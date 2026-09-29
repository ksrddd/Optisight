<template>
  <span class="inline-flex shrink-0 items-center gap-1.5" :title="`Severity: ${meta.full}`">
    <!-- The bar is reinforcement, never the signal. The text code below is the
         accessible carrier, so severity survives greyscale and colour blindness. -->
    <span class="h-2.5 w-[3px] shrink-0 rounded-[1px]" :class="meta.bar" aria-hidden="true" />
    <span class="font-mono text-2xs font-semibold uppercase tracking-[0.06em]" :class="meta.text">
      {{ meta.code }}
    </span>
    <span class="sr-only">{{ meta.full }} severity</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  severity: { type: String, required: true }
})

const MAP = {
  critical: { code: 'CRIT', full: 'Critical', bar: 'bg-sev-critical', text: 'text-sev-critical' },
  high: { code: 'HIGH', full: 'High', bar: 'bg-sev-high', text: 'text-sev-high' },
  medium: { code: 'MED', full: 'Medium', bar: 'bg-sev-medium', text: 'text-sev-medium' },
  low: { code: 'LOW', full: 'Low', bar: 'bg-sev-low', text: 'text-sev-low' }
}

const meta = computed(() => MAP[props.severity] ?? MAP.low)
</script>
