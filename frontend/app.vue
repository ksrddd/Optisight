<template>
  <div class="min-h-screen bg-surface-base">
    <!--
      THESIS: The triage queue IS the page. Refuses the dashboard arrangement
      where cards own the viewport and the table is the last section.
      OWN-WORLD: #09090b ground, 1px #27272a rules, radii <=6px, zero blur or
      glow, Inter for UI and JetBrains Mono for machine values. One law: hue
      means severity and nothing else, so focus and selection are neutral.
      STORY: the analyst reads queue pressure in one glance, narrows to what is
      theirs, opens an incident in place, and acts without losing the stream.
      FIRST VIEWPORT: fixed 100vh grid - 216px nav, 48px command bar, 56px page
      head, 4-up KPI strip, then the virtualised feed beside a 320px attack
      surface rail. The primary action sits in the slide-over.
      FORM: enterprise operations console. Brief-pinned world; the concept roll
      is waived under the pinned-direction rule.
      FINISH: unreviewed and undocumented is unfinished; this build ends with
      the finish review, the verdict, and DESIGN.md
    -->
    <NuxtLoadingIndicator color="#fafafa" :height="2" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue'

const { fetchMe } = useUser()
const { updateSimulation: syncSystem } = useSystemState()
const toastRef = ref(null)

let timer = null

onMounted(() => {
  // Session recovery
  fetchMe()

  // Global System Heartbeat (3s)
  timer = setInterval(() => {
    syncSystem()
  }, 3000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// Provide a global way to add toasts
provide('toast', {
  add: (title, message, type) => toastRef.value?.add(title, message, type)
})
</script>
