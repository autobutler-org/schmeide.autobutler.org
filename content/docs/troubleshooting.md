---
title: Troubleshooting
description: What to check when a job does not start, fails at the gate, stalls, or leaves a pull request open
navigation:
  title: Troubleshooting
  order: 11
---

# Troubleshooting

Start with the issue: schmeide comments on it with every outcome. Then `schmeide status` for the job's state, and the
runner's log for anything the comment leaves out, such as the gate's output.

## No job after labeling

- The issue must be open, have an assignee, and carry `schmeide:ready` (or the label the operator set with
  `--ready-label`).
- Its repository must be in an org or installation the control node allows.
- Check the delivery in the GitHub App's settings, under Advanced. A failed delivery can be redelivered from there.
- An issue keeps one job. If its last job is still running or opened a pull request, more labeling does nothing. If
  it ended `failed` or `gate_failed`, remove the label and add it again.
- The job goes to the assignee's runners. If the assignee has no live runner and nobody runs a `--pool` runner, the job
  waits as `pending`.

## The control node will not start

- The allowlist is empty: set `SCHMEIDE_ALLOWED_ORGS`, `SCHMEIDE_ALLOWED_INSTALLATIONS`, or both.
- The private key is readable by group or other: `chmod 0600` it, or run
  `schmeide doctor --github-app-private-key-file <path> --fix`.
- NATS listens beyond loopback without TLS: set both TLS files, or `SCHMEIDE_ALLOW_PLAINTEXT_NATS=true` on a network you
  trust.

## The gate fails on every job

If every job fails at the gate within minutes, whatever the issue asks for, suspect the runner's environment, not the
agent. The issue comment reads:

```text
schmeide did not open a pull request: the gate command `<gate>` failed: exit status 2. The gate's output is in the runner's log.
```

The output is in the runner's log, on the `gate failed` line, with the last 4000 bytes.

The gate runs in a fresh worktree with a trimmed environment and a scratch `HOME` and `TMPDIR`. So anything a toolchain
keeps in untracked files or the home directory is missing: `node_modules/`, `.dart_tool/` and `~/.pub-cache`, a Python
virtualenv, caches under `~/.cache`, and variables your shell profile sets. An SDK older than the version the repo pins
fails the same way.

To confirm, run the gate on unmodified `main` the way the runner does:

```sh
repo=$(mktemp -d) scratch=$(mktemp -d)
git clone -q --depth 1 https://github.com/<owner>/<repo> "$repo"
cd "$repo"
env -i PATH="$PATH" USER="$USER" LOGNAME="$LOGNAME" SHELL="$SHELL" \
  TERM="$TERM" LANG="$LANG" HOME="$scratch" TMPDIR="$scratch" \
  sh -c '<the gate from .schmeide/config.toml>'
```

If that fails, fix the environment:

- Make the gate resolve its own dependencies, for example `gate = "flutter pub get && make check test"`, or `npm ci`,
  `uv sync`, and so on. That also makes the gate pass in CI and any other fresh clone.
- Reuse a cache with `--gate-pass-env`: set `PUB_CACHE=$HOME/.pub-cache` in the runner's environment and start it with
  `--gate-pass-env PUB_CACHE`. Listing `HOME`, `TMPDIR`, or an `XDG_*_HOME` name has no effect.
- Keep the runner machine's SDKs at the versions the repo pins.

Then relabel each failed issue.

## Sessions edit files but run no commands

That is the default [permission floor](/docs/permissions). Under `--permission-mode acceptEdits`, Claude Code refuses
every Bash call, and the session's output shows "This command requires approval". The session cannot run the repo's
tests, so its mistakes surface at the gate. To change that, read [opting in](/docs/permissions#opting-in).

## A session stops with "produced no output for 15m0s"

A worker or reviewer session that writes nothing for 15 minutes is canceled, however much of its timeout is left. It
is handled like a session timeout: retried up to `--max-attempts` before the pull request opens, final after. The
runner's stderr shows each event of the session, including the last one before it went silent.

## A session sits until the two-hour timeout

Run `schmeide version` on the runner machine. A runner older than v0.0.3, started from an interactive terminal, could
have its sessions stopped by `SIGTTOU` until the session timeout fired. Upgrade the runner.

## "refusing to push"

The secret scan found a credential-shaped literal in the lines the job added, for example
`refusing to push: config.go:12 contains a GitHub token`. The message names the file, line, and kind, never the secret.
A refused push counts as an attempt, so the job is tried again up to `--max-attempts`. If the literal is a test fixture
or a false positive, the line needs `schmeide:allow-secret` on it: say so in the issue, then relabel it once the job
has failed.

## The pull request stays open

When schmeide stops with the pull request open, the issue comment starts with "schmeide failed this job and left the
pull request open" (or, for `review_fix` off, "schmeide left the pull request open for a person"), followed by the
reason.

| Reason in the comment                                                       | What to do                                                                   |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `the review requested changes and automate.review_fix is off`               | Fix it by hand, or turn `review_fix` on.                                     |
| `the review did not pass within N rounds`                                   | Read the last review and fix it by hand.                                     |
| `branch protection on <base> requires N approving review(s)`                | Approve and merge it yourself; schmeide cannot supply that review.           |
| `could not read branch protection on <base>`                                | Check the App's Administration permission.                                   |
| starts with `CI is green, but`                                              | Checks passed, then the merge or merge queue step failed; the rest says why. |
| `...which has not merged into <base> after waiting <duration> (check_wait)` | Merge the one below, or raise `check_wait`.                                  |
| `...closed without merging into <base>`                                     | Retarget the pull request by hand.                                           |
| `could not rebase <branch> onto <base>`                                     | Rebase the branch by hand.                                                   |

## A job is stuck as reviewing

Under factory merge, the job stays in progress until the pull request merges. A red check after the one fix round, a
head with no check runs, and a merge GitHub refuses all leave it waiting. Check the pull request's checks on GitHub.

## A runner disappears from status

A runner refreshes its registration every minute. One that cannot reach the control node for three minutes stops
counting as registered: `schmeide status` stops listing it, and its steward's next job goes to the pool. It comes back
when a refresh gets through. The runner logs `could not report to the control node` while it cannot.

## Tokens

When a job ends, the runner revokes its GitHub token. If GitHub refuses or does not answer within 30 seconds, the
runner logs `could not revoke the job's token; it expires within the hour`, and nothing else changes.
