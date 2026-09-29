<template>
  <div
    class="flex min-h-[38px] shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line bg-surface-raised px-2 py-1.5"
  >
    <!-- Severity: multi-select. Each chip carries its own live count so the
         analyst can see what narrowing will cost before clicking. -->
    <div class="flex items-center gap-1" role="group" aria-label="Filter by severity">
      <button
        v-for="s in severities"
        :key="s.key"
        class="chip"
        :class="model.severities.includes(s.key) ? 'chip-on' : ''"
        :aria-pressed="model.severities.includes(s.key)"
        @click="toggle('severities', s.key)"
      >
        <span class="h-2 w-[3px] shrink-0 rounded-[1px]" :class="s.bar" aria-hidden="true" />
        {{ s.label }}
        <span class="font-mono text-2xs tabular-nums text-ink-faint">{{ counts[s.key] ?? 0 }}</span>
      </button>
    </div>

    <span class="h-4 w-px shrink-0 bg-line" aria-hidden="true" />

    <!-- Triage status: multi-select -->
    <div class="flex items-center gap-1" role="group" aria-label="Filter by triage status">
      <button
        v-for="s in statuses"
        :key="s.key"
        class="chip"
        :class="model.statuses.includes(s.key) ? 'chip-on' : ''"
        :aria-pressed="model.statuses.includes(s.key)"
        @click="toggle('statuses', s.key)"
      >
        {{ s.label }}
      </button>
    </div>

    <span class="hidden h-4 w-px shrink-0 bg-line sm:block" aria-hidden="true" />

    <label class="relative flex h-6 min-w-[150px] flex-1 items-center sm:max-w-[280px]">
      <span class="sr-only">Filter by asset, IP, threat type or event ID</span>
      <Search class="pointer-events-none absolute left-2 h-3 w-3 text-ink-faint" aria-hidden="true" />
      <input
        v-model="model.query"
        type="search"
        placeholder="asset, IP, type, EVT-id…"
        class="input h-6 rounded pl-7 font-mono text-xs placeholder:font-sans placeholder:text-ink-faint"
      />
    </label>

    <div class="ml-auto flex shrink-0 items-center gap-2">
      <p class="font-mono text-xs tabular-nums text-ink-muted">
        <span class="text-ink-primary">{{ matched.toLocaleString() }}</span>
        <span class="text-ink-faint"> / {{ total.toLocaleString() }}</span>
      </p>

      <button v-if="isFiltered" class="chip" @click="reset">
        <X class="h-3 w-3" aria-hidden="true" />
        Clear
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Search, X } from 'lucide-vue-next'

const model = defineModel({ type: Object, required: true })

defineProps({
  counts: { type: Object, default: () => ({}) },
  matched: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
})

const severities = [
  { key: 'critical', label: 'Critical', bar: 'bg-sev-critical' },
  { key: 'high', label: 'High', bar: 'bg-sev-high' },
  { key: 'medium', label: 'Medium', bar: 'bg-sev-medium' },
  { key: 'low', label: 'Low', bar: 'bg-sev-low' }
]

const statuses = [
  { key: 'new', label: 'New' },
  { key: 'triaging', label: 'Triaging' },
  { key: 'contained', label: 'Contained' },
  { key: 'dismissed', label: 'Dismissed' }
]

const toggle = (group, key) => {
  const list = model.value[group]
  model.value = {
    ...model.value,
    [group]: list.includes(key) ? list.filter((k) => k !== key) : [...list, key]
  }
}

const isFiltered = computed(
  () => model.value.severities.length > 0 || model.value.statuses.length > 0 || model.value.query.trim() !== ''
)

const reset = () => {
  model.value = { severities: [], statuses: [], query: '' }
}
</script>
