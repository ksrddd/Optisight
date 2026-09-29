<template>
  <div>
    <!-- A composite index is a ratio, so it gets a ratio chart. A trend line
         here would say less than the mix does. -->
    <div class="flex h-1.5 w-full gap-px overflow-hidden rounded-[1px] bg-line-faint">
      <span
        v-for="seg in segments"
        :key="seg.key"
        class="h-full transition-[width] duration-150 ease-out"
        :class="seg.cls"
        :style="{ width: `${seg.pct}%` }"
      />
    </div>

    <dl class="mt-1.5 flex items-center gap-x-2.5 gap-y-1 overflow-hidden">
      <div v-for="seg in all" :key="seg.key" class="flex shrink-0 items-center gap-1">
        <dt class="text-2xs tracking-normal" :class="seg.text">{{ seg.label }}</dt>
        <dd class="font-mono text-2xs tabular-nums text-ink-secondary">{{ seg.count }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  counts: { type: Object, required: true }
})

// Visual weight scales with severity. Low-severity noise is the bulk of any
// real feed, so rendering it at full saturation would let the least important
// band dominate the page. Opacity does the ranking that width cannot.
const ORDER = [
  { key: 'critical', label: 'Crit', cls: 'bg-sev-critical', text: 'text-sev-critical' },
  { key: 'high', label: 'High', cls: 'bg-sev-high/85', text: 'text-sev-high' },
  { key: 'medium', label: 'Med', cls: 'bg-sev-medium/55', text: 'text-sev-medium' },
  { key: 'low', label: 'Low', cls: 'bg-sev-low/35', text: 'text-sev-low' }
]

const total = computed(() => ORDER.reduce((sum, s) => sum + (props.counts[s.key] ?? 0), 0))

const all = computed(() =>
  ORDER.map((s) => ({
    ...s,
    count: props.counts[s.key] ?? 0,
    pct: total.value ? ((props.counts[s.key] ?? 0) / total.value) * 100 : 0
  }))
)

const segments = computed(() => all.value.filter((s) => s.pct > 0))
</script>
