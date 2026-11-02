<script setup lang="ts">
import SiteShell from "./components/SiteShell.vue";

const route = useRoute();

// One canonical per page so search engines index a single URL for each route.
useHead({
  link: [{ rel: "canonical", href: () => `https://schmeide.autobutler.org${route.path}` }],
});
</script>

<template>
  <SiteShell>
    <NuxtPage />
  </SiteShell>
</template>
