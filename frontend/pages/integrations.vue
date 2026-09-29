<template>
  <div class="flex h-full min-h-0 flex-col bg-surface-base">
    <!-- Page head -->
    <div class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
      <div class="min-w-0">
        <h1 class="truncate text-lg font-semibold tracking-[-0.02em] text-ink-primary">Data Sources</h1>
        <p class="truncate text-xs text-ink-muted">
          {{ connectors.length }} connectors ·
          <span class="font-mono">{{ totalRate.toLocaleString() }}</span> MB/s aggregate ingest
        </p>
      </div>

      <button class="btn btn-primary shrink-0" @click="addSource">
        <Plus class="h-3.5 w-3.5" aria-hidden="true" />
        Add source
      </button>
    </div>

    <!-- Pipeline posture -->
    <div class="flex shrink-0 flex-wrap items-stretch border-b border-line bg-surface-raised">
      <button
        v-for="p in posture"
        :key="p.key"
        class="flex min-w-[150px] flex-1 flex-col gap-0.5 border-r border-line px-3 py-2 text-left
               transition-colors duration-fast last:border-r-0 hover:bg-surface-hover"
        :class="statusFilter === p.key ? 'bg-surface-hover' : ''"
        :aria-pressed="statusFilter === p.key"
        @click="statusFilter = statusFilter === p.key ? null : p.key"
      >
        <span class="field-label truncate">{{ p.label }}</span>
        <span class="flex items-baseline gap-1.5">
          <span class="text-xl font-semibold tabular-nums" :class="p.count ? p.tone : 'text-ink-primary'">
            {{ p.count }}
          </span>
          <span class="truncate text-2xs text-ink-muted">{{ p.note }}</span>
        </span>
      </button>
    </div>

    <!-- Connector table + rail -->
    <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          class="grid h-7 shrink-0 items-center gap-3 border-b border-line bg-surface-panel px-3
                 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-muted"
          :style="gridStyle"
        >
          <span>Source</span>
          <span>Kind</span>
          <span>Status</span>
          <span class="text-right">Ingest</span>
          <span>Share of pipeline</span>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div v-if="!visibleGroups.length" class="flex h-full items-center justify-center p-6">
            <div class="max-w-[280px] text-center">
              <Network class="mx-auto h-5 w-5 text-ink-faint" aria-hidden="true" />
              <p class="mt-2 text-sm font-medium text-ink-primary">No connectors in this state</p>
              <p class="mt-1 text-xs text-ink-muted">Clear the filter to see every data source.</p>
            </div>
          </div>

          <template v-for="group in visibleGroups" :key="group.key">
            <!-- Category acts as a table section, not a separate card block —
                 one continuous scan down the pipeline. -->
            <div
              class="flex h-7 items-center justify-between gap-2 border-b border-line bg-surface-panel px-3"
            >
              <h2 class="panel-title">{{ group.label }}</h2>
              <span class="font-mono text-2xs tabular-nums text-ink-faint">
                {{ group.items.length }} · {{ group.rate.toLocaleString() }} MB/s
              </span>
            </div>

            <button
              v-for="c in group.items"
              :key="c.id"
              class="grid h-9 w-full items-center gap-3 px-3 text-left rule-b transition-colors duration-fast hover:bg-surface-raised"
              :style="gridStyle"
              @click="selected = c"
            >
              <span class="flex min-w-0 items-center gap-2">
                <component :is="iconFor(c.icon)" class="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
                <span class="truncate text-sm text-ink-primary">{{ c.name }}</span>
                <span class="hidden truncate text-2xs text-ink-faint xl:inline">{{ c.description }}</span>
              </span>

              <span class="truncate font-mono text-xs text-ink-muted">{{ c.type }}</span>

              <span class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="statusMeta[c.status].dot" aria-hidden="true" />
                <span class="truncate text-xs" :class="statusMeta[c.status].text">{{ c.status }}</span>
              </span>

              <span class="truncate text-right font-mono text-xs tabular-nums text-ink-secondary">
                {{ c.rate.toLocaleString() }}
                <span class="text-2xs text-ink-faint">MB/s</span>
              </span>

              <span class="flex items-center gap-2">
                <span class="h-1 flex-1 overflow-hidden rounded-[1px] bg-line-faint">
                  <span
                    class="block h-full"
                    :class="c.status === 'Warning' ? 'bg-sev-high/85' : 'bg-ink-faint'"
                    :style="{ width: `${(c.rate / maxRate) * 100}%` }"
                  />
                </span>
                <span class="w-8 shrink-0 text-right font-mono text-2xs tabular-nums text-ink-faint">
                  {{ ((c.rate / totalRate) * 100).toFixed(0) }}%
                </span>
              </span>
            </button>
          </template>
        </div>
      </div>

      <!-- Pipeline rail -->
      <aside
        class="flex w-full shrink-0 flex-col overflow-y-auto border-t border-line bg-surface-raised
               max-h-[42%] lg:max-h-none lg:w-rail lg:border-l lg:border-t-0"
        aria-label="Pipeline summary"
      >
        <section class="shrink-0 border-b border-line">
          <div class="panel-header">
            <h2 class="panel-title">Throughput</h2>
            <span class="font-mono text-2xs text-ink-faint">live</span>
          </div>
          <div class="p-3">
            <p class="flex items-baseline gap-1.5">
              <span class="text-2xl font-semibold tabular-nums tracking-[-0.03em] text-ink-primary">
                {{ totalRate.toLocaleString() }}
              </span>
              <span class="text-sm text-ink-muted">MB/s</span>
            </p>
            <p class="mt-0.5 text-xs text-ink-muted">
              {{ (totalRate / 1024).toFixed(2) }} GB/s across {{ connectors.length }} sources
            </p>

            <div class="mt-2.5 flex h-1.5 w-full gap-px overflow-hidden rounded-[1px] bg-line-faint">
              <span
                v-for="g in groups"
                :key="g.key"
                class="h-full bg-ink-faint"
                :style="{ width: `${(g.rate / totalRate) * 100}%` }"
                :title="`${g.label} · ${g.rate} MB/s`"
              />
            </div>
            <dl class="mt-1.5 space-y-1">
              <div v-for="g in groups" :key="g.key" class="flex items-baseline justify-between gap-2">
                <dt class="truncate text-2xs text-ink-muted">{{ g.label }}</dt>
                <dd class="shrink-0 font-mono text-2xs tabular-nums text-ink-secondary">
                  {{ ((g.rate / totalRate) * 100).toFixed(0) }}%
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="shrink-0">
          <div class="panel-header">
            <h2 class="panel-title">Top sources</h2>
            <span class="text-2xs tracking-normal text-ink-faint">by ingest rate</span>
          </div>
          <ul class="p-3 pt-2">
            <li v-for="c in topSources" :key="c.id" class="py-1.5 first:pt-0 last:pb-0">
              <div class="flex items-baseline justify-between gap-2">
                <span class="truncate font-mono text-xs text-ink-secondary">{{ c.name }}</span>
                <span class="shrink-0 font-mono text-2xs tabular-nums text-ink-muted">{{ c.rate }}</span>
              </div>
              <div class="mt-1 h-1 w-full overflow-hidden rounded-[1px] bg-line-faint">
                <span
                  class="block h-full"
                  :class="c.status === 'Warning' ? 'bg-sev-high/85' : 'bg-ink-faint'"
                  :style="{ width: `${(c.rate / maxRate) * 100}%` }"
                />
              </div>
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <ConnectorDrawer v-if="selected" :connector="selected" @close="selected = null" @action="handleAction" />
  </div>
