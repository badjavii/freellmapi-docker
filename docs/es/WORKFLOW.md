# Flujo de desarrollo y despliegue

[Read this guide in English](../WORKFLOW.md)

FreeLLMAPI Docker está diseñado para ser portátil entre Linux, macOS y Windows.

## Requisitos previos

- Git.
- Docker Engine con Compose v2, o Docker Desktop.
- OpenCode instalado en la computadora donde se ejecutará el agente.
- Una contraseña maestra que solo conozcas tú.

El código fuente de FreeLLMAPI se fija mediante un submódulo Git. Los scripts de desbloqueo inicializan ese submódulo automáticamente.

## Configuración inicial del vault (una sola vez)

En Linux/macOS:

```sh
./scripts/vault.sh init
./scripts/vault.sh add-key nvidia
./scripts/vault.sh add-key openrouter
./scripts/unlock.sh
docker compose up --build
```

En Windows PowerShell:

```powershell
.\scripts\vault.ps1 init
.\scripts\vault.ps1 add-key nvidia
.\scripts\vault.ps1 add-key openrouter
.\scripts\unlock.ps1
docker compose up --build
```

Después de modificar las credenciales, crea un commit **únicamente** con `vault/credentials.enc.json`. Su contenido se cifra antes de guardarse. La contraseña maestra y `.runtime/` nunca se incluyen en Git.

## Instalación en una nueva computadora

```sh
git clone https://github.com/badjavii/freellmapi-docker.git
cd freellmapi-docker
./scripts/unlock.sh
docker compose up --build
```

En Windows, sustituye `./scripts/unlock.sh` por `.\scripts\unlock.ps1`.

No es necesario configurar manualmente el panel: el administrador y las claves de los proveedores se crean o importan al iniciar el servicio. El panel sigue requiriendo iniciar sesión para realizar tareas administrativas.

## Uso de OpenCode

Espera a que aparezcan las líneas `[freellmapi-setup] [OK]` en la salida de Compose.
Después ejecuta `./scripts/opencode.sh` (Linux/macOS) o `.\scripts\opencode.ps1` (Windows).

El lanzador lee **la única configuración generada** en `.runtime/opencode.json`, utiliza la clave unificada de la API local y no modifica la configuración global de OpenCode.

El catálogo de modelos es dinámico. Las claves de proveedores pueden importarse correctamente y aun así estar inválidas, limitadas por cuota o no disponibles en el proveedor. Si las solicitudes fallan, consulta los estados en el panel.

## Mantenimiento del vault

```sh
./scripts/vault.sh add-key huggingface
./scripts/vault.sh list
./scripts/vault.sh unlock
```

Después de desbloquear un vault actualizado, vuelve a ejecutar `docker compose up --build` para aplicar los cambios. No elimines el vault cifrado para evitar perder el estado protegido.

## Detener los servicios

```sh
docker compose down
./scripts/vault.sh lock
```

Detén los contenedores **antes** de bloquear el vault. El comando `lock` elimina la configuración descifrada y los archivos generados de OpenCode, pero no borra la base de datos SQLite.

## Seguridad y limitaciones

- Es un servicio de desarrollo local vinculado a `127.0.0.1:3001`. No expongas su puerto de API a Internet sin protección adicional.
- El vault cifrado puede incluirse en un repositorio **público**. Su contraseña debe ser larga y única.
- Los datos de ejecución permanecen dentro de la carpeta del proyecto, pero fuera del historial de Git.
- GitHub Actions utiliza credenciales ficticias; no se envían API keys reales a CI.
- Cada computadora nueva recibe una clave unificada de API generada por FreeLLMAPI. Los scripts de ejecución actualizan automáticamente el entorno de OpenCode.
- El historial de SQLite y los cambios realizados únicamente desde el panel no se transfieren mediante Git. El proyecto configura FreeLLMAPI a partir del vault cifrado, en lugar de sincronizar toda la base de datos SQLite.
- La primera compilación obtiene el código fuente de FreeLLMAPI mediante el submódulo y descarga imágenes base y dependencias npm.
- En Windows utiliza PowerShell y Docker Desktop con contenedores Linux.
- Ejecuta `docker compose up --build` desde la raíz del repositorio.
