<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header Area & Centralized Ticker -->
    <div class="flex flex-col gap-6">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white tracking-tight">OptiSight - Centralized Dashboard</h1>
          <p class="text-slate-400 mt-1">Intelligent Visibility for IT Ops, SOC, and Infrastructure.</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/reports"
            class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center gap-2">
            <Download class="w-4 h-4" />
            Centralized Reports
          </NuxtLink>
        </div>
      </div>

      <!-- Live Monitoring Ticker -->
      <div class="glass-card p-4 border border-slate-700/50 flex flex-wrap items-center gap-6 overflow-hidden relative text-sm">
        <div class="flex items-center gap-2 whitespace-nowrap animate-pulse-slow">
          <span class="text-slate-400">Network Flow (Global):</span>
          <span class="font-mono font-bold text-indigo-400 text-lg">{{ networkTraffic }} TB/s</span>
          <Activity class="w-4 h-4 text-indigo-400" />
        </div>
        <div class="w-px h-6 bg-slate-700/50 hidden md:block"></div>
        <div class="flex items-center gap-2 whitespace-nowrap animate-pulse-slow">
          <span class="text-slate-400">Transactions Handled:</span>
          <span class="font-mono font-bold text-sky-400 text-lg">{{ formatNumber(transactions) }}/sec</span>
          <Server class="w-4 h-4 text-sky-400" />
        </div>
        <div class="w-px h-6 bg-slate-700/50 hidden lg:block"></div>
        <div class="items-center gap-2 whitespace-nowrap hidden lg:flex">
          <span class="text-slate-400">Live Revenue Stream:</span>
          <span class="font-mono font-bold text-emerald-400 text-lg">฿{{ formatNumber(liveRevenue) }}</span>
          <TrendingUp class="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </div>

    <!-- Stats Grid for Multiple Teams -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="glass-card h-32 animate-pulse bg-white/5"></div>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- IT Ops -->
      <StatCard title="Systems Online (IT Ops)" :value="systemsOnline + '/' + totalSystems" :icon="Server" bgClass="bg-indigo-500/20"
        textClass="text-indigo-400" glowClass="bg-indigo-500" trend="99.99% Uptime" :trendUp="true" />
      
      <!-- SOC -->
      <StatCard title="Active Threats (SOC)" :value="stats?.activeAlerts || 3"
        :icon="ShieldAlert" bgClass="bg-rose-500/20" textClass="text-rose-400" glowClass="bg-rose-500" trend="Requires Action"
        :trendUp="false" />
      
      <!-- Infra -->
      <StatCard title="Data Nodes Active (Infra)" :value="'32/32'" :icon="Database"
        bgClass="bg-sky-500/20" textClass="text-sky-400" glowClass="bg-sky-500" trend="Synced" :trendUp="true" />
      
      <!-- Business / Overview -->
      <StatCard title="Transaction Revenue" :value="'฿' + formatNumber(totalRevenue)" :icon="RefreshCcw"
        bgClass="bg-emerald-500/20" textClass="text-emerald-400" glowClass="bg-emerald-500" trend="+8% vs Last Hour" :trendUp="true" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- IT Ops & Data: Network Traffic Chart -->
      <div class="glass-card p-6 glass border border-slate-700/50 flex flex-col">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <Activity class="w-5 h-5 text-indigo-400"/> Network Traffic & Server Load
          </h2>
          <span class="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">Live</span>
        </div>
        
        <div class="h-64 relative flex mt-6 pl-10 pb-6">
          <!-- Y-Axis -->
          <div class="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[10px] text-slate-400 font-mono text-right pr-2">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          <!-- Chart Area -->
          <div class="flex-1 relative overflow-hidden border-b border-l border-slate-700/50">
            <!-- Grid Lines -->
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
              <div class="w-full h-px bg-slate-500" v-for="n in 5" :key="n"></div>
            </div>

            <!-- SVG Line Chart for Network -->
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full z-10 overflow-visible">
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(99, 102, 241, 0.4)" />
                  <stop offset="100%" stop-color="rgba(99, 102, 241, 0)" />
                </linearGradient>
              </defs>
              <path :d="networkLinePath" fill="none" stroke="#6366f1" stroke-width="2" class="transition-all duration-1000 ease-in-out"/>
              <path :d="networkAreaPath" fill="url(#netGradient)" class="transition-all duration-1000 ease-in-out"/>
              
              <!-- Plot Points -->
              <circle v-for="(point, idx) in networkPoints" :key="'net-pt-'+idx"
                :cx="point.x" :cy="point.y" r="1.5" fill="#818cf8" class="transition-all duration-1000 ease-in-out" />
            </svg>
          </div>

          <!-- X-Axis -->
          <div class="absolute left-10 right-0 bottom-0 h-6 flex justify-between items-end text-[10px] text-slate-400 font-mono px-1">
            <span>-60s</span>
            <span>-45s</span>
            <span>-30s</span>
            <span>-15s</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      <!-- Business & IT Ops: Revenue Flow Line Chart -->
      <div class="glass-card p-6 glass border border-slate-700/50 flex flex-col">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-emerald-400"/> Processed Revenue Flow
          </h2>
          <span class="text-xs text-emerald-400">฿ / min</span>
        </div>
        
        <div class="h-64 relative flex mt-6 pl-12 pb-6">
          <!-- Y-Axis -->
          <div class="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-[10px] text-slate-400 font-mono text-right pr-2">
            <span>500k</span>
            <span>375k</span>
            <span>250k</span>
            <span>125k</span>
            <span>0</span>
          </div>

          <!-- Chart Area -->
          <div class="flex-1 relative overflow-hidden border-b border-l border-slate-700/50">
            <!-- Grid Lines -->
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
              <div class="w-full h-px bg-slate-500" v-for="n in 5" :key="n"></div>
            </div>

            <!-- SVG Simulated Line Chart for Revenue -->
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full z-10 overflow-visible">
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(52, 211, 153, 0.4)" />
                  <stop offset="100%" stop-color="rgba(52, 211, 153, 0)" />
                </linearGradient>
              </defs>
              <path :d="revenueLinePath" fill="none" stroke="#34d399" stroke-width="2" class="transition-all duration-1000 ease-in-out"/>
              <path :d="revenueAreaPath" fill="url(#revenueGradient)" class="transition-all duration-1000 ease-in-out"/>
              
              <!-- Plot Points -->
              <circle v-for="(point, idx) in revenuePoints" :key="'rev-pt-'+idx"
                :cx="point.x" :cy="point.y" r="1.5" fill="#10b981" class="transition-all duration-1000 ease-in-out" />
            </svg>
          </div>

          <!-- X-Axis -->
          <div class="absolute left-12 right-0 bottom-0 h-6 flex justify-between items-end text-[10px] text-slate-400 font-mono px-1">
            <span>-60s</span>
            <span>-45s</span>
            <span>-30s</span>
            <span>-15s</span>
            <span>Now</span>
          </div>
        </div>
      </div>
      
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Systems Status / Alerts Integration -->
      <div class="glass-card p-6 border border-slate-700/50">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Critical Systems Pulse</h2>
          <NuxtLink to="/alerts" class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">Alert Center</NuxtLink>
        </div>
        
        <div class="grid grid-cols-1 gap-4">
          <div class="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Database class="w-5 h-5"/>
              </div>
              <div>
                <h3 class="text-sm font-medium text-slate-200">Core Banking DB</h3>
                <p class="text-xs text-emerald-400 mt-1">Operational (9ms latency)</p>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-white/5 border border-rose-500/20 flex items-center gap-4 relative overflow-hidden">
            <div class="absolute right-0 top-0 bottom-0 w-1 bg-rose-500 animate-pulse"></div>
            <div class="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <ShieldAlert class="w-5 h-5"/>
            </div>
            <div>
              <h3 class="text-sm font-medium text-slate-200">External API Gateway</h3>
              <p class="text-xs text-rose-400 mt-1">DDoS Attempt Blocked (SOC)</p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Server class="w-5 h-5"/>
            </div>
            <div>
              <h3 class="text-sm font-medium text-slate-200">Payment Processors</h3>
              <p class="text-xs text-indigo-400 mt-1">Load Balanced (6 nodes)</p>
            </div>
          </div>
        </div>
      </div>

      <!-- NEW: Predictive Analysis AI -->
      <div class="glass-card p-6 border border-indigo-500/40 relative overflow-hidden">
        <!-- background glow -->
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none"></div>
        
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-indigo-400" /> AI Predictive Analysis
          </h2>
          <span class="text-xs bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/20">Proactive Mode</span>
        </div>

        <div class="space-y-4 relative z-10">
          <div class="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-transparent border-l-2 border-indigo-400">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-medium text-indigo-100 text-sm">Database Storage Warning (7 Days)</h3>
                <p class="text-xs text-indigo-200/70 mt-1">Based on current transaction growth, Node 3 will reach 95% capacity in 7 days.</p>
              </div>
              <span class="text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded whitespace-nowrap ml-4">High Probability</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-white/5 border-l-2 border-slate-500">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-medium text-slate-200 text-sm">API Rate Limit Trend</h3>
                <p class="text-xs text-slate-400 mt-1">Third-party payment gateway requests are trending upwards. May hit limits by Friday.</p>
              </div>
              <span class="text-[10px] font-bold text-slate-400 bg-slate-500/20 px-2 py-1 rounded whitespace-nowrap ml-4">Watching</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { TrendingUp, Activity, Download, Server, ShieldAlert, RefreshCcw, Database, Sparkles } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted, inject, computed } from 'vue'