</template>

<script setup>
import { ref, computed, inject, defineAsyncComponent } from 'vue'
import {
  Plus,
  Network,
  Cloud,
  CloudSnow,
  CloudCog,
  Box,
  Database,
  Layers,
  Server,
  Terminal,
  ShieldCheck,
  Users,
  Code,
  Globe
} from 'lucide-vue-next'

const ConnectorDrawer = defineAsyncComponent(() => import('~/components/sources/ConnectorDrawer.vue'))

definePageMeta({ dense: true })
useHead({ title: 'Data Sources | OptiSight' })

const toast = inject('toast', { add: () => {} })

// Shared application state — the dashboard and settings read the same records,
// so this page must not fork its own copy of the connector list.
const { integrations } = useSystemState()

const selected = ref(null)
const statusFilter = ref(null)

const gridStyle = {
  gridTemplateColumns: 'minmax(190px,1.7fr) 110px 118px 120px minmax(140px,1fr)'
}

const ICONS = { Cloud, CloudSnow, CloudCog, Box, Database, Layers, Server, Terminal, ShieldCheck, Users, Code }
const iconFor = (name) => ICONS[name] ?? Globe

const statusMeta = {
  Connected: { dot: 'bg-sev-low', text: 'text-ink-secondary' },
  Syncing: { dot: 'bg-ink-faint', text: 'text-ink-muted' },
  Warning: { dot: 'bg-sev-high', text: 'text-sev-high' },
  Disconnected: { dot: 'bg-sev-critical', text: 'text-sev-critical' }
}

