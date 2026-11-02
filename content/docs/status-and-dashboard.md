---
title: Status and dashboard
description: See your runners and jobs with schmeide status, or on a local web page with schmeide dashboard
navigation:
  title: Status and dashboard
  order: 10
---

# Status and dashboard

Two commands show a steward what the factory is doing. Both connect to the control node's NATS as that steward, the
same way a runner does, and change nothing.

## schmeide status

```sh
schmeide status --steward octocat
```

It lists your registered runners and your jobs that are queued or running. A steward whose runner was started with
`--pool` also sees queued and running pool jobs. Other stewards' runners and jobs are not shown.

The jobs table has the columns `JOB`, `STATE`, `FOR`, and `DETAIL`. `FOR` is how long the job has been in its state, so
for a pending job it is how long the job has waited. `--json` prints one object with `runners` and `jobs` instead; each
job's `since` is when it entered its state.

If it cannot reach the control node, it says so and what to check:

```text
schmeide status: cannot reach the control node's NATS at nats://127.0.0.1:4222 as octocat: ...
```

## Job states

| State           | Meaning                                                                                     | Final |
| --------------- | ------------------------------------------------------------------------------------------- | ----- |
| `pending`       | Created by the control node; no runner has claimed it yet.                                  | no    |
| `claimed`       | A runner took it.                                                                           | no    |
| `working`       | The harness session or the gate is running.                                                 | no    |
| `retrying`      | An attempt failed and the job will be delivered again.                                      | no    |
| `reviewing`     | The pull request is open and review, or factory merge, is in progress.                      | no    |
| `pr_opened`     | The pull request is open and the job is done; a person merges.                              | yes   |
| `merged`        | Factory merge merged the pull request, directly or through the merge queue.                 | yes   |
| `gate_failed`   | The gate failed or timed out. Relabel the issue to try again.                               | yes   |
| `failed`        | The job failed before a pull request opened. Relabel the issue to try again.                | yes   |
| `review_failed` | Review requested changes it could not resolve, or rounds ran out. The pull request is open. | yes   |
| `merge_failed`  | Factory merge could not merge. The pull request is open.                                    | yes   |
| `queued`        | Recorded only by older runners that stopped after adding to a merge queue.                  | yes   |

## schmeide dashboard

```sh
schmeide dashboard --steward octocat
```

A local web page at `http://127.0.0.1:7878` showing your live runners, unfinished jobs, jobs finished in the last 24
hours, and an activity log of the states it has seen. It asks the control node for status every `--interval` (default
5 seconds).

| Flag           | Default                 | Effect                                                  |
| -------------- | ----------------------- | ------------------------------------------------------- |
| `--steward`    | required                | The GitHub login whose runners and jobs the page shows. |
| `--nats-url`   | `nats://127.0.0.1:4222` | The control node's NATS.                                |
| `--nats-token` | none                    | The steward's NATS token.                               |
| `--addr`       | `127.0.0.1:7878`        | Where the page is served.                               |
| `--interval`   | `5s`                    | How often to ask for status.                            |
| `--model`      | `sonnet`                | The claude model the ask panel uses.                    |
| `--claude`     | `claude`                | The claude executable the ask panel runs.               |

The activity log lives in the dashboard's memory. It keeps the newest 200 events and starts over when the dashboard
restarts. A state that came and went between two polls is not in it.

### The ask panel

"Ask the factory" sends your question, the conversation so far, and the page's current view to the claude CLI, which
runs with no tools. It can explain what the page shows; it cannot run commands, read files, or change anything. The rest
of the page works without claude installed.

It answers one question at a time. A second question while one is being answered gets
`another question is still being answered; wait for it and ask again`. A question with no answer within two minutes
shows an error in place of the answer.

### Keep it on loopback

The page has no login, and its ask panel runs on your claude account. On a loopback address, a request whose `Host` is
not a loopback name is refused. Any other `--addr` logs a warning at startup.

### When something is down

- No control node at startup: it exits 1 with `cannot reach the control node's NATS at <url> as <steward>`.
- A taken `--addr`: it exits 1 with `listen on <addr>: ...; pass a free address with --addr`.
- The control node stops answering later: the page shows `control node unreachable` with the last state it had, and
  the next good poll clears it.
- The dashboard process stops: an open page keeps its last view and shows `the dashboard process is not answering`.
