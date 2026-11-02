<script setup lang="ts">
import SectionIntro from "./SectionIntro.vue";
import { features } from "~/data/copy";
</script>

<template>
  <section class="features">
    <SectionIntro :eyebrow="features.eyebrow" :heading="features.heading" :lede="features.lede" />
    <ul class="bento">
      <li
        v-for="(feature, index) in features.items"
        :key="feature.name"
        class="card reveal"
        :class="{ upcoming: feature.upcoming }"
      >
        <details>
          <summary>
            <div class="meta">
              <span class="index" aria-hidden="true">{{ String(index + 1).padStart(2, "0") }}</span>
              <span v-if="feature.badge" class="badge">{{ feature.badge }}</span>
              <span class="toggle" aria-hidden="true"></span>
            </div>
            <h3>{{ feature.name }}</h3>
          </summary>
          <p>{{ feature.body }}</p>
        </details>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.features {
  width: 100%;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--section-gap) var(--gutter) 0;
  box-sizing: border-box;
}

.bento {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(17rem, 100%), 1fr));
  align-items: start;
  gap: 0.75rem;
  margin: 3.5rem 0 0;
  padding: 0;
  list-style: none;
}

.card {
  display: flex;
  flex-direction: column;
  padding: var(--card-pad);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-none);
  transition: box-shadow var(--duration-fast) ease;
}

.card:hover {
  box-shadow: var(--shadow-hover);
}

summary {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  cursor: pointer;
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

.meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 1.5rem;
  margin-bottom: 2rem;
}

.toggle {
  flex: none;
  width: 0.5rem;
  height: 0.5rem;
  border-right: 2px solid var(--color-text-muted);
  border-bottom: 2px solid var(--color-text-muted);
  transform: rotate(45deg);
  transition: transform var(--duration-fast) ease;
}

details[open] .toggle {
  transform: rotate(-135deg);
}

.index {
  margin-right: auto;
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  color: var(--color-text-muted);
}

.badge {
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-pill);
  background: var(--pastel-yellow);
  color: var(--pastel-yellow-ink);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.upcoming {
  border-style: dashed;
  border-color: var(--color-border-strong);
  background: var(--color-surface-sunken);
}

h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-h3);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: var(--tracking-snug);
  color: var(--color-text-strong);
}

p {
  margin: 0.6rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-muted);
  text-wrap: pretty;
}

/*
 * On wide screens the cards settle into an asymmetric 12-column bento. Spans
 * follow the order of `features.items`; an item added past the end falls back
 * to a third of the row.
 */
@media (min-width: 960px) {
  .bento {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }

  .card {
    grid-column: span 4;
  }

  .card:nth-child(1),
  .card:nth-child(7) {
    grid-column: span 7;
  }

  .card:nth-child(2),
  .card:nth-child(6) {
    grid-column: span 5;
  }

  .card:nth-child(n + 8):nth-child(-n + 11) {
    grid-column: span 3;
  }
}
</style>
