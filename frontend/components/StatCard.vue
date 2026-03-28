<template>
  <div
    class="glass-card p-6 flex flex-col gap-4 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
    <div class="flex items-center justify-between relative z-10">
      <div>
        <h3 class="text-sm font-medium text-slate-400">{{ title }}</h3>
        <p class="text-3xl font-bold text-white mt-1">{{ value }}</p>
      </div>
      <div :class="`p-3 rounded-2xl ${bgClass} ${textClass} bg-opacity-10 shadow-lg border border-white/5`">
        <component :is="icon" class="w-6 h-6" />
      </div>
    </div>

    <!-- Trend line indicator mock -->
    <div class="mt-2 flex items-center gap-2 text-xs font-medium"
      :class="trendUp ? 'text-emerald-400' : 'text-rose-400'">
      <span class="flex items-center bg-white/5 px-2 py-0.5 rounded-full">
        <component :is="trendUp ? TrendingUp : TrendingDown" class="w-3 h-3 mr-1" />
        {{ trend }}
      </span>
      <span class="text-slate-500">vs last hour</span>
    </div>

    <!-- Background Glow -->
    <div
      :class="`absolute -right-8 -bottom-8 w-24 h-24 ${glowClass} blur-2xl rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`">
    </div>
  </div>
</template>

<script setup>
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

defineProps({
  title: String,
  value: [String, Number],
  icon: [Object, Function],
  bgClass: { type: String, default: 'bg-indigo-500/20' },
  textClass: { type: String, default: 'text-indigo-400' },
  glowClass: { type: String, default: 'bg-indigo-500' },
  trend: { type: String, default: '+12%' },
  trendUp: { type: Boolean, default: true }
})
</script>
