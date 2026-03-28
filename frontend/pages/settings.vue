<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">System Settings</h1>
        <p class="text-slate-400 mt-1">Configure monitoring thresholds and notification preferences.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Tabs -->
      <div class="lg:col-span-1 space-y-2">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="activeTab === tab.id ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 border border-transparent'"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.name }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="lg:col-span-3">
        <div class="glass-card p-8 border border-slate-700/50 h-full flex flex-col">
          
          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'" class="space-y-8 animate-fade-in">
            <div>
              <h2 class="text-xl font-semibold text-white mb-2">User Profile</h2>
              <p class="text-sm text-slate-400">Personalize your identity across the monitoring network.</p>
            </div>

            <div class="flex flex-col md:flex-row gap-10 items-start">
              <!-- Avatar Selector -->
              <div class="space-y-4">
                <label class="text-sm font-medium text-slate-300">Profile Image</label>
                <div class="relative group">
                  <div class="w-32 h-32 rounded-3xl bg-slate-800 border-2 border-indigo-500/30 overflow-hidden shadow-2xl">
                    <img :src="profileForm.avatar" alt="Avatar" class="w-full h-full object-cover">
                  </div>
                </div>
                <div class="grid grid-cols-4 gap-2">
                  <button 
                    v-for="s in seeds" :key="s"
                    @click="profileForm.avatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${s}`"
                    class="w-8 h-8 rounded-lg overflow-hidden border-2 transition-all"
                    :class="profileForm.avatar.includes(s) ? 'border-indigo-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'"
                  >
                    <img :src="`https://api.dicebear.com/9.x/notionists/svg?seed=${s}`" class="w-full h-full object-cover">
                  </button>
                </div>
              </div>

              <!-- Profile Form -->
              <div class="flex-1 space-y-6 w-full">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-medium text-slate-500 uppercase ml-1">Full Name</label>
                    <input 
                      v-model="profileForm.name"
                      type="text" 
                      class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                    >
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-medium text-slate-500 uppercase ml-1">Job Role</label>
                    <input 
                      v-model="profileForm.role"
                      type="text" 
                      class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                    >
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-medium text-slate-500 uppercase ml-1">Email Address</label>
                  <input 
                    v-model="profileForm.email"
                    type="email" 
                    class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- General Monitoring -->
          <div v-if="activeTab === 'general'" class="space-y-8 animate-fade-in">
            <div>
              <h2 class="text-xl font-semibold text-white mb-2">Monitoring Thresholds</h2>
              <p class="text-sm text-slate-400">Define when the system should flag warnings or critical alerts.</p>
            </div>

            <div class="space-y-6">
              <div v-for="setting in thresholdsForm" :key="setting.name" class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-slate-300">{{ setting.name }}</label>
                  <span class="text-xs font-mono text-indigo-400">{{ setting.value }}{{ setting.unit }}</span>
                </div>
                <input 
                  type="range" 
                  v-model="setting.value" 
                  :min="setting.min" 
                  :max="setting.max"
                  class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                >
              </div>
            </div>
          </div>

          <!-- Notification Settings -->
          <div v-if="activeTab === 'notifications'" class="space-y-8 animate-fade-in">
            <div>
              <h2 class="text-xl font-semibold text-white mb-2">Notification Channel</h2>
              <p class="text-sm text-slate-400">Where should we send critical system alerts?</p>
            </div>

            <div class="space-y-4">
              <div v-for="channel in channelsForm" :key="channel.name" 
                @click="channel.enabled = !channel.enabled"
                class="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all"
                :class="channel.enabled ? 'bg-white/5 border-slate-600' : 'bg-transparent border-white/5 opacity-50'"
              >
                <div class="flex items-center gap-3">
                  <component :is="getChannelIcon(channel.name)" class="w-5 h-5" :class="channel.enabled ? 'text-white' : 'text-slate-500'" />
                  <span class="text-sm font-medium text-white">{{ channel.name }}</span>
                </div>
                <div class="w-5 h-5 rounded border border-slate-700 flex items-center justify-center transition-all"
                  :class="channel.enabled ? 'bg-indigo-500 border-indigo-500' : ''">
                  <Check v-if="channel.enabled" class="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>

          <!-- Security Tab -->
          <div v-if="activeTab === 'security'" class="space-y-8">
             <div class="p-12 flex flex-col items-center justify-center text-center opacity-50">
               <Shield class="w-16 h-16 text-slate-600 mb-4" />
               <h3 class="text-lg font-medium text-white">Security Hardware Binding</h3>
               <p class="text-sm text-slate-500 max-w-xs mt-2">Connect a physical FIDO2 key to manage advanced security settings.</p>
               <button class="mt-6 px-6 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium cursor-not-allowed">Scan for Devices</button>
             </div>
          </div>

          <div class="mt-auto pt-10 flex justify-end gap-3">
            <button 
              @click="resetForm"
              class="px-6 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Reset
            </button>
            <button 
              @click="saveSettings"
              class="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
            >
              Save Configuration
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Settings, Bell, Shield, User, Activity, Check, Mail, MessageSquare, Globe } from 'lucide-vue-next'
import { ref, inject, reactive, watch } from 'vue'
import { useUser, DEFAULTS } from '~/composables/useUser'

const toast = inject('toast')
const { user, settings, updateProfile, updateSettings } = useUser()

const activeTab = ref('profile')
const seeds = ['Admin', 'Sasha', 'Felix', 'Luna', 'Neo', 'Vesper', 'Aria', 'Kael']

// Initialize forms from global state
const profileForm = reactive({ ...user.value })
const thresholdsForm = ref(JSON.parse(JSON.stringify(settings.value.thresholds)))
const channelsForm = ref(JSON.parse(JSON.stringify(settings.value.notifications)))

const tabs = [
  { id: 'profile', name: 'User Profile', icon: User },
  { id: 'general', name: 'General', icon: Settings },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security', icon: Shield },
]

const getChannelIcon = (name) => {
  if (name.includes('Email')) return Mail
  if (name.includes('Slack')) return MessageSquare
  return Globe
}

const resetForm = () => {
  if (activeTab.value === 'profile') {
    Object.assign(profileForm, DEFAULTS.user)
  } else if (activeTab.value === 'general') {
    thresholdsForm.value = JSON.parse(JSON.stringify(DEFAULTS.settings.thresholds))
  } else if (activeTab.value === 'notifications') {
    channelsForm.value = JSON.parse(JSON.stringify(DEFAULTS.settings.notifications))
  }
  
  toast.add('Factory Defaults Restored', 'Original system settings have been loaded into the form.', 'info')
}

const saveSettings = () => {
  if (activeTab.value === 'profile') {
    updateProfile(profileForm)
    toast.add('Profile Updated', 'Your profile changes have been applied.', 'success')
  } else if (activeTab.value === 'general') {
    updateSettings({ thresholds: JSON.parse(JSON.stringify(thresholdsForm.value)) })
    toast.add('Thresholds Updated', 'System monitoring thresholds have been saved.', 'success')
  } else if (activeTab.value === 'notifications') {
    updateSettings({ notifications: JSON.parse(JSON.stringify(channelsForm.value)) })
    toast.add('Notifications Updated', 'Your communication preferences has been saved.', 'success')
  }
}

// Watch global state for changes (though mostly updated from here)
watch(user, (val) => Object.assign(profileForm, val), { deep: true })
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
