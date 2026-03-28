<template>
  <aside
    class="w-64 glass-dark hidden md:flex flex-col m-4 rounded-3xl overflow-hidden relative border border-slate-700/50 shadow-2xl">
    <!-- Logo area -->
    <div class="h-20 flex items-center px-8 border-b border-white/5 relative z-10">
      <div class="flex items-center gap-3">
        <div
          class="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Activity class="w-5 h-5 text-white" />
        </div>
        <span
          class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Optisight</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-2 relative z-10 overflow-y-auto">
      <NuxtLink v-for="item in navItems" :key="item.name" :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-white/5"
        active-class="bg-indigo-500/10 text-indigo-400 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-indigo-500 before:rounded-r-full">
        <component :is="item.icon" class="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
          :class="{ 'opacity-100 text-indigo-400': $route.path === item.path }" />
        <span class="font-medium text-slate-300 group-hover:text-white transition-colors"
          :class="{ 'text-white font-semibold': $route.path === item.path }">{{ item.name }}</span>
      </NuxtLink>
    </nav>

    <!-- User Profile area -->
    <div class="p-4 border-t border-white/5 relative z-10">
      <NuxtLink 
        to="/settings"
        class="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all group"
      >
        <div class="w-9 h-9 rounded-full bg-slate-700 flex-shrink-0 border-2 border-indigo-500/20 overflow-hidden group-hover:border-indigo-500/50 transition-colors">
          <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover">
        </div>
        <div class="flex flex-col min-w-0 flex-1">
          <span class="text-xs font-semibold text-white truncate">{{ user.name }}</span>
          <span class="text-[10px] text-slate-400 truncate">{{ user.email }}</span>
        </div>
        <ChevronRight class="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
      </NuxtLink>
      
      <button 
        @click="handleLogout"
        class="w-full mt-2 flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all"
      >
        <LogOut class="w-3 h-3" />
        TERMINATE SESSION
      </button>
    </div>

    <!-- Ambient glow effect -->
    <div
      class="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl rounded-full pointer-events-none">
    </div>
  </aside>
</template>

<script setup>
import { LayoutDashboard, Bell, ShieldAlert, Activity, Settings, Database, FileText, LogOut, ChevronRight, CreditCard } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { user } = useUser()

const handleLogout = () => {
  router.push('/login')
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Alert Center', path: '/alerts', icon: Bell },
  { name: 'Security Details', path: '/security', icon: ShieldAlert },
  { name: 'System Logs', path: '/logs', icon: Database },
  { name: 'Export Reports', path: '/reports', icon: FileText },
  { name: 'Subscription', path: '/subscription', icon: CreditCard },
  { name: 'Settings', path: '/settings', icon: Settings },
]
</script>
