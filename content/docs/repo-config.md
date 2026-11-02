---
title: Repo config
description: Every key in .schmeide/config.toml, its default, and the errors it can produce
navigation:
  title: Repo config
  order: 5
---

# Repo config

Each repository schmeide works on keeps its config in `.schmeide/config.toml` at the repository root. The file is TOML,
every value is a quoted string, and a key the file does not recognize is an error, so a typo fails loudly instead of
being ignored.

`schmeide init` writes a starting file for you.

## When it is read

The runner reads the file from the base branch before any harness session starts. A session therefore cannot change
the gate or switch on automation for itself.

A missing file, or any error below, fails the job at once: one comment on the issue names the file and the error, no
pull request opens, and the job is not retried. Push a fixed file, then remove `schmeide:ready` from the issue and add
it again to make a new job.

## A minimal file

```toml
gate = "make check test"
```

## A file that sets every key

```toml
gate = "make check test"
check_wait = "10m"
gate_timeout = "30m"
session_timeout = "2h"

[automate]
merge = "on"
review_fix = "on"
create_issues = "off"
```

## Keys

| Key                      | Required | Default when absent or empty                             |
| ------------------------ | -------- | -------------------------------------------------------- |
| `gate`                   | yes      | none; the file is rejected                               |
| `check_wait`             | no       | `2m`                                                     |
| `gate_timeout`           | no       | the runner's `--gate-timeout`, which defaults to `30m`   |
| `session_timeout`        | no       | the runner's `--session-timeout`, which defaults to `2h` |
| `automate.merge`         | no       | `"off"`: a person merges                                 |
| `automate.review_fix`    | no       | `"off"`: no fix rounds for review findings               |
| `automate.create_issues` | no       | `"off"`; nothing reads it yet                            |

### gate

The shell command a job must pass before schmeide opens a pull request. It is required; an absent or blank value is an
error. A failing gate fails the job and is not retried.

```toml
gate = "make check test"
```

The gate runs in a fresh worktree with a trimmed environment and a scratch `HOME` and `TMPDIR`, so untracked files
(`node_modules/`, `.dart_tool/`) and caches in the runner's home directory are not there. A gate that passes in your
own checkout can fail on every job. Have it resolve its own dependencies:

```toml
gate = "flutter pub get && make check test"
```

See [troubleshooting](/docs/troubleshooting#the-gate-fails-on-every-job) for how to diagnose this.

### check_wait

How long a stacked pull request waits for the one below it to merge, under factory merge. It does not end the wait for
this pull request's own checks; that wait runs until the pull request has merged. A positive Go duration such as `90s`,
`10m`, or `1h30m`. It only matters when `automate.merge = "on"`.

```toml
check_wait = "10m"
```

### gate_timeout

How long the gate may run before its process group is canceled and the job fails. A positive Go duration. Absent or
empty keeps the runner's `--gate-timeout`. A gate timeout is not retried.

### session_timeout

How long one harness session may run before its process group is canceled and the job fails. A positive Go duration.
Absent or empty keeps the runner's `--session-timeout`. A session timeout before the pull request opens counts toward
the runner's `--max-attempts`.

When the repo sets one of these timeouts, the repo value wins over the runner flag. A runner started with
`--gate-timeout 1h` uses one hour for a repo with no `gate_timeout`, and 30 minutes for a repo that sets
`gate_timeout = "30m"`.

## [automate]

The switches for what the factory does without a person. Every switch is `"on"` or `"off"`. Absent, empty, and blank
values mean `"off"`, so a repo with no `[automate]` table leaves every step after review to a person.

Any other value is an error, and values are case-sensitive: `"On"` and `"yes"` are rejected. An unknown key inside the
table is an error too.

### automate.merge

Whether the runner merges a pull request after review has passed and CI is green.

- `"off"` leaves the pull request for a person.
- `"on"` keeps the job running until the pull request has merged, either directly or through the base branch's merge
  queue. See [factory merge](/docs/review-and-merge#factory-merge) for the full rules.

A top-level `merge` key is no longer accepted. A file that still sets it is told to move it into `[automate]`.

### automate.review_fix

Whether the writer gets fix rounds for review findings.

- `"on"`: when the reviewer requests changes and a review round remains, a fresh worker session applies the findings,
  the gate runs again, and the same branch is pushed so the open pull request updates.
- `"off"`: the reviewer still runs and its result is reported. A request for changes fails the job, the comment says
  the review requested changes and `automate.review_fix` is off, and the pull request stays open for a person.

Factory merge happens only after review passes, so with `merge = "on"` and `review_fix = "off"` a rejected pull request
is not merged.

### automate.create_issues

Accepted ahead of the feature. schmeide does not create issues yet, and nothing reads this switch. It is validated like
the other switches.

## What has no repo key

The runner flags `--ack-wait`, `--stuck-after`, `--max-attempts`, `--max-review-rounds`, and the harness flags apply to
every repository a runner serves. See [running a runner](/docs/runners).

## Errors

Every rejected value produces an error that names the file and the key and shows a valid example:

```text
.schmeide/config.toml: check_wait = "soon" is not a positive duration; set a duration such as check_wait = "10m"
.schmeide/config.toml: gate_timeout = "0s" is not a positive duration; set a duration such as gate_timeout = "30m"
.schmeide/config.toml: automate.merge = "yes" is not a legal value; set automate.merge = "on" or automate.merge = "off"
.schmeide/config.toml: check_wait must be a quoted string; set it like check_wait = "10m"
.schmeide/config.toml: automate.review_fix must be a quoted string; set it like automate.review_fix = "on"
.schmeide/config.toml: unknown key(s) gaet; remove them or fix the spelling
.schmeide/config.toml: merge moved into [automate]; set it as [automate] merge = "on"
```
