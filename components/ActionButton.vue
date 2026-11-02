<script setup lang="ts">
import type { Link } from "~/data/copy";

withDefaults(defineProps<{ link: Link; variant?: "primary" | "secondary" }>(), {
  variant: "primary",
});
</script>

<template>
  <a class="btn" :class="variant" :href="link.href">{{ link.label }}</a>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3rem;
  padding: 0 1.5rem;
  box-sizing: border-box;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-size: var(--text-body);
  font-weight: 500;
  letter-spacing: -0.005em;
  text-decoration: none;
  transition:
    background-color var(--duration-fast) ease,
    border-color var(--duration-fast) ease,
    transform var(--duration-fast) var(--ease-out);
}

.btn:active {
  transform: var(--press);
}

.primary {
  background: var(--color-ink);
  color: var(--color-on-ink);
}

.primary:hover {
  background: var(--color-ink-hover);
}

.secondary {
  border-color: var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-text-strong);
}

.secondary:hover {
  border-color: var(--color-text-muted);
}

/* The arrow is decoration; the empty alt text keeps it out of the accessible name. */
.secondary::after {
  content: "\2192" / "";
  transition: transform var(--duration-fast) var(--ease-out);
}

.secondary:hover::after {
  transform: translateX(3px);
}

@media (max-width: 640px) {
  .btn {
    width: 100%;
  }
}
</style>
