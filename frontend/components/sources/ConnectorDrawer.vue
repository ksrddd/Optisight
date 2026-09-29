<template>
  <SlideOver ref="shell" :label="`Connector ${connector.name}`" width="480px" @close="emit('close')">
    <header class="shrink-0 border-b border-line px-3 py-2.5">
      <div class="flex items-start gap-2.5">
        <span
          class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded border border-line bg-surface-panel"
          aria-hidden="true"
        >
          <component :is="icon" class="h-4 w-4 text-ink-secondary" />
        </span>

        <div class="min-w-0 flex-1">
          <h2 class="truncate text-lg font-semibold tracking-[-0.02em] text-ink-primary">{{ connector.name }}</h2>
          <p class="truncate text-xs text-ink-muted">{{ connector.description }}</p>
        </div>

        <button class="btn h-7 w-7 shrink-0 px-0" aria-label="Close connector" @click="requestClose">
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="status.dot" aria-hidden="true" />
          <span class="text-xs" :class="status.text">{{ connector.status }}</span>
        </span>
        <span class="h-3 w-px bg-line" aria-hidden="true" />
        <span class="font-mono text-xs tabular-nums text-ink-secondary">{{ connector.rate }} MB/s</span>
        <span class="h-3 w-px bg-line" aria-hidden="true" />
        <span class="font-mono text-2xs text-ink-faint">{{ connector.type }}</span>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <section
        v-if="connector.status === 'Warning'"
        class="border-b border-line px-3 py-2.5"
      >
        <div class="flex items-start gap-2 rounded border border-sev-high/40 bg-sev-high/[0.07] px-2 py-1.5">
          <AlertTriangle class="mt-px h-3.5 w-3.5 shrink-0 text-sev-high" aria-hidden="true" />
          <p class="min-w-0 flex-1 text-xs text-sev-high">
            Ingest has fallen below this connector's baseline. Events may be arriving late or incomplete.
          </p>
        </div>
      </section>

      <section class="border-b border-line px-3 py-2.5">
        <h3 class="panel-title mb-2">Pipeline</h3>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
          <div v-for="f in facts" :key="f.label" class="min-w-0">
            <dt class="field-label">{{ f.label }}</dt>
            <dd class="truncate font-mono text-xs tabular-nums text-ink-primary">{{ f.value }}</dd>
          </div>
        </dl>
      </section>

      <!-- What this source actually contributes downstream. Without this a
           connector page is just a status light. -->
      <section class="px-3 py-2.5">
        <h3 class="panel-title mb-2">Delivers to</h3>
        <ul class="overflow-hidden rounded border border-line">
          <li
            v-for="d in destinations"
            :key="d.label"
            class="flex h-8 items-center gap-2 border-b border-line-faint px-2 last:border-b-0"
          >
            <component :is="d.icon" class="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
            <span class="min-w-0 flex-1 truncate text-xs text-ink-secondary">{{ d.label }}</span>
            <span class="shrink-0 font-mono text-2xs text-ink-faint">{{ d.note }}</span>
          </li>
        </ul>
      </section>
    </div>

    <footer class="shrink-0 border-t border-line bg-surface-panel px-3 py-2.5">
      <div class="flex items-center gap-2">
        <button class="btn flex-1" @click="act('test')">
          <Activity class="h-3.5 w-3.5" aria-hidden="true" />
          Test
        </button>
        <button class="btn flex-1" @click="act('resync')">
          <RefreshCw class="h-3.5 w-3.5" aria-hidden="true" />
          Resync
        </button>
        <button class="btn btn-danger flex-1" @click="act('pause')">
          <PauseCircle class="h-3.5 w-3.5" aria-hidden="true" />
          Pause
        </button>
      </div>
      <p class="mt-1.5 text-2xs text-ink-muted">
        Pausing stops ingestion but retains everything already delivered.
      </p>
    </footer>
  </SlideOver>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  X,
  Activity,
  RefreshCw,
  PauseCircle,
  AlertTriangle,
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
  Globe,
  LayoutDashboard,
  Bell,
  Shield
} from 'lucide-vue-next'
import SlideOver from '~/components/ui/SlideOver.vue'

const props = defineProps({
  connector: { type: Object, required: true }
})

const emit = defineEmits(['close', 'action'])

const shell = ref(null)
const requestClose = () => shell.value?.requestClose()

const ICONS = { Cloud, CloudSnow, CloudCog, Box, Database, Layers, Server, Terminal, ShieldCheck, Users, Code }
const icon = computed(() => ICONS[props.connector.icon] ?? Globe)

const STATUS = {
  Connected: { dot: 'bg-sev-low', text: 'text-ink-secondary' },
  Syncing: { dot: 'bg-ink-faint', text: 'text-ink-muted' },
  Warning: { dot: 'bg-sev-high', text: 'text-sev-high' },
  Disconnected: { dot: 'bg-sev-critical', text: 'text-sev-critical' }
}
const status = computed(() => STATUS[props.connector.status] ?? STATUS.Connected)

const facts = computed(() => [
  { label: 'Connector ID', value: props.connector.id },
  { label: 'Category', value: props.connector.type },
  { label: 'Ingest rate', value: `${props.connector.rate} MB/s` },
  { label: 'Daily volume', value: `${((props.connector.rate * 86400) / 1024 / 1024).toFixed(1)} TB` }
])

const destinations = computed(() => {
  const base = [
    { label: 'Dashboard metrics', icon: LayoutDashboard, note: 'realtime' },
    { label: 'Alert Center rules', icon: Bell, note: 'evaluated' },
    { label: 'System Logs', icon: Terminal, note: 'indexed' }
  ]
  if (['Security', 'Auth', 'Logs'].includes(props.connector.type)) {
    base.splice(2, 0, { label: 'Security (SOC) detections', icon: Shield, note: 'correlated' })
  }
  return base
})

const act = (kind) => {
  emit('action', { kind, connector: props.connector })
  requestClose()
}
</script>
