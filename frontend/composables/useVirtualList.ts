import { ref, computed, shallowRef, watch, onBeforeUnmount, type Ref } from 'vue'

export interface VirtualListOptions {
  /** Fixed row height in px. Must match the rendered row exactly. */
  itemHeight: number
  /** Rows rendered beyond each edge of the viewport. */
  overscan?: number
}

export interface VirtualRow<T> {
  item: T
  index: number
}

/**
 * Windowed rendering for long, continuously-growing lists.
 *
 * A SOC analyst holds this page open for a full shift while the feed keeps
 * appending, so the number of live DOM nodes has to be a function of viewport
 * height rather than of dataset length. This keeps roughly
 * `ceil(viewport / itemHeight) + 2 * overscan` rows mounted no matter how many
 * events have arrived.
 *
 * Fixed row height is a deliberate constraint, not a limitation: it makes
 * offset maths O(1), removes the measurement pass that causes scroll jitter in
 * dynamic virtualisers, and is the correct model for a tabular log where every
 * row is one line.
 *
 * The API mirrors TanStack Virtual's shape closely enough that swapping in
 * `@tanstack/vue-virtual` later is a single-file change.
 */
export function useVirtualList<T>(items: Ref<T[]>, options: VirtualListOptions) {
  const { itemHeight } = options
  const overscan = options.overscan ?? 10

  const containerRef = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const viewportHeight = ref(0)

  // shallowRef: these rows are replaced wholesale on every scroll frame and
  // never mutated in place, so deep reactivity would be pure overhead.
  const visible = shallowRef<VirtualRow<T>[]>([])

  const totalHeight = computed(() => items.value.length * itemHeight)

  // Kept as two scalar computeds rather than one object so the rebuild watcher
  // fires only when the window genuinely moves — a fresh object identity every
  // scroll frame would rebuild the rows even when the range is unchanged.
  const startIndex = computed(() => {
    if (!items.value.length || viewportHeight.value === 0) return 0
    return Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
  })

  const endIndex = computed(() => {
    const count = items.value.length
    if (!count || viewportHeight.value === 0) return 0
    const first = Math.floor(scrollTop.value / itemHeight)
    return Math.min(count, first + Math.ceil(viewportHeight.value / itemHeight) + overscan)
  })

  const offsetY = computed(() => startIndex.value * itemHeight)

  /** True while the newest row is in view — drives hold-on-scroll in the feed. */
  const atTop = computed(() => scrollTop.value <= 2)

  const rebuild = () => {
    const start = startIndex.value
    const end = endIndex.value
    const source = items.value
    const out: VirtualRow<T>[] = new Array(Math.max(0, end - start))
    for (let i = start; i < end; i++) {
      out[i - start] = { item: source[i]!, index: i }
    }
    visible.value = out
  }

  // Sync flush: scrolling must not paint a frame with a stale window.
  watch([startIndex, endIndex], rebuild, { flush: 'sync' })
  watch(items, rebuild)

  // --- Scroll plumbing -----------------------------------------------------
  // Scroll events fire far faster than frames. Coalescing to rAF means we
  // recompute the window at most once per painted frame.
  let frame = 0
  const onScroll = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      const el = containerRef.value
      if (el) scrollTop.value = el.scrollTop
    })
  }

  let resizeObserver: ResizeObserver | null = null

  const detach = (el: HTMLElement | null) => {
    if (el) el.removeEventListener('scroll', onScroll)
    resizeObserver?.disconnect()
    resizeObserver = null
  }

  watch(containerRef, (el, prev) => {
    detach(prev ?? null)
    if (!el) return

    el.addEventListener('scroll', onScroll, { passive: true })
    scrollTop.value = el.scrollTop
    viewportHeight.value = el.clientHeight

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const h = entries[0]?.contentRect.height ?? el.clientHeight
        if (h !== viewportHeight.value) {
          viewportHeight.value = h
          rebuild()
        }
      })
      resizeObserver.observe(el)
    }

    rebuild()
  })

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame)
    detach(containerRef.value)
  })

  const scrollToTop = () => {
    const el = containerRef.value
    if (!el) return
    el.scrollTop = 0
    scrollTop.value = 0
  }

  const scrollToIndex = (index: number) => {
    const el = containerRef.value
    if (!el) return
    el.scrollTop = index * itemHeight
    scrollTop.value = el.scrollTop
  }

  return {
    containerRef,
    visible,
    totalHeight,
    offsetY,
    atTop,
    scrollTop,
    viewportHeight,
    scrollToTop,
    scrollToIndex
  }
}
