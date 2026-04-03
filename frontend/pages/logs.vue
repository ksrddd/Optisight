<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Infrastructure Data Flow Logs</h1>
        <p class="text-slate-400 mt-1">Real-time centralized tracing of server transactions and data movements.</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="toast.add('Log Stream Paused', 'Live stream paused for inspection', 'info')"
          class="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm border border-indigo-500/20 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2">
          <Pause class="w-4 h-4" />
          Pause Stream
        </button>
      </div>
    </div>

    <!-- Live Log Console -->
    <div class="glass-card flex flex-col rounded-2xl border border-slate-700/50 overflow-hidden h-[600px] bg-[#0a0f1d] shadow-2xl">
      <!-- Terminal Header -->
      <div class="px-4 py-3 bg-slate-900/80 border-b border-indigo-500/20 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500/50"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500/50"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></span>
          </div>
          <span class="text-xs font-mono text-indigo-400/80">root@optisight-centralized-aggregator:~#</span>
        </div>
        <div class="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Streaming ({{ logLines.length }} lines)
        </div>
      </div>

      <!-- Log Output -->
      <div class="p-4 overflow-y-auto flex-1 font-mono text-[13px] leading-relaxed relative" id="log-container">
        <!-- Lines -->
        <transition-group name="log-list" tag="div" class="space-y-1">
          <div v-for="log in logLines" :key="log.id" class="flex hover:bg-white/5 px-2 py-0.5 rounded transition-colors group">
            <span class="text-slate-500 w-24 flex-shrink-0 select-none">{{ log.timestamp }}</span>
            <span class="w-16 flex-shrink-0" :class="{
              'text-emerald-400': log.level === 'INFO',
              'text-amber-400': log.level === 'WARN',
              'text-rose-400': log.level === 'ERROR',
              'text-sky-400': log.level === 'DEBUG'
            }">[{{ log.level }}]</span>
            <span class="text-indigo-300 w-32 flex-shrink-0 truncate hidden sm:block">[{{ log.service }}]</span>
            <span class="text-slate-300 flex-1 ml-2 break-all group-hover:text-white transition-colors">{{ log.message }}</span>
          </div>
        </transition-group>

        <div v-if="logLines.length === 0" class="flex items-center justify-center h-full text-slate-500">
           Connecting to infrastructure streams...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Pause } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted, inject, nextTick } from 'vue'

const toast = inject('toast')
const logLines = ref([])
let idCounter = 0

// Mock data generation for Bank/Infra transactions
const services = ['Core-Auth', 'DB-Cluster-A', 'Payment-GW', 'Ledger-Node-2', 'Redis-Cache']
const levels = ['INFO', 'INFO', 'INFO', 'INFO', 'DEBUG', 'WARN']
const messages = [
  'Transaction sync completed successfully.',
  'Cache miss for key user_session:884.',
  'Data flow latency detected in sub-node.',
  'Allocating new container for Payment Gateway.',
  'TLS Handshake successful with client.',
  'Database query executed in 14ms.',
  'Memory threshold reached 80% on Node-2.'
]

const addRandomLog = () => {
  const d = new Date()
  const timestamp = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`
  
  const level = levels[Math.floor(Math.random() * levels.length)]
  const service = services[Math.floor(Math.random() * services.length)]
  let message = messages[Math.floor(Math.random() * messages.length)]

  // Sometimes throw a simulated error for Infra team to see
  if(Math.random() > 0.95) {
    logLines.value.push({
      id: idCounter++,
      timestamp,
      level: 'ERROR',
      service: 'Payment-GW',
      message: 'Connection timeout while reaching external banking API. Retrying...'
    })
  } else {
    logLines.value.push({
      id: idCounter++,
      timestamp,
      level,
      service,
      message
    })
  }

  // Keep array bounded
  if(logLines.value.length > 50) {
    logLines.value.shift()
  }

  // Auto-scroll
  nextTick(() => {
    const el = document.getElementById('log-container')
    if(el) el.scrollTop = el.scrollHeight
  })
}

let logInterval
onMounted(() => {
  // Pre-fill
  for(let i=0; i<15; i++) {
    addRandomLog()
  }
  
  // Stream
  logInterval = setInterval(() => {
    addRandomLog()
  }, 1200) // Emit a log every 1.2s to simulate infra traffic
})

onUnmounted(() => {
  if (logInterval) clearInterval(logInterval)
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

/* Log list transitions */
.log-list-enter-active {
  transition: all 0.3s ease;
}
.log-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.log-list-leave-active {
  transition: all 0.5s ease;
  position: absolute;
}
.log-list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
