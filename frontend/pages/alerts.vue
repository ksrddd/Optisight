<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Intelligent Alert Center</h1>
        <p class="text-slate-400 mt-1">Review centralized system anomalies and security threat detections.</p>
      </div>
      <div class="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
        <button class="px-4 py-1.5 text-sm font-medium rounded-md bg-white/10 text-white shadow-sm">All Alerts</button>
        <button
          class="px-4 py-1.5 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors">IT Operations</button>
        <button
          class="px-4 py-1.5 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors">SOC / Security</button>
      </div>
    </div>

    <!-- Alert List -->
    <div class="glass flex flex-col rounded-2xl border border-slate-700/50 overflow-hidden">
      <!-- Loading State -->
      <div v-if="pending" class="p-8 flex justify-center">
        <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- List -->
      <transition-group v-else name="list" tag="div" class="divide-y divide-white/5">
        <div v-for="alert in alerts" :key="alert.id"
          class="p-6 flex items-start gap-4 hover:bg-white/5 transition-colors group cursor-pointer relative">

          <!-- Severity Icon -->
          <div class="mt-1">
            <div v-if="alert.severity === 'critical'"
              class="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <ShieldAlert v-if="alert.type === 'SOC'" class="w-5 h-5" />
              <Server v-else class="w-5 h-5" />
            </div>
            <div v-else-if="alert.severity === 'warning'"
              class="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle class="w-5 h-5" />
            </div>
            <div v-else
              class="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Info class="w-5 h-5" />
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-4">
              <h3 class="text-base font-medium text-white group-hover:text-amber-300 transition-colors">{{
                alert.message }}</h3>
              <span class="text-xs font-medium text-slate-500 whitespace-nowrap">{{ alert.time }}</span>
            </div>
            <p class="mt-1 text-sm text-slate-400 line-clamp-2">
              {{ alert.description }}
            </p>
            
            <div class="mt-3 flex items-center gap-2">
              <span class="text-xs font-semibold px-2 py-1 rounded-md"
                :class="alert.type === 'SOC' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'">
                Team: {{ alert.type }}
              </span>
              <span class="text-xs font-medium text-slate-500">Source: {{ alert.source }}</span>
            </div>

            <!-- Actions -->
            <div class="mt-4 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="investigate(alert)"
                class="px-3 py-1 text-xs font-medium bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-md border border-indigo-500/20 transition-colors">
                Run Diagnostics
              </button>
              <button @click.stop="dismiss(alert.id)"
                class="px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors">
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ShieldAlert, Server, AlertTriangle, Info } from 'lucide-vue-next'
import { ref, onMounted, inject } from 'vue'

const toast = inject('toast')
const config = useRuntimeConfig()
const { data: rawAlerts, pending } = await useFetch(`${config.public.apiBase}/api/stats`, { server: false })
const alerts = ref([])

const dismiss = (id) => {
  alerts.value = alerts.value.filter(a => a.id !== id)
  toast.add('Alert Acknowledged', 'System operator has acknowledged this anomaly.', 'info')
}

const investigate = (alert) => {
  toast.add('Diagnostics Started', `Running root cause analysis for: ${alert.message}`, 'success')
}

onMounted(() => {
  alerts.value = [
    { 
      id: 1, 
      type: 'IT Ops',
      source: 'Payment Gateway Node 4',
      message: 'High Latency Detected on Payment API', 
      description: 'API response times have degraded by 300% over the last 5 minutes. Approaching timeout thresholds.',
      severity: 'critical', 
      time: '2m ' 
    },
    { 
      id: 2, 
      type: 'SOC',
      source: 'External VPN Gateway',
      message: 'Multiple Failed IAM Auth Attempts', 
      description: 'Algorithm detected brute force signature originating from unknown IP subnet targeting admin accounts.',
      severity: 'critical', 
      time: '8m ' 
    },
    { 
      id: 3, 
      type: 'IT Ops',
      source: 'Core Database Cluster',
      message: 'Storage IOPS Spike Detected', 
      description: 'Unusual spike in disk read operations across replication nodes. Query optimization may be required.',
      severity: 'warning', 
      time: '15m ' 
    }
  ]
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

/* List Transitions */
.list-leave-active {
  transition: all 0.4s ease;
  position: absolute;
  width: 100%;
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.4s ease;
}
</style>
