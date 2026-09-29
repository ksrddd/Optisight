<template>
  <div class="flex h-full min-h-0 flex-col bg-surface-base">
    <!-- Page head -->
    <div class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
      <div class="min-w-0">
        <h1 class="truncate text-lg font-semibold tracking-[-0.02em] text-ink-primary">Access Control</h1>
        <p class="truncate text-xs text-ink-muted">
          {{ accounts.length }} accounts · {{ ROLES.length }} roles · {{ MODULES.length }} governed modules
        </p>
      </div>

      <button class="btn btn-primary shrink-0" @click="invite">
        <UserPlus class="h-3.5 w-3.5" aria-hidden="true" />
        Invite user
      </button>
    </div>

    <!--
      Posture strip. Deliberately a rule-separated fact row rather than a card
      grid: these are four readings of one thing (who can do damage), and the
      SOC console already owns the card-strip pattern.
    -->
    <div class="flex shrink-0 flex-wrap items-stretch border-b border-line bg-surface-raised">
      <button
        v-for="p in posture"
        :key="p.key"
        class="flex min-w-[150px] flex-1 flex-col gap-0.5 border-r border-line px-3 py-2 text-left
               transition-colors duration-fast last:border-r-0 hover:bg-surface-hover"
        :class="filters.posture === p.key ? 'bg-surface-hover' : ''"
        :aria-pressed="filters.posture === p.key"
        @click="togglePosture(p.key)"
      >
        <span class="field-label truncate">{{ p.label }}</span>
        <span class="flex items-baseline gap-1.5">
          <span class="text-xl font-semibold tabular-nums" :class="p.count ? p.tone : 'text-ink-primary'">
            {{ p.count }}
          </span>
          <span class="truncate text-2xs text-ink-muted">{{ p.note }}</span>
        </span>
      </button>
    </div>

    <!-- Filters -->
    <div
      class="flex min-h-[38px] shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line bg-surface-raised px-2 py-1.5"
    >
      <div class="flex items-center gap-1" role="group" aria-label="Filter by privilege">
        <button
          v-for="p in privileges"
          :key="p.key"
          class="chip"
          :class="filters.privileges.includes(p.key) ? 'chip-on' : ''"
          :aria-pressed="filters.privileges.includes(p.key)"
          @click="togglePrivilege(p.key)"
        >
          <span class="h-2 w-[3px] shrink-0 rounded-[1px]" :class="p.bar" aria-hidden="true" />
          {{ p.label }}
          <span class="font-mono text-2xs tabular-nums text-ink-faint">{{ privilegeCounts[p.key] ?? 0 }}</span>
        </button>
      </div>

      <span class="h-4 w-px shrink-0 bg-line" aria-hidden="true" />

      <div class="flex items-center gap-1" role="group" aria-label="Filter by status">
        <button
          v-for="s in statuses"
          :key="s"
          class="chip capitalize"
          :class="filters.statuses.includes(s) ? 'chip-on' : ''"
          :aria-pressed="filters.statuses.includes(s)"
          @click="toggleStatus(s)"
        >
          {{ s }}
        </button>
      </div>

      <label class="relative flex h-6 min-w-[150px] flex-1 items-center sm:max-w-[260px]">
        <span class="sr-only">Search by name, email, role or department</span>
        <Search class="pointer-events-none absolute left-2 h-3 w-3 text-ink-faint" aria-hidden="true" />
        <input
          v-model="filters.query"
          type="search"
          placeholder="name, email, role…"
          class="input h-6 rounded pl-7 text-xs"
        />
      </label>

      <div class="ml-auto flex shrink-0 items-center gap-2">
        <p class="font-mono text-xs tabular-nums text-ink-muted">
          <span class="text-ink-primary">{{ filtered.length }}</span>
          <span class="text-ink-faint"> / {{ accounts.length }}</span>
        </p>
        <button v-if="isFiltered" class="chip" @click="reset">
          <X class="h-3 w-3" aria-hidden="true" />
          Clear
        </button>
      </div>
    </div>

    <!-- Directory + roles rail -->
    <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          class="grid h-7 shrink-0 items-center gap-3 border-b border-line bg-surface-panel px-3
                 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-muted"
          :style="gridStyle"
        >
          <span>Account</span>
          <span>Role</span>
          <span>Privilege</span>
          <span>MFA</span>
          <span>Last active</span>
          <span>Status</span>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div v-if="!filtered.length" class="flex h-full items-center justify-center p-6">
            <div class="max-w-[280px] text-center">
              <Users class="mx-auto h-5 w-5 text-ink-faint" aria-hidden="true" />
              <p class="mt-2 text-sm font-medium text-ink-primary">No accounts match these filters</p>
              <p class="mt-1 text-xs text-ink-muted">Clear the filters to see the full directory.</p>
            </div>
          </div>

          <button
            v-for="a in filtered"
            :key="a.id"
            class="grid h-9 w-full items-center gap-3 px-3 text-left rule-b transition-colors duration-fast hover:bg-surface-raised"
            :class="a.status === 'suspended' ? 'opacity-55' : ''"
            :style="gridStyle"
            @click="selected = a"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-surface-panel text-2xs font-semibold text-ink-muted"
                aria-hidden="true"
              >{{ a.name[0] }}</span>
              <span class="truncate text-sm text-ink-primary">{{ a.name }}</span>
              <span class="hidden truncate font-mono text-2xs text-ink-faint xl:inline">{{ a.email }}</span>
            </span>

            <span class="flex min-w-0 items-baseline gap-1.5">
              <span class="truncate text-xs text-ink-secondary">{{ roleById(a.roleId).label }}</span>
              <!-- Department only when it adds something the role name did not. -->
              <span
                v-if="a.department !== roleById(a.roleId).label"
                class="hidden shrink-0 text-2xs text-ink-faint 2xl:inline"
              >{{ a.department }}</span>
            </span>

            <PrivilegeTag :privilege="roleById(a.roleId).privilege" />

            <!-- A missing second factor is the one thing on this page that is
                 allowed to shout, because it is the actual risk. -->
            <span class="flex items-center gap-1.5">
              <component
                :is="a.mfa ? ShieldCheck : ShieldAlert"
                class="h-3.5 w-3.5 shrink-0"
                :class="a.mfa ? 'text-ink-faint' : 'text-sev-critical'"
                aria-hidden="true"
              />
              <span class="text-xs" :class="a.mfa ? 'text-ink-muted' : 'font-medium text-sev-critical'">
                {{ a.mfa ? 'On' : 'Off' }}
              </span>
            </span>

            <span class="truncate font-mono text-xs tabular-nums text-ink-muted">{{ relative(a.lastActive) }}</span>

            <span class="flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="statusMeta[a.status].dot" aria-hidden="true" />
              <span class="truncate text-xs capitalize" :class="statusMeta[a.status].text">{{ a.status }}</span>
            </span>
          </button>
        </div>
      </div>

      <!-- Roles rail -->
      <aside
        class="flex w-full shrink-0 flex-col overflow-y-auto border-t border-line bg-surface-raised
               max-h-[46%] lg:max-h-none lg:w-rail lg:border-l lg:border-t-0"
        aria-label="Roles and module reach"
      >
        <section class="shrink-0 border-b border-line">
          <div class="panel-header">
            <h2 class="panel-title">Roles</h2>
            <span class="font-mono text-2xs text-ink-faint">{{ accounts.length }} assigned</span>
          </div>

          <ul class="p-3 pt-2">
            <li v-for="r in roleRows" :key="r.id" class="py-1.5 first:pt-0 last:pb-0">
              <div class="flex items-center justify-between gap-2">
                <span class="truncate text-xs text-ink-secondary">{{ r.label }}</span>
                <span class="flex shrink-0 items-center gap-2">
                  <PrivilegeTag :privilege="r.privilege" />
                  <span class="w-5 text-right font-mono text-2xs tabular-nums text-ink-muted">{{ r.count }}</span>
                </span>
              </div>
              <div class="mt-1 h-1 w-full overflow-hidden rounded-[1px] bg-line-faint">
                <span class="block h-full" :class="r.bar" :style="{ width: `${r.pct}%` }" />
              </div>
            </li>
          </ul>
        </section>

        <!-- Module reach answers the question this page exists for: how many
             people can currently open each surface. -->
        <section class="shrink-0">
          <div class="panel-header">
            <h2 class="panel-title">Module reach</h2>
            <span class="text-2xs tracking-normal text-ink-faint">accounts with access</span>
          </div>

          <ul class="p-3 pt-2">
            <li v-for="m in moduleReach" :key="m.id" class="flex items-center gap-2 py-1">
              <span class="w-[86px] shrink-0 truncate text-xs text-ink-secondary">{{ m.label }}</span>
              <span class="h-1 flex-1 overflow-hidden rounded-[1px] bg-line-faint">
                <span class="block h-full bg-ink-faint" :style="{ width: `${m.pct}%` }" />
              </span>
              <span class="w-5 shrink-0 text-right font-mono text-2xs tabular-nums text-ink-muted">{{ m.count }}</span>
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <UserDrawer v-if="selected" :account="selected" @close="selected = null" @action="handleAction" />
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { UserPlus, Search, X, Users, ShieldCheck, ShieldAlert } from 'lucide-vue-next'
import PrivilegeTag from '~/components/access/PrivilegeTag.vue'
import UserDrawer from '~/components/access/UserDrawer.vue'
import { MODULES, ROLES, fetchDirectory, roleById } from '~/services/access/directory'

