<script setup lang="ts">
import { footer, hero, masthead } from "~/data/copy";
</script>

<template>
  <footer class="footer">
    <div class="inner">
      <div class="brand">
        <p class="wordmark">{{ masthead.wordmark }}</p>
        <p class="tagline">{{ hero.subhead }}</p>
      </div>
      <nav aria-label="Footer">
        <a v-for="link in footer.links" :key="link.href" :href="link.href">
          {{ link.label }}
        </a>
      </nav>
      <div class="legal">
        <p>{{ footer.note }}</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
}

.inner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  gap: 2.5rem var(--gutter);
  width: 100%;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 4rem var(--gutter) 3rem;
  box-sizing: border-box;
}

p {
  margin: 0;
}

.wordmark {
  font-family: var(--font-serif);
  font-size: 2rem;
  line-height: 1;
  letter-spacing: var(--tracking-tight);
  color: var(--color-text-strong);
}

.tagline {
  margin-top: 0.75rem;
  max-width: 18rem;
  font-size: var(--text-small);
  color: var(--color-text-muted);
}

nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: var(--text-small);
}

a {
  color: var(--color-text);
  text-decoration: none;
  transition: color var(--duration-fast) ease;
}

a:hover {
  color: var(--color-text-strong);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.legal {
  grid-column: 1 / -1;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  line-height: 1.6;
  color: var(--color-text-muted);
}
</style>
