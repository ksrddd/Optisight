<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">System Logs</h1>
        <p class="text-slate-400 mt-1">Real-time technical logs from all system services.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input v-model="searchQuery" type="text" placeholder="Search logs..."
            class="pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 w-64 transition-all">
        </div>
        <button
          class="p-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors">
          <Filter class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="glass rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col max-h-[600px]">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-slate-900/40 text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
              <th class="px-6 py-4">Timestamp</th>
              <th class="px-6 py-4">Level</th>
              <th class="px-6 py-4">Service</th>
              <th class="px-6 py-4">Message</th>
            </tr>
          </thead>
          <transition-group tag="tbody" name="list" class="divide-y divide-white/5">
            <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-white/5 transition-colors font-mono text-xs">
              <td class="px-6 py-3 text-slate-500 whitespace-nowrap">{{ log.timestamp }}</td>
              <td class="px-6 py-3">
                <span :class="getLevelClass(log.level)"
                  class="px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase transition-all">
                  {{ log.level }}
                </span>
              </td>
              <td class="px-6 py-3 text-indigo-400/80">{{ log.service }}</td>
              <td class="px-6 py-3 text-slate-300">{{ log.message }}</td>
            </tr>
          </transition-group>
        </table>
      </div>
    </div>

    <!-- Live Indicator -->
    <div class="flex items-center gap-2 text-xs text-indigo-400 animate-pulse">
      <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
      Streaming live logs...
    </div>
  </div>
</template>

<script setup>
import { Search, Filter } from 'lucide-vue-next'
import { ref, computed, onMounted, onUnmounted } from 'vue'

const searchQuery = ref('')
const logs = ref([
  { id: 101, timestamp: '2024-03-27 01:12:04', level: 'info', service: 'auth-v2', message: 'User session validated successfully: uid_8842' },
  { id: 102, timestamp: '2024-03-27 01:12:07', level: 'warning', service: 'db-proxy', message: 'Slow query detected on primary shard cluster-01' },
  { id: 103, timestamp: '2024-03-27 01:12:15', level: 'info', service: 'gateway', message: 'Inbound request handled: [POST] /v1/auth/refresh' },
  { id: 104, timestamp: '2024-03-27 01:12:22', level: 'error', service: 'mailer', message: 'Failed to deliver notification email to: worker-99@node.local' },
  { id: 105, timestamp: '2024-03-27 01:12:45', level: 'info', service: 'auth-v2', message: 'New JWT issued for client: opti-mobile-app' },
])

const filteredLogs = computed(() => {
  if (!searchQuery.value) return logs.value
  const q = searchQuery.value.toLowerCase()
  return logs.value.filter(l => l.message.toLowerCase().includes(q) || l.service.toLowerCase().includes(q))
})

const getLevelClass = (level) => {
  switch (level) {
    case 'error': return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    default: return 'text-sky-400 bg-sky-500/10 border-sky-500/20'
  }
}

// Live simulation
let interval = null
let nextId = 200

onMounted(() => {
  interval = setInterval(() => {
    const services = ['auth-v2', 'gateway', 'db-proxy', 'mailer', 'security-scanner']
    const messages = [
      'Heartbeat signal received from node-04',
      'Configuration reloaded successfully',
      'Cache invalidated for namespace: metrics',
      'Processing incoming packet buffer (45KB)',
      'Health check passed for container: app-srv-1'
    ]

    logs.value.unshift({
      id: nextId++,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      level: Math.random() > 0.9 ? 'warning' : 'info',
      service: services[Math.floor(Math.random() * services.length)],
      message: messages[Math.floor(Math.random() * messages.length)]
    })

    if (logs.value.length > 50) logs.value.pop()
  }, 2000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
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

.list-enter-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
  background-color: rgba(99, 102, 241, 0.1);
}
</style>