definePageMeta({ dense: true })
useHead({ title: 'Access Control | OptiSight' })

const toast = inject('toast', { add: () => {} })

const accounts = ref(fetchDirectory())
const selected = ref(null)

const COLS = 'minmax(180px,1.6fr) minmax(130px,1.1fr) 108px 82px 118px 104px'
const gridStyle = { gridTemplateColumns: COLS }

const statusMeta = {
  active: { dot: 'bg-sev-low', text: 'text-ink-secondary' },
  invited: { dot: 'bg-ink-faint', text: 'text-ink-muted' },
  suspended: { dot: 'bg-sev-high', text: 'text-sev-high' }
}

// Swatches match PrivilegeTag: hue only where privilege is itself a risk.
const privileges = [
  { key: 'full', label: 'Full', bar: 'bg-sev-critical' },
  { key: 'elevated', label: 'Elevated', bar: 'bg-sev-high' },
  { key: 'operational', label: 'Operational', bar: 'bg-line-strong' },
  { key: 'read', label: 'Read', bar: 'bg-line-strong' }
]

const statuses = ['active', 'invited', 'suspended']

const filters = ref({ privileges: [], statuses: [], query: '', posture: null })

const privilegeOf = (a) => roleById(a.roleId).privilege

const privilegeCounts = computed(() => {
  const counts = {}
  for (const a of accounts.value) {
    const p = privilegeOf(a)
    counts[p] = (counts[p] ?? 0) + 1
  }
  return counts
})

