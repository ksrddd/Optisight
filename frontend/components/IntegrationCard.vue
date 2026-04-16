<template>
  <div
    class="glass-card p-5 border border-slate-700/50 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col h-full bg-slate-900/20 backdrop-blur-sm">
    <div class="flex items-start justify-between mb-3">
      <div
        class="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
        <component :is="IconComponent" class="w-5 h-5" :class="iconColor" />
      </div>
      <span class="px-2 py-0.5 text-[10px] font-medium rounded-full border whitespace-nowrap"
        :class="getStatusStyle(status)">
        {{ status }}
      </span>
    </div>

    <div class="flex-1">
      <h3
        class="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors uppercase tracking-tight">
        {{ name }}</h3>
      <p class="text-[11px] text-slate-400 mt-1 mb-3 line-clamp-2 leading-relaxed">{{ description }}</p>
    </div>

    <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
      <span class="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">MOD: {{ type }}</span>
      <div v-if="rate" class="flex items-center gap-1 text-[9px] text-slate-500">
        <TrendingUp class="w-3 h-3 text-emerald-400" />
        {{ rate }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Cloud, CloudSnow, CloudCog, Box, Database, Layers, Server,
  Terminal, ShieldCheck, Users, Code, TrendingUp, Cpu, Globe, Infinity as InfinityIcon
} from 'lucide-vue-next'

const props = defineProps({
  name: String,
  description: String,
  status: String,
  type: String,
  icon: String,
  iconColor: String,
  rate: String
})

const icons = {
  Cloud, CloudSnow, CloudCog, Box, Database, Layers, Server,
  Terminal, ShieldCheck, Users, Code, Cpu, Globe, Infinity: InfinityIcon
}

const IconComponent = computed(() => icons[props.icon] || Globe)

const getStatusStyle = (status) => {
  if (status === 'Connected') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (status === 'Syncing') return 'bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse'
  if (status === 'Warning') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-slate-800 text-slate-400 border-slate-700'
}
</script>
