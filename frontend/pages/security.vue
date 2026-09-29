<template>
  <div class="flex h-full min-h-0 flex-col bg-surface-base">
    <!-- Page head -------------------------------------------------------- -->
    <div class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
      <div class="min-w-0">
        <h1 class="truncate text-lg font-semibold tracking-[-0.02em] text-ink-primary">
          Security Operations
        </h1>
        <p class="truncate text-xs text-ink-muted">
          {{ activeEnv.label }} ·
          <span class="font-mono">{{ activeEnv.id }}</span> ·
          {{ stream.retained.value.toLocaleString() }} events in buffer
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <!-- Time range. Segmented, because the options are few and comparison
             between them is the point. -->
        <div class="hidden items-center rounded border border-line md:flex" role="group" aria-label="Time range">
          <button
            v-for="r in ranges"
            :key="r.key"
            class="h-7 px-2.5 text-xs font-medium transition-colors duration-fast first:rounded-l last:rounded-r"
            :class="range === r.key ? 'bg-surface-hover text-ink-primary' : 'text-ink-muted hover:text-ink-primary'"
            :aria-pressed="range === r.key"
            @click="range = r.key"
          >
            {{ r.label }}
          </button>
        </div>

        <button class="btn" :aria-pressed="!stream.streaming.value" @click="toggleStream">
          <component :is="stream.streaming.value ? Pause : Play" class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden sm:inline">{{ stream.streaming.value ? 'Pause' : 'Resume' }}</span>
        </button>

        <NuxtLink to="/reports" class="btn">
          <FileDown class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden sm:inline">Export</span>
        </NuxtLink>
      </div>
    </div>

    <!-- KPI strip. Deliberately unequal: the metric that triggers action gets
         more room than the ones that provide context. -->
    <!--
      On a phone the queue is what matters, so the KPI strip becomes a single
      swipeable row rather than four stacked cards; stacking them consumed
      almost half the viewport and left two rows of feed visible.
    -->
    <div
      class="flex shrink-0 snap-x snap-mandatory overflow-x-auto border-b border-line
             sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible
             xl:grid-cols-[1.05fr_1.35fr_1fr_1fr]"
    >
      <KpiCard
        label="Active critical incidents"
        :value="stream.openCritical.value"
        :series="stream.criticalSeries.value"
        :severity="stream.openCritical.value > 0 ? 'critical' : 'low'"
        :delta="criticalDelta.text"
        :direction="criticalDelta.direction"
        :tone="criticalDelta.direction === 'up' ? 'bad' : 'good'"
        delta-note="unresolved, last 15m"
        :badge="stream.openCritical.value > 0 ? 'ACTION REQ' : 'CLEAR'"
      />

      <KpiCard
        label="Threat level"
        :value="stream.threatLabel.value"
        :severity="stream.threatSeverity.value"
        :delta="`${stream.threatScore.value}/100`"
        direction="flat"
        delta-note="composite index"
      >
        <template #viz>
          <SeverityMixBar :counts="stream.recentMix.value" />
        </template>
      </KpiCard>

      <KpiCard
        label="Mean time to detect"
        :value="mttdText"
        :series="stream.mttdSeries.value"
        :delta="mttdDelta.text"
        :direction="mttdDelta.direction"
        :tone="mttdDelta.direction === 'up' ? 'bad' : 'good'"
        delta-note="vs shift average"
      />

      <KpiCard
        label="Bandwidth anomaly"
        :value="stream.bandwidth.value.toFixed(1)"
        unit="σ"
        :series="stream.bandwidthSeries.value"
        :severity="bandwidthSeverity"
        :delta="bwDelta.text"
        :direction="bwDelta.direction"
        :tone="bwDelta.direction === 'up' ? 'bad' : 'good'"
        delta-note="egress baseline"
      />
    </div>

    <!-- Filters ---------------------------------------------------------- -->
    <FilterBar
      v-model="filters"
      :counts="stream.severityCounts.value"
      :matched="filtered.length"
      :total="stream.events.value.length"
    />

    <!-- Feed + attack surface -------------------------------------------- -->
    <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
      <ThreatFeed
        ref="feedRef"
        :rows="filtered"
        :retained="stream.retained.value"
        :capacity="stream.capacity"
        class="min-h-0 flex-1"
        @open="openIncident"
      />

      <AttackSurface
        :recent="stream.recent.value"
        :by-service="stream.byService.value"
        class="max-h-[46%] shrink-0 lg:max-h-none"
      />
    </div>

    <!-- Slide-over. Mounted only on demand, so the payload viewer, hexdump and
         MITRE panel never enter the initial bundle. -->
    <IncidentDrawer
      v-if="selected"
      :incident="selected"
      @close="closeIncident"
      @action="handleAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent, inject, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Pause, Play, FileDown } from 'lucide-vue-next'
