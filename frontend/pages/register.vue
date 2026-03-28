<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
    <!-- Ambient Background -->
    <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
      <div class="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-md relative z-10 animate-fade-in">
      <!-- Logo -->
      <div class="flex flex-col items-center mb-10">
        <div
          class="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-4">
          <Activity class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Access Request</h1>
        <p class="text-slate-400 mt-2 text-center">Initialize your profile to begin system monitoring.</p>
      </div>

      <!-- Register Card -->
      <div class="glass-card p-10 border border-white/10 shadow-3xl">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-300 ml-1">First Name</label>
              <input type="text" required placeholder="John"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all">
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-300 ml-1">Last Name</label>
              <input type="text" required placeholder="Doe"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all">
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-300 ml-1">Work Email</label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="email" required placeholder="name@company.com"
                class="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all">
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-300 ml-1">Secret Key</label>
            <div class="relative">
              <ShieldCheck class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="password" required placeholder="••••••••"
                class="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all">
            </div>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-400 px-1">
            <input type="checkbox" required class="accent-indigo-500 rounded">
            <span>I agree to the <a href="#" class="text-indigo-400">Security Protocols</a> and Data Privacy
              policy.</span>
          </div>

          <button type="submit" :disabled="loading"
            class="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
            <span>Create Secure Profile</span>
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

<script setup>
import { Activity, Mail, ShieldCheck, Loader2 } from 'lucide-vue-next'
import { ref, inject } from 'vue'

definePageMeta({
  layout: false
})

const toast = inject('toast')
const router = useRouter()
const loading = ref(false)

const handleRegister = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    toast.add('Profile Created', 'Request pending administrator approval.', 'info')
    router.push('/login')
  }, 2000)
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
