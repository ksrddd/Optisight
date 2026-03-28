export const DEFAULTS = {
  user: {
    name: 'System Admin',
    email: 'admin@optisight.corp',
    role: 'Administrator',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Admin'
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
  const user = useState('user-profile', () => ({ ...DEFAULTS.user }))

  const settings = useState('system-settings', () => JSON.parse(JSON.stringify(DEFAULTS.settings)))

  const updateProfile = (newData: any) => {
    user.value = { ...user.value, ...newData }
  }

  const updateSettings = (newSettings: any) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  return {
    user,
    settings,
    updateProfile,
    updateSettings
  }
}
