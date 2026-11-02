<script setup lang="ts">
import type { NuxtError } from "#app";

import SiteShell from "./components/SiteShell.vue";
import { errorPage } from "./data/copy";

const props = defineProps<{ readonly error: NuxtError }>();

const isNotFound = computed(() => props.error.statusCode === 404);
const heading = computed(() =>
  isNotFound.value ? errorPage.notFoundHeading : errorPage.errorHeading
);

useSeoMeta({ title: () => `${heading.value} — schmeide` });
</script>

<template>
  <SiteShell>
    <main class="error">
      <p class="status">{{ error.statusCode }}</p>
      <h1>{{ heading }}</h1>
      <p class="body">{{ isNotFound ? errorPage.notFoundBody : errorPage.errorBody }}</p>
      <!-- Plain links force a full page load, which clears the error state. -->
      <nav class="links" aria-label="Error recovery">
        <a v-for="link in errorPage.links" :key="link.href" :href="link.href">{{ link.label }}</a>
      </nav>
    </main>
  </SiteShell>
</template>

<style scoped>
.error {
  width: 100%;
  max-width: var(--prose-width);
  margin: 0 auto;
  padding: clamp(4rem, 9vw, 7rem) var(--gutter) var(--section-gap);
  box-sizing: border-box;
}

.status {
  margin: 0 0 1.25rem;
  font-family: var(--font-mono);
  font-size: var(--text-small);
  letter-spacing: var(--tracking-wide);
  color: var(--color-text-muted);
}

h1 {
  margin: 0 0 1.25rem;
  font-family: var(--font-serif);
  font-size: var(--text-h1);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: var(--tracking-tight);
  color: var(--color-text-strong);
}

.body {
  margin: 0 0 2.5rem;
  font-size: var(--text-lede);
  color: var(--color-text-muted);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.links a {
  display: inline-flex;
  align-items: center;
  height: 3rem;
  padding: 0 1.25rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-weight: 500;
  text-decoration: none;
  transition: border-color var(--duration-fast) ease;
}

.links a:hover {
  border-color: var(--color-text-muted);
}
</style>
