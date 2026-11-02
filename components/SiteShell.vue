<script setup lang="ts">
import SiteFooter from "./SiteFooter.vue";
import SiteHeader from "./SiteHeader.vue";
</script>

<template>
  <div class="page">
    <SiteHeader />
    <slot />
    <SiteFooter />
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  overflow-x: clip;
  background: var(--color-canvas);
  color: var(--color-text);
}
</style>
