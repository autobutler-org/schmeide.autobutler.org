---
title: Glossary
description: The terms schmeide's docs, flags, and issue comments use
navigation:
  title: Glossary
  order: 13
---

# Glossary

The terms schmeide uses, in alphabetical order.

## activity log

The list of job states `schmeide dashboard` has seen, newest first. It lives in the dashboard's memory, keeps the newest
200 events, and starts over when the dashboard restarts.

## ask panel

The "Ask the factory" part of the dashboard. It sends your question and the page's current view to the claude CLI,
which runs with no tools. It can explain what the page shows; it cannot change anything.

## blocked-by

GitHub's issue-dependencies list, which schmeide reads to [stack pull requests](/docs/stacked-pull-requests). It is not
a key in `.schmeide/config.toml`.

## check_wait

A repo config key: how long a stacked pull request waits for the one below it to merge, under factory merge. It
defaults to two minutes and does not end the wait for the pull request's own checks.

## control node

The single `schmeide control` process. It receives GitHub webhooks, holds the job queue in an embedded NATS server with
JetStream, and mints a GitHub installation token for each job.

## dashboard

`schmeide dashboard`: a local web page for one steward that shows their runners, jobs, and activity log, with the ask
panel. It reads what `schmeide status` reads and changes nothing.

## factory merge

`automate.merge = "on"` in the repo config. After review passes, the runner waits for green checks and merges the pull
request, or adds it to the merge queue. Off by default.

## fix round

A fresh writer session that applies findings: after a review requests changes (with `automate.review_fix = "on"`), or
once after the first red check under factory merge. Each counts against `--max-review-rounds`.

## gate

The command the repo config requires to pass before a pull request is opened, such as `make check test`. A gate
failure is final and is not retried.

## harness

A coding-agent CLI schmeide drives: Claude Code or the Grok CLI. It must already be installed and logged in on the
runner machine.

## installation token

A short-lived GitHub App token the control node mints for one job, limited to that job's repository. The runner
refreshes it before it expires and revokes it when the job ends. Runners hold no long-lived GitHub credential.

## pending

The state of a job the control node has created and no runner has claimed yet.

## pool

The fallback queue for a job whose steward has no live runner. Runners started with `--pool` take pool jobs, after
their own.

## ready label

The label that marks an assigned issue as ready for the factory: `schmeide:ready` unless the operator set
`--ready-label`.

## registration

What a runner publishes about itself: its steward, host, harnesses, pool flag, and version. It is refreshed every
minute and is live for three minutes.

## restack

Rebasing a stacked pull request's branch so it follows its base as the pull request below it moves or merges.

## runner

A process on a machine with a harness installed and logged in. It connects out to the control node, takes its
steward's jobs one at a time, and takes each one to a pull request.

## session idle limit

How long a harness session may write no output before the runner cancels it: 15 minutes, with no flag or key.

## session timeout

The longest one harness session may run: `--session-timeout` on the runner, default two hours, overridden by the repo's
`session_timeout`.

## steward

The person who owns a job: the issue's assignee. Their runner works the job.

## worktree

The git worktree a runner creates for each job, on its own branch. The harness session, the gate, and review all run
in it.
