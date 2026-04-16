<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
    <!-- Ambient Background -->
    <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
      <div class="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-md relative z-10 animate-fade-in">
      <div class="flex flex-col items-center mb-10">
        <img src="/logo.png" alt="OptiSight" class="h-16 w-16 object-contain mb-4" />
        <h1 class="text-3xl font-bold text-sky-400 tracking-tight">Access Request</h1>
        <p class="text-slate-400 mt-2 text-center">Initialize your profile to begin system monitoring.</p>
      </div>

      <!-- Register Card -->
      <div class="glass-card p-10 border border-white/10 shadow-3xl">
        <!-- Error Message -->
        <div v-if="errorMsg"
          class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm">
          <AlertCircle class="w-5 h-5 mt-0.5 shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-300 ml-1">First Name</label>
              <input type="text" v-model="firstName" required placeholder="John"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all">
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-300 ml-1">Last Name</label>
              <input type="text" v-model="lastName" required placeholder="Doe"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all">
            </div>
          </div>

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
              <ShieldCheck class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input :type="showPassword ? 'text' : 'password'" v-model="password" required
                placeholder="Min. 8 characters"
                class="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all">
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
            <!-- Password Strength -->
            <div v-if="password" class="flex gap-1 mt-2">
              <div v-for="i in 4" :key="i"
                :class="['h-1 flex-1 rounded-full transition-all duration-300', i <= passwordStrength ? strengthColor : 'bg-slate-700']">
              </div>
            </div>
            <p v-if="password" class="text-xs ml-1" :class="strengthTextColor">{{ strengthLabel }}</p>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-400 px-1">
            <input type="checkbox" required class="accent-indigo-500 rounded">
            <span>I agree to the <a href="#" class="text-indigo-400">Security Protocols</a> and Data Privacy
              policy.</span>
          </div>

          <button type="submit" :disabled="loading"
            class="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group">
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
            <span>{{ loading ? 'Creating Profile...' : 'Create Secure Profile' }}</span>
            <ChevronRight v-if="!loading" class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-slate-500">
          Already have clearance?
          <NuxtLink to="/login" class="text-indigo-400 hover:text-indigo-300 font-semibold">Identify here</NuxtLink>
        </p>
      </div>

      <!-- Footer -->
      <div class="mt-12 text-center text-xs text-slate-600 uppercase tracking-widest font-medium opacity-50">
        Biometric encryption enabled
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Activity, Mail, ShieldCheck, Loader2, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'
import { ref, computed, inject } from 'vue'
import { useUser } from '~/composables/useUser'

definePageMeta({
  layout: false
})

const toast = inject('toast') as any
const router = useRouter()
const config = useRuntimeConfig()
const { updateProfile } = useUser()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

// ─── Password strength calculation ───────────────────────────────────────────
const passwordStrength = computed(() => {
  const p = password.value
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const strengthColor = computed(() => {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  return colors[passwordStrength.value - 1] || 'bg-red-500'
})

const strengthTextColor = computed(() => {
  const colors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400']
  return colors[passwordStrength.value - 1] || 'text-red-400'
})

const strengthLabel = computed(() => {
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  return labels[passwordStrength.value - 1] || 'Weak'
})

// ─── Handle Registration ──────────────────────────────────────────────────────
const handleRegister = async () => {
  errorMsg.value = ''
  loading.value = true

  try {
    const response = await $fetch<{ token: string; user: any }>(
      `${config.public.apiBase}/api/auth/register`,
      {
        method: 'POST',
        body: {
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value,
          password: password.value,
        },
      }
    )

    // Store token in cookie (SSR-safe)
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

    toast?.add('Account Created!', `Welcome to Optisight, ${response.user.name}.`, 'success')
    router.push('/')
  } catch (err: any) {
    errorMsg.value = err.data?.error || 'Registration failed. Please try again.'
    toast?.add('Registration Failed', errorMsg.value, 'error')
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
