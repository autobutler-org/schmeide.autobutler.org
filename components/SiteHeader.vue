<script setup lang="ts">
import { ref } from "vue";

import { hero, masthead } from "~/data/copy";

const menuOpen = ref(false);

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value;
}

function closeMenu(): void {
  menuOpen.value = false;
}
</script>

<template>
  <header class="masthead">
    <div class="bar">
      <a href="/" class="wordmark">
        <img class="mark" :src="hero.logo.src" alt="" width="64" height="64" />
        {{ masthead.wordmark }}
      </a>
      <nav id="site-nav" aria-label="Site" :class="{ open: menuOpen }">
        <a v-for="link in masthead.links" :key="link.href" :href="link.href" @click="closeMenu">
          {{ link.label }}
        </a>
      </nav>
      <div class="end">
        <a class="cta" :href="masthead.cta.href">{{ masthead.cta.label }}</a>
        <button
          type="button"
          class="menu-toggle"
          :aria-label="masthead.menuLabel"
          aria-controls="site-nav"
          :aria-expanded="menuOpen"
          @click="toggleMenu"
        >
          <span class="menu-icon" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.masthead {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-canvas-veil);
  -webkit-backdrop-filter: saturate(1.4) blur(12px);
  backdrop-filter: saturate(1.4) blur(12px);
}

.bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
  max-width: var(--content-width);
  height: var(--header-height);
  margin: 0 auto;
  padding: 0 var(--gutter);
  box-sizing: border-box;
}

.wordmark {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: var(--tracking-snug);
  color: var(--color-text-strong);
  text-decoration: none;
}

.mark {
  width: 1.5rem;
  height: auto;
}

nav {
  display: flex;
  gap: 1.75rem;
  margin-right: auto;
  font-size: var(--text-small);
}

nav a {
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color var(--duration-fast) ease;
}

nav a:hover {
  color: var(--color-text-strong);
}

.end {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cta {
  display: inline-flex;
  align-items: center;
  height: 2.25rem;
  padding: 0 1rem;
  border-radius: var(--radius-md);
  background: var(--color-ink);
  color: var(--color-on-ink);
  font-size: var(--text-small);
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color var(--duration-fast) ease,
    transform var(--duration-fast) var(--ease-out);
}

.cta:hover {
  background: var(--color-ink-hover);
}

.cta:active {
  transform: var(--press);
}

.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
}

.menu-icon,
.menu-icon::before {
  display: block;
  width: 0.95rem;
  height: 1.5px;
  background: var(--color-text-strong);
}

.menu-icon {
  position: relative;
  top: -0.15rem;
}

.menu-icon::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.35rem;
}

@media (max-width: 760px) {
  .bar {
    justify-content: space-between;
  }

  .menu-toggle {
    display: flex;
  }

  nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 0;
    margin: 0;
    padding: 0.5rem var(--gutter) 1rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-canvas);
    font-size: var(--text-body);
  }

  nav.open {
    display: flex;
  }

  nav a {
    padding: 0.85rem 0;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-strong);
  }

  nav a:last-child {
    border-bottom: none;
  }
}
</style>
