<template>
  <TransitionGroup tag="div" name="toast"
    class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
    <div v-for="toast in toasts" :key="toast.id"
      class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl glass-dark border border-white/10 shadow-2xl min-w-[300px]">
      <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        :class="getTypeProps(toast.type).bg">
        <component :is="getTypeProps(toast.type).icon" class="w-4 h-4" :class="getTypeProps(toast.type).text" />
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium text-white">{{ toast.title }}</p>
        <p class="text-xs text-slate-400 mt-0.5">{{ toast.message }}</p>
      </div>
      <button @click="remove(toast.id)" class="text-slate-500 hover:text-white transition-colors">
        <X class="w-4 h-4" />
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
  toasts.value = toasts.value.filter(t => t.id !== id)
}

const getTypeProps = (type) => {
  switch (type) {
    case 'error': return { icon: AlertCircle, bg: 'bg-rose-500/20', text: 'text-rose-400' }
    case 'warning': return { icon: AlertCircle, bg: 'bg-amber-500/20', text: 'text-amber-400' }
    case 'info': return { icon: Info, bg: 'bg-sky-500/20', text: 'text-sky-400' }
    default: return { icon: CheckCircle2, bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
  }
}

defineExpose({ add })
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
