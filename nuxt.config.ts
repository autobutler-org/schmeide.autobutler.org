// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-08-01",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/content"],
  /*
   * Fonts are self-hosted: @fontsource packages are bundled into the build, so
   * no request ever leaves for a font CDN.
   */
  css: [
    "@fontsource-variable/newsreader/opsz.css",
    "@fontsource-variable/newsreader/opsz-italic.css",
    "@fontsource-variable/geist",
    "@fontsource-variable/geist-mono",
    "~/assets/main.css",
  ],
  nitro: {
    static: true,
    prerender: {
      routes: ["/sitemap.xml"],
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: "en" },
      title: "schmeide: Issues In, Pull Requests Out",
      meta: [
        {
          name: "description",
          content:
            "schmeide turns an assigned, ready-labeled GitHub issue into a reviewed pull request, using Claude Code or the Grok CLI on your own runners. Open source, MIT-0.",
        },
        { property: "og:site_name", content: "schmeide" },
        { property: "og:type", content: "website" },
        {
          property: "og:title",
          content: "schmeide: Issues In, Pull Requests Out",
        },
        {
          property: "og:description",
          content:
            "schmeide turns an assigned, ready-labeled GitHub issue into a reviewed pull request, using Claude Code or the Grok CLI on your own runners. Open source, MIT-0.",
        },
        { property: "og:url", content: "https://schmeide.autobutler.org" },
        { property: "og:image", content: "https://schmeide.autobutler.org/og.png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "The schmeide anvil mark beside the name schmeide" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "schmeide: Issues In, Pull Requests Out",
        },
        {
          name: "twitter:description",
          content:
            "schmeide turns an assigned, ready-labeled GitHub issue into a reviewed pull request, using Claude Code or the Grok CLI on your own runners. Open source, MIT-0.",
        },
        { name: "twitter:image", content: "https://schmeide.autobutler.org/og.png" },
        { name: "theme-color", content: "#f7f6f3", media: "(prefers-color-scheme: light)" },
        { name: "theme-color", content: "#161615", media: "(prefers-color-scheme: dark)" },
      ],
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
        { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      ],
    },
  },
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: "github-light",
            dark: "github-dark",
          },
          preload: ["bash", "sh", "toml"],
        },
      },
    },
  },
});
