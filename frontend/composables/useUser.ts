export const DEFAULTS = {
  user: {
    id: '',
    name: 'System Admin',
    email: 'admin@optisight.corp',
    role: 'admin',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Admin',
  },
  settings: {
    thresholds: [
      { name: 'CPU Critical Level', value: 85, unit: '%', min: 0, max: 100 },
      { name: 'RAM Usage Warning', value: 70, unit: '%', min: 0, max: 100 },
      { name: 'Request Latency Threshold', value: 450, unit: 'ms', min: 0, max: 2000 },
    ],
    notifications: [
      { name: 'Email Notifications (Primary)', enabled: true },
      { name: 'Slack Integration', enabled: true },
      { name: 'System Webhook', enabled: false },
    ],
  },
}

export const useUser = () => {
  const user = useState('user-profile', () => ({ ...DEFAULTS.user }))
  const settings = useState('system-settings', () => JSON.parse(JSON.stringify(DEFAULTS.settings)))

  // ── Token cookie (SSR-safe) ───────────────────────────────────────────────
  const tokenCookie = useCookie<string | null>('optisight_token', {
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    secure: false,
  })

  const isAuthenticated = computed(() => !!tokenCookie.value)

  const getToken = () => tokenCookie.value

  const updateProfile = (newData: Partial<typeof DEFAULTS.user>) => {
    user.value = { ...user.value, ...newData }
  }

  const updateSettings = (newSettings: any) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  // ── Logout: clear cookie and reset state ─────────────────────────────────
  const logout = async () => {
    const config = useRuntimeConfig()
    try {
      await $fetch(`${config.public.apiBase}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenCookie.value}` },
      })
    } catch {
      // Swallow error - still clear session locally
    }
    tokenCookie.value = null
    user.value = { ...DEFAULTS.user }
    await navigateTo('/login')
  }

  return {
    user,
    settings,
    isAuthenticated,
    getToken,
    updateProfile,
    updateSettings,
    logout,
  }
}
