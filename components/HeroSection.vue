<script setup lang="ts">
import ActionButton from "./ActionButton.vue";
import { hero } from "~/data/copy";
</script>

<template>
  <section class="hero">
    <div class="texture" aria-hidden="true"></div>
    <div class="inner">
      <div class="copy">
        <h1>{{ hero.headline }}</h1>
        <p class="subhead">{{ hero.subhead }}</p>
        <p class="lede">{{ hero.lede }}</p>
        <div class="actions">
          <ActionButton :link="hero.primary" />
          <ActionButton :link="hero.secondary" variant="secondary" />
        </div>
      </div>
      <dl class="facts" :aria-label="hero.factsLabel">
        <div v-for="fact in hero.facts" :key="fact.label" class="fact">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  isolation: isolate;
}

/* A faint drafting grid behind the headline, fading out toward the image. */
.texture {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    linear-gradient(var(--color-grid-line) 1px, var(--mask-clear) 1px),
    linear-gradient(90deg, var(--color-grid-line) 1px, var(--mask-clear) 1px);
  background-size: 4rem 4rem;
  background-position: center top;
  -webkit-mask-image: radial-gradient(
    ellipse 80% 70% at 30% 20%,
    var(--mask-opaque),
    var(--mask-clear)
  );
  mask-image: radial-gradient(ellipse 80% 70% at 30% 20%, var(--mask-opaque), var(--mask-clear));
}

.inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3.5rem;
  width: 100%;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: clamp(4rem, 9vw, 8rem) var(--gutter) clamp(3rem, 6vw, 5rem);
  box-sizing: border-box;
}

h1 {
  max-width: 9ch;
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-display);
  font-weight: 400;
  line-height: var(--leading-tight);
  letter-spacing: -0.035em;
  color: var(--color-text-strong);
}

.subhead {
  margin: 2rem 0 0;
  font-size: var(--text-lede);
  font-weight: 500;
  letter-spacing: var(--tracking-snug);
  color: var(--color-text-strong);
}

.lede {
  max-width: var(--lede-width);
  margin: 0.75rem 0 0;
  font-size: var(--text-lede);
  color: var(--color-text-muted);
  text-wrap: pretty;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2.5rem;
}

.facts {
  margin: 0;
  border-top: 1px solid var(--color-text-strong);
  align-self: end;
}

.fact {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--color-border-strong);
}

dt {
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-text-muted);
}

dd {
  margin: 0;
  font-size: var(--text-small);
  font-weight: 500;
  color: var(--color-text-strong);
}

@media (min-width: 960px) {
  .inner {
    grid-template-columns: minmax(0, 1fr) 19rem;
    gap: 5rem;
  }
}
</style>
