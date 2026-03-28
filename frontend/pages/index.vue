<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">System Overview</h1>
        <p class="text-slate-400 mt-1">Real-time consolidated monitoring dashboard.</p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/reports"
          class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center gap-2">
          <Download class="w-4 h-4" />
          Export Report
        </NuxtLink>
      </div>
    </div>

    <!-- Stats Grid -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="glass-card h-32 animate-pulse bg-white/5"></div>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Active Alerts" :value="stats?.activeAlerts || 0" :icon="BellRing" bgClass="bg-rose-500/20"
        textClass="text-rose-400" glowClass="bg-rose-500" trend="+3%" :trendUp="false" />
      <StatCard title="Systems Online" :value="(stats?.systemsOnline || 0) + '/' + (stats?.totalSys || 0)"
        :icon="Server" bgClass="bg-emerald-500/20" textClass="text-emerald-400" glowClass="bg-emerald-500" trend="99.9%"
        :trendUp="true" />
      <StatCard title="Network Traffic" :value="stats?.networkTraffic || '0 TB/s'" :icon="Activity"
        bgClass="bg-sky-500/20" textClass="text-sky-400" glowClass="bg-sky-500" trend="+14%" :trendUp="true" />
      <StatCard title="Anomalies Detected" :value="stats?.anomaliesDetected || 0" :icon="ShieldAlert"
        bgClass="bg-amber-500/20" textClass="text-amber-400" glowClass="bg-amber-500" trend="-2%" :trendUp="true" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Activity Chart (Mock) -->
      <div class="lg:col-span-2 glass-card p-6 glass border border-slate-700/50">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-white">Network Activity</h2>
          <span
            class="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">Live</span>
        </div>
        <div class="h-64 flex items-end justify-between gap-2 overflow-hidden">
          <!-- Dynamic bars -->
          <div v-for="i in 24" :key="i"
            class="w-full bg-gradient-to-t from-indigo-500/20 to-indigo-400 rounded-t-md hover:from-indigo-400 hover:to-indigo-300 transition-all cursor-pointer relative group"
            :style="{ height: `${40 + Math.random() * 60}%` }">
            <div
              class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
              Vol: {{ Math.floor(Math.random() * 100) }}TB
            </div>
          </div>
        </div>
      </div>

      <!-- System Health List -->
      <div class="glass-card p-6 border border-slate-700/50 flex flex-col">
        <h2 class="text-lg font-semibold text-white mb-6">System Health</h2>
        <div v-if="systemsPending" class="flex-1 flex items-center justify-center">
          <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div v-else class="space-y-4 flex-1 overflow-y-auto pr-2">
          <div v-for="sys in systems" :key="sys.name"
            class="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-200">{{ sys.name }}</span>
              <span
                :class="sys.status === 'optimal' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'"
                class="px-2.5 py-1 rounded-full text-xs font-medium border border-current">
                {{ sys.status }}
              </span>
            </div>
            <div class="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span class="w-1.5 h-1.5 rounded-full"
                :class="sys.status === 'optimal' ? 'bg-emerald-400' : 'bg-amber-400'"></span>
              Uptime: {{ sys.uptime }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BellRing, Server, Activity, ShieldAlert, Download } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { io } from 'socket.io-client'

const toast = inject('toast')
const token = process.client ? localStorage.getItem('optisight_token') : ''

const { data: stats, pending } = await useFetch('http://localhost:3001/api/stats', {
  server: false,
  headers: { Authorization: `Bearer ${token}` },
  default: () => ({
    activeAlerts: 0,
    systemsOnline: 0,
    totalSys: 0,
    networkTraffic: '0 TB/s',
    anomaliesDetected: 0
  })
})

const { data: systems, pending: systemsPending } = await useFetch('http://localhost:3001/api/systems', {
  server: false,
  headers: { Authorization: `Bearer ${token}` },
  default: () => []
})

// Live simulation loop via WebSockets
let socket = null

onMounted(() => {
  socket = io('http://localhost:3001')

  socket.on('system-metrics', (metrics) => {
    if (stats.value) {
      // Simulate traffic changes on metric ping
      const trafficNum = parseFloat(stats.value.networkTraffic) || 4.2
      const change = (Math.random() - 0.5) * 0.2
      stats.value.networkTraffic = Math.max(0, trafficNum + change).toFixed(1) + ' TB/s'
    }
  })

  socket.on('anomaly-alert', (alertData) => {
    toast.add(alertData.title, alertData.message, alertData.severity)
    if (stats.value) {
      stats.value.activeAlerts++
      stats.value.anomaliesDetected++
    }
  })
})

onUnmounted(() => {
  if (socket) socket.disconnect()
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
