<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Data Sources & Integrations</h1>
        <p class="text-slate-400 mt-1">Manage centralized data pipelines from your existing infrastructure and legacy systems.</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="toast.add('New Connection', 'Opening wizard to connect a new data source...', 'info')"
          class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center gap-2">
          <Plus class="w-4 h-4" />
          Add Integration
        </button>
      </div>
    </div>

    <!-- Active Connections Summary -->
    <div class="glass-card p-4 border border-slate-700/50 flex flex-wrap items-center gap-6 overflow-hidden relative text-sm">
      <div class="flex items-center gap-2 whitespace-nowrap">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
        <span class="text-slate-400">Total Connectors:</span>
        <span class="font-mono font-bold text-white text-lg">12 Active</span>
      </div>
      <div class="w-px h-6 bg-slate-700/50 hidden md:block"></div>
      <div class="flex items-center gap-2 whitespace-nowrap animate-pulse-slow">
        <span class="text-slate-400">Data Ingestion Rate:</span>
        <span class="font-mono font-bold text-sky-400 text-lg">842 MB/s</span>
        <Database class="w-4 h-4 text-sky-400" />
      </div>
      <div class="w-px h-6 bg-slate-700/50 hidden lg:block"></div>
      <div class="flex items-center gap-2 whitespace-nowrap">
        <span class="text-slate-400">System Health:</span>
        <span class="font-mono font-bold text-emerald-400 text-lg">99.8%</span>
      </div>
    </div>

    <!-- Category: Cloud Infrastructure -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white flex items-center gap-2">
          <Cloud class="w-5 h-5 text-indigo-400" /> Cloud Infrastructure
        </h2>
        <span class="text-[10px] text-slate-500 uppercase tracking-widest">Pipeline: Ready</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IntegrationCard 
          v-for="item in integrations.cloud" 
          :key="item.name" 
          v-bind="item" 
        />
      </div>
    </section>

    <!-- Category: Database & Legacy Systems -->
    <section>
      <div class="flex items-center justify-between mb-4 mt-4">
        <h2 class="text-lg font-semibold text-white flex items-center gap-2">
          <Database class="w-5 h-5 text-sky-400" /> Database & Legacy Systems
        </h2>
        <span class="text-[10px] text-slate-500 uppercase tracking-widest">Status: Healthy</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IntegrationCard 
          v-for="item in integrations.db" 
          :key="item.name" 
          v-bind="item" 
        />
      </div>
    </section>

    <!-- Category: Security & Monitoring Tools -->
    <section>
      <div class="flex items-center justify-between mb-4 mt-4">
        <h2 class="text-lg font-semibold text-white flex items-center gap-2">
          <ShieldAlert class="w-5 h-5 text-rose-400" /> Security & Monitoring Tools
        </h2>
        <span class="text-[10px] text-slate-500 uppercase tracking-widest">Stream: Live</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IntegrationCard 
          v-for="item in integrations.security" 
          :key="item.name" 
          v-bind="item" 
        />
      </div>
    </section>

  </div>
</template>

<script setup>
import { Plus, Database, Cloud, ShieldAlert } from 'lucide-vue-next'
import { inject } from 'vue'

const toast = inject('toast')
const { integrations, stats } = useSystemState()
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-pulse-slow {
  animation: pulse 3s infinite;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
