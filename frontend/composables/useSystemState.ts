import { reactive, computed, onMounted, onUnmounted } from 'vue'
import { useUser } from './useUser'

export const useSystemState = () => {
  const { settings } = useUser()
  
  // 1. Unified Dataset for Connectors
  const integrations = useState('global-integrations', () => ({
    cloud: [
      { id: 'aws', name: 'AWS CloudWatch', description: 'Metrics & log data sync via Kinesis', status: 'Connected', type: 'Cloud', icon: 'Cloud', iconColor: 'text-orange-400', rate: 240 },
      { id: 'azure', name: 'Azure Monitor', description: 'VM & Network telemetry via Events', status: 'Syncing', type: 'Cloud', icon: 'CloudSnow', iconColor: 'text-blue-400', rate: 142 },
      { id: 'gcp', name: 'Google Cloud Audit', description: 'GCP audit logs via Pub/Sub', status: 'Connected', type: 'Cloud', icon: 'CloudCog', iconColor: 'text-rose-400', rate: 85 },
      { id: 'kube', name: 'Kubernetes Cluster', description: 'Pod metrics & state analysis', status: 'Warning', type: 'Container', icon: 'Box', iconColor: 'text-indigo-400', rate: 12 }
    ],
    db: [
      { id: 'oracle', name: 'Oracle DB (Legacy)', description: 'Financial transaction monitoring', status: 'Connected', type: 'Database', icon: 'Database', iconColor: 'text-red-500', rate: 45 },
      { id: 'postgres', name: 'PostgreSQL Cluster', description: 'Main backend DB load', status: 'Connected', type: 'Database', icon: 'Database', iconColor: 'text-blue-500', rate: 312 },
      { id: 'redis', name: 'Redis Cache Layer', description: 'In-memory cache latency', status: 'Connected', type: 'Cache', icon: 'Layers', iconColor: 'text-rose-500', rate: 190 },
      { id: 'mainframe', name: 'Legacy Mainframe', description: 'IBM Z-Series transaction logs', status: 'Warning', type: 'Core', icon: 'Server', iconColor: 'text-amber-400', rate: 5 }
    ],
    security: [
      { id: 'splunk', name: 'Splunk Forwarder', description: 'Enterprise log stream', status: 'Connected', type: 'Logs', icon: 'Terminal', iconColor: 'text-white', rate: 550 },
      { id: 'palo', name: 'Palo Alto FW', description: 'Network security events', status: 'Syncing', type: 'Security', icon: 'ShieldCheck', iconColor: 'text-emerald-500', rate: 210 },
      { id: 'ad', name: 'Active Directory', description: 'IAM and User Logins', status: 'Connected', type: 'Auth', icon: 'Users', iconColor: 'text-indigo-400', rate: 18 },
      { id: 'webhook', name: 'Internal Webhooks', description: 'Custom team tools', status: 'Connected', type: 'API', icon: 'Code', iconColor: 'text-slate-400', rate: 4 }
    ]
  }))

  // 2. Relational Computed Metrics
  const allConnectors = computed(() => [
    ...integrations.value.cloud,
    ...integrations.value.db,
    ...integrations.value.security
  ])

  const stats = computed(() => {
    const totalRateRaw = allConnectors.value.reduce((acc, curr) => acc + curr.rate, 0)
    const connected = allConnectors.value.filter(c => c.status === 'Connected').length
    
    // Threshold from Settings (CPU Critical Level)
    const cpuThreshold = settings.value.thresholds.find(t => t.name.includes('CPU'))?.value || 85
    
    // Connectors violating threshold (Rate as proxy for load %)
    const violations = allConnectors.value.filter(c => c.rate > cpuThreshold * 10).length 
    const manualWarnings = allConnectors.value.filter(c => c.status === 'Warning').length
    
    const total = allConnectors.value.length

    return {
      totalRate: (totalRateRaw / 1024).toFixed(2), 
      totalRateMB: totalRateRaw, 
      systemsOnline: connected,
      totalSystems: total,
      activeAlerts: Math.max(violations, manualWarnings),
      health: (Math.max(0, 100 - (violations * 10) - (manualWarnings * 5))).toFixed(1)
    }
  })

  // 3. Global Heartbeat / Simulation
  const liveRevenue = useState('global-revenue', () => 840200)
  const totalRevenue = useState('global-total-revenue', () => 15420000)
  const transactions = useState('global-transactions', () => 4520)

  const updateSimulation = () => {
    // Fluctuating transaction throughput
    transactions.value += Math.floor(Math.random() * 50 - 25)
    if (transactions.value < 2000) transactions.value = 4500

    // Revenue growth based on DB health
    const dbMultiplier = integrations.value.db.filter(d => d.status === 'Connected').length / 4
    liveRevenue.value += Math.floor(Math.random() * 2500 * dbMultiplier)
    totalRevenue.value += Math.floor(Math.random() * 2500 * dbMultiplier)

    // Minor fluctuations in ingestion rates
    allConnectors.value.forEach(conn => {
      if (conn.status !== 'Warning' && conn.status !== 'Disconnected') {
        const delta = Math.floor(Math.random() * 10 - 5)
        conn.rate = Math.max(1, conn.rate + delta)
      }
    })
  }

  return {
    integrations,
    stats,
    liveRevenue,
    totalRevenue,
    transactions,
    updateSimulation
  }
}
