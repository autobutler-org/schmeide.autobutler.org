import { defineCollection, defineContentConfig } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      // Load every markdown file under content/docs
      source: "docs/**",
      type: "page",
    }),
  },
});
