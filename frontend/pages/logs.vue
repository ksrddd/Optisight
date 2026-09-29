<template>
  <div class="flex h-full min-h-0 flex-col bg-surface-base">
    <!-- Page head -->
    <div class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
      <div class="min-w-0">
        <h1 class="truncate text-lg font-semibold tracking-[-0.02em] text-ink-primary">System Logs</h1>
        <p class="truncate text-xs text-ink-muted">
          Centralised across {{ stream.byService.value.length }} services ·
          <span class="font-mono">{{ stream.rate.value }}</span> lines/s ·
          error rate
          <span class="font-mono" :class="stream.errorRate.value >= 2 ? 'text-sev-high' : ''">
            {{ stream.errorRate.value.toFixed(2) }}%
          </span>
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button class="btn" :aria-pressed="!stream.streaming.value" @click="toggle">
          <component :is="stream.streaming.value ? Pause : Play" class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden sm:inline">{{ stream.streaming.value ? 'Pause' : 'Resume' }}</span>
        </button>
        <button class="btn" @click="copyQuery">
          <Download class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="flex min-h-[38px] shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line bg-surface-raised px-2 py-1.5"
    >
      <div class="flex items-center gap-1" role="group" aria-label="Filter by level">
        <button
          v-for="l in levels"
          :key="l.key"
          class="chip"
          :class="filters.levels.includes(l.key) ? 'chip-on' : ''"
          :aria-pressed="filters.levels.includes(l.key)"
          @click="toggleLevel(l.key)"
        >
          <span class="h-2 w-[3px] shrink-0 rounded-[1px]" :class="l.bar" aria-hidden="true" />
          {{ l.key }}
          <span class="font-mono text-2xs tabular-nums text-ink-faint">
            {{ compact(stream.levelCounts.value[l.key]) }}
          </span>
        </button>
      </div>

      <span class="h-4 w-px shrink-0 bg-line" aria-hidden="true" />

      <select v-model="filters.service" class="input h-6 w-[136px] cursor-pointer text-xs" aria-label="Filter by service">
        <option value="">All services</option>
        <option v-for="s in stream.byService.value" :key="s.service" :value="s.service">{{ s.service }}</option>
      </select>

      <label class="relative flex h-6 min-w-[150px] flex-1 items-center sm:max-w-[300px]">
        <span class="sr-only">Search message, host or trace id</span>
        <Search class="pointer-events-none absolute left-2 h-3 w-3 text-ink-faint" aria-hidden="true" />
        <input
          v-model="filters.query"
          type="search"
          placeholder="message, host, trace…"
          class="input h-6 rounded pl-7 font-mono text-xs placeholder:font-sans"
        />
      </label>

      <div class="ml-auto flex shrink-0 items-center gap-2">
        <p class="font-mono text-xs tabular-nums text-ink-muted">
          <span class="text-ink-primary">{{ compact(filtered.length) }}</span>
          <span class="text-ink-faint"> / {{ compact(stream.entries.value.length) }}</span>
        </p>
        <button v-if="isFiltered" class="chip" @click="reset">
          <X class="h-3 w-3" aria-hidden="true" />
          Clear
        </button>
      </div>
    </div>

    <!-- Console + rail -->
    <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <div class="relative min-h-0 flex-1">
          <div
            v-if="held > 0"
            class="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center"
          >
            <button
              class="btn pointer-events-auto h-6 gap-1.5 border-line-strong bg-surface-overlay text-ink-primary"
              @click="jumpToLatest"
            >
              <ArrowUp class="h-3 w-3" aria-hidden="true" />
              <span class="font-mono tabular-nums">{{ compact(held) }}</span>
              new · held
            </button>
          </div>

          <div
            ref="containerRef"
            class="h-full overflow-y-auto outline-none"
            tabindex="0"
            role="log"
            aria-label="System log console"
            @pointerenter="pointerInside = true"
            @pointerleave="onPointerLeave"
          >
            <div v-if="!displayRows.length" class="flex h-full items-center justify-center p-6">
              <div class="max-w-[280px] text-center">
                <FileSearch class="mx-auto h-5 w-5 text-ink-faint" aria-hidden="true" />
                <p class="mt-2 text-sm font-medium text-ink-primary">No lines match these filters</p>
                <p class="mt-1 text-xs text-ink-muted">The stream is still running behind the filter.</p>
              </div>
            </div>

            <div v-else :style="{ height: `${totalHeight}px` }" class="relative w-full">
              <div class="absolute inset-x-0 top-0" :style="{ transform: `translateY(${offsetY}px)` }">
                <!-- A log line is a line: one row, fixed height, no wrapping.
                     The full record lives in the drawer rather than reflowing
                     the console and breaking the virtualiser's row maths. -->
                <button
                  v-for="row in visible"
                  :key="row.item.id"
                  class="flex h-6 w-full items-center gap-3 whitespace-nowrap px-3 text-left font-mono text-xs
                         transition-colors duration-fast hover:bg-surface-raised"
                  @click="selected = row.item"
                >
                  <span class="w-[92px] shrink-0 tabular-nums text-ink-faint">{{ fmtTime(row.item.ts) }}</span>
                  <span class="w-[46px] shrink-0 font-semibold" :class="levelMeta[row.item.level].text">
                    {{ row.item.level }}
                  </span>
                  <span class="w-[104px] shrink-0 truncate text-ink-muted">{{ row.item.service }}</span>
                  <span class="hidden w-[112px] shrink-0 truncate text-ink-faint xl:block">{{ row.item.host }}</span>
                  <span class="min-w-0 flex-1 truncate" :class="levelMeta[row.item.level].msg">
                    {{ row.item.message }}
                  </span>
                  <span
                    v-if="row.item.status"
                    class="hidden w-8 shrink-0 text-right tabular-nums 2xl:block"
                    :class="row.item.status >= 500 ? 'text-sev-critical' : 'text-ink-faint'"
                  >{{ row.item.status }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex h-6 shrink-0 items-center gap-3 overflow-hidden whitespace-nowrap border-t border-line
                 bg-surface-panel px-3 font-mono text-2xs tabular-nums text-ink-faint"
        >
          <span class="shrink-0">{{ visible.length }} lines mounted</span>
          <span class="h-2.5 w-px shrink-0 bg-line" aria-hidden="true" />
          <span class="shrink-0">{{ compact(stream.retained.value) }} / {{ compact(stream.capacity) }} buffered</span>
          <span class="hidden h-2.5 w-px shrink-0 bg-line sm:block" aria-hidden="true" />
          <span class="hidden shrink-0 sm:inline">batch 250ms</span>
        </div>
      </div>

      <!-- Service health rail -->
      <aside
        class="flex w-full shrink-0 flex-col overflow-y-auto border-t border-line bg-surface-raised
               max-h-[42%] lg:max-h-none lg:w-rail lg:border-l lg:border-t-0"
        aria-label="Log volume by service"
      >
        <section class="shrink-0 border-b border-line">
          <div class="panel-header">
            <h2 class="panel-title">Level mix</h2>
            <span class="font-mono text-2xs text-ink-faint">last {{ compact(3000) }}</span>
          </div>
          <div class="p-3">
            <div class="flex h-1.5 w-full gap-px overflow-hidden rounded-[1px] bg-line-faint">
              <span
                v-for="l in levelMix"
                :key="l.key"
                class="h-full"
                :class="l.bar"
                :style="{ width: `${l.pct}%` }"
                :title="`${l.count} ${l.key}`"
              />
            </div>
            <dl class="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <div v-for="l in levelMix" :key="l.key" class="flex shrink-0 items-center gap-1">
                <dt class="text-2xs tracking-normal" :class="levelMeta[l.key].text">{{ l.key }}</dt>
                <dd class="font-mono text-2xs tabular-nums text-ink-secondary">{{ compact(l.count) }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="shrink-0">
          <div class="panel-header">
            <h2 class="panel-title">Volume by service</h2>
            <span class="text-2xs tracking-normal text-ink-faint">errors / lines</span>
          </div>

          <ul class="p-3 pt-2">
            <li v-for="s in serviceRows" :key="s.service" class="py-1.5 first:pt-0 last:pb-0">
              <div class="flex items-baseline justify-between gap-2">
                <button
                  class="truncate font-mono text-xs transition-colors duration-fast hover:text-ink-primary"
                  :class="filters.service === s.service ? 'text-ink-primary' : 'text-ink-secondary'"
                  @click="filters.service = filters.service === s.service ? '' : s.service"
                >
                  {{ s.service }}
                </button>
                <span class="shrink-0 font-mono text-2xs tabular-nums">
                  <span :class="s.errors ? 'text-sev-critical' : 'text-ink-faint'">{{ s.errors }}</span>
                  <span class="text-ink-faint">/{{ compact(s.total) }}</span>
                </span>
              </div>
              <div class="mt-1 flex h-1 w-full gap-px overflow-hidden rounded-[1px] bg-line-faint">
                <span
                  v-for="seg in s.segments"
                  :key="seg.key"
                  class="h-full"
                  :class="seg.bar"
                  :style="{ width: `${seg.pct}%` }"
                />
              </div>
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <LogDrawer v-if="selected" :entry="selected" @close="selected = null" @filter="applyFilter" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, defineAsyncComponent, onBeforeUnmount, inject } from 'vue'
import { Pause, Play, Download, Search, X, ArrowUp, FileSearch } from 'lucide-vue-next'

const LogDrawer = defineAsyncComponent(() => import('~/components/logs/LogDrawer.vue'))

definePageMeta({ dense: true })
useHead({ title: 'System Logs | OptiSight' })

const stream = useLogStream()
const selected = ref(null)

const ROW_H = 24

const levels = [
  { key: 'ERROR', bar: 'bg-sev-critical' },
  { key: 'WARN', bar: 'bg-sev-high' },
  { key: 'INFO', bar: 'bg-line-strong' },
  { key: 'DEBUG', bar: 'bg-line-strong' }
]

// INFO and DEBUG are the baseline of every log stream. Colouring them would
// tint the entire console and leave nothing for the lines that matter.
const levelMeta = {
  ERROR: { text: 'text-sev-critical', msg: 'text-sev-critical', bar: 'bg-sev-critical' },
  WARN: { text: 'text-sev-high', msg: 'text-ink-primary', bar: 'bg-sev-high/85' },
  INFO: { text: 'text-ink-muted', msg: 'text-ink-secondary', bar: 'bg-line-strong' },
  DEBUG: { text: 'text-ink-faint', msg: 'text-ink-faint', bar: 'bg-line' }
}

const filters = ref({ levels: [], service: '', query: '' })

const filtered = computed(() => {
  const { levels: lv, service, query } = filters.value
  const q = query.trim().toLowerCase()

  return stream.entries.value.filter((e) => {
    if (lv.length && !lv.includes(e.level)) return false
    if (service && e.service !== service) return false
    if (q) {
      const hay = `${e.message} ${e.host} ${e.service} ${e.traceId}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

// --- Hold-while-working, same contract as the threat feed -----------------
const held = ref(0)
const pointerInside = ref(false)
const displayRows = computed(() => (held.value > 0 ? filtered.value.slice(held.value) : filtered.value))

const { containerRef, visible, totalHeight, offsetY, atTop, scrollToTop } = useVirtualList(displayRows, {
  itemHeight: ROW_H,
  overscan: 14
})

const shouldHold = () => pointerInside.value || !atTop.value
let prevHeadId = null

watch(
  filtered,
  (rows) => {
    const headId = rows[held.value]?.id ?? null
    if (prevHeadId === null) {
      prevHeadId = headId
      return
    }
    if (headId === prevHeadId) return

    const idx = rows.findIndex((r) => r.id === prevHeadId)
    if (idx === -1) held.value = 0
    else if (idx > held.value && shouldHold()) held.value = idx
    else held.value = 0

    prevHeadId = rows[held.value]?.id ?? null
  },
  { flush: 'sync' }
)

const release = () => {
  held.value = 0
  prevHeadId = filtered.value[0]?.id ?? null
}

const onPointerLeave = () => {
  pointerInside.value = false
  if (atTop.value) release()
}

const jumpToLatest = async () => {
  scrollToTop()
  release()
  await nextTick()
  containerRef.value?.focus()
}

// --- Presentation ---------------------------------------------------------
const fmtTime = (ts) => {
  const d = new Date(ts)
  return d.toISOString().slice(11, 23)
}

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n))

const levelMix = computed(() => {
  const counts = stream.levelCounts.value
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return ['ERROR', 'WARN', 'INFO', 'DEBUG'].map((key) => ({
    key,
    count: counts[key],
    pct: (counts[key] / total) * 100,
    bar: levelMeta[key].bar
  }))
})

const serviceRows = computed(() =>
  stream.byService.value.map((s) => {
    const other = Math.max(0, s.total - s.errors - s.warns)
    const total = s.total || 1
    return {
      ...s,
      segments: [
        { key: 'ERROR', count: s.errors, bar: 'bg-sev-critical' },
        { key: 'WARN', count: s.warns, bar: 'bg-sev-high/85' },
        { key: 'other', count: other, bar: 'bg-line-strong' }
      ]
        .filter((seg) => seg.count > 0)
        .map((seg) => ({ ...seg, pct: (seg.count / total) * 100 }))
    }
  })
)

const toggleLevel = (key) => {
  const list = filters.value.levels
  filters.value.levels = list.includes(key) ? list.filter((k) => k !== key) : [...list, key]
}

const isFiltered = computed(
  () => filters.value.levels.length > 0 || filters.value.service !== '' || filters.value.query.trim() !== ''
)

const reset = () => {
  filters.value = { levels: [], service: '', query: '' }
}

const toggle = () => {
  stream.streaming.value = !stream.streaming.value
}

// Drilling in from a single line: follow its request across services, or pin
// the console to the service that produced it.
const applyFilter = ({ kind, entry }) => {
  if (kind === 'trace') {
    filters.value = { levels: [], service: '', query: entry.traceId }
  } else {
    filters.value = { ...filters.value, service: entry.service }
  }
  release()
}

const toast = inject('toast', { add: () => {} })
const copyQuery = () =>
  toast.add('Export queued', `${compact(filtered.length)} lines will be delivered to the reports queue.`, 'info')

onBeforeUnmount(() => {
  prevHeadId = null
})
</script>