const config = useRuntimeConfig()
const toast = inject('toast')
const token = process.client ? localStorage.getItem('optisight_token') : ''

// Data points
const networkTraffic = ref(12.4)
const transactions = ref(4520)
const liveRevenue = ref(840200)
const totalRevenue = ref(15420000)
const systemsOnline = ref(142)
const totalSystems = ref(145)

const { data: stats, pending } = await useFetch(`${config.public.apiBase}/api/stats`, {
  server: false,
  headers: { Authorization: `Bearer ${token}` }
})

// Function to generate the line paths from points array
const createLinePath = (pts) => {
  if (pts.length === 0) return ''
  let d = `M ${pts[0].x} ${100 - pts[0].y}`
  
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i-1]
    const curr = pts[i]
    const cpX = (prev.x + curr.x) / 2
    d += ` C ${cpX} ${100 - prev.y}, ${cpX} ${100 - curr.y}, ${curr.x} ${100 - curr.y}`
  }
  return d
}

// Line chart simulation data for Revenue & Network
const generatePoints = () => {
  return Array.from({ length: 15 }, (_, i) => ({
    x: (i / 14) * 100,
    y: 30 + Math.random() * 50 // y is 0-100 down from top
  }))
}

const revenuePoints = ref(generatePoints())
const networkPoints = ref(generatePoints())

