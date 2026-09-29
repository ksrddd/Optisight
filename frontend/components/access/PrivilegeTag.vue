<template>
  <span class="inline-flex shrink-0 items-center gap-1.5" :title="meta.note">
    <!-- Privilege is a risk axis, so it borrows the severity ramp rather than
         inventing a second colour language. The text code is the accessible
         carrier; the bar only reinforces it. -->
    <span class="h-2.5 w-[3px] shrink-0 rounded-[1px]" :class="bar" aria-hidden="true" />
    <span class="font-mono text-2xs font-semibold uppercase tracking-[0.06em]" :class="text">
      {{ meta.label }}
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { PRIVILEGE_META } from '~/services/access/directory'

const props = defineProps({
  privilege: { type: String, required: true }
})

const meta = computed(() => PRIVILEGE_META[props.privilege] ?? PRIVILEGE_META.read)

// Only privilege that can change state or grant access is a risk signal.
// Operational and read-only are the baseline the whole directory sits at, so
// they stay neutral — colouring them would put amber on two thirds of the rows
// and leave nothing for the three accounts that can actually do damage.
const BAR = {
  critical: 'bg-sev-critical',
  high: 'bg-sev-high',
  medium: 'bg-line-strong',
  low: 'bg-line-strong'
}
const TEXT = {
  critical: 'text-sev-critical',
  high: 'text-sev-high',
  medium: 'text-ink-muted',
  low: 'text-ink-faint'
}

const bar = computed(() => BAR[meta.value.severity])
const text = computed(() => TEXT[meta.value.severity])
</script>
