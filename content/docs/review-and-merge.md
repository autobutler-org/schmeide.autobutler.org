---
title: Review and merge
description: Review rounds, fix rounds, factory merge, merge queues, and branch protection
navigation:
  title: Review and merge
  order: 6
---

# Review and merge

After the gate passes and the pull request is open, schmeide reviews the change. Whether it also merges is up to the
repository.

## Review rounds

The runner runs up to `--max-review-rounds` reviewer sessions (default 3) in the job's worktree. Each round is a fresh
session.

- **Who reviews.** The reviewer is the first ready harness other than the writer, so Grok reviews Claude Code's change
  when both are logged in on the runner. With one ready harness, it reviews its own change.
- **How it answers.** The reviewer writes `.schmeide/review.md` in the worktree. The runner reads it and removes it
  before any later commit, so the file never lands in the pull request.
- **A pass** finishes the review.
- **A request for changes** depends on `automate.review_fix`:
  - `"on"`, with a round left: a fresh worker session applies the findings, the gate runs again, and the same branch is
    pushed, so the open pull request updates. Then the next review round runs.
  - `"off"`: the job fails, the issue comment says the review requested changes and `automate.review_fix` is off, and
    the pull request stays open for a person.
- **Running out of rounds**, or a gate failure on a fix, comments on the issue and leaves the pull request open.

## Human merge

With `automate.merge` absent, empty, or `"off"` (the default), the job finishes once review passes. The pull request
stays open, and a person reviews and merges it.

## Factory merge

With `automate.merge = "on"`, the job stays in progress after review until the pull request has merged.

### Branch protection first

Before waiting on checks, the runner reads branch protection on the base branch.

- If it can read it and the branch requires one or more approving reviews, the job fails. The comment names that
  requirement, the pull request stays open, and nothing is merged or enqueued. The runner cannot supply that review.
- A 404 or a 403 on the read does not fail the job. The merge is attempted and GitHub still enforces its rules.
- Any other read failure fails the job, the comment says schmeide could not read branch protection, and the pull
  request stays open.

Required status checks are fine; they are what the runner waits for.

### Waiting for checks

The runner reads the head commit's check runs after one second, then backs off, doubling the pause up to 30 seconds,
and keeps reading until the pull request has merged.

| Check state                                              | Counts as                           |
| -------------------------------------------------------- | ----------------------------------- |
| Completed, `success`                                     | green                               |
| Completed, `skipped`                                     | green                               |
| Completed, `failure`, `cancelled`, `timed_out`, or empty | red                                 |
| Not completed                                            | pending                             |
| No check runs at all                                     | not green; the runner keeps polling |

A red check, an empty list, and a merge GitHub refuses do not finish the job; the next poll tries again.

### The CI fix round

The first red check runs one writer fix round, when a review round remains. The runner gives the session the failed
check's log, capped in size, and polling continues on the new head. The round counts against `--max-review-rounds`, and
there is no second one. A fix round that itself fails comments on the issue and leaves the pull request open.

### Merging

Green checks merge the pull request with a merge commit. When the base branch has a merge queue, green checks add the
pull request to the queue instead, and the job stays in progress until the queue merges it. Either way the job ends
`merged`.

A failure after the checks are green starts its comment with "CI is green, but", so a pull request that looks ready
says why it was not merged.

## Pull requests in a stack

A pull request stacked on another schmeide pull request merges bottom first. See
[stacked pull requests](/docs/stacked-pull-requests#merging-a-stack).
