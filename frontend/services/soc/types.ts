/**
 * SOC domain contract.
 *
 * This is the single shape shared by the backend emitter
 * (`backend/src/lib/threats.ts`), the transport layer, and the UI. Nothing in
 * `components/` should ever redefine or widen it.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type TriageStatus = 'new' | 'triaging' | 'contained' | 'dismissed'
export type ResponseAction = 'blocked' | 'quarantined' | 'throttled' | 'allowed' | 'flagged'
export type Protocol = 'TCP' | 'UDP' | 'TLS' | 'HTTP'

export interface Technique {
  id: string
  name: string
  tactic: string
}

export interface ThreatEvent {
  id: string
  ts: number
  severity: Severity
  type: string
  technique: Technique
  asset: string
  service: string
  srcIp: string
  srcPort: number
  dstPort: number
  protocol: Protocol
  action: ResponseAction
  status: TriageStatus
  detector: string
  bytes: number
  hash: string
  geo: string
}

/** Where the events currently on screen are coming from. */
export type StreamSource = 'socket' | 'local'

export interface StreamStatus {
  connected: boolean
  source: StreamSource
  latencyMs: number
}
