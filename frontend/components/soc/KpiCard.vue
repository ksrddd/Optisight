<template>
  <div
    class="flex snap-start flex-col justify-between gap-2 border-r border-line bg-surface-raised px-3 py-2.5
           min-w-[232px] shrink-0 last:border-r-0
           sm:min-w-0 sm:shrink sm:border-b xl:border-b-0"
  >
    <div class="flex items-start justify-between gap-2">
      <h3 class="field-label truncate">{{ label }}</h3>
      <span
        v-if="badge"
        class="shrink-0 font-mono text-2xs font-semibold uppercase tracking-[0.06em]"
        :class="badgeClass"
      >
        {{ badge }}
      </span>
    </div>

    <div class="flex items-end justify-between gap-3">
      <div class="flex min-w-0 flex-col gap-0.5">
        <p class="flex items-baseline gap-1 truncate">
          <span
            class="text-2xl font-semibold tabular-nums tracking-[-0.03em]"
            :class="valueClass"
          >{{ value }}</span>
          <span v-if="unit" class="text-sm font-medium text-ink-muted">{{ unit }}</span>
        </p>

        <p class="flex items-center gap-1 truncate text-xs">
          <component
            v-if="deltaIcon"
            :is="deltaIcon"
            class="h-3 w-3 shrink-0"
            :class="deltaClass"
            aria-hidden="true"
          />
          <span class="font-mono tabular-nums" :class="deltaClass">{{ delta }}</span>
          <span class="truncate text-ink-muted">{{ deltaNote }}</span>
        </p>
      </div>

      <!-- Micro-trend. 32 points of the real series; no axes, no interaction,
           no chart library — it exists to answer "which way" in one glance.
           Metrics whose story is a composition rather than a direction pass
           their own visual through the `viz` slot instead. -->
      <div v-if="!$slots.viz" class="h-7 w-[84px] shrink-0" :class="sparkClass">
        <Sparkline :values="series" :label="`${label} trend, last 32 samples`" />
      </div>
    </div>

    <slot name="viz" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-vue-next'
import Sparkline from './Sparkline.vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  unit: { type: String, default: '' },
  delta: { type: String, default: '' },
  deltaNote: { type: String, default: '' },
  /** 'up' | 'down' | 'flat' — the direction the metric moved. */
  direction: { type: String, default: 'flat' },
  /** 'bad' | 'good' | 'neutral' — what that direction means operationally. */
  tone: { type: String, default: 'neutral' },
  series: { type: Array, default: () => [] },
  badge: { type: String, default: '' },
  /** Severity name when the value itself is a severity readout. */
  severity: { type: String, default: '' }
})

const SEV_TEXT = {
  critical: 'text-sev-critical',
  high: 'text-sev-high',
  medium: 'text-sev-medium',
  low: 'text-sev-low'
}

const valueClass = computed(() => (props.severity ? SEV_TEXT[props.severity] : 'text-ink-primary'))

const deltaIcon = computed(() => {
  if (props.direction === 'up') return ArrowUpRight
  if (props.direction === 'down') return ArrowDownRight
  return Minus
})

const deltaClass = computed(() => {
  if (props.tone === 'bad') return 'text-sev-high'
  if (props.tone === 'good') return 'text-sev-low'
  return 'text-ink-muted'
})

const badgeClass = computed(() => SEV_TEXT[props.severity] ?? 'text-ink-muted')

// The sparkline inherits colour from its container via currentColor.
const sparkClass = computed(() => (props.severity ? SEV_TEXT[props.severity] : 'text-ink-faint'))
</script>
