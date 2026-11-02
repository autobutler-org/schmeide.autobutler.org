---
title: How a job runs
description: Every stage from a labeled issue to a finished job, and what happens when one fails
navigation:
  title: How a job runs
  order: 4
---

# How a job runs

A job is one issue on its way to a pull request. This page follows a job through every stage, in order, and says what
happens when a stage fails.

## 1. The issue becomes a job

The control node creates a job when an `issues` webhook arrives for an open issue that has an assignee and carries the
ready label (`schmeide:ready` unless the operator set `--ready-label`). Either an `assigned` or a `labeled` delivery
does it, so the order does not matter.

- The job stores the issue's title and body from that delivery. Editing the issue afterwards does not change a job
  that already exists.
- The issue's repository has to belong to an allowed org or installation. Anything else publishes no job.
- A delivery GitHub repeats within `--delivery-ttl` (default 10 minutes) is acknowledged and not published again.
- An issue keeps one job. While that job is queued, running, or finished with a pull request, more labels, a
  relabel, or a new assignee publish nothing. After a job ends `failed` or `gate_failed`, removing
  `schmeide:ready` and adding it again starts a new job from the issue's current title and body.

The job goes on the steward's subject, so only that steward's runners take it. If the steward has no live runner, the
job goes to the pool instead; see [pool runners](/docs/runners#pool-runners). Until a runner claims it, `schmeide
status` lists the job as `pending`, with how long it has waited.

## 2. A runner claims it

A runner works one job at a time. While it holds a job it sends a heartbeat every third of `--ack-wait` (default 5
minutes). If the heartbeats stop, for example because the runner died, JetStream offers the job again. If a job goes
`--stuck-after` (default 3 hours) without a state change, the runner cancels its work and hands it back.

Before the first job in a new pair of work directory and origin, the runner asks on its terminal whether to trust it.
See [running a runner](/docs/runners#trusting-a-work-directory).

## 3. The repo config is read

The runner reads `.schmeide/config.toml` from the base branch before any agent starts, so a session cannot change the
gate or switch on automation for itself. A missing or invalid file fails the job at once: one comment on the issue
names the file and the error, and no pull request opens. Fix the file, push it, and add the ready label again.

## 4. The worktree and branch

The runner clones the repository into its `--work-dir` (default `schmeide-work`) and creates a git worktree on a
branch named `<issue number>_<short-description>`. The worktree starts from the base branch: the default branch, or
the branch of the pull request this one stacks on (see [stacked pull requests](/docs/stacked-pull-requests)).

A git hook in the worktree stops the job from creating, moving, or deleting any other job's `<digits>_*` branch.

## 5. The writer session

The runner starts a fresh harness session with a brief built from the issue. It uses the first harness whose check
passes, and Claude Code is offered first, so Claude Code writes the change whenever it is usable.

- The session can edit files in its worktree. By default it cannot run commands; see [permissions](/docs/permissions).
- It stops after `--session-timeout` (default 2 hours), or `session_timeout` from the repo config.
- It is also stopped after 15 minutes with no output. The issue comment then says the session "produced no output for
  15m0s".

## 6. The gate

The runner runs the repo's `gate` command in the worktree, for example `make check test`.

- A failing gate fails the job and is not retried. The issue comment does not include the command's output; that stays
  in the runner's log.
- The gate stops after `--gate-timeout` (default 30 minutes), or `gate_timeout` from the repo config. A gate timeout is
  not retried either.
- The gate runs with a trimmed environment and a scratch `HOME` and `TMPDIR` that are removed when the job ends. A gate
  that passes in your own checkout can still fail here; see [troubleshooting](/docs/troubleshooting).

## 7. Push and pull request

Before `git push`, the runner scans the lines the job adds for credential-shaped literals: private keys, GitHub and
GitLab tokens, AWS access keys, JWTs, Anthropic and xAI API keys, and the runner's own tokens. A hit refuses the push
with a message such as `refusing to push: config.go:12 contains a GitHub token`, naming the file, line, and kind but
never the secret. A line containing `schmeide:allow-secret` is skipped, unless it holds one of the runner's own tokens.

Then the runner pushes the branch and opens a pull request as the GitHub App. Commits are authored as
`schmeide[bot]` unless `--git-name` and `--git-email` say otherwise.

## 8. Review

Once the pull request is open, the runner runs up to `--max-review-rounds` (default 3) reviewer sessions in the same
worktree. See [review and merge](/docs/review-and-merge) for how a review passes, requests changes, and leads to a fix
round.

## 9. Merge, or hand over

With `automate.merge` absent or `"off"`, the job finishes when review passes and the pull request waits for a person.
With `"on"`, the runner waits for green checks and merges it. See [factory merge](/docs/review-and-merge#factory-merge).

The outcome is reported to the control node and commented on the issue.

## Retries

A failure before the pull request is open, other than a gate failure, is tried again up to `--max-attempts` (default
3). The count is stored with the job's status, so a restarted runner continues from it rather than starting a fresh
budget.

These do not count as attempts: handing a job back because a token could not be minted, because the runner is shutting
down, or because `--stuck-after` found no state change.

A runner that restarts mid-job resumes from the job's stage record. A job whose record names an open pull request
resumes at review and does not open a second pull request. A job with no pull request starts over.

## What is final

| Failure                                                   | Retried                | Pull request |
| --------------------------------------------------------- | ---------------------- | ------------ |
| Missing or invalid repo config                            | No                     | None opens   |
| Gate fails or times out                                   | No                     | None opens   |
| Session times out or goes silent, before the pull request | Up to `--max-attempts` | None yet     |
| Secret scan refuses the push                              | Up to `--max-attempts` | None yet     |
| Review requests changes with `review_fix` off             | No                     | Left open    |
| Review rounds run out                                     | No                     | Left open    |
| Blockers that do not form one linear stack                | No                     | None opens   |
