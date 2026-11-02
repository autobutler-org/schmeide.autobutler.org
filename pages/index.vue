<script setup lang="ts">
import LandingPage from "~/components/LandingPage.vue";

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "schmeide",
        url: "https://schmeide.autobutler.org",
        description:
          "schmeide turns an assigned, ready-labeled GitHub issue into a reviewed pull request, using Claude Code or the Grok CLI on your own runners.",
        applicationCategory: "DeveloperApplication",
        codeRepository: "https://github.com/autobutler-org/schmeide",
        license: "https://spdx.org/licenses/MIT-0.html",
        publisher: {
          "@type": "Organization",
          name: "AutoButler",
          url: "https://autobutler.org",
        },
      }),
    },
  ],
});
</script>

<template>
  <LandingPage />
</template>
