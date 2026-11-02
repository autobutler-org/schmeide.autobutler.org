---
title: Quickstart
description: From nothing to one pull request opened by schmeide, on a single machine
navigation:
  title: Quickstart
  order: 2
---

# Quickstart

This takes you from nothing to one pull request opened by schmeide, with one control node and one runner on the same
machine. Every flag is listed by `schmeide --help` and `schmeide <command> --help`.

The schmeide GitHub App is already installed on autobutler-org. This guide is for setting schmeide up in another org,
with an App of your own.

## What you need

- A GitHub org you can add an App to, and a repository in it.
- A public HTTPS URL that reaches this machine. The webhook listener is plain HTTP, so put a TLS-terminating proxy in
  front of it.
- `git` on `PATH`, and `gh` on `PATH` and logged in.
- One harness, Claude Code or the Grok CLI, installed and logged in.
- The `schmeide` binary.

## 1. Install schmeide

From a clone of the repository, `make install` builds the binary with its version stamp and writes it to `GOBIN`, or
to `GOPATH/bin` (usually `~/go/bin`) when `GOBIN` is unset. That directory has to be on your `PATH`.

To install a tagged release without cloning:

```sh
go install github.com/autobutler-org/schmeide/cmd/schmeide@v0.0.5
```

Check it with `schmeide version`.

## 2. Create the GitHub App

In the org, open Settings, Developer settings, GitHub Apps, New GitHub App.

- **Webhook URL:** `https://<your-host>/webhook`.
- **Webhook secret:** a long random string. Keep it; the control node needs the same value.
- **Repository permissions:**

  | Permission     | Access         | Why                                                  |
  | -------------- | -------------- | ---------------------------------------------------- |
  | Contents       | Read and write | Push the job's branch.                               |
  | Pull requests  | Read and write | Open and update the pull request.                    |
  | Issues         | Read and write | Comment on the issue with the outcome.               |
  | Workflows      | Read and write | Let a push change files under `.github/workflows`.   |
  | Merge queues   | Read and write | Add a pull request to the base branch's merge queue. |
  | Checks         | Read-only      | Read check runs before a factory merge.              |
  | Administration | Read-only      | Read branch protection before a factory merge.       |
  | Actions        | Read-only      | Read a failed job's log for a CI fix round.          |

  The control node asks for all eight on every job token. GitHub refuses the token when the App lacks any of them, so
  every job waits until the App has them.

- **Subscribe to events:** Issues.

Create the App and note its **App ID**. Generate a **private key** and save the `.pem` file. Install the App on your
org, on the repository you will test with.

The private key must not be readable by group or other, or the control node refuses to start:

```sh
chmod 0600 /path/to/app.pem
```

## 3. Add the repo config

In a checkout of the target repository, `schmeide init` writes `.schmeide/config.toml` and `.schmeide/control.conf`.
It refuses to overwrite either file. `.schmeide/control.conf` is an operator config with placeholders, mode 0600: do
not commit it with real secrets.

The repository needs `.schmeide/config.toml` on its default branch. A minimal one:

```toml
# Required. The command a job must pass before a pull request is opened.
gate = "make check test"

# Optional. Every switch defaults to "off".
[automate]
# "on" lets the factory merge after review and green checks.
merge = "off"
# "on" gives the writer fix rounds for review findings.
review_fix = "off"
```

`gate` is required, and unknown keys are an error. Every key is on the [repo config](/docs/repo-config) page.

## 4. Start the control node

The webhook secret, App ID, key file, runner tokens, and an allowlist are all required. Put secrets in the environment
so they stay out of the process list.

```sh
export SCHMEIDE_WEBHOOK_SECRET=...
export SCHMEIDE_GITHUB_APP_ID=...
export SCHMEIDE_GITHUB_APP_PRIVATE_KEY_FILE=/path/to/app.pem
export SCHMEIDE_RUNNER_TOKENS='octocat:a-token-for-octocat'
export SCHMEIDE_ALLOWED_ORGS=your-org
schmeide control
```

`SCHMEIDE_RUNNER_TOKENS` is a comma-separated list of `<github login>:<token>`, one entry per steward. Make each token
a long random string. The allowlist must not be empty: set `SCHMEIDE_ALLOWED_ORGS`, `SCHMEIDE_ALLOWED_INSTALLATIONS`,
or both.

The webhook listener serves `POST /webhook` on `:8080`. Point your TLS proxy at it. Runners connect to NATS on
`127.0.0.1:4222`. For runners on other machines, see [running a control node](/docs/control-node).

## 5. Check the machine, then start the runner

In another terminal, with the login and token from the previous step:

```sh
export SCHMEIDE_STEWARD=octocat
export SCHMEIDE_NATS_TOKEN=a-token-for-octocat
schmeide doctor
```

`schmeide doctor` checks `git`, `gh`, free disk, each harness, and that the control node answers for that steward.
Each failed check says how to fix it. When it passes:

```sh
schmeide runner
```

The first time a runner uses a work directory with a given origin, it asks on its terminal whether to trust that
pair, and stores a yes. An unattended runner needs `SCHMEIDE_TRUST=1` instead; see [running a runner](/docs/runners).

## 6. Get one pull request

On an open issue in the repository, assign it to the steward's login (`octocat` above) and add the label
`schmeide:ready`. Both are needed, in either order.

The webhook creates one job. The runner takes it, works on a branch named `<issue number>_<short-description>`, runs
the gate, then pushes and opens a pull request as the App. A review session follows. With the default `merge`, a
person presses merge.

Watch it with `schmeide status`, or open the local [dashboard](/docs/status-and-dashboard).

## Shell completion

`schmeide completion <shell>` prints a completion script to stdout.

```sh
# bash: add to ~/.bashrc
source <(schmeide completion bash)

# zsh: add to ~/.zshrc, after compinit
source <(schmeide completion zsh)

# fish
schmeide completion fish > ~/.config/fish/completions/schmeide.fish
```

## If nothing happens

- **The control node will not start:** check the allowlist is set and the key file is mode 0600.
- **No job after labeling:** check the delivery in the App's Advanced tab, and that the issue is assigned, labeled,
  and in an allowed org.
- **The gate fails on every job:** the gate runs in a fresh worktree with a scratch home directory. See
  [troubleshooting](/docs/troubleshooting#the-gate-fails-on-every-job).
