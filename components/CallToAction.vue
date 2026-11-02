<script setup lang="ts">
import ActionButton from "./ActionButton.vue";
import SectionIntro from "./SectionIntro.vue";
import { callToAction } from "~/data/copy";
</script>

<template>
  <section class="cta">
    <SectionIntro
      :eyebrow="callToAction.eyebrow"
      :heading="callToAction.heading"
      :lede="callToAction.body"
    />
    <div class="actions">
      <ActionButton :link="callToAction.action" />
    </div>
  </section>
</template>

<style scoped>
.cta {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2.5rem;
}
</style>
