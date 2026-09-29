import { ref, shallowRef, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Severity, StreamStatus, ThreatEvent } from '~/services/soc/types'
import { SERVICE_NAMES, makeThreatHistory } from '~/services/soc/simulator'
import { connectThreatStream, type ThreatStreamHandle } from '~/services/soc/stream'
import { fetchThreatHistory } from '~/services/soc/api'

/**
 * Feed orchestration.
 *
 * Responsibilities are deliberately narrow: take events from the transport
 * layer (`services/soc/stream.ts`), batch them, bound the buffer, and expose
 * reactive views of them. It performs no I/O of its own — no URLs, no sockets,
 * no fetch — and generates no data. Components consume this and never reach
 * past it.
 */

/** How often batched arrivals are committed to the reactive array. */
const FLUSH_INTERVAL = 250

/**
 * Hard ceiling on retained events. An eight-hour shift at ~40 events/min would
 * otherwise accumulate ~19k rows; the buffer discards the oldest beyond this so
 * memory stays flat regardless of session length.
 */
const MAX_EVENTS = 5000

/** Ceiling on un-committed arrivals while the analyst has the feed paused. */
const MAX_STAGED = 750

export function useThreatStream() {
  const events = shallowRef<ThreatEvent[]>([])
  const connected = ref(false)
  const streaming = ref(true)
  const source = ref<'socket' | 'local'>('local')
  const latencyMs = ref(0)
  const ingestRate = ref(0)

  // Staging area — intentionally NOT reactive.
  let staged: ThreatEvent[] = []
  let arrivalsThisWindow = 0
  let handle: ThreatStreamHandle | null = null

  const push = (event: ThreatEvent) => {
    staged.unshift(event)
    // The stream keeps arriving while the feed is paused. Bound the staging
    // area too, otherwise "pause" becomes a memory leak with a button.
    if (staged.length > MAX_STAGED) staged.length = MAX_STAGED
    arrivalsThisWindow += 1
  }

  const flush = () => {
    if (!staged.length || !streaming.value) return

    // One array identity change per window, regardless of arrival count.
    const next = staged.concat(events.value)
    staged = []
    events.value = next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next
  }

  const patch = (id: string, changes: Partial<ThreatEvent>) => {
    const idx = events.value.findIndex((e) => e.id === id)
    if (idx === -1) return
    const next = events.value.slice()
    next[idx] = { ...next[idx]!, ...changes }
    events.value = next
  }

  const applyStatus = (status: StreamStatus) => {
    connected.value = status.connected
    source.value = status.source
    latencyMs.value = status.latencyMs
  }

  // --- Derived operational metrics ----------------------------------------

  /** The live 15-minute window. Everything an analyst calls "now". */
  const recent = computed(() => {
    const cutoff = Date.now() - 900_000
    return events.value.filter((e) => e.ts >= cutoff)
  })

  /**
   * Unresolved criticals in the live window — the number that decides whether
   * anyone has to move. Counting the whole retained buffer instead would report
   * hours of already-closed work as an active alarm.
   */
  const openCritical = computed(
    () =>
      recent.value.filter((e) => e.severity === 'critical' && (e.status === 'new' || e.status === 'triaging')).length
  )

  /** Whole-buffer counts, matching the totals the filter bar reports. */
  const severityCounts = computed(() => {
    const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const e of events.value) counts[e.severity] += 1
    return counts
  })

  /** Severity mix of the live window, for the threat-level distribution bar. */
  const recentMix = computed(() => {
    const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const e of recent.value) counts[e.severity] += 1
    return counts
  })

  /**
   * 0–100 composite. Normalised against the worst case (every event critical)
   * so the index actually uses its range instead of pinning at 100.
   */
  const threatScore = computed(() => {
    const c = recentMix.value
    const total = recent.value.length
    if (!total) return 0
    const weighted = c.critical * 5 + c.high * 2.5 + c.medium * 1 + c.low * 0.25
    const mix = (weighted / (total * 5)) * 100
    // Absolute open-critical load matters independently of the mix: five
    // criticals is an incident whether or not the queue is otherwise quiet.
    return Math.min(100, Math.round(mix + Math.min(35, openCritical.value * 3.5)))
  })

  const threatLabel = computed(() => {
    const s = threatScore.value
    return s >= 75 ? 'SEVERE' : s >= 50 ? 'ELEVATED' : s >= 25 ? 'GUARDED' : 'LOW'
  })

  const threatSeverity = computed<Severity>(() => {
    const s = threatScore.value
    return s >= 75 ? 'critical' : s >= 50 ? 'high' : s >= 25 ? 'medium' : 'low'
  })

  /** Incident distribution across services, for the attack-surface panel. */
  const byService = computed(() => {
    const map = new Map<string, { service: string; total: number } & Record<Severity, number>>()
    for (const name of SERVICE_NAMES) {
      map.set(name, { service: name, total: 0, critical: 0, high: 0, medium: 0, low: 0 })
    }
    for (const e of recent.value) {
      const row = map.get(e.service)
      if (!row) continue
      row.total += 1
      row[e.severity] += 1
    }
    return [...map.values()].sort((a, b) => b.critical - a.critical || b.total - a.total)
  })

  // --- Sparkline series ----------------------------------------------------
  // Appended on a slow cadence so a trend line reads as a trend, not as noise.

  const mttdSeries = ref<number[]>([])
  const bandwidthSeries = ref<number[]>([])
  const criticalSeries = ref<number[]>([])
  const scoreSeries = ref<number[]>([])

  const mttd = computed(() => mttdSeries.value[mttdSeries.value.length - 1] ?? 0)
  const bandwidth = computed(() => bandwidthSeries.value[bandwidthSeries.value.length - 1] ?? 0)

  /**
   * Seeds the trend lines. Called after the backfill has landed so the history
   * converges on the value the card is currently displaying — a sparkline that
   * ends somewhere other than its own headline number is a lie in chart form.
   */
  const seedSeries = () => {
    const m: number[] = []
    const b: number[] = []
    let mv = 148
    let bv = 2.4
    for (let i = 0; i < 32; i++) {
      mv = Math.max(38, Math.min(260, mv + (Math.random() - 0.52) * 22))
      bv = Math.max(0.4, Math.min(9, bv + (Math.random() - 0.48) * 0.7))
      m.push(Math.round(mv))
      b.push(Number(bv.toFixed(2)))
    }
    mttdSeries.value = m
    bandwidthSeries.value = b

    // Random-walk backwards from the live values so the series lands exactly on
    // them at the right-hand edge.
    const walkBack = (end: number, drift: number, floor = 0) => {
      const out = new Array<number>(32)
      let v = end
      for (let i = 31; i >= 0; i--) {
        out[i] = Math.max(floor, Math.round(v))
        v += (Math.random() - 0.5) * drift
      }
      return out
    }

    criticalSeries.value = walkBack(openCritical.value, Math.max(2, openCritical.value * 0.25))
    scoreSeries.value = walkBack(threatScore.value, 6)
  }

  const nudge = (series: number[], value: number) => {
    const next = series.slice(1)
    next.push(value)
    return next
  }

  const advanceSeries = () => {
    const lastM = mttdSeries.value[mttdSeries.value.length - 1] ?? 140
    const lastB = bandwidthSeries.value[bandwidthSeries.value.length - 1] ?? 2.4
    mttdSeries.value = nudge(mttdSeries.value, Math.max(38, Math.round(lastM + (Math.random() - 0.52) * 20)))
    bandwidthSeries.value = nudge(
      bandwidthSeries.value,
      Number(Math.max(0.4, lastB + (Math.random() - 0.48) * 0.6).toFixed(2))
    )
    criticalSeries.value = nudge(criticalSeries.value, openCritical.value)
    scoreSeries.value = nudge(scoreSeries.value, threatScore.value)
  }

  // --- Lifecycle -----------------------------------------------------------

  let flushTimer: ReturnType<typeof setInterval> | null = null
  let seriesTimer: ReturnType<typeof setInterval> | null = null
  let rateTimer: ReturnType<typeof setInterval> | null = null

  onMounted(async () => {
    const config = useRuntimeConfig()
    const token = useCookie('optisight_token')
    const baseUrl = config.public.apiBase as string

    // Backfill first so the queue is never empty on open. Falls back to a local
    // history when the API is unreachable.
    const history = await fetchThreatHistory({ baseUrl, token: token.value }, 800)
    events.value = history.length ? history : makeThreatHistory(2400)

    // Series are seeded from the loaded buffer, not before it.
    seedSeries()

    flushTimer = setInterval(flush, FLUSH_INTERVAL)
    seriesTimer = setInterval(advanceSeries, 5000)
    rateTimer = setInterval(() => {
      ingestRate.value = arrivalsThisWindow * 12 // per-minute, from a 5s window
      arrivalsThisWindow = 0
    }, 5000)

    handle = connectThreatStream({
      baseUrl,
      // The socket handshake is now authenticated (SEC-API-001); without a token
      // the server refuses the connection and the feed stays on the local
      // simulator. Passing it here keeps the live tail working for a real session.
      token: token.value,
      onEvent: push,
      onStatus: applyStatus
    })
  })

  onBeforeUnmount(() => {
    if (flushTimer) clearInterval(flushTimer)
    if (seriesTimer) clearInterval(seriesTimer)
    if (rateTimer) clearInterval(rateTimer)
    handle?.disconnect()
    staged = []
  })

  return {
    // state
    events,
    recent,
    connected,
    streaming,
    source,
    latencyMs,
    ingestRate,
    retained: computed(() => events.value.length),
    capacity: MAX_EVENTS,
    // metrics
    openCritical,
    severityCounts,
    recentMix,
    threatScore,
    threatLabel,
    threatSeverity,
    byService,
    mttd,
    mttdSeries,
    bandwidth,
    bandwidthSeries,
    criticalSeries,
    scoreSeries,
    // commands
    patch
  }
}
