---
title: What schmeide is
description: The pieces of schmeide, who does what, and what it does not do
navigation:
  title: Overview
  order: 1
---

# What schmeide is

schmeide is a software factory. It takes a GitHub issue that is assigned and labeled ready, has a coding agent write
the change on a runner you control, runs your repository's own checks, opens a pull request, and has a second agent
session review it. By default a person presses merge.

Everything is one Go binary, `schmeide`, with a command for each role.

## The pieces

| Piece        | Command                 | What it does                                                                                                                                                   |
| ------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Control node | `schmeide control`      | Receives the schmeide GitHub App's webhooks, keeps the job queue in an embedded NATS server with JetStream, and mints a short-lived GitHub token for each job. |
| Runner       | `schmeide runner`       | Connects out to the control node, takes one steward's jobs one at a time, and drives Claude Code or the Grok CLI in a git worktree.                            |
| GitHub App   | none                    | The identity schmeide acts as. It sends issue events to the control node, and its installation tokens push branches and open pull requests.                    |
| Repo config  | `.schmeide/config.toml` | Lives in each target repository. Names the gate command and switches each automated step on or off.                                                            |

There is one control node. There can be many runners, on many machines.

## Who does what

- **The steward** is the person who owns a job: the issue's assignee. Each steward runs their own runner, on a machine
  where Claude Code or the Grok CLI is already installed and logged in. schmeide never handles an agent API key.
- **The operator** runs the control node, holds the GitHub App's private key, and hands each steward a NATS token.
- **The repo maintainer** commits `.schmeide/config.toml`, which decides the gate and what happens without a person.

## What happens to an issue

1. Someone assigns an open issue to a steward and adds the `schmeide:ready` label, in either order.
2. The control node turns that into one job on the steward's queue.
3. The steward's runner checks out a fresh worktree on a branch named `<issue number>_<short-description>` and runs a
   harness session from the issue's title and body.
4. The runner runs the repo's gate. If it passes, the runner pushes the branch and opens a pull request as the App.
5. A fresh reviewer session checks the change. It can pass it or request changes.
6. The pull request waits for a person, unless the repo turned on factory merge.

[How a job runs](/docs/job-lifecycle) covers each step and what happens when one fails.

## What it does not do

- **No container isolation.** A job runs in a git worktree on the runner's host, as the user that started the
  runner, with that machine's toolchains. Run the runner as a user that holds nothing else worth taking.
- **No agent credentials.** Claude Code and the Grok CLI use whatever login already exists on the runner machine.
- **No automatic merge by default.** Each repository opts in with `automate.merge = "on"`.
- **No issue creation.** The `automate.create_issues` switch is accepted ahead of the feature, and nothing reads it.
- **No GitHub App setup.** Creating the App is manual; the [quickstart](/docs/quickstart) walks through it.

## Where next

- New to schmeide: the [quickstart](/docs/quickstart), from nothing to one pull request.
- How a task flows, what a ready issue looks like, and how labels are used: [architecture](/docs/architecture).
- Adding a repository: [repo config](/docs/repo-config).
- Running it for a team: [running a control node](/docs/control-node) and [running a runner](/docs/runners).
- A word you do not recognize: the [glossary](/docs/glossary).
