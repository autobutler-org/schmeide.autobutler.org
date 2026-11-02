---
title: Architecture
description: How a task moves from a ready issue to a merged pull request, what a ready issue looks like, and how labels are used
navigation:
  title: Architecture
  order: 3
---

# Architecture

This page follows one task from start to finish: the issue a person writes, the label that makes it ready, the
control node that queues it, the runner that works it, and the review and merge that end it. Each diagram opens at full
size when you select it.

## The pieces

<a href="/assets/diagrams/system-light.svg" title="Open the full-size diagram">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/assets/diagrams/system-dark.svg">
    <img src="/assets/diagrams/system-light.svg"
      alt="Flowchart. A person assigns and labels a GitHub issue. The schmeide GitHub App sends a signed
      webhook to the control node, which publishes a job to JetStream. The steward runner takes the job,
      gets a per-job installation token from the control node, works in a git worktree with Claude Code or
      the Grok CLI, runs the repo gate, and pushes and opens a pull request as the App. Reviewer sessions
      then check the pull request, and a person or factory merge merges it."
      width="760" height="1432" loading="lazy">
  </picture>
</a>

| Piece                   | Runs where                 | Owns                                                                                          |
| ----------------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| GitHub issue            | GitHub                     | The task: its title and body are the brief the agent works from.                              |
| schmeide GitHub App     | GitHub                     | The identity schmeide acts as. It sends issue events and pushes as `schmeide[bot]`.           |
| Control node            | One host the operator runs | Webhook intake, the job queue (embedded NATS with JetStream), job status, and per-job tokens. |
| Runner                  | Each steward's machine     | The worktree, the agent sessions, the gate, the pull request, review, and merge.              |
| `.schmeide/config.toml` | The target repository      | The gate command and the automation switches.                                                 |

The runner always connects out to the control node. Nothing connects in to a runner, and runners hold no long-lived
GitHub credential: each job gets an installation token scoped to its one repository, refreshed before it expires and
revoked when the job ends.

## What a ready issue looks like

An issue is ready when it meets all of these at the moment a `labeled` or `assigned` event fires:

