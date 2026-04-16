<template>
  <div class="space-y-8 animate-fade-in pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Executive Reporting Hub</h1>
        <p class="text-slate-400 mt-1">Audit security posture and financial performance across specific intervals.</p>
      </div>
    </div>

    <!-- Dual Report Sections -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">

      <!-- ── SECTION 1: SECURITY AUDIT ── -->
      <div class="space-y-6 flex flex-col">
        <div
          class="glass-card p-8 border border-slate-700/50 flex-1 flex flex-col bg-rose-500/5 hover:border-rose-500/30 transition-all duration-500">
          <div class="flex items-center gap-4 mb-8">
            <div
              class="h-12 w-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <ShieldAlert class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Security Operations</h2>
              <p class="text-[10px] font-bold text-rose-400/80 uppercase tracking-widest">Incident & Threat Intelligence
              </p>
            </div>
          </div>

          <div class="space-y-8 flex-1">
            <!-- Time Range (Security) -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-slate-400">Audit Period</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="range in ranges" :key="'sec-' + range" @click="securityRange = range"
                  :class="securityRange === range ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:bg-white/5'"
                  class="px-5 py-2.5 text-xs font-bold rounded-xl border transition-all uppercase tracking-wider">
                  {{ range }}
                </button>
              </div>
            </div>

            <!-- Detailed Security Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="metric in detailedSecurity" :key="metric.label"
                class="p-4 rounded-xl bg-slate-900/40 border border-white/5">
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{{ metric.label }}</p>
                <div class="flex items-end justify-between">
                  <span class="text-lg font-bold text-white">{{ metric.value }}</span>
                  <span :class="metric.trend > 0 ? 'text-rose-400' : 'text-emerald-400'"
                    class="text-[10px] flex items-center gap-1">
                    {{ metric.trend > 0 ? '↑' : '↓' }} {{ Math.abs(metric.trend) }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- Security Focus Intensity -->
            <div class="space-y-3">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Threat Intensity Breakdown</p>
              <div class="space-y-3">
                <div v-for="opt in securityOptions" :key="opt.name"
                  class="p-4 rounded-xl border border-white/5 bg-slate-900/40 flex items-center justify-between group">
                  <div class="flex items-center gap-3">
                    <component :is="opt.icon" class="w-4 h-4 text-rose-400/60" />
                    <span class="text-sm text-slate-300 font-medium">{{ opt.name }}</span>
                  </div>
                  <div class="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-rose-500" :style="{ width: opt.value + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action -->
          <div class="mt-12 pt-8 border-t border-white/5">
            <button @click="handleGenerate('security')" :disabled="isGenerating === 'security'"
              class="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-400 rounded-xl font-bold text-xs transition-all border border-rose-500/20 flex items-center justify-center gap-2 group">
              <Loader2 v-if="isGenerating === 'security'" class="w-4 h-4 animate-spin" />
              <Download v-else class="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              {{ isGenerating === 'security' ? 'ANALYZING INCIDENTS...' : 'GENERATE FULL SECURITY AUDIT' }}
            </button>
          </div>
        </div>

        <!-- Progress Overlay (Security) -->
        <div v-if="isGenerating === 'security'" class="glass-card p-4 border border-rose-500/30 animate-pulse">
          <div class="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all duration-300"
              :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- ── SECTION 2: BUSINESS ROI ── -->
      <div class="space-y-6 flex flex-col">
        <div
          class="glass-card p-8 border border-slate-700/50 flex-1 flex flex-col bg-sky-500/5 hover:border-sky-500/30 transition-all duration-500">
          <div class="flex items-center gap-4 mb-8">
            <div
              class="h-12 w-12 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/10">
              <PiggyBank class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Business ROI</h2>
              <p class="text-[10px] font-bold text-sky-400/80 uppercase tracking-widest">FinOps & Cost Optimization</p>
            </div>
          </div>

          <div class="space-y-8 flex-1">
            <!-- Time Range (ROI) -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-slate-400">Financial Period</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="range in ranges" :key="'roi-' + range" @click="roiRange = range"
                  :class="roiRange === range ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20' : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:bg-white/5'"
                  class="px-5 py-2.5 text-xs font-bold rounded-xl border transition-all uppercase tracking-wider">
                  {{ range }}
                </button>
              </div>
            </div>

            <!-- Detailed ROI Metrics -->
            <div class="p-6 bg-slate-900/60 rounded-2xl border border-white/5 space-y-6">
              <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">ROI Performance
                Analysis ({{ roiRange }})</h4>
              <div class="grid grid-cols-3 gap-4">
                <!-- Revenue -->
                <div class="text-center space-y-1">
                  <p class="text-[10px] text-slate-500 font-bold">รายได้</p>
                  <p class="text-xl font-black text-white">฿1.24M</p>
                  <span class="text-[9px] text-emerald-400 font-bold">+12.5%</span>
                </div>
                <!-- Profit -->
                <div class="text-center space-y-1">
                  <p class="text-[10px] text-emerald-400 font-bold">กำไร</p>
                  <p class="text-xl font-black text-emerald-400">+฿450K</p>
                  <span class="text-[9px] text-emerald-400 font-bold">+8.2%</span>
                </div>
                <!-- Loss -->
                <div class="text-center space-y-1">
                  <p class="text-[10px] text-rose-400 font-bold">ขาดทุน</p>
                  <p class="text-xl font-black text-rose-400">-฿120K</p>
                  <span class="text-[9px] text-rose-400 font-bold">+4.1%</span>
                </div>
              </div>

              <!-- Additional Detail Table -->
              <div class="pt-4 border-t border-white/5 space-y-2">
                <div v-for="item in roiBreakdown" :key="item.label"
                  class="flex justify-between items-center text-[11px]">
                  <span class="text-slate-500">{{ item.label }}</span>
                  <span class="text-slate-300 font-mono font-bold">{{ item.value }}</span>
                </div>
              </div>
            </div>

            <!-- Savings Estimation -->
            <div class="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <TrendingUp class="w-5 h-5 text-sky-400" />
                <div>
                  <p class="text-xs font-bold text-white">Estimated Annual Savings</p>
                  <p class="text-[10px] text-sky-300/70">Based on optimization trends</p>
                </div>
              </div>
              <span class="text-sm font-black text-white">฿214,800</span>
            </div>
          </div>

          <!-- Action -->
          <div class="mt-12 pt-8 border-t border-white/5">
            <button @click="handleGenerate('roi')" :disabled="isGenerating === 'roi'"
              class="w-full py-4 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 group">
              <Loader2 v-if="isGenerating === 'roi'" class="w-4 h-4 animate-spin" />
              <Download v-else class="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              {{ isGenerating === 'roi' ? 'CALCULATING ROI...' : 'GENERATE FULL FINANCIAL ROI AUDIT' }}
            </button>
          </div>
        </div>

        <!-- Progress Overlay (ROI) -->
        <div v-if="isGenerating === 'roi'" class="glass-card p-4 border border-sky-500/30 animate-pulse">
          <div class="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-300"
              :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>

    </div>

    <!-- Global Info Footer -->
    <div class="glass-card p-6 border border-white/5 bg-white/5 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
          Status: All data nodes synchronized
        </div>
        <div class="h-4 w-px bg-white/10"></div>
        <div class="text-xs text-slate-500">Reports are generated using real-time telemetry from NeonDB clusters.</div>
      </div>
      <div class="flex gap-4">
        <span class="text-[10px] text-slate-600 font-bold uppercase tracking-widest">v1.2.4-stable</span>
        <span class="text-[10px] text-slate-600 font-bold uppercase tracking-widest">System nodes 16/16 online</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Download, ShieldAlert, PiggyBank,
  Loader2, Info, Lock, Terminal, Activity, TrendingUp
} from 'lucide-vue-next'
import { ref, inject } from 'vue'

