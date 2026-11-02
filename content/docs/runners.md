---
title: Running a runner
description: Start a runner, check a machine with doctor, trust a work directory, and use pool runners
navigation:
  title: Running a runner
  order: 8
---

# Running a runner

A runner is the process that does the work. It runs on a machine where a coding agent is already installed and logged
in, connects out to the control node, and takes one steward's jobs one at a time. Nothing connects in to a runner, so it
can sit behind NAT on a laptop or a workstation.

## What a runner machine needs

- `git` on `PATH`.
- `gh` on `PATH` and logged in (`gh auth login`).
- At least 1 GiB free on the disk that holds the work directory.
- At least one harness installed and logged in: Claude Code (`claude`) or the Grok CLI (`grok`). schmeide uses the
  existing login and does not handle agent API keys.
- The toolchains the target repositories' gates need, such as Go, Node, or Flutter.
- The steward's NATS token from the operator, and the control node's NATS URL.

The control node's container image does not include `git` or a harness. Run runners from a binary: `make install`, or
`go install github.com/autobutler-org/schmeide/cmd/schmeide@<tag>`.

## Check the machine with doctor

```sh
export SCHMEIDE_STEWARD=octocat
export SCHMEIDE_NATS_TOKEN=...
export SCHMEIDE_NATS_URL=tls://schmeide.example.com:4222
schmeide doctor
```

| Check                                 | Fails when                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `git`                                 | git is not on `PATH`                                                                                                           |
| `gh`                                  | gh is not on `PATH`, or `gh auth status` fails                                                                                 |
| `disk`                                | less than 1 GiB is free on the disk holding the current directory                                                              |
| `harness claude-code`, `harness grok` | every harness fails; one passing is enough, and the other is reported as not selected                                          |
| `control node`                        | the control node does not answer for that steward and token                                                                    |
| `permission floor`                    | never; it states the floor                                                                                                     |
| `lint gate`                           | only when it cannot read the current directory; otherwise it reports a Makefile `check` target or a pre-commit config it finds |

Each failed check says how to fix it. The exit code is 0 when every check passes, and 1 otherwise. `--json` prints the
checks as a JSON list.

## Start the runner

```sh
schmeide runner
```

The runner registers under its steward with the harnesses it found, publishes that registration again every minute,
and waits for jobs. Stop it with Ctrl-C or `SIGTERM`; a job it holds is handed back for another runner.

Every flag has a `SCHMEIDE_<NAME>` environment variable, with hyphens turned into underscores. A flag wins over the
environment. An environment value that does not parse, such as a bad duration, stops the runner with exit code 2 and
a message naming the variable. Prefer the environment for `SCHMEIDE_NATS_TOKEN`, so the token stays out of the process
list.

## Trusting a work directory

Before the first job in a new pair of work directory and origin URL, the runner asks on its terminal whether to trust
that pair. A yes is stored under the user config directory, in `schmeide/trust`. A different origin asks again, even
for the same directory.

An unattended runner has no terminal to ask on. Set `SCHMEIDE_TRUST=1` to trust every pair for that run; it records
nothing. A run with no terminal, no recorded yes, and no `SCHMEIDE_TRUST=1` refuses the job.

## Pool runners

`--pool` (off by default) makes a runner a pool runner. It still takes its own steward's jobs first, and it also takes
jobs whose steward has no live runner.

A runner's registration is live for three minutes after the control node stored it, and a running runner refreshes it
every minute. So when a steward's runner has been stopped for more than three minutes, their next job is published on
the pool subject instead of waiting. Pool runners share one queue, and each still works one job at a time.

## Flags

| Flag                               | Default                                        | What it sets                                                             |
| ---------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `--steward`                        | required                                       | Your GitHub login. The runner only takes jobs for issues assigned to it. |
| `--nats-token`                     | none                                           | Your token from the control node's `--runner-tokens`.                    |
| `--nats-url`                       | `nats://127.0.0.1:4222`                        | The control node's NATS. Use `tls://<host>:4222` when it serves TLS.     |
| `--work-dir`                       | `schmeide-work`                                | Where clones, worktrees, and per-job scratch directories go.             |
| `--pool`                           | `false`                                        | Also take jobs whose steward has no live runner.                         |
| `--max-attempts`                   | `3`                                            | Failed work outcomes allowed before a job's failure is final.            |
| `--max-review-rounds`              | `3`                                            | Reviewer sessions per pull request, fix rounds included.                 |
| `--session-timeout`                | `2h`                                           | Longest one harness session may run. The repo's `session_timeout` wins.  |
| `--gate-timeout`                   | `30m`                                          | Longest the gate may run. The repo's `gate_timeout` wins.                |
| `--ack-wait`                       | `5m`                                           | Heartbeat lease. The runner heartbeats every third of it.                |
| `--stuck-after`                    | `3h`                                           | Time without a state change before the job is handed back.               |
| `--claude-args`                    | `--permission-mode acceptEdits`                | Flags for each Claude Code session.                                      |
| `--grok-args`                      | `--permission-mode acceptEdits`                | Flags for each Grok session.                                             |
| `--allow-dangerous-harness-args`   | `false`                                        | Accept harness flags that skip permission checks.                        |
| `--pass-env`                       | none                                           | Extra variable names the harness session sees.                           |
| `--gate-pass-env`                  | none                                           | Extra variable names the gate sees. A `SCHMEIDE_` name is refused.       |
| `--git-name`, `--git-email`        | `schmeide[bot]`                                | Commit author for the job's commits.                                     |
| `--github-url`, `--github-api-url` | `https://github.com`, `https://api.github.com` | Where repositories are cloned from and the REST API lives.               |

Give every runner that shares a queue, a steward's runners or all pool runners, the same `--ack-wait`. The first runner
to create the queue sets the lease; a runner with a different value logs a warning and heartbeats at the lease in
force.

## The environment a job sees

A harness session sees a short base list (`PATH`, `HOME`, `USER`, `LOGNAME`, `SHELL`, `TERM`, `LANG`, `TZ`, `TMPDIR`,
the proxy variables, `SSL_CERT_FILE`, `SSL_CERT_DIR`, and names starting with `LC_` or `XDG_`), plus names starting
with `ANTHROPIC_`, `CLAUDE_`, or `XAI_` so an existing login works, plus anything in `--pass-env`. It never sees the
runner's `SCHMEIDE_*` settings, including its NATS token.

The gate sees the same base list without the agent prefixes, plus `--gate-pass-env`. Its `HOME` and `TMPDIR` are a
scratch directory for that job, removed when the job ends. Go builds get a `GOCACHE` and `GOMODCACHE` that persist per
repository under the work directory; other toolchains do not. To share another cache across jobs, set its variable in
the runner's environment and list it, for example `--gate-pass-env PUB_CACHE`.

Never list a secret in `--pass-env` or `--gate-pass-env`. Both the session and the gate run as the user that started
the runner, so run it as a user that holds nothing else worth taking.
