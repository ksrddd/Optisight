/**
 * Synthetic threat-event source for the SOC console.
 *
 * The shape here is the contract the frontend feed consumes
 * (`frontend/composables/useThreatStream.ts`). Replacing this module with a
 * real detection pipeline — SIEM forwarder, IDS, WAF — should not require any
 * change on the client as long as the emitted shape holds.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type TriageStatus = 'new' | 'triaging' | 'contained' | 'dismissed';
export type ResponseAction = 'blocked' | 'quarantined' | 'throttled' | 'allowed' | 'flagged';

export interface Technique {
  id: string;
  name: string;
  tactic: string;
}

export interface ThreatEvent {
  id: string;
  ts: number;
  severity: Severity;
  type: string;
  technique: Technique;
  asset: string;
  service: string;
  srcIp: string;
  srcPort: number;
  dstPort: number;
  protocol: 'TCP' | 'UDP' | 'TLS' | 'HTTP';
  action: ResponseAction;
  status: TriageStatus;
  detector: string;
  bytes: number;
  hash: string;
  geo: string;
}

const SERVICES = [
  { service: 'api-gateway', assets: ['gw-apac-01', 'gw-apac-02', 'gw-edge-07'] },
  { service: 'auth', assets: ['auth-db-master', 'auth-idp-03', 'ad-sync-01'] },
  { service: 'core-banking', assets: ['cbs-txn-11', 'cbs-ledger-02', 'mainframe-z04'] },
  { service: 'payments', assets: ['pay-switch-05', 'pay-iso8583-02'] },
  { service: 'customer-data', assets: ['pg-cluster-01', 'pg-replica-04'] },
  { service: 'kubernetes', assets: ['k8s-node-17', 'k8s-ingress-02'] },
  { service: 'vpn-edge', assets: ['vpn-gw-01', 'vpn-gw-02'] },
  { service: 'file-transfer', assets: ['sftp-corp-01'] }
];

interface Signature {
  type: string;
  technique: Technique;
  /** Severity draw pool — proportions here set the severity mix. */
  weight: Severity[];
  /**
   * Relative arrival frequency. Real detection feeds are bottom-heavy: scans
   * and certificate noise dominate, genuine exfiltration is rare. Weighting
   * arrivals this way is what keeps a critical badge meaningful on screen.
   */
  frequency: number;
  action: ResponseAction[];
  detector: string;
  ports: number[];
  internal?: boolean;
}

