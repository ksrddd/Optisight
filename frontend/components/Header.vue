<template>
  <header
    class="relative z-30 flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface-raised px-2 md:px-3"
  >
    <!-- Mobile navigation -->
    <button
      class="btn h-7 w-7 px-0 md:hidden"
      aria-label="Open navigation"
      @click="navOpen = true"
    >
      <Menu class="h-4 w-4" aria-hidden="true" />
    </button>

    <!-- Environment / cluster switcher -->
    <div ref="envRef" class="relative">
      <button
        class="btn max-w-[190px] gap-2"
        :aria-expanded="envOpen"
        aria-haspopup="listbox"
        @click="envOpen = !envOpen"
      >
        <span
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="activeEnv.production ? 'bg-sev-low' : 'bg-ink-faint'"
          aria-hidden="true"
        />
        <span class="truncate font-mono text-xs text-ink-primary">{{ activeEnv.id }}</span>
        <ChevronDown class="h-3 w-3 shrink-0 text-ink-faint" aria-hidden="true" />
      </button>

      <ul
        v-if="envOpen"
        class="absolute left-0 top-[calc(100%+4px)] z-50 w-[280px] overflow-hidden rounded-md border border-line-strong bg-surface-overlay py-1"
        role="listbox"
        aria-label="Environment"
      >
        <li v-for="env in environments" :key="env.id" role="option" :aria-selected="env.id === activeEnv.id">
          <button
            class="flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors duration-fast hover:bg-surface-hover"
            @click="selectEnv(env)"
          >
            <span
              class="h-1.5 w-1.5 shrink-0 rounded-full"
              :class="env.production ? 'bg-sev-low' : 'bg-ink-faint'"
              aria-hidden="true"
            />
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="truncate font-mono text-xs text-ink-primary">{{ env.id }}</span>
              <span class="truncate text-2xs tracking-normal text-ink-muted">{{ env.label }}</span>
            </span>
            <span class="shrink-0 font-mono text-2xs tabular-nums text-ink-faint">{{ env.nodes }} nodes</span>
            <Check
              v-if="env.id === activeEnv.id"
              class="h-3.5 w-3.5 shrink-0 text-ink-primary"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </div>

    <!-- Command search -->
    <button
      class="ml-1 hidden h-7 min-w-0 flex-1 items-center gap-2 rounded border border-line bg-surface-input px-2
             text-left transition-colors duration-fast ease-out hover:border-line-strong sm:flex md:max-w-md"
      @click="cmdkOpen = true"
    >
      <Search class="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
      <span class="truncate text-xs text-ink-muted">Search incidents, assets, IPs…</span>
      <span class="ml-auto flex shrink-0 items-center gap-0.5">
        <kbd class="kbd">{{ modKey }}</kbd>
        <kbd class="kbd">K</kbd>
      </span>
    </button>

    <div class="flex-1 sm:hidden" />

    <!-- System health -->
    <div class="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
      <dl class="hidden items-center gap-3 lg:flex" aria-label="Stream health">
        <div class="flex items-baseline gap-1.5">
          <dt class="field-label">RTT</dt>
          <dd class="font-mono text-xs tabular-nums text-ink-secondary">
            {{ health.connected ? `${health.latencyMs}ms` : '—' }}
          </dd>
        </div>
        <div class="flex items-baseline gap-1.5">
          <dt class="field-label">Ingest</dt>
          <dd class="font-mono text-xs tabular-nums text-ink-secondary">
            {{ health.ingestRate }}/min
          </dd>
        </div>
      </dl>

      <!-- Connection state. Shape and text carry the state; colour only
           reinforces it, so this stays readable without colour vision. -->
      <div
        class="flex h-7 items-center gap-1.5 rounded border border-line px-2"
        :title="health.connected ? 'Socket stream connected' : 'Socket unavailable — local generator active'"
      >
        <span class="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span
            v-if="health.connected"
            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sev-low opacity-60"
          />
          <span
            class="relative inline-flex h-1.5 w-1.5 rounded-full"
            :class="health.connected ? 'bg-sev-low' : 'bg-sev-high'"
          />
        </span>
        <span class="text-2xs font-semibold uppercase tracking-[0.06em] text-ink-secondary">
          {{ health.connected ? 'Live' : 'Local' }}
        </span>
      </div>

      <time
        v-if="mounted"
        class="hidden font-mono text-xs tabular-nums text-ink-muted md:block"
        :datetime="isoNow"
      >
        {{ clock }} UTC
      </time>

      <button class="btn relative h-7 w-7 px-0" aria-label="Notifications">
        <Bell class="h-4 w-4" aria-hidden="true" />
        <span
          class="absolute -right-px -top-px h-1.5 w-1.5 rounded-full bg-sev-critical ring-2 ring-surface-raised"
          aria-hidden="true"
        />
      </button>
    </div>
  </header>
</template>

<script setup>
import { Menu, Search, Bell, ChevronDown, Check } from 'lucide-vue-next'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const navOpen = useState('nav-open', () => false)
const cmdkOpen = useState('cmdk-open', () => false)
const health = useState('stream-health', () => ({
  connected: false,
  latencyMs: 0,
  ingestRate: 0,
  source: 'local'
}))

const environments = [
  { id: 'prod-apac-1', label: 'Production · Singapore', nodes: 42, production: true },
  { id: 'prod-emea-1', label: 'Production · Frankfurt', nodes: 28, production: true },
  { id: 'stg-apac-1', label: 'Staging · Singapore', nodes: 9, production: false },
  { id: 'dr-apac-2', label: 'Disaster recovery · Jakarta', nodes: 12, production: false }
]

const activeEnv = useState('active-env', () => environments[0])
const envOpen = ref(false)
const envRef = ref(null)

const selectEnv = (env) => {
  activeEnv.value = env
  envOpen.value = false
}

const onDocClick = (e) => {
  if (envRef.value && !envRef.value.contains(e.target)) envOpen.value = false
}

// Clock renders only after mount; a server-rendered time would not match the
// client's first paint.
const mounted = ref(false)
const clock = ref('')
const isoNow = ref('')
let timer = null

const tick = () => {
  const d = new Date()
  isoNow.value = d.toISOString()
  clock.value = isoNow.value.slice(11, 19)
}

const modKey = computed(() => {
  if (!mounted.value) return 'Ctrl'
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl'
})

onMounted(() => {
  mounted.value = true
  tick()
  timer = setInterval(tick, 1000)
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('click', onDocClick)
})
</script>
