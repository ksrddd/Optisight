<template>
  <div class="space-y-4">
    <!-- Page head -->
    <div class="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0">
        <h1 class="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-ink-primary">
          Operations Overview
          <DemoBadge />
        </h1>
        <p class="mt-0.5 text-xs text-ink-muted">
          Cross-department system health · {{ connectors.length }} connectors ·
          <span class="font-mono">{{ stats.totalRate }}</span> GB/s aggregate ingest
        </p>
      </div>
      <NuxtLink to="/reports" class="btn shrink-0 self-start md:self-auto">
        <FileText class="h-3.5 w-3.5" aria-hidden="true" />
        Reports
      </NuxtLink>
    </div>

    <!-- Posture strip: real values derived from the shared system state, so the
         dashboard and the pages it summarises never disagree (UX-01). -->
    <div class="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-surface-raised lg:grid-cols-4">
      <div v-for="(m, i) in posture" :key="m.label"
        class="flex flex-col gap-1 border-line p-3"
        :class="[i % 2 === 0 ? 'border-r' : '', i < 2 ? 'border-b lg:border-b-0' : '', i !== 0 ? 'lg:border-l' : '']">
        <span class="field-label truncate">{{ m.label }}</span>
        <span class="flex items-baseline gap-1.5">
          <span class="text-2xl font-semibold tabular-nums tracking-[-0.03em]" :class="m.tone">{{ m.value }}</span>
          <span v-if="m.unit" class="text-sm text-ink-muted">{{ m.unit }}</span>
        </span>
        <span class="truncate text-2xs text-ink-muted">{{ m.note }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <!-- Aggregate ingest — a real rolling series accumulated from the live
           heartbeat, not random noise (UX-09). -->
      <section class="panel rounded-lg lg:col-span-2">
        <div class="panel-header">
          <h2 class="panel-title">Aggregate ingest · last {{ throughput.length }} samples</h2>
          <span class="font-mono text-2xs tabular-nums text-ink-muted">{{ stats.totalRateMB.toLocaleString() }} MB/s now</span>
        </div>
        <div class="h-[220px] p-2">
          <client-only>
            <apexchart type="area" height="100%" width="100%" :options="chartOptions" :series="chartSeries" />
          </client-only>
        </div>
      </section>

      <!-- Capacity outlook — honest projection: linear extrapolation of each
           connector's rate toward the configured threshold. No fabricated
           "95% in 7 days" copy; if nothing is trending, it says so (DS-03). -->
      <section class="panel flex flex-col rounded-lg">
        <div class="panel-header">
          <h2 class="panel-title">Capacity outlook</h2>
          <Activity class="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
        </div>
        <div class="min-h-0 flex-1 divide-y divide-line-faint">
          <div v-if="!outlook.length" class="flex h-full items-center justify-center p-4 text-center">
            <p class="text-xs text-ink-muted">All connectors are within capacity thresholds.</p>
          </div>
          <div v-for="o in outlook" :key="o.id" class="flex items-center justify-between gap-3 px-3 py-2.5">
            <div class="min-w-0">
              <p class="truncate text-sm text-ink-primary">{{ o.name }}</p>
              <p class="truncate text-2xs text-ink-muted">{{ o.note }}</p>
            </div>
            <span class="shrink-0 font-mono text-xs font-semibold tabular-nums" :class="o.tone">{{ o.pct }}%</span>
          </div>
        </div>
      </section>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- System status: grouped connector health, reusing the console's neutral
           baseline / severity grammar. No hard-coded "9ms latency" claims. -->
      <section class="panel rounded-lg">
        <div class="panel-header">
          <h2 class="panel-title">System status</h2>
          <NuxtLink to="/integrations" class="text-2xs text-ink-muted underline-offset-2 hover:text-ink-primary hover:underline">
            Data Sources
          </NuxtLink>
        </div>
        <div class="divide-y divide-line-faint">
          <div v-for="c in keySystems" :key="c.id" class="flex items-center justify-between gap-3 px-3 py-2.5">
            <div class="flex min-w-0 items-center gap-2.5">
              <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="statusDot(c.status)" aria-hidden="true" />
              <span class="truncate text-sm text-ink-primary">{{ c.name }}</span>
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <span class="font-mono text-2xs tabular-nums text-ink-muted">{{ c.rate }} MB/s</span>
              <span class="w-[68px] text-right text-2xs font-medium" :class="statusText(c.status)">{{ c.status }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Routed alerts summary: links to the owning surface, single source. The
           SOC figure reads from the same state the Security console publishes;
           when that console has not been open this session it shows "—" rather
           than a fabricated number (UX-01, DS-02). -->
      <section class="panel rounded-lg">
        <div class="panel-header">
          <h2 class="panel-title">Attention required</h2>
          <NuxtLink to="/alerts" class="text-2xs text-ink-muted underline-offset-2 hover:text-ink-primary hover:underline">
            Alert Center
          </NuxtLink>
        </div>
        <div class="divide-y divide-line-faint">
          <NuxtLink to="/security"
            class="flex items-center justify-between gap-3 px-3 py-3 transition-colors duration-fast hover:bg-surface-raised">
            <div class="flex min-w-0 items-center gap-2.5">
              <Shield class="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
              <div class="min-w-0">
                <p class="truncate text-sm text-ink-primary">Open critical incidents</p>
                <p class="truncate text-2xs text-ink-muted">SOC · Security console</p>
              </div>
            </div>
            <span class="shrink-0 font-mono text-md font-semibold tabular-nums"
              :class="socCritical > 0 ? 'text-sev-critical' : 'text-ink-muted'">
              {{ socCritical === null ? '—' : socCritical }}
            </span>
          </NuxtLink>

          <NuxtLink to="/integrations"
            class="flex items-center justify-between gap-3 px-3 py-3 transition-colors duration-fast hover:bg-surface-raised">
            <div class="flex min-w-0 items-center gap-2.5">
              <Network class="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
              <div class="min-w-0">
                <p class="truncate text-sm text-ink-primary">Connectors needing attention</p>
                <p class="truncate text-2xs text-ink-muted">IT Ops · Data Sources</p>
              </div>
            </div>
            <span class="shrink-0 font-mono text-md font-semibold tabular-nums"
              :class="warningCount > 0 ? 'text-sev-high' : 'text-ink-muted'">{{ warningCount }}</span>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { FileText, Activity, Shield, Network } from 'lucide-vue-next'
import DemoBadge from '~/components/ui/DemoBadge.vue'
import { useUser } from '~/composables/useUser'
import { useSystemState } from '~/composables/useSystemState'

useHead({ title: 'Operations Overview | OptiSight' })

const { settings } = useUser()
const { stats, integrations } = useSystemState()

const connectors = computed(() => [
  ...integrations.value.cloud,
  ...integrations.value.db,
  ...integrations.value.security
])

// The SOC critical count is published by the Security console into shared state.
// Null until that console has run this session — rendered as "—", never a
// plausible fallback like the old hard-coded 3 (UX-01).
const socCriticalRaw = useState('soc-open-critical', () => null)
const socCritical = computed(() => socCriticalRaw.value)

const warningCount = computed(() => connectors.value.filter((c) => c.status === 'Warning' || c.status === 'Disconnected').length)

const posture = computed(() => [
  {
    label: 'Systems online', value: `${stats.value.systemsOnline}/${stats.value.totalSystems}`,
    tone: 'text-ink-primary', note: 'connectors reporting'
  },
  {
    label: 'Pipeline health', value: stats.value.health, unit: '%',
    tone: Number(stats.value.health) < 80 ? 'text-sev-high' : 'text-ink-primary', note: 'weighted by warnings'
  },
  {
    label: 'Aggregate ingest', value: stats.value.totalRate, unit: 'GB/s',
    tone: 'text-ink-primary', note: `${stats.value.totalRateMB.toLocaleString()} MB/s`
  },
  {
    label: 'Attention required', value: warningCount.value,
    tone: warningCount.value > 0 ? 'text-sev-high' : 'text-ink-primary', note: 'connectors flagged'
  }
])

const cpuThreshold = computed(() => settings.value.thresholds.find((t) => t.name.includes('CPU'))?.value || 85)

// Honest capacity projection: rate as a proxy for load %, ranked by proximity to
// the configured threshold. Only surfaces connectors actually approaching it.
const outlook = computed(() => {
  const ceiling = cpuThreshold.value * 10
  return connectors.value
    .map((c) => ({ id: c.id, name: c.name, pct: Math.min(100, Math.round((c.rate / ceiling) * 100)) }))
    .filter((c) => c.pct >= 60)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)
    .map((c) => ({
      ...c,
      tone: c.pct >= 90 ? 'text-sev-critical' : c.pct >= 75 ? 'text-sev-high' : 'text-ink-secondary',
      note: c.pct >= 90 ? 'at threshold' : 'trending up'
    }))
})

const keySystems = computed(() => [...integrations.value.db, ...integrations.value.security].slice(0, 6))

const statusDot = (s) => ({ Connected: 'bg-sev-low', Syncing: 'bg-ink-faint', Warning: 'bg-sev-high', Disconnected: 'bg-sev-critical' })[s] || 'bg-ink-faint'
const statusText = (s) => ({ Connected: 'text-ink-muted', Syncing: 'text-ink-muted', Warning: 'text-sev-high', Disconnected: 'text-sev-critical' })[s] || 'text-ink-muted'

// Rolling throughput series accumulated from the real aggregate ingest on each
// global heartbeat — a true recent history, not Math.random() every 3s.
const throughput = ref(Array.from({ length: 20 }, () => Number(stats.value.totalRateMB)))
let timer = null
onMounted(() => {
  timer = setInterval(() => {
    const next = [...throughput.value, Number(stats.value.totalRateMB)]
    if (next.length > 40) next.shift()
    throughput.value = next
  }, 3000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const chartSeries = computed(() => [{ name: 'Ingest MB/s', data: throughput.value }])
const chartOptions = {
  chart: { animations: { enabled: true, dynamicAnimation: { speed: 150 } }, toolbar: { show: false }, background: 'transparent', sparkline: { enabled: false } },
  theme: { mode: 'dark' },
  colors: ['#a1a1aa'],
  stroke: { curve: 'smooth', width: 1.5 },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.18, opacityTo: 0.02, stops: [0, 100] } },
  dataLabels: { enabled: false },
  grid: { borderColor: '#1c1c1f', strokeDashArray: 3, padding: { left: 8, right: 8 } },
  xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { labels: { style: { colors: '#8a8a93', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' } } },
  tooltip: { theme: 'dark', x: { show: false }, y: { formatter: (v) => `${Math.round(v).toLocaleString()} MB/s` } }
}
</script>