const SIGNATURES: Signature[] = [
  {
    type: 'Port scan',
    technique: { id: 'T1046', name: 'Network Service Discovery', tactic: 'Discovery' },
    weight: ['low', 'low', 'low', 'medium'],
    frequency: 22,
    action: ['blocked', 'flagged'],
    detector: 'ids-suricata',
    ports: [22, 3389, 1433]
  },
  {
    type: 'Anomalous query volume',
    technique: { id: 'T1213', name: 'Data from Information Repositories', tactic: 'Collection' },
    weight: ['medium', 'medium', 'low', 'low'],
    frequency: 14,
    action: ['flagged', 'throttled'],
    detector: 'db-baseline',
    ports: [5432, 1521],
    internal: true
  },
  {
    type: 'Expired certificate presented',
    technique: { id: 'T1587.003', name: 'Digital Certificates', tactic: 'Resource Development' },
    weight: ['low', 'low', 'medium'],
    frequency: 12,
    action: ['flagged', 'allowed'],
    detector: 'tls-inspector',
    ports: [443]
  },
  {
    type: 'DDoS amplification',
    technique: { id: 'T1498.002', name: 'Reflection Amplification', tactic: 'Impact' },
    weight: ['high', 'medium', 'medium', 'low'],
    frequency: 12,
    action: ['blocked', 'throttled'],
    detector: 'edge-scrubber',
    ports: [53, 123]
  },
  {
    type: 'Credential stuffing',
    technique: { id: 'T1110.004', name: 'Credential Stuffing', tactic: 'Credential Access' },
    weight: ['high', 'high', 'medium', 'medium', 'low'],
    frequency: 12,
    action: ['blocked', 'throttled'],
    detector: 'auth-anomaly',
    ports: [443, 8443]
  },
  {
    type: 'Suspicious outbound beacon',
    technique: { id: 'T1071.001', name: 'Web Protocols', tactic: 'Command and Control' },
    weight: ['high', 'medium', 'medium', 'low'],
    frequency: 8,
    action: ['blocked', 'quarantined'],
    detector: 'c2-heuristics',
    ports: [443, 8443, 53]
  },
  {
    type: 'SQL injection attempt',
    technique: { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access' },
    weight: ['critical', 'high', 'high', 'medium'],
    frequency: 8,
    action: ['blocked'],
    detector: 'waf-inline',
    ports: [443, 80]
  },
  {
    type: 'Lateral movement (SMB)',
    technique: { id: 'T1021.002', name: 'SMB/Windows Admin Shares', tactic: 'Lateral Movement' },
    weight: ['critical', 'high', 'high', 'medium'],
    frequency: 5,
    action: ['quarantined', 'flagged'],
    detector: 'edr-behavioural',
    ports: [445, 139],
    internal: true
  },
  {
    type: 'Privilege escalation',
    technique: { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation' },
    weight: ['critical', 'high', 'high', 'medium'],
    frequency: 4,
    action: ['quarantined', 'blocked'],
    detector: 'edr-behavioural',
    ports: [22, 5985],
    internal: true
  },
  {
    type: 'Data exfiltration pattern',
    technique: { id: 'T1048.003', name: 'Exfiltration Over Unencrypted Protocol', tactic: 'Exfiltration' },
    weight: ['critical', 'critical', 'high', 'high'],
    frequency: 3,
    action: ['blocked', 'quarantined'],
    detector: 'dlp-egress',
    ports: [21, 8080]
  }
];

const TOTAL_FREQUENCY = SIGNATURES.reduce((sum, s) => sum + s.frequency, 0);

/** Frequency-weighted signature draw. Yields roughly 6% critical, 20% high. */
const pickSignature = (): Signature => {
  let roll = Math.random() * TOTAL_FREQUENCY;
  for (const sig of SIGNATURES) {
    roll -= sig.frequency;
    if (roll <= 0) return sig;
  }
  return SIGNATURES[SIGNATURES.length - 1] as Signature;
};

const GEOS = ['RU', 'CN', 'BR', 'NL', 'US', 'VN', 'IR', 'KP', 'TH', 'SG', 'IN', 'TR'];
const HEX = '0123456789abcdef';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;

const randomIp = (internal = false) =>
  internal
    ? `10.${Math.floor(Math.random() * 8)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`
    : `${Math.floor(Math.random() * 205) + 45}.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}.${Math.floor(Math.random() * 254) + 1}`;

const randomHash = () => {
  let out = '';
  for (let i = 0; i < 16; i++) out += HEX[Math.floor(Math.random() * 16)];
  return out;
};

let sequence = 0;

export function makeThreatEvent(ts: number = Date.now()): ThreatEvent {
  const sig = pickSignature();
  const target = pick(SERVICES);
  const severity = pick(sig.weight);
  sequence += 1;

  return {
    id: `EVT-${ts.toString(36).toUpperCase()}-${sequence.toString(36).toUpperCase()}`,
    ts,
    severity,
    type: sig.type,
    technique: sig.technique,
    asset: pick(target.assets),
    service: target.service,
    srcIp: randomIp(sig.internal),
    srcPort: Math.floor(Math.random() * 30000) + 32768,
    dstPort: pick(sig.ports),
    protocol: pick(['TCP', 'TLS', 'UDP', 'HTTP'] as const),
    action: pick(sig.action),
    status: severity === 'critical' && Math.random() > 0.55 ? 'triaging' : 'new',
    detector: sig.detector,
    bytes: Math.floor(Math.random() * 480000) + 240,
    hash: randomHash(),
    geo: pick(GEOS)
  };
}

/** A backfill of recent history, newest first. */
export function makeThreatHistory(count: number): ThreatEvent[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) =>
    makeThreatEvent(now - Math.floor(i * (1400 + Math.random() * 900)))
  );
}
