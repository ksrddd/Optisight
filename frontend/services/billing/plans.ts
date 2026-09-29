/**
 * Subscription and billing domain data.
 *
 * Prices, tier names and capability copy are existing product facts carried
 * over from the previous pricing page — do not invent new ones here. Usage
 * figures and invoice records are demonstration values for the prototype and
 * would come from the billing service in production.
 */

export type TierId = 'starter' | 'pro' | 'enterprise'

export interface Tier {
  id: TierId
  name: string
  price: string
  priceNote: string
  summary: string
  cta: string
}

export interface Capability {
  label: string
  group: string
  values: Record<TierId, string>
}

export interface UsageMetric {
  id: string
  label: string
  used: number
  limit: number
  unit: string
  /** Rendered as `used unit of limit unit`. */
  format?: (n: number) => string
}

export interface Invoice {
  id: string
  issued: string
  period: string
  amount: number
  status: 'paid' | 'due' | 'refunded'
}

export const TIERS: Tier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '฿2,000',
    priceNote: 'per month',
    summary: 'Essential monitoring for small teams and startups starting out.',
    cta: 'Downgrade'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '฿5,000',
    priceNote: 'per month',
    summary: 'Advanced features for growing organisations requiring deeper insights.',
    cta: 'Current plan'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '฿15,000+',
    priceNote: 'per month',
    summary: 'Custom solutions and scale for large-scale enterprise operations.',
    cta: 'Contact sales'
  }
]

export const CAPABILITIES: Capability[] = [
  {
    group: 'Scale',
    label: 'Monitored devices',
    values: { starter: '50', pro: '250', enterprise: 'Unlimited' }
  },
  {
    group: 'Scale',
    label: 'Data retention',
    values: { starter: '1 week', pro: '1 month', enterprise: '1 year+' }
  },
  {
    group: 'Scale',
    label: 'Connected data sources',
    values: { starter: '3', pro: '25', enterprise: 'Unlimited' }
  },
  {
    group: 'Scale',
    label: 'Platform seats',
    values: { starter: '5', pro: '25', enterprise: 'Unlimited' }
  },
  {
    group: 'Detection',
    label: 'Anomaly detection',
    values: { starter: 'Threshold-based', pro: 'ML behavioural', enterprise: 'ML + predictive' }
  },
  {
    group: 'Detection',
    label: 'Alert channels',
    values: { starter: 'Email', pro: 'Email, SMS, webhook', enterprise: 'All + custom' }
  },
  {
    group: 'Detection',
    label: 'Custom dashboards',
    values: { starter: '—', pro: 'Included', enterprise: 'Included' }
  },
  {
    group: 'Operations',
    label: 'Support',
    values: { starter: 'Community', pro: 'Priority', enterprise: '24/7 phone' }
  },
  {
    group: 'Operations',
    label: 'Account manager',
    values: { starter: '—', pro: '—', enterprise: 'Dedicated' }
  },
  {
    group: 'Operations',
    label: 'Deployment',
    values: { starter: 'Cloud', pro: 'Cloud', enterprise: 'Cloud or on-premise' }
  },
  {
    group: 'Operations',
    label: 'Custom integrations',
    values: { starter: '—', pro: '—', enterprise: 'Included' }
  }
]

export interface Subscription {
  tier: TierId
  seats: number
  seatsUsed: number
  renewsOn: string
  billingCycle: string
  paymentMethod: { brand: string; last4: string; expires: string }
  nextAmount: number
}

export function fetchSubscription(): Subscription {
  return {
    tier: 'pro',
    seats: 25,
    seatsUsed: 22,
    renewsOn: '2026-09-12',
    billingCycle: 'Monthly',
    paymentMethod: { brand: 'Visa', last4: '4412', expires: '08/28' },
    nextAmount: 5000
  }
}

/** Consumption against the current tier's ceilings. */
export function fetchUsage(): UsageMetric[] {
  return [
    { id: 'devices', label: 'Monitored devices', used: 187, limit: 250, unit: 'devices' },
    { id: 'sources', label: 'Connected data sources', used: 12, limit: 25, unit: 'sources' },
    { id: 'seats', label: 'Platform seats', used: 22, limit: 25, unit: 'seats' },
    { id: 'retention', label: 'Retained log volume', used: 812, limit: 1024, unit: 'GB' }
  ]
}

export function fetchInvoices(): Invoice[] {
  return [
    { id: 'INV-2026-0812', issued: '2026-08-12', period: 'Aug 2026', amount: 5000, status: 'paid' },
    { id: 'INV-2026-0712', issued: '2026-07-12', period: 'Jul 2026', amount: 5000, status: 'paid' },
    { id: 'INV-2026-0612', issued: '2026-06-12', period: 'Jun 2026', amount: 5000, status: 'paid' },
    { id: 'INV-2026-0512', issued: '2026-05-12', period: 'May 2026', amount: 5000, status: 'paid' },
    { id: 'INV-2026-0412', issued: '2026-04-12', period: 'Apr 2026', amount: 2000, status: 'paid' },
    { id: 'INV-2026-0312', issued: '2026-03-12', period: 'Mar 2026', amount: 2000, status: 'paid' }
  ]
}

export const formatTHB = (n: number) => `฿${n.toLocaleString('en-US')}`
