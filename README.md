<div align="center">

# FreeLLMAPI Docker

_Portable, self-hosted LLM infrastructure for agentic software development_

[![Containerization](https://img.shields.io/badge/Containerization-Docker-94e2d5?labelColor=181825&style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-f5c2e7?labelColor=181825&style=for-the-badge)](https://docs.docker.com/)
![Security](https://img.shields.io/badge/Security-Encrypted%20Secrets%20(Planned)-cba6f7?labelColor=181825&style=for-the-badge)
![Status](https://img.shields.io/badge/Status-In%20Development-a6e3a1?labelColor=181825&style=for-the-badge)

</div>

## About this project

**FreeLLMAPI Docker** is a personal, self-hosted environment designed to run [FreeLLMAPI](https://github.com/tashfeenahmed/FreeLLMAPI) through Docker Compose and make it easier to use multiple LLM providers with agentic coding tools such as OpenCode.

The goal is to maintain a single private repository containing the deployment configuration, application source, and **encrypted** provider credentials. Cloning the repository on another computer should be enough to recreate the environment after supplying a master password and starting Docker.

The project targets **Linux, macOS, and Windows**. Cross-platform support and the encrypted credential workflow are development goals, not completed features yet.

## Planned features

- Build FreeLLMAPI from source included in the repository rather than depending on a prebuilt FreeLLMAPI image.
- Deploy the gateway and its dashboard with Docker Compose.
- Configure LLM providers such as NVIDIA, OpenRouter, and Hugging Face through declarative configuration.
- Store API keys and administrative credentials in a version-controlled, encrypted vault.
- Add and update credentials using a command-line utility protected by a master password.
- Initialize the dashboard administrator without repeating the account setup on every new installation.
- Keep the dashboard authentication enabled while avoiding repetitive provider setup.
- Persist application data locally and support encrypted backups and restoration.
- Provide startup workflows for Linux, macOS, and Windows.

## Planned architecture

```text
   OpenCode / Other API Clients
                  |
          FreeLLMAPI Gateway
           (Docker Compose)
                  |
      +-----------+------------+
      |           |            |
   NVIDIA     OpenRouter  Hugging Face ...

       Encrypted vault (Git-tracked)
                  |
            Master password
                  |
   Local decrypted configuration (Git-ignored)
                  |
           FreeLLMAPI startup
```

The vault password will **not** be committed to Git. Decrypted configuration and runtime data will also stay outside version control.

## Project structure

The following is the **target structure**; directories and files will be added as implementation progresses.

```text
freellmapi-docker/
├── upstream/          # FreeLLMAPI application source
├── vault/             # Encrypted secrets and vault tooling
├── config/            # Declarative configuration templates
├── scripts/           # Setup, startup, and maintenance scripts
├── compose.yaml       # Docker Compose services
├── .gitignore         # Local secrets and runtime exclusions
└── README.md          # Project documentation
```

## Installation

### Prerequisites

- [Git](https://git-scm.com/)
- [Docker Engine and Docker Compose](https://docs.docker.com/) on Linux, or Docker Desktop on macOS and Windows
- Access to this private repository
- A master password for unlocking the encrypted vault once implemented

### Clone the repository

```bash
git clone https://github.com/badjavii/freellmapi-docker.git
cd freellmapi-docker
```

The deployment scripts and Docker Compose setup are **not available yet**. Installation and first-run instructions will be added as those components are implemented.

## Security

- Provider API keys must never be committed in plaintext, even to a private repository.
- Only encrypted vault contents should be versioned; the master password remains outside Git.
- Decrypted files, environment secrets, database files, and backups containing sensitive information must be excluded from commits.
- The local dashboard should bind to `127.0.0.1` by default instead of being exposed to the public network.
- Dashboard authentication will remain enabled. Automatic administrator provisioning is separate from bypassing login.
- Access to a private repository alone does not replace encryption, secure backups, or credential rotation.

## Notes

- The project is currently in its initial development stage; the features above describe its intended scope.
- Docker may still download base images and build dependencies when building FreeLLMAPI from source for the first time.
- Application state, such as SQLite data and usage history, will require its own backup and restore mechanism; it is not automatically transported by cloning Git.
- Free-tier models and APIs are subject to the availability, regional requirements, and rate limits of their respective providers.

## Credits

Project designed and developed by **Badjavii**, junior developer.

Built around [FreeLLMAPI](https://github.com/tashfeenahmed/FreeLLMAPI), an independent open-source project. Its source code and dependencies remain subject to their respective licenses.
