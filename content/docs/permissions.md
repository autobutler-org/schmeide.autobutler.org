---
title: Permissions
description: The permission floor every agent session starts from, what the runner refuses, and how to opt in to more
navigation:
  title: Permissions
  order: 10
---

# Permissions

Every harness session starts from the same floor, for Claude Code and the Grok CLI alike:

- A session may edit files in its own worktree.
- A session is not handed flags that skip permission checks.

The default session flags hold that floor: both `--claude-args` and `--grok-args` default to
`--permission-mode acceptEdits`.

## What that means in practice

Sessions run in print mode, where no one can answer a permission prompt. Under `acceptEdits`, Claude Code refuses every
Bash tool call ("This command requires approval"). So by default a session edits files but cannot run the repository's
formatter, linter, or tests, and its mistakes show up only at the gate.

That is deliberate. The gate, not the session, decides whether a change is good enough to open a pull request.

## What the runner refuses

`schmeide runner` refuses to start when `--claude-args` or `--grok-args` contains either of these:

- `--dangerously-skip-permissions`, or `--allow-dangerously-skip-permissions`
- a `--permission-mode` other than `acceptEdits`, such as `bypassPermissions`

The error names the flag it found. Other flags, such as `--verbose`, are not refused.

## Opting in

Pass `--allow-dangerous-harness-args`, or set `SCHMEIDE_ALLOW_DANGEROUS_HARNESS_ARGS=true`, to accept those flags. For
example, to let Claude Code sessions run commands:

```sh
export SCHMEIDE_CLAUDE_ARGS="--permission-mode auto"
export SCHMEIDE_ALLOW_DANGEROUS_HARNESS_ARGS=true
schmeide runner
```

A session with skipped permission checks runs with every right of the runner's operating-system user. schmeide does
not add a sandbox, so run the runner as a user that holds nothing else worth taking: no SSH keys you care about, no
cloud credentials, no access to other projects.

`schmeide doctor` states the floor in its `permission floor` check. That check never fails.

## What schmeide itself holds

- **No agent keys.** Sessions use the login already on the runner machine, through `ANTHROPIC_`, `CLAUDE_`, and `XAI_`
  variables and the CLIs' own config.
- **No long-lived GitHub credential on runners.** Each job gets an installation token scoped to its one repository. The
  runner refreshes it when it is within five minutes of expiring and revokes it when the job ends. If the revoke fails,
  the runner logs `could not revoke the job's token; it expires within the hour`.
- **No runner settings inside a session.** The session and the gate never see `SCHMEIDE_*` variables, including the
  runner's NATS token.
