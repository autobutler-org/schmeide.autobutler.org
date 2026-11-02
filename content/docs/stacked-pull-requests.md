---
title: Stacked pull requests
description: Build one issue on top of another with GitHub's issue dependencies
navigation:
  title: Stacked pull requests
  order: 6
---

# Stacked pull requests

When one issue builds on another that has not merged yet, schmeide can base the new pull request on the earlier one's
branch. You say which issue depends on which with GitHub's issue dependencies, the "blocked by" list on an issue. There
is no key for it in `.schmeide/config.toml`.

## How the base is chosen

When a job starts, the runner reads the issue's blocked-by list and keeps only the blockers that count:

- the blocker issue is open, and
- it has an open pull request whose head branch starts with `<blocker issue number>_`, the prefix schmeide gives its
  own branches.

A closed blocker, and an open blocker with no such pull request, do not count.

| Blockers that count                   | Base branch                        |
| ------------------------------------- | ---------------------------------- |
| None                                  | The repository's default branch    |
| One                                   | That blocker's pull request branch |
| Two or more, forming one linear chain | The branch at the top of the chain |
| Two or more, side by side             | None: the job fails                |

The worktree is created from the base branch, and the pull request opens against that same branch.

Blockers side by side, a diamond rather than a line, fail the job finally. The runner comments on the issue that they
are not one linear stack, does not open a pull request, and does not retry.

## An example

1. Issue #40 adds a table. Label it ready; schmeide opens a pull request from `40_add-table` into `main`.
2. Issue #41 adds a page that reads the table. Mark #41 as blocked by #40, then label it ready.
3. schmeide opens #41's pull request from `41_add-page` into `40_add-table`, so its diff shows only the new page.

## Merging a stack

With a person merging, merge from the bottom up, and retarget each pull request as GitHub prompts.

With `automate.merge = "on"`, the stack merges bottom first on its own:

- A stacked pull request first waits, for up to `check_wait` (default 2 minutes), for the pull request below it to
  merge. While it waits, it rebases onto that branch as the branch moves.
- Once the one below has merged, the runner retargets this pull request to the default branch, if GitHub has not
  already, and rebases it onto the default branch. The rebased branch is force-pushed with a lease.
- Then it waits for its own checks and merges, as in [factory merge](/docs/review-and-merge#factory-merge).

The pull request stays open, with a comment saying which, when:

- the one below has not merged within `check_wait`,
- the one below was closed without merging, or
- a rebase conflicts. The branch is left as it was, and the comment asks a person to rebase.

Raise `check_wait` in the repo config when the pull requests below take longer than two minutes to get through CI.
