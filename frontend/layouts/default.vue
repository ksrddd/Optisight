<template>
  <div class="h-screen bg-slate-950 flex overflow-hidden">
    <!-- Sidebar Component -->
    <Sidebar />

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300">
      <Header />

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:px-12">
        <div class="max-w-7xl mx-auto space-y-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
</script>
