<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Access Control & Security</h1>
        <p class="text-slate-400 mt-1">Monitor internal fraud attempts and unauthorized access.</p>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="glass-card p-6 border border-rose-500/30 relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/20 blur-2xl rounded-full"></div>
        <h3 class="text-sm font-medium text-slate-400">Blocked Attempts</h3>
        <p class="text-3xl font-bold text-white mt-1">124</p>
        <span class="text-xs text-rose-400 mt-2 block">+12% from yesterday</span>
      </div>
      <div class="glass-card p-6 border border-emerald-500/30 relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full"></div>
        <h3 class="text-sm font-medium text-slate-400">Active Sessions</h3>
        <p class="text-3xl font-bold text-white mt-1">1,402</p>
        <span class="text-xs text-emerald-400 mt-2 block">Normal levels</span>
      </div>
      <div class="glass-card p-6 border border-amber-500/30 relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/20 blur-2xl rounded-full"></div>
        <h3 class="text-sm font-medium text-slate-400">Flagged Users</h3>
        <p class="text-3xl font-bold text-white mt-1">8</p>
        <span class="text-xs text-amber-400 mt-2 block">Requires review</span>
      </div>
    </div>

    <!-- Security Logs Table -->
    <div class="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div class="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white">Recent Security Events</h2>
        <button @click="toast.add('Logs Requested', 'Retrieving full security audit logs...', 'info')"
          class="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          View All Logs
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-slate-900/40 text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-white/5">
              <th class="px-6 py-4">Event</th>
              <th class="px-6 py-4">User / Entity</th>
              <th class="px-6 py-4">IP Address</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-if="pending">
              <td colspan="5" class="px-6 py-8 text-center text-slate-500">Loading events...</td>
            </tr>
            <tr v-else v-for="(event, idx) in events" :key="idx" class="hover:bg-white/5 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <ShieldAlert class="w-4 h-4 text-rose-400" v-if="event.status === 'Blocked'" />
                  <Search class="w-4 h-4 text-amber-400" v-else-if="event.status === 'Investigating'" />
                  <span class="font-medium text-slate-200">{{ event.event }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-400">{{ event.user }}</td>
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
import { ShieldAlert, Search } from 'lucide-vue-next'
import { ref, onMounted, inject } from 'vue'

const toast = inject('toast')
const { data: events, pending } = await useFetch('http://localhost:3001/api/security', { server: false })

onMounted(() => {
  if (!events.value) {
    events.value = [
      { event: 'Failed Admin Login', user: 'unknown', ip: '192.168.1.100', status: 'Blocked', time: '10m ago' },
      { event: 'Data Export Anomaly', user: 'jdoe', ip: '10.0.0.5', status: 'Investigating', time: '45m ago' },
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
