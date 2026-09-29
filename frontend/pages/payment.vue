<script setup lang="ts">
// The standalone payment route was an unstyled stub and no processor is
// integrated (FN-05). Billing lives on /subscription, so this route now simply
// forwards there rather than presenting an abandoned page.
definePageMeta({ layout: false })
await navigateTo('/subscription', { redirectCode: 301, replace: true })
</script>

<template>
  <div />
</template>
