<template>
  <header
    class="h-20 mt-4 mx-4 md:mr-8 md:ml-0 flex items-center justify-between px-6 rounded-3xl glass-dark border border-slate-700/50 shadow-lg relative z-20">

    <!-- Mobile Menu Button (mock) -->
    <div class="md:hidden">
      <button class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
        <Menu class="w-6 h-6" />
      </button>
    </div>

    <!-- Search Bar -->
    <div
      class="hidden sm:flex items-center w-full max-w-md bg-slate-900/50 border border-slate-700/50 rounded-full px-4 py-2 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
      <Search class="w-4 h-4 text-slate-400 mr-2" />
      <input type="text" placeholder="Search systems, logs, or anomalies..."
        class="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-500">
    </div>

    <!-- Right Actions -->
    <div class="flex items-center gap-4">
      <!-- Connection Status indicator -->
      <div
        class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span class="text-xs font-medium text-emerald-400">Live Connect</span>
      </div>

      <!-- Notification Bell -->
      <button class="relative p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
        <Bell class="w-5 h-5" />
        <span
          class="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-800 rounded-full animate-pulse"></span>
      </button>

      <!-- Settings -->
      <button class="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
        <Settings class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { Menu, Search, Bell, Settings } from 'lucide-vue-next'
</script>
