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
      
      <!-- IT Ops & Data: Network Traffic Chart (Modernized with ApexCharts) -->
      <div class="glass-card p-6 glass border border-slate-700/50 flex flex-col min-h-[400px]">
        <div class="flex items-center justify-between mb-6">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold text-white flex items-center gap-2">
              <Activity class="w-5 h-5 text-indigo-400"/> Network Traffic & Server Load
            </h2>
            <p class="text-xs text-slate-500 mt-1">Real-time throughput analysis</p>
          </div>
          <span class="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">Live Monitor</span>
        </div>
        
        <div class="flex-1 min-h-[300px]">
          <client-only>
            <apexchart
              type="line"
              height="100%"
              width="100%"
              :options="networkChartOptions"
              :series="networkSeries"
            ></apexchart>
          </client-only>
        </div>
      </div>

      <!-- Business & IT Ops: Revenue Flow Area Chart (Modernized with ApexCharts) -->
      <div class="glass-card p-6 glass border border-slate-700/50 flex flex-col min-h-[400px]">
        <div class="flex items-center justify-between mb-6">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp class="w-5 h-5 text-emerald-400"/> Processed Revenue Flow
            </h2>
            <p class="text-xs text-slate-500 mt-1">Global transaction intake velocity</p>
          </div>
          <div class="flex flex-col items-end">
             <span class="text-xs text-emerald-400 font-mono">฿ / min</span>
             <span class="text-[10px] text-slate-500">Auto-scaling active</span>
          </div>
        </div>
        
        <div class="flex-1 min-h-[300px]">
          <client-only>
            <apexchart
              type="area"
              height="100%"
              width="100%"
              :options="revenueChartOptions"
              :series="revenueSeries"
            ></apexchart>
          </client-only>
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

      <!-- Specialized: AI Insight Module -->
      <div class="glass-card p-6 border border-indigo-500/40 relative overflow-hidden">
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
const { user, token, settings } = useUser()
const { stats: sysStats, liveRevenue, totalRevenue, transactions } = useSystemState()

// SEO & Metadata
useSeoMeta({
  title: 'Optisight Dashboard | Centralized Monitoring',
  description: 'Real-time intelligent visibility for IT Ops, SOC, and infrastructure performance.',
  ogTitle: 'Optisight - Professional Dashboard',
  ogDescription: 'Centralized infrastructure and security monitoring platform.',
  ogImage: 'https://api.dicebear.com/9.x/shapes/svg?seed=Optisight',
  twitterCard: 'summary_large_image',
})

// Core Stats (Mapped to Global State)
const networkTraffic = computed(() => sysStats.value.totalRate)
const systemsOnline = computed(() => sysStats.value.systemsOnline)
const totalSystems = computed(() => sysStats.value.totalSystems)
const activeAlerts = computed(() => sysStats.value.activeAlerts)

// Threshold Logic
const cpuThreshold = computed(() => settings.value.thresholds.find(t => t.name.includes('CPU'))?.value || 85)

const { data: stats, pending } = await useFetch(`${config.public.apiBase}/api/stats`, {
  server: false,
  headers: { Authorization: `Bearer ${token.value}` }
})

// ── ApexCharts Configuration ──────────────────────────────────────────────────

// 1. Network Traffic Chart Options
const networkSeries = ref([{
  name: 'System Load',
  data: Array.from({ length: 15 }, () => Math.floor(Math.random() * 40) + 20)
}])

const networkChartOptions = computed(() => {
  const currentLoad = networkSeries.value[0].data[networkSeries.value[0].data.length - 1]
  const isCritical = currentLoad >= cpuThreshold.value
  
  return {
    chart: {
      id: 'network-monitor',
      animations: { enabled: true, easing: 'linear', dynamicAnimation: { speed: 1000 } },
      toolbar: { show: false },
      background: 'transparent',
      sparkline: { enabled: false }
    },
    theme: { mode: 'dark' },
    stroke: { curve: 'smooth', width: 3, colors: [isCritical ? '#f43f5e' : '#6366f1'] },
    colors: [isCritical ? '#f43f5e' : '#6366f1'],
    grid: { borderColor: '#334155', strokeDashArray: 4, padding: { left: 10, right: 10 } },
    annotations: {
      yaxis: [{
        y: cpuThreshold.value,
        borderColor: '#f43f5e',
        label: {
          show: true,
          text: `LIMIT: ${cpuThreshold.value}%`,
          style: { color: "#fff", background: '#f43f5e' }
        }
      }]
    },
    xaxis: {
      categories: Array.from({ length: 15 }, (_, i) => `-${(15 - i) * 5}s`),
      labels: { style: { colors: '#94a3b8', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      max: 100,
      labels: { 
        style: { colors: '#94a3b8', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' },
        formatter: (val) => val.toFixed(0) + '%'
      }
    },
    tooltip: { theme: 'dark', x: { show: true }, y: { formatter: (val) => val.toFixed(1) + ' % load' } }
  }
})

// 2. Revenue Flow Chart Options
const revenueSeries = ref([{
  name: 'Revenue flow',
  data: Array.from({ length: 15 }, () => Math.floor(Math.random() * 200000) + 200000)
}])

const revenueChartOptions = ref({
  chart: {
    id: 'revenue-monitor',
    animations: { enabled: true, easing: 'smooth', speed: 800 },
    toolbar: { show: false },
    background: 'transparent'
  },
  theme: { mode: 'dark' },
  stroke: { curve: 'monotoneCubic', width: 2, colors: ['#10b981'] },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [20, 100],
      colorStops: [
        { offset: 0, color: '#10b981', opacity: 0.4 },
        { offset: 100, color: '#10b981', opacity: 0 }
      ]
    }
  },
  dataLabels: { enabled: false },
  grid: { borderColor: '#334155', strokeDashArray: 4 },
  xaxis: {
    categories: Array.from({ length: 15 }, (_, i) => `${i}:00`),
    labels: { style: { colors: '#94a3b8', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' } },
    axisBorder: { show: false }
  },
  yaxis: {
    labels: { 
      style: { colors: '#94a3b8', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' },
      formatter: (val) => '฿' + (val / 1000).toFixed(0) + 'k'
    }
  },
  tooltip: { theme: 'dark', y: { formatter: (val) => '฿' + val.toLocaleString() } }
})

// ── UTILS ─────────────────────────────────────────────────────────────────────
const formatNumber = (val) => {
  return val ? val.toLocaleString('en-US') : '0'
}

// ── LOCAL CHART HEARTBEAT (Numbers sync globally, charts animate locally) ──
let chartTimer = null

onMounted(() => {
  chartTimer = setInterval(() => {
    // Update Network Series
    const newNetData = [...networkSeries.value[0].data]
    newNetData.shift()
    newNetData.push(Math.floor(Math.random() * 40) + 20)
    networkSeries.value = [{ name: 'System Load', data: newNetData }]

    // Update Revenue Series
    const newRevData = [...revenueSeries.value[0].data]
    newRevData.shift()
    newRevData.push(Math.floor(Math.random() * 200000) + 200000)
    revenueSeries.value = [{ name: 'Revenue flow', data: newRevData }]
  }, 3000)
})

onUnmounted(() => {
  if (chartTimer) clearInterval(chartTimer)
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
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom shadow/glow for charts */
.apexcharts-canvas {
  filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.1));
}
</style>
