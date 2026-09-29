import { ref, shallowRef, computed, onMounted, onBeforeUnmount } from 'vue'
import type { LogEntry, LogLevel } from '~/services/logs/stream'
import { SERVICE_NAMES, connectLogStream, makeLogHistory, type LogStreamHandle } from '~/services/logs/stream'

/**
 * Log feed orchestration.
 *
 * Identical strategy to `useThreatStream`: batch arrivals into 250ms windows,
 * bound the buffer, expose reactive views. Logs arrive an order of magnitude
 * faster than detections, which is exactly why the batching matters more here.
 */

const FLUSH_INTERVAL = 250
const MAX_ENTRIES = 8000
const MAX_STAGED = 1500

export function useLogStream() {
  const entries = shallowRef<LogEntry[]>([])
  const streaming = ref(true)
  const rate = ref(0)

  let staged: LogEntry[] = []
  let arrivalsThisWindow = 0
  let handle: LogStreamHandle | null = null

  const push = (entry: LogEntry) => {
    staged.unshift(entry)
    if (staged.length > MAX_STAGED) staged.length = MAX_STAGED
    arrivalsThisWindow += 1
  }

  const flush = () => {
    if (!staged.length || !streaming.value) return
    const next = staged.concat(entries.value)
    staged = []
    entries.value = next.length > MAX_ENTRIES ? next.slice(0, MAX_ENTRIES) : next
  }

  const levelCounts = computed(() => {
    const counts: Record<LogLevel, number> = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 }
    for (const e of entries.value) counts[e.level] += 1
    return counts
  })

  /** Errors as a share of the last 2,000 lines — the number an SRE watches. */
  const errorRate = computed(() => {
    const window = entries.value.slice(0, 2000)
    if (!window.length) return 0
    return (window.filter((e) => e.level === 'ERROR').length / window.length) * 100
  })

  const byService = computed(() => {
    const map = new Map<string, { service: string; total: number; errors: number; warns: number }>()
    for (const s of SERVICE_NAMES) map.set(s, { service: s, total: 0, errors: 0, warns: 0 })
    for (const e of entries.value.slice(0, 3000)) {
      const row = map.get(e.service)
      if (!row) continue
      row.total += 1
      if (e.level === 'ERROR') row.errors += 1
      else if (e.level === 'WARN') row.warns += 1
    }
    return [...map.values()].sort((a, b) => b.errors - a.errors || b.total - a.total)
  })

  let flushTimer: ReturnType<typeof setInterval> | null = null
  let rateTimer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    entries.value = makeLogHistory(3000)

    flushTimer = setInterval(flush, FLUSH_INTERVAL)
    rateTimer = setInterval(() => {
      rate.value = Math.round(arrivalsThisWindow / 2)
      arrivalsThisWindow = 0
    }, 2000)

    handle = connectLogStream(push)
  })

  onBeforeUnmount(() => {
    if (flushTimer) clearInterval(flushTimer)
    if (rateTimer) clearInterval(rateTimer)
    handle?.stop()
    staged = []
  })

  return {
    entries,
    streaming,
    rate,
    levelCounts,
    errorRate,
    byService,
    retained: computed(() => entries.value.length),
    capacity: MAX_ENTRIES
  }
}
