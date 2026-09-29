<template>
  <div class="min-w-0">
    <div class="flex items-baseline justify-between gap-2">
      <span class="field-label truncate">{{ metric.label }}</span>
      <span class="shrink-0 font-mono text-2xs tabular-nums" :class="pct >= 80 ? tone.text : 'text-ink-muted'">
        {{ pct.toFixed(0) }}%
      </span>
    </div>

    <p class="mt-0.5 flex items-baseline gap-1">
      <span class="text-lg font-semibold tabular-nums text-ink-primary">{{ metric.used.toLocaleString() }}</span>
      <span class="font-mono text-xs tabular-nums text-ink-faint">/ {{ metric.limit.toLocaleString() }}</span>
      <span class="truncate text-2xs text-ink-muted">{{ metric.unit }}</span>
    </p>

    <!-- The meter stays neutral until consumption is actually a problem.
         Colour here means "this will stop working", not "this is a bar". -->
    <div class="mt-1.5 h-1 w-full overflow-hidden rounded-[1px] bg-line-faint">
      <span
        class="block h-full transition-[width] duration-150 ease-out"
        :class="tone.bar"
        :style="{ width: `${Math.min(100, pct)}%` }"
      />
    </div>

    <p class="mt-1 truncate text-2xs" :class="pct >= 80 ? tone.text : 'text-ink-muted'">{{ note }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  metric: { type: Object, required: true }
})

const pct = computed(() => (props.metric.limit ? (props.metric.used / props.metric.limit) * 100 : 0))

const tone = computed(() => {
  if (pct.value >= 100) return { bar: 'bg-sev-critical', text: 'text-sev-critical' }
  if (pct.value >= 90) return { bar: 'bg-sev-high', text: 'text-sev-high' }
  if (pct.value >= 80) return { bar: 'bg-sev-medium', text: 'text-sev-medium' }
  return { bar: 'bg-ink-faint', text: 'text-ink-muted' }
})

const note = computed(() => {
  const left = props.metric.limit - props.metric.used
  if (left <= 0) return 'Limit reached — upgrade to continue'
  if (pct.value >= 90) return `Only ${left.toLocaleString()} ${props.metric.unit} remaining`
  if (pct.value >= 80) return `${left.toLocaleString()} ${props.metric.unit} remaining`
  return `${left.toLocaleString()} ${props.metric.unit} available`
})
</script>
