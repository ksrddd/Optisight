<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Access Control (RBAC)</h1>
        <p class="text-slate-400 mt-1">Manage team roles and centralized platform permissions.</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="toast.add('Add User', 'Invitation link sent to new employee.', 'success')"
          class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center gap-2">
          <UserPlus class="w-4 h-4" />
          Invite User
        </button>
      </div>
    </div>

    <!-- Stats row for RBAC status -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="glass-card p-6 border border-slate-700/50 relative overflow-hidden">
        <h3 class="text-sm font-medium text-slate-400">Total Active Users</h3>
        <p class="text-3xl font-bold text-white mt-1">24</p>
      </div>
      <div class="glass-card p-6 border border-slate-700/50 relative overflow-hidden">
        <h3 class="text-sm font-medium text-slate-400">SOC Analysts</h3>
        <p class="text-3xl font-bold text-indigo-400 mt-1">5</p>
      </div>
      <div class="glass-card p-6 border border-slate-700/50 relative overflow-hidden">
        <h3 class="text-sm font-medium text-slate-400">IT Ops Engineers</h3>
        <p class="text-3xl font-bold text-emerald-400 mt-1">12</p>
      </div>
    </div>

    <!-- Users Table -->
    <div class="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div class="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white">System Users & Permissions</h2>
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search users by name or department..."
            class="pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors w-64" />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-slate-900/40 text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-white/5">
              <th class="px-6 py-4">Employee</th>
              <th class="px-6 py-4">Department (Role)</th>
              <th class="px-6 py-4">Platform Permissions</th>
              <th class="px-6 py-4">Last Login</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="user in users" :key="user.id" class="hover:bg-white/5 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-indigo-300">
                    {{ user.name.charAt(0) }}
                  </div>
                  <div>
                    <span class="font-medium text-slate-200 block">{{ user.name }}</span>
                    <span class="text-xs text-slate-500">{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-medium rounded-full border" :class="getRoleBadgeClass(user.role)">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span v-for="perm in user.permissions" :key="perm"
                    class="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {{ perm }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-400">{{ user.lastLogin }}</td>
              <td class="px-6 py-4 text-right">
                <button @click="toast.add('Edit Capabilities', 'Opening IAM control panel for ' + user.name, 'info')"
                  class="text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Settings2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { UserPlus, Search, Settings2 } from 'lucide-vue-next'
import { ref, inject } from 'vue'

const toast = inject('toast')

const users = ref([
  { id: 1, name: 'Alice Wong', email: 'alice.w@fintech.co', role: 'Global Admin', permissions: ['Full Access', 'Billing'], lastLogin: '2 mins ago' },
  { id: 2, name: 'Bob Smith', email: 'b.smith@fintech.co', role: 'IT Operations', permissions: ['View Dashboard', 'Manage Alerts', 'View Logs'], lastLogin: '1 hr ago' },
  { id: 3, name: 'Charlie Dave', email: 'charlie.d@fintech.co', role: 'SOC Analyst', permissions: ['Security Dashboard', 'Manage Alerts'], lastLogin: '3 hrs ago' },
  { id: 4, name: 'Diana Clark', email: 'd.clark@fintech.co', role: 'Data / Infra', permissions: ['View Logs', 'View Integrations'], lastLogin: '5 mins ago' },
  { id: 5, name: 'Eve Torres', email: 'eve.t@fintech.co', role: 'Executive (Read-only)', permissions: ['View Dashboard', 'Export Reports'], lastLogin: '1 day ago' },
])

const getRoleBadgeClass = (role) => {
  if (role.includes('Admin')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  if (role.includes('SOC')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  if (role.includes('IT')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (role.includes('Infra')) return 'bg-sky-500/10 text-sky-400 border-sky-500/20'
  return 'bg-slate-800 text-slate-300 border-slate-700'
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
