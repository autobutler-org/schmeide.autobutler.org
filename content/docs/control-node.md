---
title: Running a control node
description: Ports, TLS, storage, settings, and a reference deployment for the control node
navigation:
  title: Running a control node
  order: 9
---

# Running a control node

The control node is the one `schmeide control` process. It receives the GitHub App's webhooks, keeps the job queue in
an embedded NATS server with JetStream, and mints a GitHub installation token for each job a runner asks for. This page
is the contract for running it anywhere; it does not assume a cloud or an orchestrator.

## The image

Each `v*` release tag publishes `ghcr.io/autobutler-org/schmeide:<version>`, with the `v` dropped (tag `v0.0.5` is
image `0.0.5`), and moves `latest` to it. Pin an exact version in production and upgrade on purpose. The control node
warns when a runner reports a different version, so keep runners on the same release.

The image runs `schmeide` as its entrypoint, as the nonroot user (UID 65532). It serves the control node only; runners
need `git` and a harness, which the image does not have.

## Ports

| Port | Setting                                         | Protocol                  | Who connects                                     |
| ---- | ----------------------------------------------- | ------------------------- | ------------------------------------------------ |
| 8080 | `SCHMEIDE_HTTP_ADDR` (default `:8080`)          | plain HTTP                | GitHub, through your TLS-terminating proxy       |
| 4222 | `SCHMEIDE_NATS_ADDR` (default `127.0.0.1:4222`) | NATS, TLS when configured | Runners, `schmeide status`, `schmeide dashboard` |

Never expose 8080 directly. Put a TLS-terminating proxy in front of it and expose only the proxy's 443.

## NATS over TLS

NATS serves TLS itself; a proxy cannot sit in front of it, because a NATS client starts in plain text and upgrades
after the server's greeting. Set both:

- `SCHMEIDE_NATS_TLS_CERT_FILE`: the PEM certificate, with its chain.
- `SCHMEIDE_NATS_TLS_KEY_FILE`: the PEM private key.

With both set, NATS refuses plain connections. Setting only one is a startup error. Both files are read again on every
TLS handshake, so a renewed certificate is served without a restart.

Without TLS, the control node refuses to start when NATS listens beyond loopback, because steward tokens and every
job's GitHub token would cross the network in plain text. On a network you trust, such as a private container network
with no other tenants, `SCHMEIDE_ALLOW_PLAINTEXT_NATS=true` starts it anyway, with a warning.

Runners then use `--nats-url tls://<host>:4222`. The certificate must be valid for that host; runners verify it against
the system roots. For a private CA on Linux, point `SSL_CERT_FILE` at a bundle that includes it.

## Settings

Every setting is a flag, a `SCHMEIDE_*` environment variable, or a `name = value` line in a `--config` file. A flag
wins over the environment, which wins over the file. `schmeide control --help` is the full list.

Required:

| Variable                                                    | Value                                                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `SCHMEIDE_WEBHOOK_SECRET`                                   | The GitHub App's webhook secret.                                                         |
| `SCHMEIDE_GITHUB_APP_ID`                                    | The GitHub App's ID.                                                                     |
| `SCHMEIDE_GITHUB_APP_PRIVATE_KEY_FILE`                      | Path of the App's private key, mode 0600.                                                |
| `SCHMEIDE_RUNNER_TOKENS`                                    | Comma-separated `<steward login>:<token>` entries, one per steward.                      |
| `SCHMEIDE_ALLOWED_ORGS` or `SCHMEIDE_ALLOWED_INSTALLATIONS` | At least one: owner logins, or App installation IDs, whose repositories may create jobs. |

Optional:

| Variable                  | Default                                 | Value                                                                       |
| ------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `SCHMEIDE_HTTP_ADDR`      | `:8080`                                 | Webhook listener address.                                                   |
| `SCHMEIDE_NATS_ADDR`      | `127.0.0.1:4222`                        | NATS listen address. Use `0.0.0.0:4222` in a container.                     |
| `SCHMEIDE_DATA_DIR`       | `schmeide-data`; the image sets `/data` | Where JetStream keeps its files.                                            |
| `SCHMEIDE_READY_LABEL`    | `schmeide:ready`                        | The label that, with an assignee, makes an issue a job.                     |
| `SCHMEIDE_WEBHOOK_RATE`   | `1000`                                  | Webhook requests accepted per minute. More are rejected and publish no job. |
| `SCHMEIDE_DELIVERY_TTL`   | `10m`                                   | How long a delivery id is remembered, to drop replays.                      |
| `SCHMEIDE_GITHUB_API_URL` | `https://api.github.com`                | GitHub REST API base URL.                                                   |
| `SCHMEIDE_CONFIG`         | none                                    | Path of a config file, if you prefer one to variables.                      |

