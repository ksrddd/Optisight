<template>
  <TransitionGroup
    tag="div"
    name="toast"
    class="pointer-events-none fixed bottom-3 right-3 z-[100] flex flex-col gap-1.5"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex w-[320px] items-start gap-2 rounded border border-line-strong bg-surface-overlay px-2.5 py-2"
      role="status"
    >
      <component
        :is="typeProps(toast.type).icon"
        class="mt-px h-3.5 w-3.5 shrink-0"
        :class="typeProps(toast.type).text"
        aria-hidden="true"
      />
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-ink-primary">{{ toast.title }}</p>
        <p class="mt-0.5 break-words text-xs text-ink-muted">{{ toast.message }}</p>
      </div>
      <button
        class="-mr-0.5 -mt-0.5 shrink-0 p-0.5 text-ink-faint transition-colors duration-fast hover:text-ink-primary"
        aria-label="Dismiss notification"
        @click="remove(toast.id)"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </div>
  </TransitionGroup>
</template>

<script setup>
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'
import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

const add = (title, message, type = 'success') => {
  const id = nextId++
  toasts.value.push({ id, title, message, type })
  setTimeout(() => remove(id), 5000)
}

const remove = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

const typeProps = (type) => {
  switch (type) {
    case 'error':
      return { icon: AlertCircle, text: 'text-sev-critical' }
    case 'warning':
      return { icon: AlertCircle, text: 'text-sev-high' }
    case 'info':
      return { icon: Info, text: 'text-ink-secondary' }
    default:
      return { icon: CheckCircle2, text: 'text-sev-low' }
  }
}

defineExpose({ add })
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1), transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
