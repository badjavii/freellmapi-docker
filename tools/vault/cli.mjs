import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadVault, saveVault, upsertProvider, atomicWrite, publicProviderSummary, cleanLocalVault } from "./core.mjs";

const ROOT = process.cwd();
const VAULT = path.join(ROOT, "vault", "credentials.enc.json");
const RUNTIME = path.join(ROOT, ".runtime");

function ask(prompt, hidden = false) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
      reject(new Error("Interactive terminal required (do not pipe your password)"));
      return;
    }
    process.stdout.write(prompt);
    let value = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = (error) => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error); else resolve(value);
    };
    const onData = chunk => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\r" || char === "\n") { finish(); return; }
        if (char === "\u0003") { finish(new Error("Cancelled")); return; }
        if (char === "\u007f" || char === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            if (!hidden) process.stdout.write("\b \b");
          }
        } else if (char >= " " && char !== "\u007f") {
          value += char;
          if (!hidden) process.stdout.write(char);
        }
      }
    };
    process.stdin.on("data", onData);
  });
}

async function master(confirm = false) {
  const password = await ask("Master password: ", true);
  if (confirm) {
    if (password.length < 14) throw new Error("Master password must contain at least 14 characters");
    const again = await ask("Confirm master password: ", true);
    if (password !== again) throw new Error("Passwords do not match");
  }
  return password;
}

function unlockFiles(config) {
  fs.mkdirSync(RUNTIME, { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(RUNTIME, "data"), { recursive: true, mode: 0o700 });
  const providers = {
    admin: config.admin,
    keys: config.keys,
    routing: config.routing
  };
  atomicWrite(path.join(RUNTIME, "providers.json"), JSON.stringify(providers, null, 2) + "\n");
  atomicWrite(path.join(RUNTIME, "app.env"), "ENCRYPTION_KEY=" + config.encryptionKey + "\n");
  const uid = typeof process.getuid === "function" ? process.getuid() : 1000;
  const gid = typeof process.getgid === "function" ? process.getgid() : 1000;
  atomicWrite(path.join(ROOT, ".env"), "HOST_UID=" + uid + "\nHOST_GID=" + gid + "\nPORT=3001\n");
  console.log("[OK] Vault decrypted; runtime files generated inside .runtime/");
  console.log("[OK] " + config.keys.length + " provider credential(s) staged (not yet validated upstream)");
  console.log("[OK] FreeLLMAPI admin and encryption key staged");
  console.log("Next: docker compose up -d --build");
}

async function main() {
  const command = process.argv[2] ?? "help";
  if (command === "init") {
    if (fs.existsSync(VAULT)) throw new Error("Vault exists: use add-key or unlock");
    const password = await master(true);
    const email = (await ask("Dashboard admin email: ")).trim();
    const adminPassword = await ask("Dashboard admin password (8+ chars): ", true);
    const config = {
      encryptionKey: crypto.randomBytes(32).toString("hex"),
      admin: { email, password: adminPassword },
      keys: [],
      routing: { strategy: "balanced" }
    };
    saveVault(VAULT, config, password);
    console.log("[OK] Encrypted vault initialized (commit vault/credentials.enc.json)");
    return;
  }
  if (command === "add-key") {
    if (!fs.existsSync(VAULT)) throw new Error("Initialize vault first");
    const password = await master();
    const config = loadVault(VAULT, password);
    const platform = (process.argv[3] || await ask("Provider platform (nvidia/openrouter/huggingface/google): ")).trim().toLowerCase();
    const label = (await ask("Key label: ")).trim();
    const key = (await ask("Provider API key (hidden): ", true)).trim();
    upsertProvider(config, { platform, label, key });
    saveVault(VAULT, config, password);
    console.log("[OK] Encrypted credential added/updated: " + platform + "/" + label);
    return;
  }
  if (command === "unlock") {
    if (!fs.existsSync(VAULT)) throw new Error("Initialize vault first");
    unlockFiles(loadVault(VAULT, await master()));
    return;
  }
  if (command === "list") {
    const config = loadVault(VAULT, await master());
    console.log(JSON.stringify(publicProviderSummary(config), null, 2));
    return;
  }
  if (command === "clean") {
    console.log("[WARNING] This deletes the encrypted vault AND all local runtime data, including SQLite history.");
    console.log("[WARNING] Stop the stack with docker compose down and back up anything you need first.");
    const confirmation = await ask("Type CLEAN to continue: ");
    if (confirmation !== "CLEAN") {
      console.log("[INFO] Cleanup cancelled; nothing was deleted.");
      return;
    }
    cleanLocalVault(ROOT);
    console.log("[OK] Local vault and runtime state cleaned. The repository and Git history are unchanged.");
    console.log("Next: ./scripts/vault.sh init (or .\\scripts\\vault.ps1 init on Windows).");
    return;
  }
  if (command === "lock") {
    for (const name of ["providers.json", "app.env", "opencode.json"]) {
      fs.rmSync(path.join(RUNTIME, name), { force: true });
    }
    fs.rmSync(path.join(ROOT, ".env"), { force: true });
    console.log("[OK] Local decrypted configuration locked. Encrypted vault retained.");
    return;
  }
  if (command === "help") {
    console.log("Vault commands: init | add-key [platform] | unlock | list | lock | clean");
    return;
  }
  throw new Error("Unknown command: " + command);
}

main().catch(err => { console.error("[ERROR] " + err.message); process.exitCode = 1; });
