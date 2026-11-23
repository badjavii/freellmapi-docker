<div align="center">

# FreeLLMAPI Docker

_Infraestructura de LLM portátil y autoalojada para el desarrollo de software con agentes_

[![Docker](https://img.shields.io/badge/Contenedores-Docker-94e2d5?labelColor=181825&style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
![Plataformas](https://img.shields.io/badge/Plataformas-Linux%20%7C%20macOS%20%7C%20Windows-f5c2e7?labelColor=181825&style=for-the-badge)
![Seguridad](https://img.shields.io/badge/Seguridad-Vault%20cifrado-cba6f7?labelColor=181825&style=for-the-badge)
![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-a6e3a1?labelColor=181825&style=for-the-badge)

[Read this README in English](../../README.md)

</div>

## Sobre el proyecto

**FreeLLMAPI Docker** es un entorno autoalojado y portátil para conectar agentes de programación con diversos proveedores de LLM alojados en la nube mediante [FreeLLMAPI](https://github.com/tashfeenahmed/FreeLLMAPI). Construye FreeLLMAPI a partir de una revisión fijada de su código fuente, en lugar de descargar una imagen de aplicación precompilada.

El repositorio es **público por diseño**. Las credenciales de los proveedores y las del administrador del panel se almacenan en un vault **cifrado** y versionado en Git. Solo la contraseña maestra permanece fuera de Git.

El flujo reproducible previsto para una computadora nueva es:

```text
git clone -> desbloquear vault -> docker compose up -> iniciar OpenCode
```

No es necesario registrar manualmente los proveedores ni crear una cuenta de administrador desde el panel en una instalación nueva. El inicio de sesión del panel se mantiene para las tareas administrativas.

## Funcionalidades

- Código fuente de FreeLLMAPI fijado mediante un submódulo Git y compilado con Docker Compose.
- Cifrado autenticado AES-256-GCM y derivación de claves mediante scrypt para el vault.
- Comandos interactivos para inicializar el vault, agregar o actualizar claves, consultar proveedores y desbloquearlo.
- Configuración declarativa de las claves de proveedores y del primer administrador del panel.
- Estado persistente en SQLite dentro de la carpeta del repositorio, excluido del seguimiento de Git.
- Descubrimiento automático de modelos disponibles en la pasarela y generación de **una única** configuración local de OpenCode.
- Scripts de shell para Linux/macOS y scripts PowerShell para Windows.
- API vinculada únicamente a `127.0.0.1:3001`, salvo modificación deliberada.
- Pruebas unitarias de Node.js y comprobaciones con GitHub Actions.

## Estructura del proyecto

```text
freellmapi-docker/
├── upstream/             # Código fuente fijado de FreeLLMAPI (submódulo Git)
├── tools/
│   ├── vault/            # Cifrado y gestión de credenciales
│   └── bootstrap/        # Inicialización de OpenCode y la pasarela
├── vault/
│   └── credentials.enc.json  # Cifrado y versionado en Git (tras inicializarlo)
├── scripts/              # Scripts de entrada POSIX y PowerShell
├── tests/                # Pruebas unitarias automatizadas
├── docs/                 # Guías de despliegue y mantenimiento
├── .runtime/             # Generado localmente; nunca incluido en commits
├── compose.yaml
└── README.md
```

## Requisitos previos

- [Git](https://git-scm.com/).
- [Docker Engine + Compose](https://docs.docker.com/) en Linux, o Docker Desktop con contenedores Linux en macOS y Windows.
- [OpenCode](https://opencode.ai/) instalado en el equipo anfitrión si se desea ejecutar el agente.
- La contraseña maestra del vault, conservada por separado de GitHub.

Durante la primera compilación, Docker descarga imágenes base y dependencias. NVIDIA, OpenRouter, Hugging Face y los demás proveedores tienen sus propias cuotas y condiciones.

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/badjavii/freellmapi-docker.git
cd freellmapi-docker
```

### Creación inicial del vault

Si todavía **no existe** `vault/credentials.enc.json`, créalo una sola vez y añade las claves de tus proveedores.

**Linux y macOS:**

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

Los comandos solicitan los datos de forma interactiva: las API keys y las contraseñas maestras no se pasan como argumentos de la terminal. Tras agregar las credenciales, crea un commit y haz push **únicamente del archivo cifrado** `vault/credentials.enc.json`.

### Arranque en una computadora nueva

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

El script de desbloqueo obtiene el submódulo de FreeLLMAPI en la revisión fijada, solicita la contraseña maestra y prepara los archivos locales de ejecución. Al arrancar, FreeLLMAPI importa las credenciales declaradas y crea la primera cuenta de administrador si la base de datos es nueva.

Con el servicio iniciado, abre **http://localhost:3001** para acceder al panel.

## Integración con OpenCode

El servicio `configure` de Compose verifica los registros de proveedores importados, obtiene la clave unificada de la pasarela mediante acceso autenticado, descubre los modelos disponibles y crea `.runtime/opencode.json`.

En los logs muestra la dirección de la API, la cantidad de modelos y el estado de arranque **sin revelar las API keys**.

Ejecuta OpenCode desde cualquier proyecto de software mediante:

```bash
/path/to/freellmapi-docker/scripts/opencode.sh
```

O en Windows:

```powershell
& "C:\path\to\freellmapi-docker\scripts\opencode.ps1"
```

El lanzador conserva el directorio de trabajo actual, lee el único archivo de configuración generado y pasa la clave unificada mediante el entorno del proceso. Nunca sobrescribe la configuración global de OpenCode.

Una clave importada no necesariamente es una clave *funcional*. Siguen aplicándose los límites de uso, la validación de proveedores, la disponibilidad de modelos y los requisitos de elegibilidad geográfica.

## Mantenimiento

Actualiza una API key utilizando `./scripts/vault.sh add-key <provider>` (o su equivalente en PowerShell), crea un commit con el nuevo vault cifrado y vuelve a desbloquearlo antes de reiniciar los servicios.

Detén y elimina los contenedores sin borrar la base de datos local:

```bash
docker compose down
```

Después ejecuta `./scripts/vault.sh lock` para eliminar la configuración descifrada localmente, **una vez detenidos los contenedores**.

No ejecutes `docker compose down -v` suponiendo que crea un respaldo de la base de datos. Esta se conserva en la carpeta local `.runtime/data/`. Las credenciales versionadas son portátiles, pero el historial de uso de SQLite no se sincroniza automáticamente entre computadoras.

## Seguridad

- El vault cifrado **sí se incluye en Git**, incluso en este repositorio público.
- La contraseña maestra y la configuración temporal descifrada **no se incluyen en los commits**.
- Utiliza una contraseña maestra larga y única; un vault público sigue expuesto a intentos de adivinar la contraseña fuera de línea.
- No publiques API keys en texto plano, el JSON descifrado ni la clave unificada generada en issues, commits o logs.
- El panel sigue requiriendo autenticación; la creación automática del administrador no evita el inicio de sesión.
- Considera que los proveedores externos procesarán las solicitudes o el código que les envíes.

Encontrarás más información en la [guía del flujo de trabajo](./WORKFLOW.md).

## Créditos

Diseñado y desarrollado por **Badjavii**, desarrollador junior.

Construido sobre [FreeLLMAPI](https://github.com/tashfeenahmed/FreeLLMAPI), un proyecto independiente de código abierto. Su código fuente y sus dependencias conservan sus respectivas licencias.
