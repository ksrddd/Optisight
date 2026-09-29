/**
 * Access-control domain data.
 *
 * There is no `/api/users` endpoint yet, so the directory is served from here.
 * Everything a component needs about roles, modules and accounts comes through
 * this module — components never define their own permission tables, which is
 * what keeps "who can see what" answerable in one place.
 */

export type Privilege = 'full' | 'elevated' | 'operational' | 'read'
export type AccountStatus = 'active' | 'invited' | 'suspended'

export interface Module {
  id: string
  label: string
  path: string
}

export interface Role {
  id: string
  label: string
  privilege: Privilege
  /** Module ids this role can reach. */
  modules: string[]
  description: string
}

export interface Account {
  id: string
  name: string
  email: string
  roleId: string
  department: string
  mfa: boolean
  status: AccountStatus
  /** Epoch ms. */
  lastActive: number
  createdAt: number
}

/** The platform's navigable surfaces — the unit RBAC is granted over. */
export const MODULES: Module[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'sources', label: 'Data Sources', path: '/integrations' },
  { id: 'alerts', label: 'Alert Center', path: '/alerts' },
  { id: 'security', label: 'Security (SOC)', path: '/security' },
  { id: 'logs', label: 'System Logs', path: '/logs' },
  { id: 'access', label: 'Access Control', path: '/users' },
  { id: 'billing', label: 'Subscription', path: '/subscription' },
  { id: 'settings', label: 'Settings', path: '/settings' }
]

export const ROLES: Role[] = [
  {
    id: 'admin',
    label: 'Global Admin',
    privilege: 'full',
    modules: MODULES.map((m) => m.id),
    description: 'Unrestricted access including billing and account administration.'
  },
  {
    id: 'sec-lead',
    label: 'Security Lead',
    privilege: 'elevated',
    modules: ['dashboard', 'alerts', 'security', 'logs', 'access', 'settings'],
    description: 'Owns SOC response and can grant security-scoped access.'
  },
  {
    id: 'soc',
    label: 'SOC Analyst',
    privilege: 'operational',
    modules: ['dashboard', 'alerts', 'security', 'logs'],
    description: 'Triages detections and executes containment actions.'
  },
  {
    id: 'itops',
    label: 'IT Operations',
    privilege: 'operational',
    modules: ['dashboard', 'sources', 'alerts', 'logs'],
    description: 'Maintains platform health and ingestion pipelines.'
  },
  {
    id: 'infra',
    label: 'Data / Infra',
    privilege: 'operational',
    modules: ['dashboard', 'sources', 'logs'],
    description: 'Manages connectors, retention and storage.'
  },
  {
    id: 'billing',
    label: 'Billing Manager',
    privilege: 'elevated',
    modules: ['dashboard', 'billing'],
    description: 'Manages the subscription, seats and invoices.'
  },
  {
    id: 'exec',
    label: 'Executive',
    privilege: 'read',
    modules: ['dashboard'],
    description: 'Read-only summary access. Cannot act on any surface.'
  }
]

export const PRIVILEGE_META: Record<Privilege, { label: string; severity: string; note: string }> = {
  full: { label: 'Full', severity: 'critical', note: 'Can modify billing and access control' },
  elevated: { label: 'Elevated', severity: 'high', note: 'Can grant access or change configuration' },
  operational: { label: 'Operational', severity: 'medium', note: 'Can act on incidents and systems' },
  read: { label: 'Read', severity: 'low', note: 'Cannot change any state' }
}

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/**
 * Seeded relative to load time so "last active" always reads plausibly.
 * Offsets, not fixed dates, so the directory never looks stale.
 */
const seed: Array<[string, string, string, string, boolean, AccountStatus, number, number]> = [
  ['Alice Wong', 'alice.w@fintech.co', 'admin', 'Platform', true, 'active', 2 * MIN, 900 * DAY],
  ['Kittipong Sae-Lim', 'kittipong.s@fintech.co', 'admin', 'Platform', true, 'active', 41 * MIN, 720 * DAY],
  ['Marcus Reyes', 'm.reyes@fintech.co', 'admin', 'Platform', false, 'active', 6 * HOUR, 410 * DAY],
  ['Napat Chaiyaporn', 'napat.c@fintech.co', 'sec-lead', 'Security', true, 'active', 12 * MIN, 640 * DAY],
  ['Hannah Okafor', 'h.okafor@fintech.co', 'sec-lead', 'Security', true, 'active', 3 * HOUR, 300 * DAY],
  ['Charlie Dave', 'charlie.d@fintech.co', 'soc', 'Security', true, 'active', 3 * MIN, 520 * DAY],
  ['Siriporn Thongchai', 'siriporn.t@fintech.co', 'soc', 'Security', true, 'active', 8 * MIN, 380 * DAY],
  ['Yuki Tanaka', 'y.tanaka@fintech.co', 'soc', 'Security', true, 'active', 25 * MIN, 210 * DAY],
  ['Diego Fernandes', 'd.fernandes@fintech.co', 'soc', 'Security', false, 'active', 2 * HOUR, 95 * DAY],
  ['Preeda Wattana', 'preeda.w@fintech.co', 'soc', 'Security', true, 'active', 5 * HOUR, 150 * DAY],
  ['Bob Smith', 'b.smith@fintech.co', 'itops', 'IT Operations', true, 'active', 1 * HOUR, 700 * DAY],
  ['Anong Rattana', 'anong.r@fintech.co', 'itops', 'IT Operations', true, 'active', 34 * MIN, 460 * DAY],
  ['Ivan Petrov', 'i.petrov@fintech.co', 'itops', 'IT Operations', true, 'active', 4 * HOUR, 240 * DAY],
  ['Grace Lim', 'g.lim@fintech.co', 'itops', 'IT Operations', true, 'active', 9 * HOUR, 180 * DAY],
  ['Somchai Prasert', 'somchai.p@fintech.co', 'itops', 'IT Operations', true, 'suspended', 46 * DAY, 520 * DAY],
  ['Diana Clark', 'd.clark@fintech.co', 'infra', 'Data / Infra', true, 'active', 5 * MIN, 610 * DAY],
  ['Ravi Menon', 'r.menon@fintech.co', 'infra', 'Data / Infra', true, 'active', 7 * HOUR, 330 * DAY],
  ['Chanida Boonmee', 'chanida.b@fintech.co', 'infra', 'Data / Infra', true, 'active', 2 * DAY, 275 * DAY],
  ['Laura Mendes', 'l.mendes@fintech.co', 'billing', 'Finance', true, 'active', 1 * DAY, 400 * DAY],
  ['Thanawat Srisuk', 'thanawat.s@fintech.co', 'billing', 'Finance', false, 'invited', 0, 3 * DAY],
  ['Eve Torres', 'eve.t@fintech.co', 'exec', 'Executive', true, 'active', 1 * DAY, 550 * DAY],
  ['James Whitfield', 'j.whitfield@fintech.co', 'exec', 'Executive', true, 'active', 38 * DAY, 480 * DAY]
]

export function fetchDirectory(): Account[] {
  const now = Date.now()
  return seed.map(([name, email, roleId, department, mfa, status, lastAgo, createdAgo], i) => ({
    id: `USR-${(i + 1).toString().padStart(3, '0')}`,
    name,
    email,
    roleId,
    department,
    mfa,
    status,
    lastActive: status === 'invited' ? 0 : now - lastAgo,
    createdAt: now - createdAgo
  }))
}

export const roleById = (id: string): Role => ROLES.find((r) => r.id === id) ?? ROLES[ROLES.length - 1]!