const revenueLinePath = computed(() => createLinePath(revenuePoints.value))
const revenueAreaPath = computed(() => `${revenueLinePath.value} L 100 100 L 0 100 Z`)

const networkLinePath = computed(() => createLinePath(networkPoints.value))
const networkAreaPath = computed(() => `${networkLinePath.value} L 100 100 L 0 100 Z`)

const formatNumber = (val) => {
  return val.toLocaleString('en-US')
}

// Live simulation loop for IT Ops / Bank Ticker
let simulationInterval = null

onMounted(() => {
  simulationInterval = setInterval(() => {
    // Fluctuations
    networkTraffic.value = parseFloat((12 + (Math.random() * 1.5 - 0.75)).toFixed(2))
    transactions.value += Math.floor(Math.random() * 50 - 25)
    if(transactions.value < 2000) transactions.value = 4500
    
    liveRevenue.value += Math.floor(Math.random() * 2500)
    totalRevenue.value += Math.floor(Math.random() * 2500)
    
    // Shift Revenue Line
    const revPts = [...revenuePoints.value]
    for(let i = 0; i < revPts.length - 1; i++) { revPts[i].y = revPts[i+1].y }
    revPts[revPts.length - 1].y = 30 + Math.random() * 50
    revenuePoints.value = revPts

    // Shift Network Line
    const netPts = [...networkPoints.value]
    for(let i = 0; i < netPts.length - 1; i++) { netPts[i].y = netPts[i+1].y }
    netPts[netPts.length - 1].y = 20 + Math.random() * 70
    networkPoints.value = netPts

  }, 3000)
})

onUnmounted(() => {
  if (simulationInterval) clearInterval(simulationInterval)
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-pulse-slow {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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
