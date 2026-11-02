---
title: Command reference
description: Every schmeide command, what it is for, and how flags and environment variables combine
navigation:
  title: Command reference
  order: 13
---

# Command reference

schmeide is one binary. Run `schmeide --help` for the list of commands, and `schmeide <command> --help` for a command's
flags with their defaults and environment variables.

| Command               | What it does                                                                                                | Runs on                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `schmeide control`    | Runs the control node: the webhook listener, the embedded NATS job queue, and per-job tokens.               | The control node host                                                      |
| `schmeide runner`     | Takes your jobs from the control node and opens a pull request for each.                                    | A steward's machine                                                        |
| `schmeide doctor`     | Checks that this machine can run a runner, and says how to fix what fails.                                  | A runner machine, or the control node with `--github-app-private-key-file` |
| `schmeide status`     | Shows your registered runners and your queued or running jobs.                                              | Anywhere that reaches NATS                                                 |
| `schmeide dashboard`  | Serves a local page of your runners and jobs, with a read-only ask panel.                                   | A steward's machine                                                        |
| `schmeide init`       | Writes `.schmeide/config.toml` and `.schmeide/control.conf` in the current directory. Refuses to overwrite. | A checkout of the target repo                                              |
| `schmeide completion` | Prints a completion script for `bash`, `zsh`, or `fish`.                                                    | Anywhere                                                                   |
| `schmeide version`    | Prints the version stamped into the binary.                                                                 | Anywhere                                                                   |

## Flags and the environment

Every flag has a `SCHMEIDE_<NAME>` environment variable, with the flag's hyphens turned into underscores:
`--webhook-secret` is `SCHMEIDE_WEBHOOK_SECRET`, `--nats-token` is `SCHMEIDE_NATS_TOKEN`.

- On `control`, a flag wins over the environment, which wins over the `--config` file. The config file is one
  `name = value` line per setting, named as the flags are.
- On `runner` and `doctor`, a flag wins over the environment. An environment value that does not parse for its flag (a
  duration, an integer, or a boolean) stops the command with exit code 2 and a message naming the variable.

Put tokens and secrets in the environment or the config file, so they stay out of the process list.

## Exit codes

| Code | Meaning                                                                                   |
| ---- | ----------------------------------------------------------------------------------------- |
| `0`  | Success.                                                                                  |
| `1`  | A runtime failure, such as the control node being unreachable, or a doctor check failing. |
| `2`  | A usage error, such as a missing required flag or a value that does not parse.            |

A usage error ends with a line such as `Run 'schmeide runner --help' for usage.`

## Where each command is documented

- `control`: [running a control node](/docs/control-node)
- `runner` and `doctor`: [running a runner](/docs/runners)
- `status` and `dashboard`: [status and dashboard](/docs/status-and-dashboard)
- `init`: [quickstart](/docs/quickstart) and [repo config](/docs/repo-config)
- `completion`: [quickstart](/docs/quickstart#shell-completion)
