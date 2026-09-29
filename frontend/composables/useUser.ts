export const DEFAULTS = {
  user: {
    id: '',
    name: 'Guest User',
    email: '',
    role: 'guest',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Guest'
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
    ]
  }
}

export const useUser = () => {
  const config = useRuntimeConfig()
  const user = useState('user-profile', () => ({ ...DEFAULTS.user }))
  const settings = useState('system-settings', () => JSON.parse(JSON.stringify(DEFAULTS.settings)))
  // Single owner of token storage. Pages must not read or write the token
  // directly — the login page previously wrote localStorage while this read a
  // cookie, so sessions never established (FN-01).
  // NOTE: this cookie is client-readable. SEC-SESSION-002 tracks moving the
  // session to a server-set HttpOnly cookie; until then, keep SameSite=strict
  // and mark Secure outside dev so it is not sent over plaintext.
  const token = useCookie('optisight_token', {
    maxAge: 60 * 60 * 24,
    sameSite: 'strict',
    secure: !import.meta.dev
  })
  const status = useState('auth-status', () => !!token.value)

  const login = (newToken: string, userData: any) => {
    token.value = newToken
    user.value = { 
      ...userData, 
      avatar: userData.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${userData.name}`
    }
    status.value = true
  }

  const logout = async () => {
    // Record the logout server-side (writes the LOGOUT audit row) before
    // clearing local state. Best-effort: local sign-out proceeds regardless of
    // the network result so a user is never stuck signed in (FN-06).
    if (token.value) {
      try {
        await $fetch(`${config.public.apiBase}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token.value}` }
        })
      } catch {
        /* proceed with local sign-out even if the call fails */
      }
    }
    token.value = null
    user.value = { ...DEFAULTS.user }
    status.value = false
    navigateTo('/login')
  }

  const fetchMe = async () => {
    if (!token.value) return
    
    try {
      const data: any = await $fetch(`${config.public.apiBase}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      if (data?.user) {
        user.value = {
          ...data.user,
          avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${data.user.name}`
        }
        status.value = true
      }
    } catch (err) {
      console.error('Session restoration failed', err)
      logout()
    }
  }

  const updateProfile = (newData: any) => {
    user.value = { ...user.value, ...newData }
  }

  const updateSettings = (newSettings: any) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  return {
    user,
    settings,
    token,
    status,
    login,
    logout,
    fetchMe,
    updateProfile,
    updateSettings
  }
}
