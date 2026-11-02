<script setup lang="ts">
/**
 * The header every landing section opens with: a small mono eyebrow, a serif
 * heading, and an optional lede. Copy comes in through props from
 * `data/copy.ts`; this component holds no strings of its own.
 */
defineProps<{
  readonly eyebrow: string;
  readonly heading: string;
  readonly lede?: string;
}>();
</script>

<template>
  <header class="intro">
    <p class="eyebrow">{{ eyebrow }}</p>
    <h2>{{ heading }}</h2>
    <p v-if="lede" class="lede">{{ lede }}</p>
  </header>
</template>

<style scoped>
.intro {
  max-width: 44rem;
}

.eyebrow {
  margin: 0 0 1.25rem;
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-text-muted);
}

h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-h2);
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: var(--tracking-tight);
  color: var(--color-text-strong);
  text-wrap: balance;
}

.lede {
  max-width: var(--lede-width);
  margin: 1.25rem 0 0;
  font-size: var(--text-lede);
  color: var(--color-text-muted);
  text-wrap: pretty;
}
</style>
