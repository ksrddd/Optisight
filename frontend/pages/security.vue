<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">SOC Security Metrics</h1>
        <p class="text-slate-400 mt-1">Real-time threat detection and access control monitoring.</p>
      </div>
    </div>

    <!-- Stats row for SOC -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="glass-card p-6 border border-rose-500/30 relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/20 blur-2xl rounded-full"></div>
        <h3 class="text-sm font-medium text-slate-400">Hacking Attempts Blocked</h3>
        <p class="text-3xl font-bold text-white mt-1">452</p>
        <span class="text-xs text-rose-400 mt-2 flex items-center gap-1"><TrendingUp class="w-3 h-3"/> +24% today</span>
      </div>
      <div class="glass-card p-6 border border-amber-500/30 relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/20 blur-2xl rounded-full"></div>
        <h3 class="text-sm font-medium text-slate-400">Active Vulnerability Risks</h3>
        <p class="text-3xl font-bold text-white mt-1">12</p>
        <span class="text-xs text-amber-400 mt-2 block">Pending patch deploy</span>
      </div>
      <div class="glass-card p-6 border border-emerald-500/30 relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full"></div>
        <h3 class="text-sm font-medium text-slate-400">IAM Auth Sessions</h3>
        <p class="text-3xl font-bold text-white mt-1">14,204</p>
        <span class="text-xs text-emerald-400 mt-2 block">Normal load</span>
      </div>
    </div>

    <!-- Security Logs Table -->
    <div class="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div class="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white">Live Threat Intelligence Feed</h2>
        <button @click="toast.add('Filter Applied', 'Viewing critical threats only.', 'info')"
          class="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Filter Critical
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-slate-900/40 text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-white/5">
              <th class="px-6 py-4">Threat Event</th>
              <th class="px-6 py-4">Target Node</th>
              <th class="px-6 py-4">Source IP</th>
              <th class="px-6 py-4">SOC Action</th>
              <th class="px-6 py-4">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-if="pending">
              <td colspan="5" class="px-6 py-8 text-center text-slate-500">Loading intelligence feed...</td>
            </tr>
            <tr v-else v-for="(event, idx) in events" :key="idx" class="hover:bg-white/5 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <ShieldAlert class="w-4 h-4 text-rose-400" v-if="event.status === 'Blocked'" />
                  <Search class="w-4 h-4 text-amber-400" v-else-if="event.status === 'Investigating'" />
                  <span class="font-medium text-slate-200">{{ event.event }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-400">{{ event.node }}</td>
              <td class="px-6 py-4 text-sm font-mono text-slate-500">{{ event.ip }}</td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-medium rounded-full border"
                  :class="event.status === 'Blocked' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'">
                  {{ event.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-400">{{ event.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShieldAlert, Search, TrendingUp } from 'lucide-vue-next'
import { ref, onMounted, inject } from 'vue'

const toast = inject('toast')
const config = useRuntimeConfig()
const { data: rawEvents, pending } = await useFetch(`${config.public.apiBase}/api/security`, { server: false })
const events = ref([])

onMounted(() => {
  if (rawEvents.value && Array.isArray(rawEvents.value) && rawEvents.value.length > 0) {
    events.value = [...rawEvents.value]
  } else {
    events.value = [
      { event: 'DDoS Amplification Attempt', node: 'API Gateway (APAC)', ip: '112.143.22.10', status: 'Blocked', time: '1m ago' },
      { event: 'Brute Force Login (Auth DB)', node: 'Auth DB Master', ip: '45.88.92.1', status: 'Blocked', time: '5m ago' },
      { event: 'Abnormal Query Pattern', node: 'Customer Data Subnet', ip: '10.0.4.52', status: 'Investigating', time: '12m ago' },
      { event: 'Unauthorized Port Scan', node: 'Internal VPN Gateway', ip: '192.168.1.100', status: 'Blocked', time: '20m ago' }
    ]
  }
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
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
