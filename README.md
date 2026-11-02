# schmeide.autobutler.org

The public site and documentation for [schmeide](https://github.com/autobutler-org/schmeide), the autobutler-org
software factory. Built with [Nuxt](https://nuxt.com) and [`@nuxt/content`](https://content.nuxt.com), typechecked
with `vue-tsc`, and tested with Vitest. It shares its design tokens and components with
[quark.autobutler.org](https://quark.autobutler.org).

Run `make` to see every target.

```sh
make setup    # install nvm, Node, and dependencies
make serve    # start the Nuxt dev server
make generate # statically generate the deployable site
make test     # run tests
make check    # lint, typecheck, and format checks
make fix      # apply lint and format fixes
```

## Layout

| Path                | What lives there                                                       |
| ------------------- | ---------------------------------------------------------------------- |
| `app.vue`           | Root layout: header, `<NuxtPage />`, footer                            |
| `pages/`            | Route components (`index.vue`, `docs/index.vue`, `docs/[...slug].vue`) |
| `components/`       | Components and their `__tests__` specs                                 |
| `content/docs/`     | Docs content, authored in Markdown and rendered via `@nuxt/content`    |
| `data/copy.ts`      | Typed landing-page copy and outbound links                             |
| `assets/`           | Global styles and design tokens                                        |
| `public/`           | Files copied verbatim into the build (icons, `og.png`)                 |
| `nuxt.config.ts`    | Nuxt configuration (site meta, `@nuxt/content` options)                |
| `content.config.ts` | `@nuxt/content` collection definitions                                 |
| `vitest.config.ts`  | Vitest-only Vite config for mounting components in isolation           |

## Where the docs come from

The pages in `content/docs/` are written for readers of this site, from the schmeide repository's `README.md`,
`docs/`, and `docs/user-journeys/`. When schmeide changes a default, a flag, or a user-visible string, update the page
here that describes it.

## Deployment

CI generates the static site (`nuxt generate`) and tests it; CD does the same and publishes `.output/public` to GitHub
Pages on pushes to `main`. The custom domain, `schmeide.autobutler.org`, is set in the repository's Pages settings.
