# Development and deployment workflow

[Leer esta guía en español](./es/WORKFLOW.md)

FreeLLMAPI Docker is intended to be portable across Linux, macOS, and Windows.

## Prerequisites

- Git
- Docker Engine with Compose v2, or Docker Desktop
- OpenCode installed on the machine where the agent will run
- A master password known only to you

The FreeLLMAPI source is pinned as an upstream Git submodule. Unlock scripts initialize that submodule automatically.

## First-time vault setup (once)

On Linux/macOS:

```sh
./scripts/vault.sh init
./scripts/vault.sh add-key nvidia
./scripts/vault.sh add-key openrouter
./scripts/unlock.sh
docker compose up --build
```

On Windows PowerShell:

```powershell
.\scripts\vault.ps1 init
.\scripts\vault.ps1 add-key nvidia
.\scripts\vault.ps1 add-key openrouter
.\scripts\unlock.ps1
docker compose up --build
```

Commit **only** `vault/credentials.enc.json` after changing credentials. It is encrypted before writing. The master password and `.runtime/` never enter Git.

## New machine

```sh
git clone https://github.com/badjavii/freellmapi-docker.git
cd freellmapi-docker
./scripts/unlock.sh
docker compose up --build
```

On Windows, replace `./scripts/unlock.sh` with `.\scripts\unlock.ps1`.

No dashboard setup is necessary: the administrator and provider keys are provisioned at service startup. The dashboard still requires login for administration.

## Using OpenCode

Wait for `[freellmapi-setup] [OK]` lines in Compose output.
Then run `./scripts/opencode.sh` (Linux/macOS), or `.\scripts\opencode.ps1` (Windows).

The launcher reads the **one generated** `.runtime/opencode.json`, uses the local unified API key, and does not modify OpenCode's global configuration.

The model catalog is dynamic. Provider keys can be successfully imported but remain invalid, rate-limited or unavailable upstream; inspect statuses in the dashboard when requests fail.

## Vault maintenance

```sh
./scripts/vault.sh add-key huggingface
./scripts/vault.sh list
./scripts/vault.sh unlock
```

Re-run `docker compose up --build` after unlocking an updated vault to apply changes. To avoid resetting the encrypted state, do not delete your vault.

## Stopping services

```sh
docker compose down
./scripts/vault.sh lock
```

Stop containers **before** locking. Lock removes decrypted configuration and the generated OpenCode files, but does not erase the SQLite database.

## Security and limitations

- This is a local development service bound to `127.0.0.1:3001`. Do not expose its API port publicly without additional protection.
- The encrypted vault may be committed to a **public** repository. Its passphrase must be long and unique.
- Runtime data stays inside the project folder but outside Git history.
- GitHub Actions uses dummy credentials; no real provider keys are uploaded to CI.
- A new machine receives a newly generated unified API key from FreeLLMAPI. Launch scripts refresh the OpenCode environment automatically.
- SQLite history and dashboard-only changes are not transported by Git. This project deliberately provisions configuration from the encrypted vault rather than syncing all of SQLite.
- The first build downloads FreeLLMAPI source through the submodule and downloads base images and npm dependencies.
- On Windows use PowerShell and Docker Desktop with Linux containers.
- `docker compose up --build` must be run from the repository root.