const GROUP_META = [
  { key: 'cloud', label: 'Cloud infrastructure' },
  { key: 'db', label: 'Database & legacy systems' },
  { key: 'security', label: 'Security & monitoring tools' }
]

const connectors = computed(() =>
  GROUP_META.flatMap((g) => (integrations.value[g.key] ?? []).map((c) => ({ ...c, group: g.key })))
)

const totalRate = computed(() => connectors.value.reduce((sum, c) => sum + c.rate, 0))
const maxRate = computed(() => Math.max(1, ...connectors.value.map((c) => c.rate)))

const groups = computed(() =>
  GROUP_META.map((g) => {
    const items = connectors.value.filter((c) => c.group === g.key)
    return { ...g, items, rate: items.reduce((s, c) => s + c.rate, 0) }
  })
)

const visibleGroups = computed(() =>
  groups.value
    .map((g) => ({
      ...g,
      items: statusFilter.value ? g.items.filter((c) => matchesStatus(c, statusFilter.value)) : g.items
    }))
    .filter((g) => g.items.length > 0)
)

const matchesStatus = (c, key) => {
  if (key === 'healthy') return c.status === 'Connected'
  if (key === 'syncing') return c.status === 'Syncing'
  if (key === 'warning') return c.status === 'Warning'
  return true
}

const posture = computed(() => {
  const list = connectors.value
  const healthy = list.filter((c) => c.status === 'Connected').length
  const syncing = list.filter((c) => c.status === 'Syncing').length
  const warning = list.filter((c) => c.status === 'Warning').length
  return [
    { key: 'healthy', label: 'Healthy', count: healthy, tone: 'text-ink-primary', note: 'streaming normally' },
    { key: 'syncing', label: 'Syncing', count: syncing, tone: 'text-ink-primary', note: 'backfill in progress' },
    { key: 'warning', label: 'Degraded', count: warning, tone: 'text-sev-high', note: 'ingest below baseline' },
    {
      key: 'volume',
      label: 'Aggregate ingest',
      count: `${(totalRate.value / 1024).toFixed(2)}`,
      tone: 'text-ink-primary',
      note: 'GB/s across all sources'
    }
  ]
})

const topSources = computed(() => [...connectors.value].sort((a, b) => b.rate - a.rate).slice(0, 6))

const addSource = () =>
  toast.add('Connect a source', 'Choose a provider to begin the connection wizard.', 'info')

const handleAction = ({ kind, connector }) => {
  const record = connectors.value.find((c) => c.id === connector.id)
  if (!record) return

  if (kind === 'resync') {
    toast.add('Resync started', `${connector.name} is backfilling from its last checkpoint.`, 'success')
  } else if (kind === 'pause') {
    toast.add('Ingestion paused', `${connector.name} will stop delivering until resumed.`, 'info')
  } else {
    toast.add('Test connection', `Handshake with ${connector.name} succeeded.`, 'success')
  }
}
</script>
