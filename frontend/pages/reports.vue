<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Export Reports</h1>
        <p class="text-slate-400 mt-1">Generate and download detailed system performance and security audits.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Report Builder -->
      <div class="lg:col-span-2 space-y-6">
        <div class="glass-card p-8 border border-slate-700/50">
          <h2 class="text-xl font-semibold text-white mb-6">Report Configuration</h2>

          <div class="space-y-6">
            <!-- Date Range -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Time Range</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button v-for="range in ranges" :key="range" @click="activeRange = range"
                  :class="activeRange === range ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:bg-white/5'"
                  class="px-4 py-2 text-xs font-medium rounded-lg border transition-all">
                  {{ range }}
                </button>
              </div>
            </div>

            <!-- Content Selection -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-3">Included Data</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="item in dataOptions" :key="item.name" @click="item.selected = !item.selected"
                  class="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all"
                  :class="item.selected ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-900/50 border-white/5 hover:border-slate-700'">
                  <div class="flex items-center gap-3">
                    <component :is="item.icon" class="w-5 h-5"
                      :class="item.selected ? 'text-indigo-400' : 'text-slate-500'" />
                    <div>
                      <p class="text-sm font-medium" :class="item.selected ? 'text-white' : 'text-slate-300'">{{
                        item.name }}</p>
                      <p class="text-xs text-slate-500">{{ item.desc }}</p>
                    </div>
                  </div>
                  <div class="w-5 h-5 rounded-full border flex items-center justify-center transition-all"
                    :class="item.selected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700'">
                    <Check v-if="item.selected" class="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Format -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Export Format</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="format" value="pdf" checked class="accent-indigo-500">
                  <span class="text-sm text-slate-400 group-hover:text-white transition-colors">PDF Document
                    (.pdf)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="format" value="csv" class="accent-indigo-500">
                  <span class="text-sm text-slate-400 group-hover:text-white transition-colors">CSV Spreadsheet
                    (.csv)</span>
                </label>
              </div>
            </div>
          </div>

          <div class="mt-10 pt-6 border-t border-white/5">
            <button @click="generateReport" :disabled="isGenerating"
              class="w-full flex items-center justify-center gap-2 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20">
              <Download v-if="!isGenerating" class="w-5 h-5" />
              <Loader2 v-else class="w-5 h-5 animate-spin" />
              {{ isGenerating ? 'Generating Secure Archive...' : 'Generate Full System Report' }}
            </button>
          </div>
        </div>

        <!-- Progress Overlay (Simulated) -->
        <div v-if="isGenerating" class="glass-card p-6 border border-indigo-500/30 animate-pulse">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-indigo-400">Export Progress</span>
            <span class="text-sm font-bold text-white">{{ progress }}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-indigo-500 transition-all duration-300" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Quick Tips -->
      <div class="space-y-6">
        <div class="glass-card p-6 border border-white/5 bg-indigo-500/5">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info class="w-5 h-5 text-indigo-400" />
            Report Tips
          </h3>
          <ul class="space-y-4">
            <li class="flex gap-3 text-sm text-slate-400">
              <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
              Weekly audits are recommended for security compliance.
            </li>
            <li class="flex gap-3 text-sm text-slate-400">
              <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
              CSV format is best for analyzing network traffic trends.
            </li>
            <li class="flex gap-3 text-sm text-slate-400">
              <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
              PDF reports include high-level visual charts and summaries.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Download, Check, FileText, Shield, Activity, Bell, Loader2, Info } from 'lucide-vue-next'
import { ref, inject } from 'vue'

const toast = inject('toast')
const isGenerating = ref(false)
const progress = ref(0)
const activeRange = ref('Last 24h')
const ranges = ['Last 1h', 'Last 24h', 'Last 7d', 'Custom']

const dataOptions = ref([
  { name: 'System Alerts', desc: 'Critical and Warning logs', icon: Bell, selected: true },
  { name: 'Network Traffic', desc: 'Throughput and spikes', icon: Activity, selected: true },
  { name: 'Security Audit', desc: 'Access and auth events', icon: Shield, selected: false },
  { name: 'Resource Usage', desc: 'CPU, RAM, and Disk', icon: FileText, selected: false },
])

const generateReport = () => {
  isGenerating.value = true
  progress.value = 0

  const interval = setInterval(() => {
    progress.value += Math.floor(Math.random() * 15) + 5
    if (progress.value >= 100) {
      progress.value = 100
      clearInterval(interval)
      setTimeout(() => {
        isGenerating.value = false
        toast.add('Report Ready', 'Your system report has been generated and is downloading.', 'success')
      }, 500)
    }
  }, 400)
}
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