- **It is open.** Closed issues never become jobs.
- **It has an assignee.** The assignee is the [steward](/docs/glossary#steward): the job goes to their runners. With
  several assignees, the first one is the steward. A login containing `.`, `*`, `>`, or whitespace, or equal to
  `_pool`, cannot be a steward.
- **It carries the ready label**, `schmeide:ready` unless the operator set `--ready-label`.
- **It is in an allowed repository**: an org in `--allowed-orgs` or an installation in `--allowed-installations`.
- **The repository has `.schmeide/config.toml`** on the base branch with a `gate`. Without it the job fails at once
  with a comment naming the file and the error.

### Writing the issue

The agent sees exactly the issue's title and body, as they were in the delivery that created the job, plus the
issue number, the repository, the gate command, and a map of the repository's files. It does not get the issue's
comments or the issues it links to. So a ready issue is written as a brief:

- **One pull request's worth of work.** If it needs two pull requests, split it into two issues and connect them with
  blocked-by (see [stacked pull requests](/docs/stacked-pull-requests)).
- **A title that names the change.** The branch name, `{issue}_{short-description}`, comes from it.
- **Where to work.** Name the files, packages, or functions involved when you know them.
- **What done looks like.** Acceptance criteria the reviewer session can check, and the tests that should exist.
- **What not to touch.** Out-of-scope areas, compatibility that must hold.
- **Something the gate can prove.** By default the session cannot run commands; the gate is the first time the change
  is built and tested. A change the gate cannot check is a change only review will catch.

Finish editing before you add the label. Edits made after the job exists do not reach it.

A minimal ready issue:

```markdown
Title: add a --quiet flag to schmeide doctor

`schmeide doctor` prints every check. Add `--quiet`, which prints only the
checks that fail. The exit code does not change.

- Code: internal/doctor/doctor.go (Main, Usage), its tests beside it.
- --quiet with --json is a usage error (exit 2).
- Document the flag in the command's --help text.

Done when: a new test shows --quiet hides passing checks and keeps failing
ones, and the existing doctor tests still pass.
```

## How labels are used

schmeide reads exactly one label: the ready label. Every other label on the issue is ignored, and schmeide adds or
removes no labels itself.

| Action on the issue                                                                                      | Effect                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Add `schmeide:ready` to an open, assigned issue                                                          | Creates a job.                                                                                         |
| Assign an open issue that already has `schmeide:ready`                                                   | Creates a job.                                                                                         |
| Add any other label to an open, assigned, ready-labeled issue with no job yet                            | Creates a job, since the event is `labeled` and the ready label is present.                            |
| Add `schmeide:ready` to an issue with no assignee                                                        | Nothing. Assign it to create the job.                                                                  |
| Edit, reopen, or comment on the issue                                                                    | Nothing. Only `labeled` and `assigned` events count, and only someone with triage access can do those. |
| Remove `schmeide:ready` while a job runs                                                                 | Nothing. The job is not canceled.                                                                      |
| Any label or assignment change while the issue's job is queued, running, or finished with a pull request | Nothing: the control node answers `duplicate`. Reassigning does not move the job to another steward.   |
| Remove and re-add `schmeide:ready` after the job ended `failed` or `gate_failed`                         | A new job, from the issue's current title and body.                                                    |

The ready label is the switch, and the assignee is the routing. Because only labeled and assigned events count, an
issue's author cannot queue work by editing their own issue: someone with triage access decides.

## From webhook to queue

<a href="/assets/diagrams/readiness-light.svg" title="Open the full-size diagram">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/assets/diagrams/readiness-dark.svg">
    <img src="/assets/diagrams/readiness-light.svg"
      alt="Flowchart of webhook intake. An issues webhook that is unsigned, a replay, or over the rate limit is
      rejected. One that is not a labeled or assigned event on an open, assigned issue with the ready
      label is ignored, as is one from a repository outside the allowlist. If the issue last job is
      queued, running, or opened a pull request, the event is a duplicate and nothing is published.
      Otherwise, the job goes to the steward queue when the steward has a live runner, or to the pool
      queue when not, with status pending."
      width="742" height="1726" loading="lazy">
  </picture>
</a>

The control node keeps one record per issue in its data directory, so the duplicate check holds across restarts. A
GitHub delivery repeated within `--delivery-ttl` (default 10 minutes) is acknowledged and dropped before any of this.

A steward has a live runner when one of their runners registered in the last three minutes; runners refresh every
minute. Otherwise the job goes to the pool, where runners started with `--pool` take it after their own work.

## Start to finish

<a href="/assets/diagrams/sequence-light.svg" title="Open the full-size diagram">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/assets/diagrams/sequence-dark.svg">
    <img src="/assets/diagrams/sequence-light.svg"
      alt="Sequence diagram. A person assigns and labels an issue. GitHub sends the webhook to the control
      node, which verifies it, stores the job as pending, and delivers it to the runner. The runner
      reports claimed and gets a per-repository installation token that the control node mints from
      GitHub. The runner reads blocked-by to pick the base, creates the worktree, reads the repo config,
      and runs a writer session. It runs the gate, scans for secrets, pushes, and opens the pull request
      as the App. Up to max-review-rounds reviewer sessions follow, with fix sessions when changes are
      requested and review_fix is on. With automate.merge on, the runner waits for green checks and
      merges; otherwise it comments that the pull request is open. It reports the final status and revokes
      the token."
      width="1152" height="1743" loading="lazy">
  </picture>
</a>

Every arrow from the runner to GitHub uses the job's installation token. The stages after "Open PR" are recorded on the
control node, so a runner that restarts mid-job resumes at review instead of opening a second pull request. Each stage
and its failure paths are described in [how a job runs](/docs/job-lifecycle).

## Job states

<a href="/assets/diagrams/states-light.svg" title="Open the full-size diagram">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/assets/diagrams/states-dark.svg">
    <img src="/assets/diagrams/states-light.svg"
      alt="State diagram. A job starts pending when the issue is labeled and assigned, becomes claimed when a
      runner takes it, then working. From working it can go to retrying and back to claimed, to
      gate_failed, to failed, or to reviewing once the pull request opens. From reviewing it ends
      pr_opened, review_failed, merged, or merge_failed. Removing and re-adding schmeide:ready on a
      gate_failed or failed job returns it to pending."
      width="915" height="854" loading="lazy">
  </picture>
</a>

`schmeide status` and the [dashboard](/docs/status-and-dashboard) show these states. Only `failed` and `gate_failed`
end without a pull request, and only they can be restarted by relabeling. The others leave a pull request behind for a
person or record that it merged.

## Review and merge

<a href="/assets/diagrams/merge-light.svg" title="Open the full-size diagram">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/assets/diagrams/merge-dark.svg">
    <img src="/assets/diagrams/merge-light.svg"
      alt="Flowchart of review and merge. A fresh reviewer session gives a verdict. Changes with review_fix on
      and a round left run a fix session, the gate, and a push, then review again; otherwise the job ends
      review_failed with the pull request open. A pass with automate.merge off ends pr_opened for a person
      to merge. With merge on, branch protection that requires approvals ends merge_failed. A stacked pull
      request first waits up to check_wait for the one below to merge and restacks onto the default
      branch. The runner then polls check runs, running one CI fix round on the first red check, and on
      green adds the pull request to the merge queue or merges it with a merge commit, ending merged."
      width="942" height="2289" loading="lazy">
  </picture>
</a>

The rules behind each branch, including how check conclusions are counted, are in
[review and merge](/docs/review-and-merge).

## Where the diagrams come from

The diagrams are Mermaid sources in this site's `diagrams/` directory, rendered to SVG with `make diagrams`. The
schmeide repository's own `ARCHITECTURE.md` and `docs/architecture/` go further into packages, streams, subjects, and
credentials.
