<template>
  <!--
    Provenance marker. Every threat record, metric, invoice and account in this
    build is synthetic (see PRODUCT.md), and nothing in the UI used to say so —
    a viewer could mistake demonstration data for production telemetry (UX-02).
    Neutral by design: this is a provenance fact, not a severity signal, so it
    never takes a hue. `title` carries the full explanation for pointer users;
    the text carries it for everyone else.
  -->
  <span
    class="inline-flex shrink-0 items-center gap-1 rounded border border-line px-1.5 py-0.5
           font-mono text-2xs uppercase tracking-[0.06em] text-ink-muted"
    title="Demonstration data — all records on this surface are synthetic, not live telemetry."
  >
    <FlaskConical class="h-3 w-3 shrink-0" aria-hidden="true" />
    <span>Demo data</span>
  </span>
</template>

<script setup>
import { FlaskConical } from 'lucide-vue-next'
</script>
