<script setup lang="ts">
interface DocSummary {
  path: string;
  title: string;
  navigation?: { title?: string; order?: number };
}

const route = useRoute();

/**
 * Content paths are stored without a trailing slash, but GitHub Pages serves
 * each prerendered doc at its directory URL (`/docs/foo/`). Normalize once so
 * the payload key and the query match either form.
 */
const docPath = route.path.replace(/\/+$/, "") || "/";

const { data: doc } = await useAsyncData(`doc-${docPath}`, () =>
  queryCollection("docs").path(docPath).first()
);

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: "Doc not found" });
}

const { data: allDocs } = await useAsyncData("docs-nav", () => queryCollection("docs").all());

const sortedDocs = computed(() =>
  ((allDocs.value ?? []) as unknown as DocSummary[])
    .slice()
    .sort((a, b) => (a.navigation?.order ?? 999) - (b.navigation?.order ?? 999))
);

useSeoMeta({
  title: () => `${doc.value?.title ?? "Docs"} — schmeide`,
  description: () => doc.value?.description ?? undefined,
  ogTitle: () => `${doc.value?.title ?? "Docs"} — schmeide`,
  ogDescription: () => doc.value?.description ?? undefined,
  ogUrl: () => `https://schmeide.autobutler.org${docPath}`,
  ogType: "article",
  twitterTitle: () => `${doc.value?.title ?? "Docs"} — schmeide`,
  twitterDescription: () => doc.value?.description ?? undefined,
});
</script>

<template>
  <article class="doc">
    <nav class="doc-nav" aria-label="Documentation">
      <NuxtLink to="/docs">All docs</NuxtLink>
      <NuxtLink
        v-for="item in sortedDocs"
        :key="item.path"
        :to="item.path"
        :class="{ current: item.path === docPath }"
      >
        {{ item.navigation?.title || item.title }}
      </NuxtLink>
    </nav>
    <div class="prose">
      <ContentRenderer v-if="doc" :value="doc" />
    </div>
  </article>
</template>

<style scoped>
.doc {
  display: grid;
  grid-template-columns: 13rem minmax(0, 1fr);
  gap: 5rem;
  align-items: start;
  width: 100%;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: clamp(3rem, 7vw, 5.5rem) var(--gutter) var(--section-gap);
  box-sizing: border-box;
}

.doc-nav {
  position: sticky;
  top: calc(var(--header-height) + 2rem);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - var(--header-height) - 4rem);
  overflow-y: auto;
  border-left: 1px solid var(--color-border);
  font-size: var(--text-small);
}

.doc-nav a {
  margin-left: -1px;
  padding: 0.35rem 0 0.35rem 1rem;
  border-left: 1px solid transparent;
  color: var(--color-text-muted);
  text-decoration: none;
  transition:
    color var(--duration-fast) ease,
    border-color var(--duration-fast) ease;
}

.doc-nav a:first-child {
  margin-bottom: 0.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.doc-nav a:hover {
  color: var(--color-text-strong);
}

.doc-nav a.current {
  border-left-color: var(--color-text-strong);
  color: var(--color-text-strong);
  font-weight: 500;
}

.prose {
  min-width: 0;
  max-width: var(--prose-width);
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--color-text);
}

.prose :deep(h1),
.prose :deep(h2) {
  font-family: var(--font-serif);
  font-weight: 400;
  letter-spacing: var(--tracking-tight);
  color: var(--color-text-strong);
  text-wrap: balance;
}

.prose :deep(h1) {
  margin: 0 0 2rem;
  font-size: var(--text-h1);
  line-height: 1.05;
}

.prose :deep(h2) {
  margin: 3.5rem 0 1rem;
  font-size: 2rem;
  line-height: 1.15;
}

.prose :deep(h3) {
  margin: 2.25rem 0 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: var(--tracking-snug);
  color: var(--color-text-strong);
}

.prose :deep(h2 a),
.prose :deep(h3 a) {
  color: inherit;
  text-decoration: none;
}

.prose :deep(p) {
  margin: 0 0 1.25rem;
  text-wrap: pretty;
}

.prose :deep(a) {
  color: var(--color-text-strong);
  text-decoration: underline;
  text-decoration-color: var(--color-border-strong);
  text-underline-offset: 0.2em;
  transition: text-decoration-color var(--duration-fast) ease;
}

.prose :deep(a:hover) {
  text-decoration-color: currentcolor;
}

.prose :deep(strong) {
  font-weight: 600;
  color: var(--color-text-strong);
}

.prose :deep(ul),
.prose :deep(ol) {
  margin: 0 0 1.25rem;
  padding-left: 1.25rem;
}

.prose :deep(li) {
  margin: 0.4rem 0;
  padding-left: 0.25rem;
}

.prose :deep(li::marker) {
  color: var(--color-text-muted);
}

.prose :deep(blockquote) {
  margin: 0 0 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  background: var(--pastel-blue);
  color: var(--color-text-strong);
}

.prose :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

.prose :deep(hr) {
  margin: 3rem 0;
  border: none;
  border-top: 1px solid var(--color-border);
}

.prose :deep(table) {
  display: block;
  width: 100%;
  margin: 0 0 1.5rem;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.prose :deep(th),
.prose :deep(td) {
  padding: 0.65rem 1rem 0.65rem 0;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
}

.prose :deep(th) {
  border-bottom-color: var(--color-text-strong);
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.prose :deep(code) {
  padding: 0.12em 0.4em;
  border-radius: var(--radius-sm);
  background: var(--color-surface-sunken);
  font-family: var(--font-mono);
  font-size: 0.85em;
  color: var(--color-text-strong);
}

.prose :deep(kbd) {
  display: inline-block;
  min-width: 1.5em;
  padding: 0.05em 0.45em;
  border: 1px solid var(--color-border-strong);
  border-bottom-width: 2px;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-family: var(--font-mono);
  font-size: 0.8em;
  text-align: center;
  color: var(--color-text-strong);
}

.prose :deep(pre) {
  margin: 0 0 1.5rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  font-size: 0.875rem;
  line-height: 1.65;
  overflow-x: auto;
}

.prose :deep(pre code) {
  padding: 0;
  background: none;
  font-size: inherit;
}

/* Shiki emits both themes as variables; pick the one matching the page. */
@media (prefers-color-scheme: dark) {
  .prose :deep(pre span) {
    color: var(--shiki-dark);
  }
}

.prose :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 2rem 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

@media (max-width: 860px) {
  .doc {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
  }

  .doc-nav {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.4rem;
    max-height: none;
    overflow: visible;
    border-left: none;
  }

  .doc-nav a {
    margin: 0;
    padding: 0.3rem 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }

  .doc-nav a:first-child {
    flex-basis: 100%;
    margin-bottom: 0.25rem;
    padding: 0;
    border: none;
    background: none;
  }

  .doc-nav a.current {
    border-color: var(--color-text-strong);
  }
}
</style>
