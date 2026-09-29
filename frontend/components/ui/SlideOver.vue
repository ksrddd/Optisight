<template>
  <Teleport to="body">
    <!--
      The open/close animation is driven by a reactive class rather than by
      <Transition>. Surfaces behind these drawers re-render several times a
      second, and those patches cancel a transition mid-flight and strand the
      panel half off-screen. A state-bound class cannot be interrupted that way.
    -->
    <div
      class="fixed inset-0 z-[60] bg-black/60 transition-opacity duration-150 ease-out motion-reduce:transition-none"
      :class="entered ? 'opacity-100' : 'opacity-0'"
      aria-hidden="true"
      @click="requestClose"
    />

    <section
      ref="panelRef"
      class="fixed inset-y-0 right-0 z-[61] flex w-full flex-col border-l border-line bg-surface-raised
             outline-none transition-transform duration-150 ease-out motion-reduce:transition-none"
      :class="entered ? 'translate-x-0' : 'translate-x-full'"
      :style="{ maxWidth: width }"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
      tabindex="-1"
      @keydown.esc="requestClose"
      @keydown.tab="trapFocus"
    >
      <slot :close="requestClose" />
    </section>
  </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

defineProps({
  label: { type: String, required: true },
  width: { type: String, default: '540px' }
})

const emit = defineEmits(['close'])

const panelRef = ref(null)
const entered = ref(false)
let closing = false

const requestClose = () => {
  if (closing) return
  closing = true
  entered.value = false
  // Let the panel finish leaving before the parent unmounts it.
  setTimeout(() => emit('close'), 150)
}

const focusables = () =>
  panelRef.value?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []

// Keep tabbing inside the panel while it is modal.
const trapFocus = (e) => {
  const nodes = focusables()
  if (!nodes.length) return
  const first = nodes[0]
  const last = nodes[nodes.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

let restoreTo = null
let raf = 0
let revealTimer = null

/**
 * Flip to the open position once the browser has painted the closed one.
 *
 * A frame callback alone is not enough: requestAnimationFrame is suspended
 * while a tab is hidden or heavily throttled, which would leave the panel
 * parked off-screen behind a fully opaque scrim — an invisible wall over the
 * page. The timer is the guarantee; the frame is the smooth path.
 */
const reveal = () => {
  if (entered.value) return
  entered.value = true
}

onMounted(() => {
  restoreTo = document.activeElement
  focusables()[0]?.focus()
  document.body.style.overflow = 'hidden'

  raf = requestAnimationFrame(reveal)
  revealTimer = setTimeout(reveal, 32)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (revealTimer) clearTimeout(revealTimer)
  document.body.style.overflow = ''
  if (restoreTo instanceof HTMLElement) restoreTo.focus()
})

defineExpose({ requestClose })
</script>
