<template>
  <div class="flex h-full min-h-0 flex-col bg-surface-base">
    <!-- Page head -->
    <div class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
      <div class="min-w-0">
        <h1 class="flex items-center gap-2 truncate text-lg font-semibold tracking-[-0.02em] text-ink-primary">
          Alert Center
          <DemoBadge />
        </h1>
        <p class="truncate text-xs text-ink-muted">
          Cross-team anomaly routing · <span class="font-mono">{{ open.length }}</span> open of
          <span class="font-mono">{{ alerts.length }}</span>
        </p>
      </div>
      <button class="btn shrink-0" :disabled="loading" @click="load">
        <RefreshCw class="h-3.5 w-3.5" :class="loading ? 'animate-spin' : ''" aria-hidden="true" />
        Refresh
      </button>
    </div>

    <!-- Routing filter: which team owns the response. Counts report what each
         narrowing will show before it is clicked. -->
    <div class="flex shrink-0 items-stretch border-b border-line bg-surface-raised">
      <button
        v-for="t in teams"
        :key="t.key"
        class="flex min-w-[130px] flex-1 flex-col gap-0.5 border-r border-line px-3 py-2 text-left
               transition-colors duration-fast last:border-r-0 hover:bg-surface-hover"
        :class="team === t.key ? 'bg-surface-hover' : ''"
        :aria-pressed="team === t.key"
        @click="team = t.key"
      >
        <span class="field-label truncate">{{ t.label }}</span>
        <span class="flex items-baseline gap-1.5">
          <span class="text-xl font-semibold tabular-nums text-ink-primary">{{ countFor(t.key) }}</span>
          <span class="truncate text-2xs text-ink-muted">{{ t.note }}</span>
        </span>
      </button>
    </div>

    <!-- Body: loading / error / empty / ready -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <!-- Loading -->
      <div v-if="loading" class="divide-y divide-line-faint">
        <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-3 py-3.5">
          <div class="h-8 w-1 shrink-0 rounded bg-surface-hover" />
          <div class="flex-1 space-y-2">
            <div class="h-3 w-1/3 rounded bg-surface-hover" />
            <div class="h-2.5 w-2/3 rounded bg-surface-raised" />
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex h-full items-center justify-center p-6">
        <div class="max-w-[300px] text-center">
          <AlertTriangle class="mx-auto h-5 w-5 text-sev-high" aria-hidden="true" />
          <p class="mt-2 text-sm font-medium text-ink-primary">Couldn't load alerts</p>
          <p class="mt-1 text-xs text-ink-muted">{{ error }}</p>
          <button class="btn mt-3" @click="load">Try again</button>
        </div>
      </div>

      <!-- Empty (no data at all, or filtered to zero) -->
      <div v-else-if="!visible.length" class="flex h-full items-center justify-center p-6">
        <div class="max-w-[300px] text-center">
          <CheckCircle2 class="mx-auto h-5 w-5 text-ink-faint" aria-hidden="true" />
          <p class="mt-2 text-sm font-medium text-ink-primary">
            {{ alerts.length ? 'Nothing in this view' : 'No open alerts' }}
          </p>
          <p class="mt-1 text-xs text-ink-muted">
            {{ alerts.length ? 'No alerts are routed to this team right now.' : 'Anomalies appear here as they are detected and routed.' }}
          </p>
          <button v-if="alerts.length && team !== 'all'" class="btn mt-3" @click="team = 'all'">Show all teams</button>
        </div>
      </div>

      <!-- Ready -->
      <ul v-else class="divide-y divide-line-faint">
        <li
          v-for="a in visible"
          :key="a.id"
          class="flex items-start gap-3 px-3 py-3 transition-colors duration-fast hover:bg-surface-raised"
        >
          <!-- Severity rail: shape + code, never colour alone -->
          <span class="mt-0.5 h-8 w-[3px] shrink-0 rounded-[1px]" :class="barFor(a.severity)" aria-hidden="true" />

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2">
                <SeverityTag :severity="tagSeverity(a.severity)" />
                <h3 class="truncate text-sm font-medium text-ink-primary">{{ a.title }}</h3>
              </div>
              <time class="shrink-0 font-mono text-2xs tabular-nums text-ink-muted" :datetime="new Date(a.ts).toISOString()">
                {{ relative(a.ts) }}
              </time>
            </div>

            <p class="mt-1 text-xs text-ink-secondary">{{ a.description }}</p>

            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span
                class="inline-flex items-center gap-1 rounded border border-line px-1.5 py-0.5 text-2xs font-medium text-ink-muted"
              >
                <component :is="teamIcon(a.team)" class="h-3 w-3" aria-hidden="true" />
                {{ teamLabel(a.team) }}
              </span>
              <span class="truncate font-mono text-2xs text-ink-faint">{{ a.source }}</span>

              <!-- Actions are always visible: never hidden behind hover, which
                   is invisible on touch and unreachable by keyboard (UX-03). -->
              <span class="ml-auto flex shrink-0 items-center gap-1.5">
                <button class="btn h-6 px-2 text-2xs" @click="investigate(a)">Run diagnostics</button>
                <button class="btn h-6 px-2 text-2xs" @click="acknowledge(a)">Acknowledge</button>
              </span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { RefreshCw, AlertTriangle, CheckCircle2, Shield, Server, Layers } from 'lucide-vue-next'
import SeverityTag from '~/components/soc/SeverityTag.vue'
import DemoBadge from '~/components/ui/DemoBadge.vue'
import { useUser } from '~/composables/useUser'

definePageMeta({ dense: true })
useHead({ title: 'Alert Center | OptiSight' })

const toast = inject('toast', { add: () => {} })
const config = useRuntimeConfig()
const { token } = useUser()

const alerts = ref([])
const loading = ref(true)
const error = ref('')
const team = ref('all')

const teams = [
  { key: 'all', label: 'All alerts', note: 'every team' },
  { key: 'soc', label: 'SOC / Security', note: 'intrusion & risk' },
  { key: 'itops', label: 'IT Operations', note: 'performance & capacity' }
]

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await $fetch(`${config.public.apiBase}/api/alerts`, {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
    })
    alerts.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err.data?.error || 'The alert service is unavailable.'
    alerts.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)

const open = computed(() => alerts.value)
const countFor = (key) => (key === 'all' ? alerts.value.length : alerts.value.filter((a) => a.team === key).length)
const visible = computed(() => (team.value === 'all' ? alerts.value : alerts.value.filter((a) => a.team === team.value)))

// Alert levels (critical/warning/info) map onto the shared severity scale so one
// SeverityTag serves the whole app. Bars follow the console rule: colour for the
// levels that demand action, neutral for the informational baseline.
const tagSeverity = (s) => ({ critical: 'critical', warning: 'high', info: 'low' })[s] || 'low'
const barFor = (s) => ({ critical: 'bg-sev-critical', warning: 'bg-sev-high', info: 'bg-line-strong' })[s] || 'bg-line-strong'

const teamLabel = (t) => (t === 'soc' ? 'SOC / Security' : 'IT Operations')
const teamIcon = (t) => (t === 'soc' ? Shield : t === 'itops' ? Server : Layers)

const relative = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const acknowledge = (a) => {
  alerts.value = alerts.value.filter((x) => x.id !== a.id)
  toast.add('Alert acknowledged', `${a.id} cleared from the queue.`, 'info')
}
const investigate = (a) => {
  toast.add('Diagnostics started', `Root-cause analysis running for ${a.id}.`, 'success')
}
</script>
