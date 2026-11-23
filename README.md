<div align="center">

# FreeLLMAPI Docker

_Portable, self-hosted LLM infrastructure for agentic software development_

[![Docker](https://img.shields.io/badge/Containerization-Docker-94e2d5?labelColor=181825&style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-f5c2e7?labelColor=181825&style=for-the-badge)
![Security](https://img.shields.io/badge/Security-Encrypted%20Vault-cba6f7?labelColor=181825&style=for-the-badge)
![Status](https://img.shields.io/badge/Status-In%20Development-a6e3a1?labelColor=181825&style=for-the-badge)

</div>

## About this project

**FreeLLMAPI Docker** is a self-hosted, portable environment for connecting coding agents to multiple hosted LLM providers through [FreeLLMAPI](https://github.com/tashfeenahmed/FreeLLMAPI). It builds FreeLLMAPI from pinned source instead of downloading a prebuilt application image.

The repository is **public by design**. Provider credentials and the dashboard administrator are stored in a Git-tracked, **encrypted** vault. Only the master password stays outside Git.

The intended repeatable workflow on a new machine is:

```text
git clone -> unlock vault -> docker compose up -> launch OpenCode
```

No manual provider registration or dashboard account creation is required on a fresh installation. Dashboard login remains enabled for administrative access.

## Features

- FreeLLMAPI source pinned using a Git submodule and built with Docker Compose.
- AES-256-GCM authenticated encryption and scrypt-based password derivation for the vault.
- Interactive commands to initialize the vault, add/update provider keys, inspect providers and unlock it.
- Declarative provisioning of provider keys and the first dashboard administrator.
- Persistent SQLite state stored inside the repository workspace and ignored by Git.
- Automatic discovery of gateway models and generation of **one** local OpenCode configuration.
- Linux/macOS shell and Windows PowerShell launchers.
- Local-only API binding to `127.0.0.1:3001`, unless deliberately changed.
- Node unit tests and GitHub Actions checks.

## Project structure

```text
freellmapi-docker/
├── upstream/             # Pinned FreeLLMAPI source (Git submodule)
├── tools/
│   ├── vault/            # Credential encryption and management
│   └── bootstrap/        # OpenCode and gateway initialization
├── vault/
│   └── credentials.enc.json  # Encrypted and Git-tracked (after initialization)
├── scripts/              # POSIX and PowerShell entrypoints
├── tests/                # Automated unit tests
├── docs/                 # Deployment and maintenance guide
├── .runtime/             # Generated locally; never committed
├── compose.yaml
└── README.md
```

## Prerequisites

- [Git](https://git-scm.com/)
- [Docker Engine + Compose](https://docs.docker.com/) on Linux, or Docker Desktop with Linux containers on macOS and Windows
- [OpenCode](https://opencode.ai/) installed on the host if you want to run the agent
- The vault master password, kept separately from GitHub

Docker downloads base images and dependencies during the first build. NVIDIA, OpenRouter, Hugging Face and other providers have their own quotas and terms.

## Installation

Clone the repository:

```bash
git clone https://github.com/badjavii/freellmapi-docker.git
cd freellmapi-docker
```

### First-time vault creation

If `vault/credentials.enc.json` does **not** exist yet, create it once and add your provider keys.

**Linux and macOS:**

```bash
./scripts/vault.sh init
./scripts/vault.sh add-key nvidia
./scripts/vault.sh add-key openrouter
```

**Windows PowerShell:**

```powershell
.\scripts\vault.ps1 init
.\scripts\vault.ps1 add-key nvidia
.\scripts\vault.ps1 add-key openrouter
```

The commands prompt interactively; provider keys and master passwords are not placed in shell arguments. Commit and push **only the encrypted** `vault/credentials.enc.json` after adding credentials.

### Start on any new machine

**Linux/macOS:**

```bash
./scripts/unlock.sh
docker compose up --build
```

**Windows PowerShell:**

```powershell
.\scripts\unlock.ps1
docker compose up --build
```

The unlock script checks out the pinned FreeLLMAPI submodule, prompts for the master password and prepares local runtime files. On startup, FreeLLMAPI imports the declared provider credentials and creates the first dashboard account if the database is new.

Once running, open **http://localhost:3001** to access the dashboard.

## OpenCode integration

The Compose `configure` service verifies imported provider records, reads the unified gateway key through authenticated API access, discovers available models, and creates `.runtime/opencode.json`.

It prints the API endpoint, model count and startup status in the logs **without revealing API keys**.

Run OpenCode from any software project with:

```bash
/path/to/freellmapi-docker/scripts/opencode.sh
```

Or on Windows:

```powershell
& "C:\path\to\freellmapi-docker\scripts\opencode.ps1"
```

The launcher keeps your current project directory, reads the existing generated file and passes the unified key through the process environment. It never overwrites your global OpenCode configuration.

An imported key is not necessarily a *working* key. Rate limits, provider validation, model availability and geographic eligibility still apply.

## Maintenance

Update an API key using `./scripts/vault.sh add-key <provider>` (or the PowerShell equivalent), commit the new encrypted vault and unlock it again before restarting the services.

Stop and remove containers without removing the local database:

```bash
docker compose down
```

Then run `./scripts/vault.sh lock` to delete locally decrypted configuration **after containers have stopped**.

Do not run `docker compose down -v` expecting it to back up the database. The database is kept in the local `.runtime/data/` workspace. Versioned credentials are portable, but SQLite usage history is not automatically synchronized between machines.

## Security

- The encrypted vault **is committed to Git**, including in this public repository.
- The master password and temporary decrypted configuration **are not committed**.
- Choose a long, unique master password; public vaults remain exposed to offline password guessing.
- Do not post raw API keys, the decrypted JSON, or the generated unified API key in issues, commits or logs.
- The dashboard remains authenticated; automatic administrator provisioning does not bypass login.
- Treat all third-party provider requests as external processing of the prompts or code you send.

More information is available in [the workflow guide](./docs/WORKFLOW.md).

## Credits

Designed and developed by **Badjavii**, junior developer.

Built around [FreeLLMAPI](https://github.com/tashfeenahmed/FreeLLMAPI), an independent open-source project. The upstream source and third-party dependencies retain their respective licenses.
