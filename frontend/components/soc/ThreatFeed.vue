<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-base">
    <!-- Column header. Lives outside the scroll container so it never repaints
         during scrolling. -->
    <div
      class="grid h-7 shrink-0 items-center gap-3 border-b border-line bg-surface-panel px-3
             text-2xs font-semibold uppercase tracking-[0.08em] text-ink-muted"
      :style="gridStyle"
      role="row"
    >
      <span>Time (UTC)</span>
      <span>Severity</span>
      <span>Threat type</span>
      <span>Target asset</span>
      <span>Source IP</span>
      <span>Action</span>
      <span>Triage</span>
    </div>

    <div class="relative min-h-0 flex-1">
      <!-- The one piece of chrome that earns its place: proof the feed is still
           live while it is deliberately holding still, and the way back. -->
      <div
        v-if="held > 0"
        class="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center"
      >
        <button
          class="btn pointer-events-auto h-6 gap-1.5 border-line-strong bg-surface-overlay text-ink-primary"
          @click="jumpToLatest"
        >
          <ArrowUp class="h-3 w-3" aria-hidden="true" />
          <span class="font-mono tabular-nums">{{ held }}</span>
          new {{ held === 1 ? 'event' : 'events' }} · held
        </button>
      </div>

      <!-- Scroll viewport -->
      <div
        ref="containerRef"
        class="h-full overflow-y-auto outline-none"
        tabindex="0"
        role="grid"
        :aria-rowcount="displayRows.length"
        aria-label="Live threat feed"
        @keydown="onKeydown"
        @pointerenter="pointerInside = true"
        @pointerleave="onPointerLeave"
      >
        <div v-if="displayRows.length === 0" class="flex h-full items-center justify-center p-6">
          <div class="max-w-[280px] text-center">
            <ShieldCheck class="mx-auto h-5 w-5 text-ink-faint" aria-hidden="true" />
            <p class="mt-2 text-sm font-medium text-ink-primary">No events match these filters</p>
            <p class="mt-1 text-xs text-ink-muted">
              The stream is still running. Widen the severity or triage filters to see arrivals.
            </p>
          </div>
        </div>

        <!-- Spacer establishes the true scroll height for the full dataset -->
        <div v-else :style="{ height: `${totalHeight}px` }" class="relative w-full">
          <div class="absolute inset-x-0 top-0" :style="{ transform: `translateY(${offsetY}px)` }">
            <div
              v-for="row in visible"
              :key="row.item.id"
              class="grid cursor-default items-center gap-3 px-3 rule-b transition-colors duration-fast
                     hover:bg-surface-raised"
              :class="rowClass(row)"
              :style="rowStyle"
              role="row"
              :aria-rowindex="row.index + 1"
              :aria-selected="row.index === activeIndex"
              @click="open(row.index)"
            >
              <!-- Time. Recency is encoded as data, not animation: virtualised
                   rows are recycled, so an entrance transition would fire on
                   the wrong row. A fresh event simply reads brighter. -->
              <span class="flex items-center gap-1.5 font-mono text-xs tabular-nums">
                <span
                  class="h-1 w-1 shrink-0 rounded-full"
                  :class="isFresh(row.item) ? sevDot[row.item.severity] : 'bg-transparent'"
                  aria-hidden="true"
                />
                <span :class="isFresh(row.item) ? 'text-ink-primary' : 'text-ink-muted'">
                  {{ fmtTime(row.item.ts) }}
                </span>
              </span>

              <SeverityTag :severity="row.item.severity" />

              <span class="truncate text-sm" :class="row.index === activeIndex ? 'text-ink-primary' : 'text-ink-secondary'">
                {{ row.item.type }}
              </span>

              <span class="flex min-w-0 items-baseline gap-1.5">
                <span class="truncate font-mono text-xs text-ink-secondary">{{ row.item.asset }}</span>
                <!-- Service is context, the hostname is the identifier. It only
                     appears once there is room that the hostname does not need. -->
                <span class="hidden shrink-0 text-2xs text-ink-faint 2xl:inline">{{ row.item.service }}</span>
              </span>

              <span class="flex min-w-0 items-baseline gap-1.5">
                <span class="truncate font-mono text-xs tabular-nums text-ink-secondary">{{ row.item.srcIp }}</span>
                <span class="hidden shrink-0 font-mono text-2xs text-ink-faint 2xl:inline">{{ row.item.geo }}</span>
              </span>

              <span class="truncate font-mono text-xs text-ink-muted">{{ row.item.action }}</span>

              <span class="flex min-w-0 items-center gap-1.5">
                <component
                  :is="statusMeta[row.item.status].icon"
                  class="h-3 w-3 shrink-0"
                  :class="statusMeta[row.item.status].cls"
                  aria-hidden="true"
                />
                <span class="truncate text-xs" :class="statusMeta[row.item.status].cls">
                  {{ statusMeta[row.item.status].label }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feed telemetry. Confirms the virtualiser is doing its job and that the
         buffer is bounded — both are operational facts on a shift-long session. -->
    <div
      class="flex h-6 shrink-0 items-center gap-3 overflow-hidden whitespace-nowrap border-t border-line
             bg-surface-panel px-3 font-mono text-2xs tabular-nums text-ink-faint"
    >
      <span class="shrink-0">{{ visible.length }} rows mounted</span>
      <span class="h-2.5 w-px shrink-0 bg-line" aria-hidden="true" />
      <span class="shrink-0">{{ retained.toLocaleString() }} / {{ capacity.toLocaleString() }} buffered</span>
      <span class="hidden h-2.5 w-px shrink-0 bg-line sm:block" aria-hidden="true" />
      <span class="hidden shrink-0 sm:inline">batch {{ FLUSH_MS }}ms</span>
      <span class="ml-auto hidden shrink-0 xl:inline">
        <kbd class="kbd">↑</kbd> <kbd class="kbd">↓</kbd> navigate · <kbd class="kbd">↵</kbd> inspect
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { ArrowUp, ShieldCheck, Circle, CircleDot, CheckCircle2, MinusCircle } from 'lucide-vue-next'
import SeverityTag from './SeverityTag.vue'

const props = defineProps({
  rows: { type: Array, required: true },
  retained: { type: Number, default: 0 },
  capacity: { type: Number, default: 0 }
})

const emit = defineEmits(['open', 'active'])

const ROW_H = 32
const FLUSH_MS = 250

/**
 * Held arrivals.
 *
 * The feed prepends several events per second. If rows moved while the analyst
 * was reaching for one, the row under the cursor would be replaced between
 * mousedown and mouseup and the click would be lost — and worse, they could
 * open the wrong incident. So the feed holds: while the pointer is over it, or
 * while it is scrolled away from the newest event, new arrivals accumulate
 * off-screen and the visible rows do not move at all.
 */
const held = ref(0)
const pointerInside = ref(false)

const displayRows = computed(() => (held.value > 0 ? props.rows.slice(held.value) : props.rows))

const { containerRef, visible, totalHeight, offsetY, atTop, scrollToTop } = useVirtualList(displayRows, {
  itemHeight: ROW_H,
  overscan: 10
})

// Asset and source IP are the values an analyst compares character by
// character, so they get guaranteed minimums before threat type takes any
// remaining space.
const COLS = '76px 64px minmax(140px,1.15fr) minmax(158px,1.1fr) minmax(126px,150px) 92px 100px'
const gridStyle = { gridTemplateColumns: COLS }
const rowStyle = { gridTemplateColumns: COLS, height: `${ROW_H}px` }

const sevDot = {
  critical: 'bg-sev-critical',
  high: 'bg-sev-high',
  medium: 'bg-sev-medium',
  low: 'bg-sev-low'
}

const statusMeta = {
  new: { label: 'New', icon: Circle, cls: 'text-ink-primary' },
  triaging: { label: 'Triaging', icon: CircleDot, cls: 'text-ink-secondary' },
  contained: { label: 'Contained', icon: CheckCircle2, cls: 'text-ink-muted' },
  dismissed: { label: 'Dismissed', icon: MinusCircle, cls: 'text-ink-faint' }
}

const fmtTime = (ts) => new Date(ts).toISOString().slice(11, 19)

// "Fresh" means arrived within the last 15s. Recomputed on a coarse ticker so
// it does not thrash on every stream flush.
const now = ref(Date.now())
if (import.meta.client) {
  const t = setInterval(() => (now.value = Date.now()), 1000)
  onBeforeUnmount(() => clearInterval(t))
}
const isFresh = (e) => now.value - e.ts < 15000

// --- Selection -----------------------------------------------------------
// Indices below address `displayRows`, which is stable while the feed is held.
const activeIndex = ref(-1)

const rowClass = (row) => {
  if (row.index === activeIndex.value) return 'bg-surface-hover'
  return row.item.status === 'dismissed' ? 'opacity-55' : ''
}

const select = (index) => {
  activeIndex.value = index
  emit('active', displayRows.value[index])
}

const open = (index) => {
  select(index)
  emit('open', displayRows.value[index])
}

const scrollActiveIntoView = () => {
  const el = containerRef.value
  if (!el || activeIndex.value < 0) return
  const top = activeIndex.value * ROW_H
  if (top < el.scrollTop) el.scrollTop = top
  else if (top + ROW_H > el.scrollTop + el.clientHeight) el.scrollTop = top + ROW_H - el.clientHeight
}

const onKeydown = (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(displayRows.value.length - 1, activeIndex.value + 1)
    emit('active', displayRows.value[activeIndex.value])
    scrollActiveIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(0, activeIndex.value - 1)
    emit('active', displayRows.value[activeIndex.value])
    scrollActiveIntoView()
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    e.preventDefault()
    emit('open', displayRows.value[activeIndex.value])
  } else if (e.key === 'Home') {
    e.preventDefault()
    jumpToLatest()
  }
}

