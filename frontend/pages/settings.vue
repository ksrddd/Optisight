<template>
  <div class="flex h-full min-h-0 flex-col bg-surface-base">
    <!-- Page head -->
    <div class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
      <div class="min-w-0">
        <h1 class="truncate text-lg font-semibold tracking-[-0.02em] text-ink-primary">Settings</h1>
        <p class="truncate text-xs text-ink-muted">Profile, detection thresholds and delivery channels</p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <span v-if="dirty" class="hidden items-center gap-1.5 sm:flex">
          <span class="h-1.5 w-1.5 rounded-full bg-sev-high" aria-hidden="true" />
          <span class="text-xs text-sev-high">Unsaved changes</span>
        </span>
        <button class="btn" @click="resetForm">Reset section</button>
        <button class="btn btn-primary" :disabled="!dirty" @click="saveSettings">Save changes</button>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col md:flex-row">
      <!-- Section nav -->
      <nav
        class="flex shrink-0 gap-px overflow-x-auto border-b border-line bg-surface-raised p-2
               md:w-[196px] md:flex-col md:overflow-y-auto md:border-b-0 md:border-r"
        aria-label="Settings sections"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="flex h-[26px] shrink-0 items-center gap-2 whitespace-nowrap rounded px-2 text-sm
                 transition-colors duration-fast ease-out hover:bg-surface-hover hover:text-ink-primary"
          :class="activeTab === tab.id ? 'bg-surface-hover font-medium text-ink-primary' : 'text-ink-secondary'"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
          @click="activeTab = tab.id"
        >
          <component
            :is="tab.icon"
            class="h-3.5 w-3.5 shrink-0"
            :class="activeTab === tab.id ? 'text-ink-primary' : 'text-ink-faint'"
            aria-hidden="true"
          />
          {{ tab.name }}
        </button>
      </nav>

      <!-- Section content -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <!-- Left-aligned against the section nav. A centred column would float
             the form in dead space on a wide operations monitor. -->
        <div class="max-w-[720px] px-4 py-4">
          <!-- Profile ---------------------------------------------------- -->
          <section v-if="activeTab === 'profile'">
            <h2 class="text-md font-semibold text-ink-primary">User profile</h2>
            <p class="mt-0.5 text-xs text-ink-muted">
              How you appear to the rest of the operations team.
            </p>

            <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
              <div>
                <span class="field-label">Avatar</span>
                <img
                  :src="profileForm.avatar"
                  alt=""
                  class="mt-1.5 h-16 w-16 rounded border border-line bg-surface-panel object-cover"
                />
                <div class="mt-1.5 grid w-[88px] grid-cols-4 gap-1">
                  <button
                    v-for="s in seeds"
                    :key="s"
                    class="aspect-square overflow-hidden rounded-[3px] border transition-colors duration-fast"
                    :class="profileForm.avatar.includes(s) ? 'border-ink-primary' : 'border-line hover:border-line-strong'"
                    :aria-label="`Use avatar ${s}`"
                    :aria-pressed="profileForm.avatar.includes(s)"
                    @click="profileForm.avatar = avatarFor(s)"
                  >
                    <img :src="avatarFor(s)" alt="" class="h-full w-full object-cover" />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label class="block">
                  <span class="field-label">Full name</span>
                  <input v-model="profileForm.name" type="text" class="input mt-1" />
                </label>
                <label class="block">
                  <span class="field-label">Job role</span>
                  <input v-model="profileForm.role" type="text" class="input mt-1" />
                </label>
                <label class="block sm:col-span-2">
                  <span class="field-label">Email address</span>
                  <input v-model="profileForm.email" type="email" class="input mt-1 font-mono" />
                </label>
              </div>
            </div>
          </section>

          <!-- Thresholds ------------------------------------------------- -->
          <section v-else-if="activeTab === 'general'">
            <h2 class="text-md font-semibold text-ink-primary">Detection thresholds</h2>
            <p class="mt-0.5 text-xs text-ink-muted">
              The point at which a reading stops being normal and becomes an alert.
            </p>

            <ul class="mt-4 overflow-hidden rounded border border-line">
              <li
                v-for="setting in thresholdsForm"
                :key="setting.name"
                class="border-b border-line-faint px-3 py-2.5 last:border-b-0"
              >
                <div class="flex items-baseline justify-between gap-3">
                  <label :for="fieldId(setting.name)" class="truncate text-sm text-ink-secondary">
                    {{ setting.name }}
                  </label>
                  <span class="shrink-0 font-mono text-sm tabular-nums text-ink-primary">
                    {{ setting.value }}<span class="text-ink-muted">{{ setting.unit }}</span>
                  </span>
                </div>

                <input
                  :id="fieldId(setting.name)"
                  v-model.number="setting.value"
                  type="range"
                  :min="setting.min"
                  :max="setting.max"
                  class="range mt-2"
                />

                <div class="mt-1 flex justify-between font-mono text-2xs tabular-nums text-ink-faint">
                  <span>{{ setting.min }}{{ setting.unit }}</span>
                  <span>{{ setting.max }}{{ setting.unit }}</span>
                </div>
              </li>
            </ul>
          </section>

          <!-- Notifications ---------------------------------------------- -->
          <section v-else-if="activeTab === 'notifications'">
            <h2 class="text-md font-semibold text-ink-primary">Delivery channels</h2>
            <p class="mt-0.5 text-xs text-ink-muted">
              Where critical alerts are sent. Disabling every channel silences paging entirely.
            </p>

            <ul class="mt-4 overflow-hidden rounded border border-line">
              <li
                v-for="channel in channelsForm"
                :key="channel.name"
                class="flex items-center gap-3 border-b border-line-faint px-3 py-2.5 last:border-b-0"
              >
                <component
                  :is="channelIcon(channel.name)"
                  class="h-4 w-4 shrink-0"
                  :class="channel.enabled ? 'text-ink-secondary' : 'text-ink-faint'"
                  aria-hidden="true"
                />
                <span class="min-w-0 flex-1 truncate text-sm" :class="channel.enabled ? 'text-ink-primary' : 'text-ink-muted'">
                  {{ channel.name }}
                </span>

                <!-- A real switch: reports its state to assistive tech and is
                     reachable by keyboard, unlike the previous clickable div. -->
                <button
                  type="button"
                  role="switch"
                  :aria-checked="channel.enabled"
                  :aria-label="channel.name"
                  class="relative h-4 w-7 shrink-0 rounded-full border transition-colors duration-fast"
                  :class="channel.enabled ? 'border-ink-primary bg-ink-primary' : 'border-line-strong bg-surface-input'"
                  @click="channel.enabled = !channel.enabled"
                >
                  <span
                    class="absolute top-[1px] h-[12px] w-[12px] rounded-full transition-all duration-fast"
                    :class="channel.enabled ? 'left-[13px] bg-surface-base' : 'left-[1px] bg-ink-faint'"
                  />
                </button>
              </li>
            </ul>

            <p v-if="allChannelsOff" class="mt-2 flex items-start gap-2 text-xs text-sev-high">
              <AlertTriangle class="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Every channel is off. Critical alerts will appear in the console only, with no one paged.
            </p>
          </section>

          <!-- Security --------------------------------------------------- -->
          <section v-else>
            <h2 class="text-md font-semibold text-ink-primary">Hardware security key</h2>
            <p class="mt-0.5 text-xs text-ink-muted">
              Bind a FIDO2 authenticator to require physical presence for privileged actions.
            </p>

            <div class="mt-4 rounded border border-line bg-surface-raised px-4 py-6 text-center">
              <Shield class="mx-auto h-5 w-5 text-ink-faint" aria-hidden="true" />
              <p class="mt-2 text-sm font-medium text-ink-primary">No security key registered</p>
              <p class="mx-auto mt-1 max-w-[340px] text-xs text-ink-muted">
                Insert a FIDO2 key and start a scan. Until one is bound, privileged actions rely on your
                password and second factor alone.
              </p>
              <button class="btn mx-auto mt-3" @click="scan">
                <Usb class="h-3.5 w-3.5" aria-hidden="true" />
                Scan for devices
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Settings, Bell, Shield, User, Mail, MessageSquare, Globe, AlertTriangle, Usb } from 'lucide-vue-next'
import { ref, inject, reactive, computed, watch } from 'vue'
import { useUser, DEFAULTS } from '~/composables/useUser'

