<template>
  <aside
    class="flex w-full min-w-0 shrink-0 flex-col overflow-y-auto border-t border-line bg-surface-raised
           lg:w-rail lg:border-l lg:border-t-0"
    aria-label="Attack surface"
  >
    <!-- Service exposure over time -------------------------------------- -->
    <section class="shrink-0 border-b border-line">
      <div class="panel-header">
        <h2 class="panel-title">Service exposure</h2>
        <span class="font-mono text-2xs text-ink-faint">last 15m</span>
      </div>

      <div class="p-3">
        <!-- A time x service matrix rather than a node graph: an analyst needs
             to know which service is under pressure and whether it is spreading,
             and a grid answers both without a layout engine. -->
        <div class="space-y-[3px]">
          <div v-for="row in matrix" :key="row.service" class="flex items-center gap-2">
            <span class="w-[86px] shrink-0 truncate font-mono text-2xs tracking-normal text-ink-secondary">
              {{ row.service }}
            </span>
            <div class="flex flex-1 gap-[3px]">
              <span
                v-for="(cell, i) in row.cells"
                :key="i"
                class="h-3 flex-1 rounded-[1px]"
                :class="cellClass(cell)"
                :title="`${row.service} · ${cell.count} ${cell.count === 1 ? 'event' : 'events'}${cell.severity ? `, peak ${cell.severity}` : ''}`"
              />
            </div>
            <span class="w-6 shrink-0 text-right font-mono text-2xs tabular-nums" :class="row.total ? 'text-ink-secondary' : 'text-ink-faint'">
              {{ row.total }}
            </span>
          </div>
        </div>

        <div class="mt-2 flex items-center justify-between font-mono text-2xs text-ink-faint">
          <span>−15m</span>
          <span>now</span>
        </div>

        <!-- Legend. Density is meaningless without it. -->
        <div class="mt-2 flex items-center gap-2 border-t border-line-faint pt-2">
          <span class="field-label">Peak</span>
          <span v-for="s in legend" :key="s.key" class="flex items-center gap-1">
            <span class="h-2.5 w-2.5 rounded-[1px]" :class="s.cls" aria-hidden="true" />
            <span class="text-2xs text-ink-muted">{{ s.label }}</span>
          </span>
        </div>
      </div>
    </section>

    <!-- Most targeted assets --------------------------------------------- -->
    <section class="shrink-0 border-b border-line">
      <div class="panel-header">
        <h2 class="panel-title">Most targeted assets</h2>
        <span class="text-2xs tracking-normal text-ink-faint">crit + high / total</span>
      </div>

      <ul class="p-3 pt-2">
        <li v-for="a in topAssets" :key="a.asset" class="py-1.5 first:pt-0 last:pb-0">
          <div class="flex items-baseline justify-between gap-2">
            <span class="truncate font-mono text-xs text-ink-secondary">{{ a.asset }}</span>
            <span class="shrink-0 font-mono text-2xs tabular-nums">
              <span :class="a.actionable ? 'text-ink-primary' : 'text-ink-muted'">{{ a.actionable }}</span>
              <span class="text-ink-faint">/{{ a.total }}</span>
            </span>
          </div>
          <!-- Only critical and high are drawn in colour; the rest of the
               volume stays neutral. Every asset has a similar low-severity
               tail, so colouring it would make all six rows look alike and
               tell the analyst nothing. -->
          <div class="mt-1 flex h-1 w-full gap-px overflow-hidden rounded-[1px] bg-line-faint">
            <span
              v-for="seg in a.segments"
              :key="seg.key"
              class="h-full"
              :class="seg.cls"
              :style="{ width: `${seg.pct}%` }"
              :title="`${seg.count} ${seg.label}`"
            />
          </div>
        </li>
        <li v-if="!topAssets.length" class="py-2 text-xs text-ink-muted">No activity in the window.</li>
      </ul>
    </section>

    <!-- Source regions ---------------------------------------------------- -->
    <section class="shrink-0">
      <div class="panel-header">
        <h2 class="panel-title">Source regions</h2>
      </div>

      <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5 p-3 pt-2">
        <li v-for="g in topGeos" :key="g.code" class="flex items-center gap-2">
          <span class="w-6 shrink-0 font-mono text-xs font-semibold text-ink-secondary">{{ g.code }}</span>
          <span class="h-1 flex-1 overflow-hidden rounded-[1px] bg-line-faint">
            <span class="block h-full bg-ink-faint" :style="{ width: `${g.pct}%` }" />
          </span>
          <span class="w-5 shrink-0 text-right font-mono text-2xs tabular-nums text-ink-muted">{{ g.count }}</span>
        </li>
      </ul>
    </section>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  recent: { type: Array, default: () => [] },
  byService: { type: Array, default: () => [] }
})

