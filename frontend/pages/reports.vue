<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Executive Reports</h1>
        <p class="text-slate-400 mt-1">Generate automated FinOps reports and cost optimization audits for stakeholders.</p>
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
              <label class="block text-sm font-medium text-slate-300 mb-2">Financial Period</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button v-for="range in ranges" :key="range" @click="activeRange = range"
                  :class="activeRange === range ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:bg-white/5'"
                  class="px-4 py-2 text-xs font-medium rounded-lg border transition-all">
                  {{ range }}
                </button>
              </div>
            </div>

            <!-- Content Selection -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-3">Report Scope</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="item in dataOptions" :key="item.name" @click="item.selected = !item.selected"
                  class="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all"
                  :class="item.selected ? 'bg-sky-500/10 border-sky-500/50' : 'bg-slate-900/50 border-white/5 hover:border-slate-700'">
                  <div class="flex items-center gap-3">
                    <component :is="item.icon" class="w-5 h-5"
                      :class="item.selected ? 'text-sky-400' : 'text-slate-500'" />
                    <div>
                      <p class="text-sm font-medium" :class="item.selected ? 'text-white' : 'text-slate-300'">{{
                        item.name }}</p>
                      <p class="text-xs text-slate-500">{{ item.desc }}</p>
                    </div>
                  </div>
                  <div class="w-5 h-5 rounded-full border flex items-center justify-center transition-all"
                    :class="item.selected ? 'bg-sky-500 border-sky-500' : 'border-slate-700'">
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
                  <input type="radio" name="format" value="pdf" checked class="accent-sky-500">
                  <span class="text-sm text-slate-400 group-hover:text-white transition-colors">Executive Summary
                    (.pdf)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="format" value="csv" class="accent-sky-500">
                  <span class="text-sm text-slate-400 group-hover:text-white transition-colors">Raw Financial Data
                    (.csv)</span>
                </label>
              </div>
            </div>
          </div>

          <div class="mt-10 pt-6 border-t border-white/5">
            <button @click="generateReport" :disabled="isGenerating"
              class="w-full flex items-center justify-center gap-2 py-4 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/20">
              <Download v-if="!isGenerating" class="w-5 h-5" />
              <Loader2 v-else class="w-5 h-5 animate-spin" />
              {{ isGenerating ? 'Compiling Financial Data...' : 'Generate ROI Report' }}
            </button>
          </div>
        </div>

        <!-- Progress Overlay (Simulated) -->
        <div v-if="isGenerating" class="glass-card p-6 border border-sky-500/30 animate-pulse">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-sky-400">Export Progress</span>
            <span class="text-sm font-bold text-white">{{ progress }}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-sky-500 transition-all duration-300" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Quick Tips -->
      <div class="space-y-6">
        <div class="glass-card p-6 border border-white/5 bg-sky-500/5">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info class="w-5 h-5 text-sky-400" />
            Report Tips
          </h3>
          <ul class="space-y-4">
            <li class="flex gap-3 text-sm text-slate-400">
              <div class="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></div>
              QTD and YTD reports auto-include infrastructure cost forecasting.
            </li>
            <li class="flex gap-3 text-sm text-slate-400">
              <div class="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></div>
              Resource Waste Audits can be sent directly to DevOps teams via CSV for immediate action.
            </li>
            <li class="flex gap-3 text-sm text-slate-400">
              <div class="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></div>
              PDF reports contain board-ready summary visuals.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Download, Check, FileText, Activity, Loader2, Info, PiggyBank, Receipt } from 'lucide-vue-next'
import { ref, inject } from 'vue'

const toast = inject('toast')
const isGenerating = ref(false)
const progress = ref(0)
const activeRange = ref('Current Month')
const ranges = ['Current Week', 'Current Month', 'QTD', 'YTD']

const dataOptions = ref([
  { name: 'Monthly FinOps Summary', desc: 'Overall cost vs efficiency', icon: PiggyBank, selected: true },
  { name: 'Resource Waste Audit', desc: 'Identified over-provisioning', icon: FileText, selected: true },
  { name: 'Incident Cost Analysis', desc: 'Downtime financial impact', icon: Receipt, selected: false },
  { name: 'Infrastructure ROI', desc: 'Value generated by IT assets', icon: Activity, selected: false },
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
        toast.add('Report Ready', 'Your Financial ROI report has been generated and is downloading.', 'success')
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