import KpiCard from '~/components/soc/KpiCard.vue'
import SeverityMixBar from '~/components/soc/SeverityMixBar.vue'
import FilterBar from '~/components/soc/FilterBar.vue'
import ThreatFeed from '~/components/soc/ThreatFeed.vue'
import AttackSurface from '~/components/soc/AttackSurface.vue'

// Lazy: the drawer pulls in the hexdump renderer and MITRE matrix, none of
// which is needed until an analyst actually opens an incident.
const IncidentDrawer = defineAsyncComponent(() => import('~/components/soc/IncidentDrawer.vue'))

definePageMeta({ dense: true })

useHead({ title: 'Security Operations | OptiSight' })

const route = useRoute()
const toast = inject('toast', { add: () => {} })
const activeEnv = useState('active-env', () => ({ id: 'prod-apac-1', label: 'Production · Singapore' }))
const health = useState('stream-health', () => ({ connected: false, latencyMs: 0, ingestRate: 0, source: 'local' }))

const stream = useThreatStream()
const feedRef = ref(null)

// Publish the live queue depth to the sidebar badge.
const navCritical = useState('soc-open-critical', () => 0)
watch(stream.openCritical, (n) => (navCritical.value = n), { immediate: true })

// Publish stream health to the command bar without coupling the two.
watch(
  [stream.connected, stream.latencyMs, stream.ingestRate, stream.source],
  ([connected, latencyMs, ingestRate, source]) => {
    health.value = { connected, latencyMs, ingestRate, source }
  },
  { immediate: true }
)

// --- Filters --------------------------------------------------------------
const filters = ref({ severities: [], statuses: [], query: '' })

const ranges = [
  { key: '15m', label: '15m', ms: 900_000 },
  { key: '1h', label: '1h', ms: 3_600_000 },
  { key: '4h', label: '4h', ms: 14_400_000 }
]
const range = ref('1h')
const rangeMs = computed(() => ranges.find((r) => r.key === range.value)?.ms ?? 3_600_000)

// Seed filters from the URL so command-palette views and shared links land on
// the same queue the sender was looking at.
onMounted(() => {
  const sev = String(route.query.sev ?? '')
    .split(',')
    .filter(Boolean)
  const status = String(route.query.status ?? '')
    .split(',')
    .filter(Boolean)
  if (sev.length || status.length) {
    filters.value = { severities: sev, statuses: status, query: '' }
  }
})

const filtered = computed(() => {
  const { severities, statuses, query } = filters.value
  const q = query.trim().toLowerCase()
  const cutoff = Date.now() - rangeMs.value

  return stream.events.value.filter((e) => {
    if (e.ts < cutoff) return false
    if (severities.length && !severities.includes(e.severity)) return false
    if (statuses.length && !statuses.includes(e.status)) return false
    if (q) {
      const hay = `${e.type} ${e.asset} ${e.service} ${e.srcIp} ${e.id} ${e.technique.id}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

// --- Derived KPI presentation --------------------------------------------
const trend = (series, lowerIsBetter = false) => {
  if (series.length < 2) return { text: '0%', direction: 'flat' }
  const head = series.slice(0, Math.floor(series.length / 2))
  const tail = series.slice(Math.floor(series.length / 2))
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length
  const before = avg(head)
  const after = avg(tail)
  if (before === 0) return { text: '—', direction: 'flat' }
  const pct = ((after - before) / before) * 100
  const direction = Math.abs(pct) < 1.5 ? 'flat' : pct > 0 ? 'up' : 'down'
  return { text: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`, direction, lowerIsBetter }
}

const criticalDelta = computed(() => trend(stream.criticalSeries.value))
const mttdDelta = computed(() => trend(stream.mttdSeries.value))
const bwDelta = computed(() => trend(stream.bandwidthSeries.value))

const mttdText = computed(() => {
  const s = Math.round(stream.mttd.value)
  return s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`
})

const bandwidthSeverity = computed(() => {
  const b = stream.bandwidth.value
  return b >= 5 ? 'critical' : b >= 3 ? 'high' : b >= 1.5 ? 'medium' : 'low'
})

// --- Incident triage ------------------------------------------------------
const selected = ref(null)

const openIncident = (incident) => {
  selected.value = incident
}

const closeIncident = () => {
  selected.value = null
}

// The drawer animates itself out and then emits `close`, so this only records
// the outcome — clearing `selected` here would cut the exit short.
const handleAction = ({ kind, incident }) => {
  if (kind === 'isolate') {
    stream.patch(incident.id, { status: 'contained' })
    toast.add('Host isolated', `${incident.asset} removed from the network.`, 'success')
  } else if (kind === 'block') {
    stream.patch(incident.id, { status: 'contained', action: 'blocked' })
    toast.add('Source blocked', `${incident.srcIp} added to the edge deny list.`, 'success')
  } else {
    stream.patch(incident.id, { status: 'dismissed' })
    toast.add('Incident dismissed', `${incident.id} marked as benign.`, 'info')
  }
}

const toggleStream = () => {
  stream.streaming.value = !stream.streaming.value
}
</script>
