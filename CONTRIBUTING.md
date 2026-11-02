# Contributing

This repository is the site for [schmeide](https://github.com/autobutler-org/schmeide). Bugs in schmeide itself belong
in the [schmeide repository](https://github.com/autobutler-org/schmeide/issues/new/choose); this one is for the website
and its docs.

## Before you start

Make sure your git config (`user.name` and `user.email`) matches your GitHub profile, and sign off your commits with
`git commit -s`. Then:

```sh
make setup   # install nvm, the Node version in .nvmrc, and dependencies
make serve   # Nuxt dev server with hot reload
```

## The workflow

1. Branch off `main`.
2. Open a pull request with a brief description of what changed and why.
3. A maintainer reviews it.

One focused commit per pull request is the norm. `main` deploys to GitHub Pages automatically: a merge is a publish.

PR titles use conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`, `style:`.
Lowercase, imperative mood. Put the issue number in the body (`Closes #N`), not the title.

## Checks

Run `make check` and `make test` before you push, and `make generate` for anything that touches docs, routing, or
`nuxt.config.ts`. `make fix` handles most lint and format complaints.

[`AGENTS.md`](AGENTS.md) has the conventions in detail. It applies to humans as much as to agents.

## Changing what the site says

Landing-page strings live in `data/copy.ts`. Docs prose lives in `content/docs/*.md`.

Only describe what schmeide actually ships. Check the schmeide repository's `README.md`, `docs/`, and
`docs/user-journeys/` first, and quote user-visible strings exactly as schmeide emits them.
