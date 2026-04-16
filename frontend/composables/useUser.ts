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
  const token = useCookie('optisight_token')
  const status = useState('auth-status', () => !!token.value)

  const login = (newToken: string, userData: any) => {
    token.value = newToken
    user.value = { 
      ...userData, 
      avatar: userData.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${userData.name}`
    }
    status.value = true
  }

  const logout = () => {
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