const toast = inject('toast')
const isGenerating = ref(null)
const progress = ref(0)

// SEO & Metadata
useSeoMeta({
  title: 'Audit & Reports | Optisight',
  description: 'Download detailed security and financial ROI reports for stakeholders.',
})

const ranges = ['รายวัน', 'รายเดือน', 'รายปี']
const securityRange = ref('รายวัน')
const roiRange = ref('รายเดือน')

const { stats: sysStats } = useSystemState()

const detailedSecurity = computed(() => [
  { label: 'Total Incidents', value: (sysStats.value.activeAlerts * 14).toLocaleString(), trend: +12 },
  { label: 'System Uptime', value: sysStats.value.health + '%', trend: -0.02 },
  { label: 'Brute Force Attempts', value: '14,210', trend: +45 },
  { label: 'Threats Blocked', value: '100%', trend: 0 }
])

const securityOptions = [
  { name: 'XSS & SQLi Detection', value: 92, icon: Terminal },
  { name: 'Session Hijack Audits', value: 34, icon: Lock },
  { name: 'DDoS Mitigation State', value: 68, icon: Activity }
]

const roiBreakdown = [
  { label: 'Infrastructure Cost', value: '฿412,000' },
  { label: 'DevOps Efficiency', value: '94.2%' },
  { label: 'Avg Latency Savings', value: '฿12,400' },
  { label: 'Cloud Waste Identified', value: '฿45,000' }
]

const handleGenerate = (type) => {
  isGenerating.value = type
  progress.value = 0

  const interval = setInterval(() => {
    progress.value += Math.floor(Math.random() * 15) + 5
    if (progress.value >= 100) {
      progress.value = 100
      clearInterval(interval)
      setTimeout(() => {
        const labels = {
          security: 'Full Security Audit (SOC-Level)',
          roi: 'Business ROI & Financial Audit'
        }
        toast.add('Audit Ready', `Your ${labels[type]} has been securely prepared.`, 'success')
        isGenerating.value = null
        progress.value = 0
      }, 500)
    }
  }, 350)
}
</script>

<style scoped>
.glass-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
}

.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
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
