<template>
  <div class="flex h-screen overflow-hidden bg-surface-base">
    <Sidebar />

    <div class="flex min-w-0 flex-1 flex-col">
      <Header />

      <!--
        Two content modes.

        `dense` pages (the SOC console) own the whole viewport and never scroll
        the document — only their internal virtualised regions scroll. Every
        other route keeps the original scrolling canvas so it renders unchanged
        while it awaits migration.
      -->
      <main v-if="dense" class="min-h-0 flex-1 overflow-hidden">
        <slot />
      </main>

      <main v-else class="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div class="mx-auto max-w-7xl space-y-8">
          <slot />
        </div>
      </main>
    </div>

    <CommandPalette />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CommandPalette from '~/components/soc/CommandPalette.vue'

const route = useRoute()
const dense = computed(() => route.meta.dense === true)
</script>
