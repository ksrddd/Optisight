<template>
  <div class="min-h-screen bg-slate-950">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'

const toastRef = ref(null)

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
