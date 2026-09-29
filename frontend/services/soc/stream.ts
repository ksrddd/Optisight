import type { StreamStatus, ThreatEvent } from './types'
import { startThreatSimulator, type SimulatorHandle } from './simulator'

/**
 * Realtime transport for the SOC feed.
 *
 * Socket.IO lives here and nowhere else. The consumer receives plain callbacks,
 * so swapping the transport for SSE or a raw WebSocket touches only this file.
 *
 * It also owns the degradation decision: if the socket cannot be reached, the
 * local simulator takes over and the status callback reports `local`, so the UI
 * never has to guess where its data came from.
 */

export interface ThreatStreamOptions {
  baseUrl: string
  /** Bearer token presented in the socket handshake; the server requires it. */
  token?: string | null
  onEvent: (event: ThreatEvent) => void
  onStatus: (status: StreamStatus) => void
  /** Fall back to the local generator when the socket is unavailable. */
  allowFallback?: boolean
}

export interface ThreatStreamHandle {
  disconnect: () => void
}

export function connectThreatStream(options: ThreatStreamOptions): ThreatStreamHandle {
  const { baseUrl, token, onEvent, onStatus, allowFallback = true } = options

  let socket: { disconnect: () => void } | null = null
  let simulator: SimulatorHandle | null = null
  let latencyTimer: ReturnType<typeof setInterval> | null = null
  let disposed = false

  const startFallback = () => {
    if (!allowFallback || simulator || disposed) return
    simulator = startThreatSimulator(onEvent)
    onStatus({ connected: false, source: 'local', latencyMs: 0 })
  }

  const stopFallback = () => {
    simulator?.stop()
    simulator = null
  }

  // Start local immediately so the feed is never empty while the socket
  // handshake is in flight; it is torn down the moment real events arrive.
  startFallback()

  void (async () => {
    try {
      const { io } = await import('socket.io-client')
      if (disposed) return

      const s = io(baseUrl, {
        transports: ['websocket'],
        reconnectionAttempts: 3,
        timeout: 4000,
        auth: { token }
      })
      socket = s

      s.on('connect', () => {
        onStatus({ connected: true, source: simulator ? 'local' : 'socket', latencyMs: 20 })

        // Measure the round trip rather than inventing a number.
        latencyTimer = setInterval(() => {
          const sent = Date.now()
          s.timeout(3000).emit('ping-rtt', (err: unknown) => {
            if (err || disposed) return
            onStatus({ connected: true, source: 'socket', latencyMs: Date.now() - sent })
          })
        }, 5000)
      })

      s.on('threat-event', (payload: ThreatEvent) => {
        // First real event wins: stop generating our own.
        if (simulator) {
          stopFallback()
          onStatus({ connected: true, source: 'socket', latencyMs: 20 })
        }
        onEvent(payload)
      })

      const degrade = () => {
        if (latencyTimer) {
          clearInterval(latencyTimer)
          latencyTimer = null
        }
        onStatus({ connected: false, source: 'local', latencyMs: 0 })
        startFallback()
      }

      s.on('disconnect', degrade)
      s.on('connect_error', degrade)
    } catch {
      startFallback()
    }
  })()

  return {
    disconnect: () => {
      disposed = true
      if (latencyTimer) clearInterval(latencyTimer)
      stopFallback()
      socket?.disconnect()
    }
  }
}