`schmeide doctor --github-app-private-key-file <path>` checks the key's mode on the control node, and `--fix` sets it
to 0600.

## Persistent storage

The data directory holds the job queue, the per-issue records that keep one job per issue, the stage records a
restarted runner resumes from, and the registrations and job states `schmeide status` shows. Put it on storage that
outlives the machine or container. UID 65532 must be able to write it: a fresh named volume already is; for a host
directory, run `sudo chown 65532:65532 /data`.

It grows slowly with the number of issues worked. The job stream keeps at most 100,000 jobs, the status stream keeps
the latest message per runner and per job, and a stage record is deleted when its job finishes.

Losing it loses queued jobs and in-progress resumption, and an issue that already had a job can get a second one.
Issues and pull requests on GitHub are unaffected; relabel an issue to queue it again.

For backups, a block-storage snapshot is crash-consistent, and JetStream recovers from it as from a power loss. For a
clean copy, stop the container, copy the directory, and start it again.

## Limits

None of these is configurable.

- Webhook bodies: 1 MiB for an `issues` event and 64 KiB for any other. A larger body answers 413. Subscribe the App to
  issues events only.
- NATS messages: 512 KiB each.
- NATS connections: 16 per steward, plus one for the control node. A runner holds one; `status` and `doctor` hold one
  briefly.

## Shutdown

On `SIGTERM` or `SIGINT`, the control node stops accepting webhooks, waits up to 10 seconds for requests in flight,
then stops NATS. Give the container longer than that to stop, for example `docker run --stop-timeout 30`.

While it is down, GitHub's deliveries fail and can be redelivered from the App's settings, and runners keep
reconnecting. A job a runner holds is offered again if its heartbeat lapses, and the runner resumes from its stage
record.

## Reference deployment: a VM with Caddy

One way to meet the contract, not the only one. One VM runs the control node container and Caddy:

- A persistent disk mounted at `/data`.
- Caddy reverse-proxies 443 to `127.0.0.1:8080` and gets a certificate from an ACME CA.
- NATS on 4222 serves the same certificate, read from Caddy's storage, mounted read-only. It picks up each renewal on
  the next handshake.
- The firewall opens 443 and 4222 only.

```text
schmeide.example.com {
 reverse_proxy 127.0.0.1:8080
}
```

The key in Caddy's storage must be readable by UID 65532. Then:

```sh
docker run -d --name schmeide --restart unless-stopped --stop-timeout 30 \
  -p 127.0.0.1:8080:8080 -p 4222:4222 \
  -v /data:/data \
  -v /etc/schmeide/github-app.pem:/run/secrets/github-app.pem:ro \
  -v /var/lib/caddy/certificates/acme-v02.api.letsencrypt.org-directory/schmeide.example.com:/run/tls:ro \
  -e SCHMEIDE_NATS_ADDR=0.0.0.0:4222 \
  -e SCHMEIDE_NATS_TLS_CERT_FILE=/run/tls/schmeide.example.com.crt \
  -e SCHMEIDE_NATS_TLS_KEY_FILE=/run/tls/schmeide.example.com.key \
  -e SCHMEIDE_GITHUB_APP_PRIVATE_KEY_FILE=/run/secrets/github-app.pem \
  --env-file /etc/schmeide/control.env \
  ghcr.io/autobutler-org/schmeide:0.0.5
```

`/etc/schmeide/control.env`, mode 0600, holds `SCHMEIDE_WEBHOOK_SECRET`, `SCHMEIDE_GITHUB_APP_ID`,
`SCHMEIDE_RUNNER_TOKENS`, and `SCHMEIDE_ALLOWED_ORGS`. Set the key file's owner and mode on the host, since a bind
mount keeps them:

```sh
sudo chown 65532:65532 /etc/schmeide/github-app.pem
sudo chmod 0600 /etc/schmeide/github-app.pem
```

## Adding a GitHub App permission later

The control node asks for every permission on every job token. After you add a permission to an existing App, the
installation's owner must accept it in the installation's settings before jobs get tokens again.
