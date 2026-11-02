import pluginVitest from "@vitest/eslint-plugin";

import { withNuxt } from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  {
    ...pluginVitest.configs.recommended,
    files: ["**/__tests__/*"],
  },
  {
    rules: {
      // Prettier and this rule fight over void elements (<img>, <hr>) —
      // defer to Prettier's formatting, same as the sibling autobutler.org
      // config.
      "vue/html-self-closing": [
        "off",
        {
          html: { void: "any", normal: "never", component: "always" },
          svg: "always",
          math: "always",
        },
      ],
    },
  }
);
