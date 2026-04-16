<template>
  <div class="min-h-screen bg-slate-950">
    <NuxtLoadingIndicator color="#6366f1" :height="3" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue'

const { fetchMe } = useUser()
const { updateSimulation: syncSystem } = useSystemState()
const toastRef = ref(null)

let timer = null

onMounted(() => {
  // Session recovery
  fetchMe()
  
  // Global System Heartbeat (3s)
  timer = setInterval(() => {
    syncSystem()
  }, 3000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// Provide a global way to add toasts
provide('toast', {
  add: (title, message, type) => toastRef.value?.add(title, message, type)
})
</script>

<style>
/* Page transition settings */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}
</style>
