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
        <h1 class="text-md font-semibold text-ink-primary">Create account</h1>
        <p class="mt-1 text-xs text-ink-muted">New accounts start with analyst access. An administrator can adjust it later.</p>

        <form class="mt-6 space-y-4" novalidate @submit.prevent="handleRegister">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="reg-first" class="field-label">First name</label>
              <input id="reg-first" v-model="firstName" type="text" autocomplete="given-name" required class="input mt-1" />
            </div>
            <div>
              <label for="reg-last" class="field-label">Last name</label>
              <input id="reg-last" v-model="lastName" type="text" autocomplete="family-name" required class="input mt-1" />
            </div>
          </div>

          <div>
            <label for="reg-email" class="field-label">Work email</label>
            <input
              id="reg-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="name@company.com"
              class="input mt-1 font-mono"
            />
          </div>

          <div>
            <label for="reg-password" class="field-label">Password</label>
            <div class="relative mt-1">
              <input
                id="reg-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                placeholder="At least 8 characters"
                class="input pr-9"
                aria-describedby="reg-strength"
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

            <!-- Strength meter. Four neutral→severity segments plus a text label,
                 announced politely so it is not conveyed by colour alone. -->
            <div v-if="password" id="reg-strength" aria-live="polite" class="mt-2">
              <div class="flex gap-1" aria-hidden="true">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-colors duration-fast"
                  :class="i <= passwordStrength ? strengthBar : 'bg-line'"
                />
              </div>
              <p class="mt-1 text-2xs" :class="strengthText">Password strength: {{ strengthLabel }}</p>
            </div>
          </div>

          <div class="flex items-start gap-2">
            <input id="reg-terms" v-model="agreed" type="checkbox" required class="mt-0.5 h-3.5 w-3.5 shrink-0 accent-ink-primary" />
            <label for="reg-terms" class="text-2xs text-ink-muted">
              I agree to the acceptable-use and data-handling policy for this workspace.
            </label>
          </div>

          <p id="reg-error" role="alert" aria-live="polite" class="flex min-h-[16px] items-center gap-1.5 text-xs text-sev-critical">
            <AlertCircle v-if="errorMsg" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{{ errorMsg }}</span>
          </p>

          <button type="submit" class="btn btn-primary h-9 w-full" :disabled="loading">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>{{ loading ? 'Creating account…' : 'Create account' }}</span>
          </button>
        </form>

        <p class="mt-5 text-center text-xs text-ink-muted">
          Already have an account?
          <NuxtLink to="/login" class="text-ink-secondary underline-offset-2 hover:text-ink-primary hover:underline">Sign in</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-vue-next'
import { ref, computed, inject } from 'vue'
import { useUser } from '~/composables/useUser'

definePageMeta({ layout: false })
useHead({ title: 'Create account | OptiSight' })

const toast = inject('toast') as any
const config = useRuntimeConfig()
const { login } = useUser()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const agreed = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const passwordStrength = computed(() => {
  const p = password.value
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

// Neutral until the password is at least fair; severity hues carry the warning
// steps, consistent with the console's one law.
const strengthBar = computed(
  () => (['bg-sev-critical', 'bg-sev-high', 'bg-sev-medium', 'bg-sev-low'][passwordStrength.value - 1] || 'bg-sev-critical')
)
const strengthText = computed(
  () => (['text-sev-critical', 'text-sev-high', 'text-sev-medium', 'text-sev-low'][passwordStrength.value - 1] || 'text-sev-critical')
)
const strengthLabel = computed(() => (['weak', 'fair', 'good', 'strong'][passwordStrength.value - 1] || 'weak'))

const handleRegister = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const response = await $fetch<{ token: string; user: any }>(`${config.public.apiBase}/api/auth/register`, {
      method: 'POST',
      body: {
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        password: password.value
      }
    })

    login(response.token, response.user)
    toast?.add('Account created', `Welcome to OptiSight, ${response.user.name}.`, 'success')
    await navigateTo('/')
  } catch (err: any) {
    errorMsg.value = err.data?.error || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