// --- Arrival handling ----------------------------------------------------
// New events land at index 0 of `rows`. Whenever the feed is being worked in,
// they are counted into `held` instead of rendered, which leaves `displayRows`
// byte-identical at the head and the visible rows perfectly still.
const shouldHold = () => pointerInside.value || !atTop.value

let prevHeadId = null

watch(
  () => props.rows,
  (rows) => {
    const headId = rows[held.value]?.id ?? null
    if (prevHeadId === null) {
      prevHeadId = headId
      return
    }
    if (headId === prevHeadId) return

    const idx = rows.findIndex((r) => r.id === prevHeadId)

    if (idx === -1) {
      // The row we were anchored to is gone: filters changed, or the buffer
      // rolled over. Start clean rather than showing a stale window.
      held.value = 0
      activeIndex.value = -1
    } else if (idx > held.value && shouldHold()) {
      held.value = idx
    } else {
      held.value = 0
    }

    prevHeadId = rows[held.value]?.id ?? null
  },
  { flush: 'sync' }
)

// Releasing the pointer while parked at the newest event resumes the flow.
const onPointerLeave = () => {
  pointerInside.value = false
  if (atTop.value) release()
}

const release = () => {
  held.value = 0
  prevHeadId = props.rows[0]?.id ?? null
  activeIndex.value = -1
}

const jumpToLatest = async () => {
  scrollToTop()
  release()
  await nextTick()
  containerRef.value?.focus()
}

defineExpose({ jumpToLatest })
</script>
