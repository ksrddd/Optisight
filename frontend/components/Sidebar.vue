<template>
  <!-- Mobile scrim -->
  <div
    v-if="navOpen"
    class="fixed inset-0 z-40 bg-black/70 md:hidden"
    aria-hidden="true"
    @click="navOpen = false"
  />

  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-sidebar shrink-0 flex-col border-r border-line bg-surface-raised
           transition-transform duration-150 ease-out
           md:static md:z-auto md:translate-x-0"
    :class="navOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Identity -->
    <div class="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
      <img src="/logo.png" alt="" class="h-5 w-5 shrink-0 object-contain" />
      <span class="text-md font-semibold tracking-[-0.01em] text-ink-primary">OptiSight</span>
      <button
        class="-mr-1 ml-auto p-1 text-ink-muted hover:text-ink-primary md:hidden"
        aria-label="Close navigation"
        @click="navOpen = false"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
      <div v-for="group in navGroups" :key="group.label" class="mb-4 last:mb-0">
        <h2 class="px-2 pb-1.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {{ group.label }}
        </h2>

        <ul class="space-y-px">
          <li v-for="item in group.items" :key="item.path">
            <NuxtLink
              :to="item.path"
              class="group flex h-[26px] items-center gap-2 rounded px-2 text-sm transition-colors duration-fast ease-out
                     hover:bg-surface-hover hover:text-ink-primary"
              :class="
                route.path === item.path
                  ? 'bg-surface-hover font-medium text-ink-primary'
                  : 'text-ink-secondary'
              "
              :aria-current="route.path === item.path ? 'page' : undefined"
              @click="navOpen = false"
            >
              <component
                :is="item.icon"
                class="h-3.5 w-3.5 shrink-0 transition-colors duration-fast"
                :class="route.path === item.path ? 'text-ink-primary' : 'text-ink-faint group-hover:text-ink-secondary'"
                aria-hidden="true"
              />
              <span class="truncate">{{ item.name }}</span>

              <!-- Live queue depth. Numerals are monospace so the column of
                   counts stays comparable at a glance. -->
              <span
                v-if="item.count"
                class="ml-auto shrink-0 font-mono text-2xs tabular-nums"
                :class="item.urgent ? 'text-sev-critical' : 'text-ink-faint'"
              >
                {{ item.count }}
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Operator -->
    <div class="shrink-0 border-t border-line p-2">
      <NuxtLink
        to="/settings"
        class="group flex items-center gap-2 rounded px-2 py-1.5 transition-colors duration-fast ease-out hover:bg-surface-hover"
      >
        <img
          :src="user.avatar"
          alt=""
          class="h-6 w-6 shrink-0 rounded-full border border-line object-cover"
        />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-xs font-medium text-ink-primary">{{ user.name }}</span>
          <span class="truncate text-2xs tracking-normal text-ink-muted">SOC Analyst · Tier 2</span>
        </span>
        <ChevronRight
          class="h-3.5 w-3.5 shrink-0 text-ink-faint transition-colors duration-fast group-hover:text-ink-secondary"
          aria-hidden="true"
        />
      </NuxtLink>

      <button
        class="mt-1 flex h-6 w-full items-center gap-2 rounded px-2 text-xs text-ink-muted
               transition-colors duration-fast ease-out hover:bg-surface-hover hover:text-ink-primary"
        @click="handleLogout"
      >
        <LogOut class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        End session
      </button>
    </div>
  </aside>
</template>

<script setup>
import {
  LayoutDashboard,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  CreditCard,
  Shield,
  Database,
  Users,
  Network,
  X
} from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { user, logout } = useUser()
const navOpen = useState('nav-open', () => false)

const handleLogout = () => logout()

// Live queue depth, published by the SOC page. Left blank rather than guessed
// when no feed has loaded — a stale badge is worse than no badge.
const openCritical = useState('soc-open-critical', () => 0)

const navGroups = computed(() => [
  {
    label: 'Operations',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Data Sources', path: '/integrations', icon: Network },
      { name: 'Alert Center', path: '/alerts', icon: Bell }
    ]
  },
  {
    label: 'Security',
    items: [
      {
        name: 'Security (SOC)',
        path: '/security',
        icon: Shield,
        count: openCritical.value || null,
        urgent: openCritical.value > 0
      },
      { name: 'System Logs', path: '/logs', icon: Database }
    ]
  },
  {
    label: 'Administration',
    items: [
      { name: 'Access Control', path: '/users', icon: Users },
      { name: 'Subscription', path: '/subscription', icon: CreditCard },
      { name: 'Settings', path: '/settings', icon: Settings }
    ]
  }
])
</script>
