<template>
  <SlideOver ref="shell" :label="`Account ${account.name}`" width="480px" @close="emit('close')">
    <!-- Identity -->
    <header class="shrink-0 border-b border-line px-3 py-2.5">
      <div class="flex items-start gap-2.5">
        <span
          class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-panel text-sm font-semibold text-ink-secondary"
          aria-hidden="true"
        >{{ initials }}</span>

        <div class="min-w-0 flex-1">
          <h2 class="truncate text-lg font-semibold tracking-[-0.02em] text-ink-primary">{{ account.name }}</h2>
          <p class="truncate font-mono text-xs text-ink-muted">{{ account.email }}</p>
        </div>

        <button class="btn h-7 w-7 shrink-0 px-0" aria-label="Close account" @click="requestClose">
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <PrivilegeTag :privilege="role.privilege" />
        <span class="text-xs text-ink-secondary">{{ role.label }}</span>
        <span class="h-3 w-px bg-line" aria-hidden="true" />
        <span class="text-xs text-ink-muted">{{ account.department }}</span>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <!-- Security posture. Sits above permissions because an account without
           MFA is a finding regardless of what it can reach. -->
      <section class="border-b border-line px-3 py-2.5">
        <h3 class="panel-title mb-2">Account security</h3>

        <div
          class="flex items-center gap-2 rounded border px-2 py-1.5"
          :class="account.mfa ? 'border-line bg-surface-panel' : 'border-sev-critical/40 bg-sev-critical/[0.07]'"
        >
          <component
            :is="account.mfa ? ShieldCheck : ShieldAlert"
            class="h-4 w-4 shrink-0"
            :class="account.mfa ? 'text-ink-muted' : 'text-sev-critical'"
            aria-hidden="true"
          />
          <p class="min-w-0 flex-1 text-xs" :class="account.mfa ? 'text-ink-secondary' : 'text-sev-critical'">
            {{ account.mfa ? 'Multi-factor authentication enabled' : 'No multi-factor authentication' }}
          </p>
          <button v-if="!account.mfa" class="btn h-6 shrink-0" @click="act('enforce-mfa')">Require MFA</button>
        </div>

        <dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
          <div v-for="f in facts" :key="f.label" class="min-w-0">
            <dt class="field-label">{{ f.label }}</dt>
            <dd class="truncate font-mono text-xs tabular-nums text-ink-primary">{{ f.value }}</dd>
          </div>
        </dl>
      </section>

      <!-- Module permissions -->
      <section class="px-3 py-2.5">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="panel-title">Module access</h3>
          <span class="font-mono text-2xs text-ink-faint">{{ role.modules.length }} / {{ MODULES.length }}</span>
        </div>

        <p class="mb-2 text-xs text-ink-muted">{{ role.description }}</p>

        <ul class="overflow-hidden rounded border border-line">
          <li
            v-for="m in moduleRows"
            :key="m.id"
            class="flex h-8 items-center gap-2 border-b border-line-faint px-2 last:border-b-0"
            :class="m.allowed ? '' : 'bg-surface-base'"
          >
            <component
              :is="m.allowed ? Check : Minus"
              class="h-3.5 w-3.5 shrink-0"
              :class="m.allowed ? 'text-ink-primary' : 'text-ink-faint'"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1 truncate text-xs" :class="m.allowed ? 'text-ink-secondary' : 'text-ink-faint'">
              {{ m.label }}
            </span>
            <span class="shrink-0 font-mono text-2xs" :class="m.allowed ? 'text-ink-muted' : 'text-ink-faint'">
              {{ m.allowed ? 'granted' : 'denied' }}
            </span>
          </li>
        </ul>

        <p class="mt-1.5 text-2xs text-ink-muted">
          Access is granted by role. Changing what this person can reach means changing their role.
        </p>
      </section>
    </div>

    <!-- Actions -->
    <footer class="shrink-0 border-t border-line bg-surface-panel px-3 py-2.5">
      <div class="flex items-center gap-2">
        <button class="btn flex-1" @click="act('change-role')">
          <UserCog class="h-3.5 w-3.5" aria-hidden="true" />
          Change role
        </button>
        <button class="btn flex-1" @click="act('reset')">
          <KeyRound class="h-3.5 w-3.5" aria-hidden="true" />
          Reset access
        </button>
        <button
          class="btn flex-1"
          :class="account.status === 'suspended' ? '' : 'btn-danger'"
          @click="act(account.status === 'suspended' ? 'restore' : 'suspend')"
        >
          <component :is="account.status === 'suspended' ? RotateCcw : Ban" class="h-3.5 w-3.5" aria-hidden="true" />
          {{ account.status === 'suspended' ? 'Restore' : 'Suspend' }}
        </button>
      </div>
      <p class="mt-1.5 text-2xs text-ink-muted">
        Suspending ends every active session for
        <span class="font-mono text-ink-secondary">{{ account.email }}</span> immediately.
      </p>
    </footer>
  </SlideOver>
</template>

<script setup>
import { computed, ref } from 'vue'
import { X, Check, Minus, ShieldCheck, ShieldAlert, UserCog, KeyRound, Ban, RotateCcw } from 'lucide-vue-next'
import SlideOver from '~/components/ui/SlideOver.vue'
import PrivilegeTag from './PrivilegeTag.vue'
import { MODULES, roleById } from '~/services/access/directory'

const props = defineProps({
  account: { type: Object, required: true }
})

const emit = defineEmits(['close', 'action'])

const shell = ref(null)
const requestClose = () => shell.value?.requestClose()

const role = computed(() => roleById(props.account.roleId))

const initials = computed(() =>
  props.account.name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
)

const fmt = (ts) => (ts ? new Date(ts).toISOString().replace('T', ' ').slice(0, 16) + 'Z' : 'never')

const facts = computed(() => [
  { label: 'Account ID', value: props.account.id },
  { label: 'Status', value: props.account.status },
  { label: 'Last active', value: fmt(props.account.lastActive) },
  { label: 'Created', value: fmt(props.account.createdAt).slice(0, 10) }
])

const moduleRows = computed(() =>
  MODULES.map((m) => ({ ...m, allowed: role.value.modules.includes(m.id) }))
)

const act = (kind) => {
  emit('action', { kind, account: props.account })
  requestClose()
}
</script>