const BUCKETS = 14
const WINDOW = 900_000 // 15 minutes

const legend = [
  { key: 'critical', label: 'Crit', cls: 'bg-sev-critical' },
  { key: 'high', label: 'High', cls: 'bg-sev-high' },
  { key: 'medium', label: 'Med', cls: 'bg-sev-medium' },
  { key: 'low', label: 'Low', cls: 'bg-sev-low' }
]

const RANK = { low: 0, medium: 1, high: 2, critical: 3 }

const matrix = computed(() => {
  const now = Date.now()
  const size = WINDOW / BUCKETS

  const rows = props.byService.map((s) => ({
    service: s.service,
    total: s.total,
    cells: Array.from({ length: BUCKETS }, () => ({ count: 0, severity: null }))
  }))

  const index = new Map(rows.map((r) => [r.service, r]))

  for (const e of props.recent) {
    const row = index.get(e.service)
    if (!row) continue
    const age = now - e.ts
    if (age < 0 || age >= WINDOW) continue
    const slot = BUCKETS - 1 - Math.floor(age / size)
    const cell = row.cells[slot]
    if (!cell) continue
    cell.count += 1
    if (cell.severity === null || RANK[e.severity] > RANK[cell.severity]) cell.severity = e.severity
  }

  return rows
})

// Two axes in one cell: hue is the peak severity, opacity is the volume.
// The opacity ceiling is itself capped by severity, so a busy hour of port
// scans can never out-shout a single exfiltration cell.
const CELL_RAMP = {
  critical: ['bg-sev-critical/45', 'bg-sev-critical/70', 'bg-sev-critical'],
  high: ['bg-sev-high/35', 'bg-sev-high/55', 'bg-sev-high/80'],
  medium: ['bg-sev-medium/25', 'bg-sev-medium/40', 'bg-sev-medium/55'],
  low: ['bg-sev-low/18', 'bg-sev-low/28', 'bg-sev-low/38']
}

const cellClass = (cell) => {
  if (!cell.count || !cell.severity) return 'bg-line-faint'
  const tier = cell.count >= 4 ? 2 : cell.count >= 2 ? 1 : 0
  return CELL_RAMP[cell.severity][tier]
}

const topAssets = computed(() => {
  const map = new Map()
  for (const e of props.recent) {
    let row = map.get(e.asset)
    if (!row) {
      row = { asset: e.asset, total: 0, critical: 0, high: 0, medium: 0, low: 0 }
      map.set(e.asset, row)
    }
    row.total += 1
    row[e.severity] += 1
  }

  return [...map.values()]
    .sort((a, b) => b.critical * 3 + b.high - (a.critical * 3 + a.high) || b.total - a.total)
    .slice(0, 6)
    .map((row) => {
      const rest = row.medium + row.low
      const segments = [
        { key: 'critical', label: 'critical', count: row.critical, cls: 'bg-sev-critical' },
        { key: 'high', label: 'high', count: row.high, cls: 'bg-sev-high/85' },
        { key: 'rest', label: 'medium or low', count: rest, cls: 'bg-line-strong' }
      ]
        .filter((s) => s.count > 0)
        .map((s) => ({ ...s, pct: (s.count / row.total) * 100 }))

      return { ...row, actionable: row.critical + row.high, segments }
    })
})

const topGeos = computed(() => {
  const map = new Map()
  for (const e of props.recent) map.set(e.geo, (map.get(e.geo) ?? 0) + 1)
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const max = sorted[0]?.[1] ?? 1
  return sorted.map(([code, count]) => ({ code, count, pct: (count / max) * 100 }))
})
</script>
