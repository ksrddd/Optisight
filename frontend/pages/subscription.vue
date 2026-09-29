<template>
  <div class="flex h-full min-h-0 flex-col bg-surface-base">
    <!-- Page head -->
    <div class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
      <div class="min-w-0">
        <h1 class="truncate text-lg font-semibold tracking-[-0.02em] text-ink-primary">Plan &amp; Billing</h1>
        <p class="truncate text-xs text-ink-muted">
          {{ currentTier.name }} · {{ sub.billingCycle }} · renews
          <span class="font-mono">{{ sub.renewsOn }}</span>
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button class="btn" @click="notify('Payment method', 'Opening the secure card update form.')">
          <CreditCard class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden sm:inline">Payment method</span>
        </button>
        <button class="btn" @click="notify('Billing contact', 'Invoices are sent to finance@fintech.co.')">
          <Mail class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden sm:inline">Billing contact</span>
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <!--
        Current plan first. This is an account page for someone who already
        subscribes — what they are paying for and how close they are to its
        ceilings outranks any pitch for a different tier.
      -->
      <section class="border-b border-line">
        <div class="panel-header">
          <h2 class="panel-title">Current plan</h2>
          <span class="font-mono text-2xs text-ink-faint">renews in {{ daysToRenewal }} days</span>
        </div>

        <div class="grid grid-cols-1 border-b border-line lg:grid-cols-[minmax(280px,340px)_1fr]">
          <!-- Contract facts -->
          <div class="border-b border-line px-3 py-3 lg:border-b-0 lg:border-r">
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-semibold tracking-[-0.03em] text-ink-primary">{{ currentTier.name }}</span>
              <span class="font-mono text-sm tabular-nums text-ink-secondary">{{ currentTier.price }}</span>
              <span class="text-xs text-ink-muted">/ month</span>
            </div>
            <p class="mt-1 text-xs text-ink-muted">{{ currentTier.summary }}</p>

            <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
              <div v-for="f in contractFacts" :key="f.label" class="min-w-0">
                <dt class="field-label">{{ f.label }}</dt>
                <dd class="truncate font-mono text-xs tabular-nums text-ink-primary">{{ f.value }}</dd>
              </div>
            </dl>

            <button class="btn mt-3 w-full" @click="notify('Cancellation', 'A billing specialist will contact you.')">
              Cancel subscription
            </button>
          </div>

          <!-- Consumption against the tier's ceilings -->
          <div class="grid grid-cols-1 gap-x-6 gap-y-4 px-3 py-3 sm:grid-cols-2 xl:grid-cols-4">
            <UsageMeter v-for="m in usage" :key="m.id" :metric="m" />
          </div>
        </div>

        <!-- One honest, specific consequence rather than a generic upsell. -->
        <p
          v-if="pressured"
          class="flex items-start gap-2 px-3 py-2 text-xs"
          :class="pressured.pct >= 90 ? 'text-sev-high' : 'text-ink-secondary'"
        >
          <AlertTriangle class="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span class="font-medium">{{ pressured.label }}</span> is at
            <span class="font-mono tabular-nums">{{ pressured.pct.toFixed(0) }}%</span> of the
            {{ currentTier.name }} limit. Enterprise removes this ceiling.
          </span>
        </p>
      </section>

      <!--
        Tier comparison as a matrix, not three marketing cards. Buyers compare
        capabilities across columns; a card forces them to hold one column in
        memory while reading the next.
      -->
      <section class="border-b border-line">
        <div class="panel-header">
          <h2 class="panel-title">Compare tiers</h2>
          <span class="text-2xs tracking-normal text-ink-faint">all prices exclude VAT</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[680px] border-collapse text-left">
            <caption class="sr-only">Capabilities available on each subscription tier</caption>
            <thead>
              <tr class="border-b border-line">
                <th scope="col" class="w-[220px] px-3 py-2.5 align-top">
                  <span class="field-label">Capability</span>
                </th>
                <th
                  v-for="t in TIERS"
                  :key="t.id"
                  scope="col"
                  class="px-3 py-2.5 align-top"
                  :class="t.id === sub.tier ? 'bg-surface-raised' : ''"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-md font-semibold text-ink-primary">{{ t.name }}</span>
                    <span
                      v-if="t.id === sub.tier"
                      class="rounded border border-line-strong bg-surface-hover px-1.5 py-px text-2xs font-semibold uppercase tracking-[0.06em] text-ink-primary"
                    >
                      Current
                    </span>
                  </div>
                  <p class="mt-0.5 font-mono text-sm tabular-nums text-ink-secondary">
                    {{ t.price }}
                    <span class="text-2xs text-ink-faint">/ mo</span>
                  </p>
                </th>
              </tr>
            </thead>

            <tbody>
              <template v-for="group in groupedCapabilities" :key="group.name">
                <tr>
                  <th
                    scope="colgroup"
                    :colspan="TIERS.length + 1"
                    class="border-b border-line bg-surface-panel px-3 py-1.5 text-left"
                  >
                    <span class="panel-title">{{ group.name }}</span>
                  </th>
                </tr>
                <tr v-for="cap in group.items" :key="cap.label" class="border-b border-line-faint last:border-b-0">
                  <th scope="row" class="px-3 py-2 text-left align-top text-xs font-normal text-ink-secondary">
                    {{ cap.label }}
                  </th>
                  <td
                    v-for="t in TIERS"
                    :key="t.id"
                    class="px-3 py-2 align-top text-xs"
                    :class="[
                      t.id === sub.tier ? 'bg-surface-raised text-ink-primary' : 'text-ink-muted',
                      cap.values[t.id] === '—' ? 'text-ink-faint' : ''
                    ]"
                  >
                    {{ cap.values[t.id] }}
                  </td>
                </tr>
              </template>
            </tbody>

            <tfoot>
              <tr class="border-t border-line">
                <td class="px-3 py-2.5"></td>
                <td
                  v-for="t in TIERS"
                  :key="t.id"
                  class="px-3 py-2.5 align-top"
                  :class="t.id === sub.tier ? 'bg-surface-raised' : ''"
                >
                  <button
                    class="btn w-full"
                    :class="t.id === sub.tier ? '' : t.id === 'enterprise' ? 'btn-primary' : ''"
                    :disabled="t.id === sub.tier"
                    @click="changeTier(t)"
                  >
                    {{ t.cta }}
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <!-- Invoices -->
      <section>
        <div class="panel-header">
          <h2 class="panel-title">Invoices</h2>
          <span class="font-mono text-2xs text-ink-faint">{{ invoices.length }} records</span>
        </div>

        <div
          class="grid h-7 items-center gap-3 border-b border-line bg-surface-panel px-3
                 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-muted"
          :style="invoiceGrid"
        >
          <span>Invoice</span>
          <span>Issued</span>
          <span>Period</span>
          <span class="text-right">Amount</span>
          <span>Status</span>
          <span class="sr-only">Actions</span>
        </div>

        <div
          v-for="inv in invoices"
          :key="inv.id"
          class="grid h-8 items-center gap-3 px-3 rule-b transition-colors duration-fast hover:bg-surface-raised"
          :style="invoiceGrid"
        >
          <span class="truncate font-mono text-xs text-ink-secondary">{{ inv.id }}</span>
          <span class="truncate font-mono text-xs tabular-nums text-ink-muted">{{ inv.issued }}</span>
          <span class="truncate text-xs text-ink-muted">{{ inv.period }}</span>
          <span class="truncate text-right font-mono text-xs tabular-nums text-ink-primary">
            {{ formatTHB(inv.amount) }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="invoiceMeta[inv.status].dot" aria-hidden="true" />
            <span class="truncate text-xs capitalize" :class="invoiceMeta[inv.status].text">{{ inv.status }}</span>
          </span>
          <button
            class="justify-self-end text-ink-faint transition-colors duration-fast hover:text-ink-primary"
            :aria-label="`Download ${inv.id}`"
            @click="notify('Invoice ready', `${inv.id} has been prepared for download.`)"
          >
            <Download class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { CreditCard, Mail, Download, AlertTriangle } from 'lucide-vue-next'
import UsageMeter from '~/components/account/UsageMeter.vue'
import {
  TIERS,
  CAPABILITIES,
  fetchSubscription,
  fetchUsage,
  fetchInvoices,
  formatTHB
} from '~/services/billing/plans'

definePageMeta({ dense: true })
useHead({ title: 'Plan & Billing | OptiSight' })

const toast = inject('toast', { add: () => {} })

const sub = ref(fetchSubscription())
const usage = ref(fetchUsage())
const invoices = ref(fetchInvoices())

const invoiceGrid = { gridTemplateColumns: 'minmax(130px,1fr) 100px minmax(90px,1fr) 100px 100px 28px' }

const currentTier = computed(() => TIERS.find((t) => t.id === sub.value.tier) ?? TIERS[0])

const daysToRenewal = computed(() =>
  Math.max(0, Math.ceil((new Date(sub.value.renewsOn).getTime() - Date.now()) / 86_400_000))
)

const contractFacts = computed(() => [
  { label: 'Next invoice', value: formatTHB(sub.value.nextAmount) },
  { label: 'Billed on', value: sub.value.renewsOn },
  { label: 'Seats', value: `${sub.value.seatsUsed} / ${sub.value.seats}` },
  {
    label: 'Payment method',
    value: `${sub.value.paymentMethod.brand} ···· ${sub.value.paymentMethod.last4}`
  }
])

/** The single metric closest to its ceiling, if any is worth flagging. */
const pressured = computed(() => {
  const ranked = usage.value
    .map((m) => ({ label: m.label, pct: m.limit ? (m.used / m.limit) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct)
  return ranked[0] && ranked[0].pct >= 75 ? ranked[0] : null
})

const groupedCapabilities = computed(() => {
  const map = new Map()
  for (const cap of CAPABILITIES) {
    if (!map.has(cap.group)) map.set(cap.group, { name: cap.group, items: [] })
    map.get(cap.group).items.push(cap)
  }
  return [...map.values()]
})

const invoiceMeta = {
  paid: { dot: 'bg-sev-low', text: 'text-ink-muted' },
  due: { dot: 'bg-sev-high', text: 'text-sev-high' },
  refunded: { dot: 'bg-ink-faint', text: 'text-ink-faint' }
}

const notify = (title, message) => toast.add(title, message, 'info')

const changeTier = (tier) => {
  if (tier.id === sub.value.tier) return
  if (tier.id === 'enterprise') {
    toast.add('Request sent', 'A solutions engineer will contact you within one business day.', 'success')
  } else {
    toast.add(
      'Plan change staged',
      `Moving to ${tier.name} takes effect on ${sub.value.renewsOn}. No charge today.`,
      'info'
    )
  }
}
</script>
