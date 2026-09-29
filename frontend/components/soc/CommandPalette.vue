<template>
  <Teleport to="body">
    <Transition name="cmdk">
      <div
        v-if="open"
        class="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[12vh]"
        @click.self="close"
      >
        <div
          class="w-full max-w-[560px] overflow-hidden rounded-lg border border-line-strong bg-surface-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <div class="flex items-center gap-2 border-b border-line px-3">
            <Search class="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Jump to a view, filter the queue, or search an asset…"
              class="h-11 w-full border-0 bg-transparent p-0 text-md text-ink-primary outline-none placeholder:text-ink-faint"
              aria-label="Command"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="run(results[cursor])"
              @keydown.esc="close"
            />
            <kbd class="kbd shrink-0">Esc</kbd>
          </div>

          <div class="max-h-[46vh] overflow-y-auto py-1">
            <template v-for="group in grouped" :key="group.label">
              <p class="px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
                {{ group.label }}
              </p>
              <button
                v-for="cmd in group.items"
                :key="cmd.id"
                class="flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors duration-fast"
                :class="results[cursor]?.id === cmd.id ? 'bg-surface-hover' : ''"
                @click="run(cmd)"
                @mousemove="cursor = results.findIndex((r) => r.id === cmd.id)"
              >
                <component :is="cmd.icon" class="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
                <span class="min-w-0 flex-1 truncate text-sm text-ink-primary">{{ cmd.label }}</span>
                <span v-if="cmd.hint" class="shrink-0 font-mono text-2xs text-ink-faint">{{ cmd.hint }}</span>
              </button>
            </template>

            <p v-if="!results.length" class="px-3 py-4 text-center text-sm text-ink-muted">
              No commands match “{{ query }}”.
            </p>
          </div>

          <div class="flex items-center gap-3 border-t border-line bg-surface-panel px-3 py-1.5 text-2xs text-ink-faint">
            <span><kbd class="kbd">↑</kbd> <kbd class="kbd">↓</kbd> navigate</span>
            <span><kbd class="kbd">↵</kbd> run</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  LayoutDashboard,
  Network,
  Bell,
  Shield,
  Database,
  Users,
  CreditCard,
  Settings,
  AlertOctagon,
  Inbox,
  CheckCircle2
} from 'lucide-vue-next'

const router = useRouter()
const open = useState('cmdk-open', () => false)
const query = ref('')
const cursor = ref(0)
const inputRef = ref(null)

const commands = [
  { id: 'nav-dash', group: 'Navigate', label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { id: 'nav-int', group: 'Navigate', label: 'Data Sources', icon: Network, to: '/integrations' },
  { id: 'nav-alerts', group: 'Navigate', label: 'Alert Center', icon: Bell, to: '/alerts' },
  { id: 'nav-sec', group: 'Navigate', label: 'Security (SOC)', icon: Shield, to: '/security' },
  { id: 'nav-logs', group: 'Navigate', label: 'System Logs', icon: Database, to: '/logs' },
  { id: 'nav-users', group: 'Navigate', label: 'Access Control', icon: Users, to: '/users' },
  { id: 'nav-sub', group: 'Navigate', label: 'Subscription', icon: CreditCard, to: '/subscription' },
  { id: 'nav-set', group: 'Navigate', label: 'Settings', icon: Settings, to: '/settings' },

  // These do real work: the SOC page reads these query params and seeds its
  // filter state from them, so a palette entry is a shareable view.
  {
    id: 'view-crit',
    group: 'Filter the queue',
    label: 'Critical incidents only',
    icon: AlertOctagon,
    to: '/security?sev=critical',
    hint: 'SOC'
  },
  {
    id: 'view-untriaged',
    group: 'Filter the queue',
    label: 'Untriaged queue',
    icon: Inbox,
    to: '/security?status=new',
    hint: 'SOC'
  },
  {
    id: 'view-escalated',
    group: 'Filter the queue',
    label: 'Critical and high, in triage',
    icon: AlertOctagon,
    to: '/security?sev=critical,high&status=triaging',
    hint: 'SOC'
  },
  {
    id: 'view-contained',
    group: 'Filter the queue',
    label: 'Contained incidents',
    icon: CheckCircle2,
    to: '/security?status=contained',
    hint: 'SOC'
  }
]

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return commands
  return commands.filter((c) => `${c.label} ${c.group}`.toLowerCase().includes(q))
})

const grouped = computed(() => {
  const map = new Map()
  for (const cmd of results.value) {
    if (!map.has(cmd.group)) map.set(cmd.group, { label: cmd.group, items: [] })
    map.get(cmd.group).items.push(cmd)
  }
  return [...map.values()]
})

const move = (delta) => {
  const n = results.value.length
  if (!n) return
  cursor.value = (cursor.value + delta + n) % n
}

const close = () => {
  open.value = false
}

const run = (cmd) => {
  if (!cmd) return
  close()
  router.push(cmd.to)
}

watch(query, () => (cursor.value = 0))

watch(open, async (v) => {
  if (!v) return
  query.value = ''
  cursor.value = 0
  await nextTick()
  inputRef.value?.focus()
})

const onKeydown = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.cmdk-enter-active,
.cmdk-leave-active {
  transition: opacity 120ms cubic-bezier(0.16, 1, 0.3, 1);
}

.cmdk-enter-from,
.cmdk-leave-to {
  opacity: 0;
}
</style>
