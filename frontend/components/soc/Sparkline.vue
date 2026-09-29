<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    class="block h-full w-full overflow-visible"
    role="img"
    :aria-label="label"
    focusable="false"
  >
    <!-- Baseline: the series mean. Gives the line something to be read
         against, so a rising trend is legible without an axis. -->
    <line
      :x1="0"
      :x2="W"
      :y1="meanY"
      :y2="meanY"
      stroke="currentColor"
      stroke-width="1"
      stroke-dasharray="2 3"
      class="text-line-strong"
      vector-effect="non-scaling-stroke"
    />

    <polyline
      :points="points"
      fill="none"
      stroke="currentColor"
      stroke-width="1.25"
      stroke-linejoin="round"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />

    <circle :cx="lastX" :cy="lastY" r="1.75" fill="currentColor" vector-effect="non-scaling-stroke" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  values: { type: Array, required: true },
  label: { type: String, default: 'Trend' }
})

// Internal coordinate space; the SVG scales to whatever box it is given.
const W = 100
const H = 28

const bounds = computed(() => {
  const v = props.values
  if (!v.length) return { min: 0, max: 1 }
  let min = Infinity
  let max = -Infinity
  for (const n of v) {
    if (n < min) min = n
    if (n > max) max = n
  }
  // A flat series would divide by zero and collapse to the top edge.
  if (max === min) {
    max = min + 1
    min = min - 1
  }
  return { min, max }
})

const toY = (n) => {
  const { min, max } = bounds.value
  // 2px of padding top and bottom keeps the stroke and end dot inside the box.
  return H - 2 - ((n - min) / (max - min)) * (H - 4)
}

const toX = (i) => (props.values.length < 2 ? W : (i / (props.values.length - 1)) * W)

const points = computed(() => props.values.map((n, i) => `${toX(i).toFixed(2)},${toY(n).toFixed(2)}`).join(' '))

const meanY = computed(() => {
  const v = props.values
  if (!v.length) return H / 2
  return toY(v.reduce((a, b) => a + b, 0) / v.length)
})

const lastX = computed(() => toX(props.values.length - 1))
const lastY = computed(() => toY(props.values[props.values.length - 1] ?? 0))
</script>
