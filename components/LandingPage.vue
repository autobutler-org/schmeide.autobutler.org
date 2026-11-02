<script setup lang="ts">
import CallToAction from "./CallToAction.vue";
import FeatureGrid from "./FeatureGrid.vue";
import HeroSection from "./HeroSection.vue";
import HowItWorks from "./HowItWorks.vue";
import ManifestoSection from "./ManifestoSection.vue";
</script>

<template>
  <div>
    <HeroSection />
    <ManifestoSection />
    <HowItWorks />
    <FeatureGrid />
    <div class="closing">
      <CallToAction />
    </div>
  </div>
</template>

<style scoped>
/* The page's last beat: the pointer to the quickstart. */
.closing {
  width: 100%;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--section-gap) var(--gutter);
  box-sizing: border-box;
}
</style>
