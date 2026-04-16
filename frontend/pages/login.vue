<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
    <!-- Ambient Background -->
    <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/20 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-md relative z-10 animate-fade-in">
      <!-- Logo -->
      <div class="flex flex-col items-center mb-10">
        <div
          class="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-4">
          <Activity class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Optisight</h1>
        <p class="text-slate-400 mt-2 text-center">Enter your credentials to access the secure monitoring hub.</p>
      </div>

      <!-- Login Card -->
      <div class="glass-card p-10 border border-white/10 shadow-3xl">
        <!-- Error Message -->
        <div v-if="errorMsg"
          class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm">
          <AlertCircle class="w-5 h-5 mt-0.5 shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-300 ml-1">Work Email</label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="email" v-model="email" required placeholder="name@company.com"
                class="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all">
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-300 ml-1">Password</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input :type="showPassword ? 'text' : 'password'" v-model="password" required placeholder="••••••••"
                class="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all">
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs">
            <label class="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors">
              <input type="checkbox" class="accent-indigo-500 rounded">
              Remember machine
            </label>
            <a href="#" class="text-indigo-400 hover:text-indigo-300 font-medium">Forgot password?</a>
          </div>

          <button type="submit" :disabled="loading"
            class="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group">
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
            <span>{{ loading ? 'Authenticating...' : 'Access Dashboard' }}</span>
            <ChevronRight v-if="!loading" class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-slate-500">
          New to the network?
          <NuxtLink to="/register" class="text-indigo-400 hover:text-indigo-300 font-semibold">Request access card
          </NuxtLink>
        </p>
      </div>

      <!-- Footer -->
      <div class="mt-12 text-center text-xs text-slate-600">
        &copy; 2026 Optisight Security Systems. All nodes encrypted.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Activity, Mail, Lock, Loader2, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'
import { ref, inject } from 'vue'
import { useUser } from '~/composables/useUser'

definePageMeta({
  layout: false
})

const toast = inject('toast') as any
const router = useRouter()
const { updateProfile } = useUser()
const config = useRuntimeConfig()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true

  try {
    const response = await $fetch<{ token: string; user: any }>(
      `${config.public.apiBase}/api/auth/login`,
      {
        method: 'POST',
        body: { email: email.value, password: password.value },
      }
    )

    // Store token in SSR-safe cookie (not localStorage)
    const tokenCookie = useCookie('optisight_token', {
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
      secure: false,
    })
    tokenCookie.value = response.token

    updateProfile({
      ...response.user,
      avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${response.user.name}`,
    })

    toast?.add('Authentication Successful', `Welcome back, ${response.user.name}.`, 'success')
    router.push('/')
  } catch (err: any) {
    errorMsg.value = err.data?.error || 'Invalid credentials. Please try again.'
    toast?.add('Authentication Failed', errorMsg.value, 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