definePageMeta({ dense: true })
useHead({ title: 'Settings | OptiSight' })

const toast = inject('toast', { add: () => {} })
const { user, settings, updateProfile, updateSettings } = useUser()

const activeTab = ref('profile')
const seeds = ['Admin', 'Sasha', 'Felix', 'Luna', 'Neo', 'Vesper', 'Aria', 'Kael']

const avatarFor = (seed) => `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`

// Forms are working copies; global state only changes on save.
const profileForm = reactive({ ...user.value })
const thresholdsForm = ref(JSON.parse(JSON.stringify(settings.value.thresholds)))
const channelsForm = ref(JSON.parse(JSON.stringify(settings.value.notifications)))

const tabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'general', name: 'Thresholds', icon: Settings },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security key', icon: Shield }
]

const fieldId = (name) => `set-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

const channelIcon = (name) => {
  if (name.includes('Email')) return Mail
  if (name.includes('Slack')) return MessageSquare
  return Globe
}

const allChannelsOff = computed(() => channelsForm.value.every((c) => !c.enabled))

/** Whether the visible section differs from saved state — drives the save button. */
const dirty = computed(() => {
  if (activeTab.value === 'profile') {
    return ['name', 'role', 'email', 'avatar'].some((k) => profileForm[k] !== user.value[k])
  }
  if (activeTab.value === 'general') {
    return JSON.stringify(thresholdsForm.value) !== JSON.stringify(settings.value.thresholds)
  }
  if (activeTab.value === 'notifications') {
    return JSON.stringify(channelsForm.value) !== JSON.stringify(settings.value.notifications)
  }
  return false
})

const resetForm = () => {
  if (activeTab.value === 'profile') {
    Object.assign(profileForm, DEFAULTS.user)
  } else if (activeTab.value === 'general') {
    thresholdsForm.value = JSON.parse(JSON.stringify(DEFAULTS.settings.thresholds))
  } else if (activeTab.value === 'notifications') {
    channelsForm.value = JSON.parse(JSON.stringify(DEFAULTS.settings.notifications))
  } else {
    return
  }

  toast.add('Defaults restored', 'Original values loaded into the form. Save to apply them.', 'info')
}

const saveSettings = () => {
  if (activeTab.value === 'profile') {
    updateProfile({ ...profileForm })
    toast.add('Profile saved', 'Your details are visible to the rest of the team.', 'success')
  } else if (activeTab.value === 'general') {
    updateSettings({ thresholds: JSON.parse(JSON.stringify(thresholdsForm.value)) })
    toast.add('Thresholds saved', 'Detection rules now use the new limits.', 'success')
  } else if (activeTab.value === 'notifications') {
    updateSettings({ notifications: JSON.parse(JSON.stringify(channelsForm.value)) })
    toast.add('Channels saved', 'Alert delivery preferences updated.', 'success')
  }
}

const scan = () => toast.add('Scanning', 'Insert and touch your security key to continue.', 'info')

watch(user, (val) => Object.assign(profileForm, val), { deep: true })
</script>
