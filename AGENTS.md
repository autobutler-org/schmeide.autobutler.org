# `AGENTS.md`

## Purpose

These instructions tell coding agents how to work in this repository.

`schmeide.autobutler.org` is the public site and documentation for
[schmeide](https://github.com/autobutler-org/schmeide), the autobutler-org
software factory. It is a [Nuxt](https://nuxt.com) app using
[`@nuxt/content`](https://content.nuxt.com) to render the docs from Markdown
at build time, typechecked with `vue-tsc`, tested with Vitest, and
statically generated (`nuxt generate`) to GitHub Pages.

## Key rule (always)

- Respect the linting and formatting conventions of the various linting and
  formatting configurations and tools being used.
- The configs are the source of truth: `eslint.config.ts`, `.prettierrc`,
  `.prettierignore`, `tsconfig*.json`, and `vite.config.ts`. Do not override
  them inline (no blanket `eslint-disable`, no `any`, no `@ts-ignore`) to make
  a change pass.

## Use Makefile Targets

- Agents should use existing Makefile targets to `serve`, `build`, `test`, and
  `check` the codebase rather than crafting their own shell commands.
- Do **not** run ad hoc commands for these standard flows — use `make test`,
  `make check`, `make build`, `make fix`.
- If an action needs to be templatized for general usage, add a new Makefile
  target for it rather than running raw commands.
- `make help` lists every target and is the default goal.

| Target          | What it does                                            |
| --------------- | ------------------------------------------------------- |
| `make setup`    | Install nvm, the Node version in `.nvmrc`, deps         |
| `make serve`    | Nuxt dev server with hot module replacement             |
| `make build`    | `nuxt build` typecheck-adjacent bundle (not what ships) |
| `make generate` | `nuxt generate` — the static site CI/CD actually ships  |
| `make test`     | Run the Vitest suite once                               |
| `make check`    | ESLint, `nuxt typecheck`, Prettier, and markdownlint    |
| `make fix`      | Apply ESLint, Prettier, and markdownlint fixes          |

## Development assumptions

- Assume the developer is running the site via `make serve` and that Nuxt will
  hot-reload on code changes.
- Never attempt to start, stop, or restart the dev server yourself.
- Focus on code changes only; the running server will pick them up
  automatically.
- If you need to confirm the deployable bundle is sound, use `make generate`
  — it's what CI/CD actually ships (`make build` alone does not statically
  render `content/docs/`, so it's not sufficient to validate docs changes).

## Project type

- This repository is a [Nuxt](https://nuxt.com) app (TypeScript, `<script
setup>` SFCs), statically generated (`nuxt generate`) and served as static
  files via GitHub Pages. There is no backend and no runtime data source —
  everything is resolved at build time, including the docs content compiled
  by `@nuxt/content`.
- The landing page stays plain Vue/CSS, per the original design. Docs pages
  use Nuxt's file-based routing (`pages/docs/`) and `@nuxt/content` because
  Markdown needs to be parsed and statically compiled at build time — that
  is the reason this app is Nuxt instead of a plain Vite SPA. Do not
  introduce further frameworks, state libraries, or content sources beyond
  what's already here without a reason in the PR body.
- Runtime dependencies are `vue`, `nuxt`, `@nuxt/content`, and
  `better-sqlite3` (a `@nuxt/content` v3 build dependency). Anything new
  belongs in `devDependencies` unless it genuinely ships to the browser, and
  adding it needs a reason in the PR body.
- Avoid heavy content-rendering dependencies (e.g. `mermaid`) — they've
  caused repeated `npm audit` failures on a sibling site. Prefer plain
  Markdown (prose, tables, lists) over embedded diagrams; describe an
  architecture in words rather than pulling in a diagramming library.

## No data collection

- Do not add analytics, tag managers, session recording, A/B testing, or
  fingerprinting.
- Do not add third-party embeds, remote fonts, remote scripts, or tracking
  pixels. Self-host assets under `public/` or `assets/` instead.
- Forms that send data off-site need explicit sign-off before being added,
  and must name the processor in the PR body.

## Current app structure (follow this)

- `nuxt.config.ts`: site meta (title, OG/Twitter tags), `@nuxt/content`
  options. This is the single source of truth for global `<head>` tags —
  there is no `index.html` in a Nuxt app.
- `content.config.ts`: `@nuxt/content` collection definitions (currently one
  `docs` collection sourced from `content/docs/**`).
- `app.vue`: root layout — the page background/glow, `SiteHeader`,
  `<NuxtPage />`, `SiteFooter`. Composition only, no page content.
- `pages/index.vue`: the landing page (renders `LandingPage.vue`).
- `pages/docs/index.vue`: docs listing page.
- `pages/docs/[...slug].vue`: renders a single doc via `<ContentRenderer>`.
- `components/`: components, one public component per file. Nuxt
  auto-imports from here, but keep explicit imports in landing-page
  components for now, matching the existing style.
- `components/__tests__/`: Vitest specs, named `<Component>.test.ts`.
- `content/docs/`: docs content, one Markdown file per page, with
  `title`/`description`/`navigation.{title,order}` frontmatter. This is
  compiled into the site at build time by `@nuxt/content` — do not hand-roll
  a second content pipeline.
- `data/copy.ts`: every string that appears on the landing page, plus the
  outbound URLs. Landing-page components import from here; they do not
  hardcode copy. (Docs prose lives in `content/docs/*.md` instead — this
  split exists because docs are long-form Markdown, not short UI strings.)
- `utils/`: pure TypeScript logic that pages use but that needs no Nuxt
  runtime (currently `docsSearch.ts`, the docs index search). Keeping it here
  lets `utils/__tests__/` cover it with plain Vitest.
- `assets/`: global styles and bundled static assets.
- `public/`: files copied verbatim into the build (`schmeide.svg`, the
  favicons, `og.png`, and any images referenced from docs content).
- `vitest.config.ts`: a plain Vite config used only by Vitest, to mount
  presentational components without the full Nuxt runtime. Nuxt's own dev
  server and build use `nuxt.config.ts`.
- `~/` and `@/` are aliased to the project root — Nuxt's defaults.

## Code organization rules

- Keep page content out of `app.vue`; it wires the header/footer/page shell
  together and nothing else. Actual page content belongs in `pages/`.
- Prefer small, focused components: extract a visibly independent section into
  its own component once it earns a name, rather than growing one file.
- Landing-page copy lives in `data/copy.ts` as typed, `readonly` `const` data.
  Components import it and render with `v-for`; they never inline a sentence
  in a template. A copy change should touch one file. Docs prose is the
  exception — it lives in `content/docs/*.md`, authored directly as Markdown.
- Keep files focused and avoid large, mixed-responsibility components.
- For shared tuning values (colors, spacing, radii, shadows, durations), use
  the design tokens defined on `:root` in `assets/main.css` and reference
  them with `var(--token)` instead of scattering literals. A raw color literal
  in a component is a bug; add a token instead. Docs pages must reuse the same
  tokens (in particular `--prose-width` for long-form content) rather than
  introducing a second visual language.
- Media-query breakpoints must stay literal — custom properties are not valid
  in media conditions. Keep them in sync with the `--breakpoint-*` tokens.
- Prefer immutable bindings. Use `const` unless reassignment is required, and
  `readonly` on types that are never mutated.

## Styling

- Component styles belong in `<style scoped>` inside the SFC. Only genuinely
  global rules (resets, tokens, `body`) go in `assets/main.css`.
- Do not reach across component boundaries with `:deep()` or global selectors
  to restyle a child component; give the child a prop or a class instead.
  Exception: styling the HTML that `<ContentRenderer>` produces from Markdown
  in `pages/docs/[...slug].vue` — that's rendered content, not a child
  component, so `:deep()` there is the correct tool, not a shortcut.
- Use relative units and `clamp()` for type scale so layouts survive zoom and
  narrow viewports.
- Keep the visual language identical to
  [quark.autobutler.org](https://quark.autobutler.org): the same tokens in
  `assets/main.css`, the same self-hosted fonts, and the same components. A
  token change made here should be made there too, and the other way round.

## UI/layout principles

- The page must not scroll horizontally at any viewport width. Test at 320px.
- Wide content (tables, code blocks, diagrams) scrolls inside its own
  `overflow-x: auto` container rather than widening the page.
- Use `grid-template-columns: repeat(auto-fit, minmax(min(<min>, 100%), 1fr))`
  for card and step layouts so they reflow without a media query per
  breakpoint. The `min(..., 100%)` wrapper is not optional — a bare `minmax`
  minimum overflows once the viewport is narrower than it.
- Give images explicit dimensions or an `aspect-ratio` so the page does not
  shift as they load.
- Every interactive element must be reachable and visible via keyboard; keep
  the `:focus-visible` outline intact.
- Use real semantic elements (`header`, `nav`, `section`, `footer`, `ol`,
  `button`, `a`). Do not attach click handlers to `div`s.
- Images need meaningful `alt` text; decorative elements need
  `aria-hidden="true"`.
- Landing-page nav (`SiteHeader`, `SiteFooter`) uses plain `<a href>` for
  every link, internal and external alike — deliberately, not an oversight.
  It keeps `mount()` component tests simple (no router context needed) and a
  full page load between a handful of static pages costs nothing noticeable.
  Docs pages (`pages/docs/`) use `<NuxtLink>` for in-docs navigation since
  they already run inside Nuxt's router context. Match whichever pattern the
  surrounding file already uses; don't mix them within one component.

## Content and copy

- The project is **schmeide**, always lowercase, as the schmeide repository
  writes it, including at the start of a sentence and in the wordmark. It is
  published by the AutoButler project; "AutoButler" names the org, not this
  tool.
- Use the terms in the schmeide repository's `docs/GLOSSARY.md` as defined
  there. The job owner is the "steward", never "submitter".
- Match the voice of the schmeide docs: plain, factual sentences, second
  person, American spelling, no filler. Concrete claims over adjectives.
- Only describe behavior schmeide actually ships. Check the schmeide
  repository's `README.md`, `docs/`, and `docs/user-journeys/` before adding a
  capability, a default, or a flag to the site. Anything not built (container
  isolation, issue creation) is described as not built.
- Quote user-visible strings (issue comments, CLI errors, log lines) exactly
  as schmeide emits them, and update the quote when schmeide changes it.
- Do not invent prices, dates, availability, testimonials, or metrics.

## SEO and metadata

- Site-wide `<title>`, description, and Open Graph/Twitter tags live in
  `nuxt.config.ts` (`app.head`) and must be updated by hand when the pitch
  changes — keep them in sync with `hero` in `data/copy.ts`.
- Docs pages set their own `<title>`/description per page via `useSeoMeta()`
  in `pages/docs/index.vue` and `pages/docs/[...slug].vue`, sourced from each
  doc's frontmatter — don't hardcode per-doc titles outside the Markdown
  file.
- `twitter:card` is `summary_large_image` because `public/og.png` (1200x630)
  is the `og:image` and `twitter:image`. Drop to `summary` if that image goes.
- `og:url` must stay `https://schmeide.autobutler.org`.

## Testing and validation

- Prefer adding or updating focused tests under `components/__tests__/` for
  non-trivial changes.
- Test rendered output and behavior, not implementation details: assert on text
  the user sees, on element counts, and on `href` targets.
- Assert on the content that would silently rot — feature lists, outbound
  links, the headline — so a copy change that breaks an invariant fails loudly.
- Do not assert on CSS class names or DOM nesting that carries no meaning.
- Landing-page components (no Nuxt composables, no `<NuxtLink>`) can be
  mounted directly with `@vue/test-utils`'s `mount()`, run under
  `vitest.config.ts`. A component that needs Nuxt's runtime (auto-imported
  composables like `useAsyncData`/`queryCollection`, or `<NuxtLink>`/
  `<ContentRenderer>`) can't be exercised that way — testing one properly
  needs `@nuxt/test-utils`'s `mountSuspended`, which isn't a dependency yet
  (add it, with a reason in the PR body, before writing that kind of test).
  Don't reach for Nuxt runtime APIs in a component you intend to test with
  plain `mount()`.
- Run `make test` and `make check` before declaring a change done. Both must
  pass; `make generate` must also succeed for anything touching docs content,
  routing, or `nuxt.config.ts` — `make build` alone doesn't statically render
  `content/docs/`.
- CI runs generate plus tests, and a separate Check workflow runs `make format`
  and fails if it produced a diff. Run `make fix` before pushing.

## Markdown

- Markdown files are linted by `markdownlint-cli2`; see `.markdownlint.yaml`
  for the active rules (that file is the source of truth — currently a
  120-column wrap, MD033/MD041 disabled).
- Docs content in `content/docs/*.md` needs `title`, `description`, and
  `navigation: { title, order }` frontmatter — `order` controls sidebar/index
  ordering. Every doc must be reachable both from `/docs` (the index) and
  from another doc's nav, or it's effectively unlisted.
- Run `make fix` to apply the mechanical fixes, then reflow long lines by hand.

## Pull request and commit conventions (always follow this)

- **PR titles must use conventional commits format:** `type: description`
  - `feat:` — new feature
  - `fix:` — bug fix
  - `chore:` — maintenance, tooling, config
  - `refactor:` — code change with no behavior change
  - `docs:` — documentation only
  - `test:` — adding or fixing tests
  - `perf:` — performance improvement
  - `style:` — copy, layout, or visual change with no behavior change
- The description should be lowercase, imperative mood: `fix: add null check`
  not `Fix: Added null check`
- Include the issue number in the PR body (`Closes #N`), not the title
- Branch names should reflect the issue: `fix/123-short-description`,
  `feat/456-short-description`
- Fill out the PR template — what, why, and how it was tested. "How was this
  tested?" should name the targets you ran and the viewports you checked.
- Commits must be signed off (`git commit -s`).
- This repository keeps a linear history; one focused commit per PR is the
  norm.

## Deployment and generated code

- `main` deploys to GitHub Pages automatically. A merge is a publish — treat
  changes to `main` as user-facing.
- Do not manually edit generated artifacts or build outputs (`.output/`,
  `.nuxt/`, `.data/`, `coverage/`, `*.tsbuildinfo`, `node_modules/`). They are
  gitignored, except that `eslint.config.ts` and `tsconfig.json` deliberately
  import from `.nuxt/` — that's the standard Nuxt pattern (run `npm run
postinstall` / `nuxt prepare` to (re)generate it), not something to hand-copy
  or vendor in.
- Do not hand-edit `package-lock.json`; change `package.json` and let npm
  regenerate it.
- Only `NUXT_PUBLIC_`-prefixed environment variables reach client code.
  Anything else stays build-time only, and nothing secret belongs in either —
  the bundle is public.
- Scope manual edits to `app.vue`, `pages/`, `components/`, `content/docs/`,
  `data/`, `utils/`, `assets/`, `public/`, and intentional configuration files
  (`nuxt.config.ts`, `content.config.ts`, etc.).
