<template>
  <div class="space-y-4">
    <!-- Page head -->
    <div class="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0">
        <h1 class="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-ink-primary">
          Reports
          <DemoBadge />
        </h1>
        <p class="mt-0.5 text-xs text-ink-muted">Weekly posture summaries for security and operations review.</p>
      </div>
    </div>

    <!-- Controls: report type + period, plain English -->
    <div class="flex flex-col gap-3 rounded-lg border border-line bg-surface-raised p-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-1.5" role="tablist" aria-label="Report type">
        <button
          v-for="r in reportTypes"
          :key="r.key"
          role="tab"
          :aria-selected="reportType === r.key"
          class="chip h-7"
          :class="reportType === r.key ? 'chip-on' : ''"
          @click="reportType = r.key"
        >
          <component :is="r.icon" class="h-3.5 w-3.5" aria-hidden="true" />
          {{ r.label }}
        </button>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="field-label">Period</span>
        <button
          v-for="p in periods"
          :key="p.key"
          class="chip h-7"
          :class="period === p.key ? 'chip-on' : ''"
          @click="period = p.key"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Report body -->
    <section class="panel rounded-lg">
      <div class="panel-header">
        <h2 class="panel-title">{{ activeReport.label }} · {{ activePeriod.label }}</h2>
        <span class="font-mono text-2xs tabular-nums text-ink-muted">generated {{ generatedAt }}</span>
      </div>

      <!-- Metric grid -->
      <div class="grid grid-cols-2 divide-x divide-y divide-line-faint sm:grid-cols-4">
        <div v-for="m in metrics" :key="m.label" class="p-3">
          <p class="field-label truncate">{{ m.label }}</p>
          <p class="mt-1 flex items-baseline gap-1">
            <span class="text-lg font-semibold tabular-nums" :class="m.tone || 'text-ink-primary'">{{ m.value }}</span>
            <span v-if="m.unit" class="text-2xs text-ink-muted">{{ m.unit }}</span>
          </p>
          <p class="mt-0.5 truncate text-2xs text-ink-muted">{{ m.note }}</p>
        </div>
      </div>

      <!-- Breakdown bars -->
      <div class="border-t border-line p-3">
        <p class="field-label mb-2">{{ activeReport.breakdownLabel }}</p>
        <div class="space-y-2">
          <div v-for="b in breakdown" :key="b.name" class="flex items-center gap-3">
            <span class="w-40 shrink-0 truncate text-xs text-ink-secondary">{{ b.name }}</span>
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div class="h-full rounded-full" :class="b.bar" :style="{ width: b.pct + '%' }" />
            </div>
            <span class="w-10 shrink-0 text-right font-mono text-2xs tabular-nums text-ink-muted">{{ b.pct }}%</span>
          </div>
        </div>
      </div>

      <!-- Export: no file backend exists, so this renders a print-ready preview
           in place rather than claiming a file was "securely prepared" (UX-07). -->
      <div class="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
        <p class="text-2xs text-ink-muted">Figures are synthetic demonstration data. Export to PDF is not yet connected.</p>
        <button class="btn" @click="printPreview">
          <Printer class="h-3.5 w-3.5" aria-hidden="true" />
          Print preview
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ShieldAlert, Activity, Printer } from 'lucide-vue-next'
import DemoBadge from '~/components/ui/DemoBadge.vue'
import { useSystemState } from '~/composables/useSystemState'

useHead({ title: 'Reports | OptiSight' })

const { stats } = useSystemState()

const reportTypes = [
  { key: 'threat', label: 'Threat Assessment', icon: ShieldAlert, breakdownLabel: 'Detections by category' },
  { key: 'performance', label: 'Network Performance', icon: Activity, breakdownLabel: 'Load by system' }
]
const periods = [
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' }
]

const reportType = ref('threat')
const period = ref('week')

const activeReport = computed(() => reportTypes.find((r) => r.key === reportType.value))
const activePeriod = computed(() => periods.find((p) => p.key === period.value))
const generatedAt = computed(() => new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC')

// Period multiplier so figures scale sensibly across daily/weekly/monthly.
const scale = computed(() => ({ day: 1, week: 7, month: 30 })[period.value])

const metrics = computed(() => {
  if (reportType.value === 'threat') {
    const detections = Math.round(stats.value.activeAlerts * 42 * scale.value)
    return [
      { label: 'Detections', value: detections.toLocaleString(), note: 'total events triaged' },
      { label: 'Auto-contained', value: `${Math.round(72 + stats.value.activeAlerts) }`, unit: '%', note: 'by policy', tone: 'text-ink-primary' },
      { label: 'Open at period end', value: stats.value.activeAlerts, note: 'awaiting triage', tone: stats.value.activeAlerts > 0 ? 'text-sev-high' : 'text-ink-primary' },
      { label: 'Mean time to detect', value: '2m 12s', note: 'rolling average' }
    ]
  }
  return [
    { label: 'Systems online', value: `${stats.value.systemsOnline}/${stats.value.totalSystems}`, note: 'period average' },
    { label: 'Pipeline health', value: stats.value.health, unit: '%', note: 'weighted', tone: Number(stats.value.health) < 80 ? 'text-sev-high' : 'text-ink-primary' },
    { label: 'Aggregate ingest', value: stats.value.totalRate, unit: 'GB/s', note: 'peak observed' },
    { label: 'Warnings raised', value: Math.round(stats.value.activeAlerts * scale.value), note: 'across connectors' }
  ]
})

const breakdown = computed(() => {
  if (reportType.value === 'threat') {
    return [
      { name: 'Credential access', pct: 38, bar: 'bg-sev-critical' },
      { name: 'Reconnaissance / scans', pct: 27, bar: 'bg-sev-high/85' },
      { name: 'Anomalous data flow', pct: 21, bar: 'bg-line-strong' },
      { name: 'Policy violations', pct: 14, bar: 'bg-line-strong' }
    ]
  }
  return [
    { name: 'Security tooling', pct: 44, bar: 'bg-line-strong' },
    { name: 'Databases', pct: 33, bar: 'bg-line-strong' },
    { name: 'Cloud & containers', pct: 23, bar: 'bg-line-strong' }
  ]
})

const printPreview = () => {
  if (import.meta.client) window.print()
}
</script>
