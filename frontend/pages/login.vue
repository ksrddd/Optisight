<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-base px-4 py-10">
    <div class="w-full max-w-[380px]">
      <!-- Identity -->
      <div class="mb-8 flex items-center gap-2.5">
        <img src="/logo.png" alt="" class="h-6 w-6 shrink-0 object-contain" />
        <span class="text-lg font-semibold tracking-[-0.02em] text-ink-primary">OptiSight</span>
        <span class="ml-auto font-mono text-2xs uppercase tracking-[0.08em] text-ink-faint">Security Operations</span>
      </div>

      <div class="panel rounded-lg p-6">
        <h1 class="text-md font-semibold text-ink-primary">Sign in</h1>
        <p class="mt-1 text-xs text-ink-muted">Access the monitoring console with your work account.</p>

        <form class="mt-6 space-y-4" novalidate @submit.prevent="handleLogin">
          <div>
            <label for="login-email" class="field-label">Work email</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="name@company.com"
              class="input mt-1 font-mono"
              :aria-invalid="!!errorMsg"
              aria-describedby="login-error"
            />
          </div>

          <div>
            <div class="flex items-baseline justify-between">
              <label for="login-password" class="field-label">Password</label>
              <NuxtLink to="/register" class="text-2xs text-ink-muted underline-offset-2 hover:text-ink-primary hover:underline">
                Need an account?
              </NuxtLink>
            </div>
            <div class="relative mt-1">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                placeholder="Enter your password"
                class="input pr-9"
                :aria-invalid="!!errorMsg"
                aria-describedby="login-error"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-ink-faint transition-colors hover:text-ink-secondary"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-3.5 w-3.5" aria-hidden="true" />
                <Eye v-else class="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <!-- Error region. Announced politely; carries an icon plus text so it
               does not rely on colour alone. -->
          <p
            id="login-error"
            role="alert"
            aria-live="polite"
            class="flex min-h-[16px] items-center gap-1.5 text-xs text-sev-critical"
          >
            <AlertCircle v-if="errorMsg" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{{ errorMsg }}</span>
          </p>

          <button type="submit" class="btn btn-primary h-9 w-full" :disabled="loading">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>{{ loading ? 'Signing in…' : 'Sign in' }}</span>
          </button>
        </form>
      </div>

      <p class="mt-4 text-center text-2xs text-ink-faint">
        Sessions expire after 24 hours. Contact your administrator if you cannot sign in.
      </p>
    </div>
  </div>
</template>

<script setup>
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-vue-next'
import { ref, inject } from 'vue'
import { useUser } from '~/composables/useUser'

definePageMeta({ layout: false })
useHead({ title: 'Sign in | OptiSight' })

const toast = inject('toast', { add: () => {} })
const route = useRoute()
const { login } = useUser()
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
    const response = await $fetch(`${config.public.apiBase}/api/auth/login`, {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })

    // Establish the session through the composable — the single owner of token
    // storage. The previous code wrote localStorage while the app read a cookie,
    // so login never actually signed the user in (FN-01).
    login(response.token, response.user)
    toast.add('Signed in', `Welcome back, ${response.user.name}.`, 'success')

    const next = typeof route.query.next === 'string' ? route.query.next : '/'
    await navigateTo(next)
  } catch (error) {
    errorMsg.value = error.data?.error || 'Invalid email or password.'
  } finally {
    loading.value = false
  }
}
</script>