const STALE_DAYS = 30
const staleCutoff = () => Date.now() - STALE_DAYS * 86_400_000

const posture = computed(() => {
  const list = accounts.value
  const fullAccess = list.filter((a) => privilegeOf(a) === 'full').length
  // Only live accounts count: an invited user has not had the chance to enrol
  // a second factor yet, and a suspended one cannot sign in at all.
  const noMfa = list.filter((a) => !a.mfa && a.status === 'active').length
  const suspended = list.filter((a) => a.status === 'suspended').length
  const dormant = list.filter((a) => a.status === 'active' && a.lastActive < staleCutoff()).length

  return [
    { key: 'full', label: 'Full access', count: fullAccess, tone: 'text-sev-critical', note: 'can change billing & RBAC' },
    { key: 'nomfa', label: 'Without MFA', count: noMfa, tone: 'text-sev-critical', note: 'second factor missing' },
    { key: 'dormant', label: `Dormant ${STALE_DAYS}d+`, count: dormant, tone: 'text-sev-high', note: 'active but unused' },
    { key: 'suspended', label: 'Suspended', count: suspended, tone: 'text-sev-high', note: 'sessions revoked' }
  ]
})

const filtered = computed(() => {
  const { privileges: privs, statuses: sts, query, posture: p } = filters.value
  const q = query.trim().toLowerCase()

  return accounts.value.filter((a) => {
    if (privs.length && !privs.includes(privilegeOf(a))) return false
    if (sts.length && !sts.includes(a.status)) return false

    if (p === 'full' && privilegeOf(a) !== 'full') return false
    if (p === 'nomfa' && (a.mfa || a.status === 'suspended')) return false
    if (p === 'suspended' && a.status !== 'suspended') return false
    if (p === 'dormant' && !(a.status === 'active' && a.lastActive < staleCutoff())) return false

    if (q) {
      const hay = `${a.name} ${a.email} ${a.department} ${roleById(a.roleId).label}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const roleRows = computed(() => {
  const max = Math.max(1, ...ROLES.map((r) => accounts.value.filter((a) => a.roleId === r.id).length))
  // Matches PrivilegeTag: baseline privilege stays neutral.
  const BAR = {
    critical: 'bg-sev-critical',
    high: 'bg-sev-high/85',
    medium: 'bg-line-strong',
    low: 'bg-line-strong'
  }
  return ROLES.map((r) => {
    const count = accounts.value.filter((a) => a.roleId === r.id).length
    return {
      ...r,
      count,
      pct: (count / max) * 100,
      bar: BAR[{ full: 'critical', elevated: 'high', operational: 'medium', read: 'low' }[r.privilege]]
    }
  }).sort((a, b) => b.count - a.count)
})

const moduleReach = computed(() => {
  const total = accounts.value.length || 1
  return MODULES.map((m) => {
    const count = accounts.value.filter((a) => roleById(a.roleId).modules.includes(m.id)).length
    return { ...m, count, pct: (count / total) * 100 }
  }).sort((a, b) => b.count - a.count)
})

const relative = (ts) => {
  if (!ts) return 'pending'
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const toggle = (group, key) => {
  const list = filters.value[group]
  filters.value[group] = list.includes(key) ? list.filter((k) => k !== key) : [...list, key]
}
const togglePrivilege = (k) => toggle('privileges', k)
const toggleStatus = (k) => toggle('statuses', k)
const togglePosture = (k) => {
  filters.value.posture = filters.value.posture === k ? null : k
}

const isFiltered = computed(
  () =>
    filters.value.privileges.length > 0 ||
    filters.value.statuses.length > 0 ||
    filters.value.query.trim() !== '' ||
    filters.value.posture !== null
)

const reset = () => {
  filters.value = { privileges: [], statuses: [], query: '', posture: null }
}

const invite = () => toast.add('Invitation sent', 'The new account appears once the invite is accepted.', 'success')

const handleAction = ({ kind, account }) => {
  const target = accounts.value.find((a) => a.id === account.id)
  if (!target) return

  if (kind === 'suspend') {
    target.status = 'suspended'
    toast.add('Account suspended', `${account.email} has been signed out everywhere.`, 'success')
  } else if (kind === 'restore') {
    target.status = 'active'
    toast.add('Account restored', `${account.email} can sign in again.`, 'success')
  } else if (kind === 'enforce-mfa') {
    target.mfa = true
    toast.add('MFA required', `${account.name} must enrol a second factor at next sign-in.`, 'success')
  } else if (kind === 'reset') {
    toast.add('Access reset', `A new sign-in link was sent to ${account.email}.`, 'info')
  } else {
    toast.add('Change role', `Opening role assignment for ${account.name}.`, 'info')
  }
}
</script>
