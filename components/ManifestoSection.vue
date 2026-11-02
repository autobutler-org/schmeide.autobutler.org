<script setup lang="ts">
import SectionIntro from "./SectionIntro.vue";
import { manifesto } from "~/data/copy";
</script>

<template>
  <section class="manifesto">
    <div class="aside">
      <SectionIntro :eyebrow="manifesto.eyebrow" :heading="manifesto.heading" />
    </div>
    <div class="body reveal">
      <p v-for="paragraph in manifesto.paragraphs" :key="paragraph">
        {{ paragraph }}
      </p>
      <p class="pull">{{ manifesto.pull }}</p>
      <p class="note">
        <a :href="manifesto.openSource.link.href">
          {{ manifesto.openSource.link.label }}
        </a>
        {{ manifesto.openSource.trailing }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.manifesto {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3rem;
  width: 100%;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--section-gap) var(--gutter) 0;
  box-sizing: border-box;
}

.body {
  max-width: var(--prose-width);
  font-size: 1.0625rem;
  line-height: 1.7;
}

.body p {
  margin: 0 0 1.5rem;
  text-wrap: pretty;
}

.body p:first-child {
  font-size: var(--text-lede);
  line-height: 1.6;
  color: var(--color-text-strong);
}

.body .pull {
  margin: 2.5rem 0;
  padding: 1.75rem 0;
  border-top: 1px solid var(--color-border-strong);
  border-bottom: 1px solid var(--color-border-strong);
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2rem);
  font-style: italic;
  line-height: 1.25;
  letter-spacing: var(--tracking-snug);
  color: var(--color-text-strong);
}

.body .note {
  font-size: var(--text-small);
  color: var(--color-text-muted);
}

a {
  color: var(--color-text-strong);
  font-weight: 500;
  text-decoration: underline;
  text-decoration-color: var(--color-border-strong);
  text-underline-offset: 0.25em;
  transition: text-decoration-color var(--duration-fast) ease;
}

a:hover {
  text-decoration-color: currentcolor;
}

@media (min-width: 960px) {
  .manifesto {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: 5rem;
  }

  .aside {
    position: sticky;
    top: calc(var(--header-height) + 2.5rem);
    align-self: start;
  }
}
</style>
