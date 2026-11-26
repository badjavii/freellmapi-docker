# Development and deployment workflow

[Leer esta guía en español](./es/WORKFLOW.md)

FreeLLMAPI Docker is intended to be portable across Linux, macOS, and Windows.

## Prerequisites

- Git
- Docker Engine with Compose v2, or Docker Desktop
- OpenCode installed on the machine where the agent will run
- A master password known only to you

The FreeLLMAPI source is pinned as an upstream Git submodule. Unlock scripts initialize that submodule automatically.

## Clean the cloned vault and set up your own instance

The public repository includes its author's encrypted vault. **You do not need the original password.** To use your own provider keys and master password, stop the stack, clean local credentials and runtime data, and initialize your own vault:

**Linux/macOS:**

```sh
docker compose down
./scripts/vault.sh clean
./scripts/vault.sh init
./scripts/vault.sh add-key openrouter
```

**Windows PowerShell:**

```powershell
docker compose down
.\scripts\vault.ps1 clean
.\scripts\vault.ps1 init
.\scripts\vault.ps1 add-key openrouter
```

`clean` asks you to type `CLEAN` before deleting the local encrypted vault, `.runtime/` (including SQLite data), and `.env`. Back up anything important first. It leaves Git history and the project code untouched. Then add your other providers, unlock and run `docker compose up -d --build`.

If you want to publish your new encrypted vault, commit it **only to your own fork or repository**, never to the original author's project.

## First-time vault setup (once)

On Linux/macOS:

```sh
./scripts/vault.sh init
./scripts/vault.sh add-key nvidia
./scripts/vault.sh add-key openrouter
./scripts/unlock.sh
docker compose up -d --build
```

On Windows PowerShell:

```powershell
.\scripts\vault.ps1 init
.\scripts\vault.ps1 add-key nvidia
.\scripts\vault.ps1 add-key openrouter
.\scripts\unlock.ps1
docker compose up -d --build
```

Commit **only** `vault/credentials.enc.json` after changing credentials. It is encrypted before writing. The master password and `.runtime/` never enter Git.

## New machine

```sh
git clone https://github.com/badjavii/freellmapi-docker.git
cd freellmapi-docker
./scripts/unlock.sh
docker compose up -d --build
```

On Windows, replace `./scripts/unlock.sh` with `.\scripts\unlock.ps1`.

No dashboard setup is necessary: the administrator and provider keys are provisioned at service startup. The dashboard still requires login for administration.

## Using OpenCode

After detached startup, inspect the Compose initialization logs:

```sh
docker compose ps -a
docker compose logs configure
```

Check for `[freellmapi-setup] [OK]` lines.
Then run `./scripts/opencode.sh` (Linux/macOS), or `.\scripts\opencode.ps1` (Windows).

The launcher reads the **one generated** `.runtime/opencode.json`, uses the local unified API key, and does not modify OpenCode's global configuration.

The model catalog is dynamic. Provider keys can be successfully imported but remain invalid, rate-limited or unavailable upstream; inspect statuses in the dashboard when requests fail.

## Vault maintenance

```sh
./scripts/vault.sh add-key huggingface
./scripts/vault.sh list
./scripts/vault.sh unlock
```

Re-run `docker compose up -d --build` after unlocking an updated vault to apply changes. To avoid resetting the encrypted state, do not delete your vault.

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
- `docker compose up -d --build` must be run from the repository root.

## Troubleshooting an interrupted source checkout

If the initial clone stops after `Cloning into .../upstream`, the FreeLLMAPI source submodule has not finished downloading. Running `docker compose up -d --build` before this finishes produces a missing `upstream/Dockerfile` error.

Retry from the repository root:

```sh
git submodule update --init --recursive --depth 1 --progress
test -f upstream/Dockerfile
./scripts/unlock.sh
docker compose up -d --build
```

Shallow checkout downloads only the history needed to reach the pinned upstream revision. If the download still fails, inspect network access to GitHub and retry; do not delete the encrypted vault.
