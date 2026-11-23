import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const VAULT_VERSION = 1;
const N = 1 << 15;
const R = 8;
const P = 1;
const MAXMEM = 64 * 1024 * 1024;
const KDF_NAME = "scrypt";
const CIPHER_NAME = "aes-256-gcm";

export function validateConfig(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid vault data");
  if (!/^[\da-f]{64}$/i.test(value.encryptionKey ?? "")) throw new Error("Missing 32-byte FreeLLMAPI encryption key");
  if (typeof value.admin?.email !== "string" || !value.admin.email.includes("@")) throw new Error("Invalid admin email");
  if (typeof value.admin?.password !== "string" || value.admin.password.length < 8) throw new Error("Invalid admin password");
  if (!Array.isArray(value.keys)) throw new Error("Invalid provider key list");
  for (const item of value.keys) {
    if (!item || !/^[a-z0-9_-]+$/i.test(item.platform ?? "") || typeof item.key !== "string" || !item.key.trim()) {
      throw new Error("Invalid provider key");
    }
    if (typeof item.label !== "string" || !item.label.trim()) throw new Error("Provider key label required");
  }
  if (!value.routing || !["priority","balanced","smartest","fastest","reliable","custom","decision"].includes(value.routing.strategy)) {
    throw new Error("Invalid routing strategy");
  }
  return value;
}

function keyFor(password, salt) {
  if (typeof password !== "string" || password.length === 0) throw new Error("Master password required");
  return crypto.scryptSync(password, salt, 32, { N, r: R, p: P, maxmem: MAXMEM });
}

export function encryptConfig(input, password) {
  const data = validateConfig(structuredClone(input));
  const salt = crypto.randomBytes(16);
  const nonce = crypto.randomBytes(12);
  const key = keyFor(password, salt);
  try {
    const cipher = crypto.createCipheriv(CIPHER_NAME, key, nonce);
    const payload = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
    return {
      version: VAULT_VERSION,
      kdf: { name: KDF_NAME, N, r: R, p: P, salt: salt.toString("base64") },
      cipher: { name: CIPHER_NAME, nonce: nonce.toString("base64"), tag: cipher.getAuthTag().toString("base64") },
      ciphertext: payload.toString("base64")
    };
  } finally {
    key.fill(0);
  }
}

export function decryptConfig(envelope, password) {
  if (envelope?.version !== VAULT_VERSION ||
      envelope?.kdf?.name !== KDF_NAME || envelope.kdf.N !== N ||
      envelope.kdf.r !== R || envelope.kdf.p !== P ||
      envelope?.cipher?.name !== CIPHER_NAME) {
    throw new Error("Unknown or unsupported vault format");
  }
  const salt = Buffer.from(envelope.kdf.salt, "base64");
  const nonce = Buffer.from(envelope.cipher.nonce, "base64");
  const tag = Buffer.from(envelope.cipher.tag, "base64");
  if (salt.length !== 16 || nonce.length !== 12 || tag.length !== 16) throw new Error("Invalid vault metadata");
  const key = keyFor(password, salt);
  try {
    const decipher = crypto.createDecipheriv(CIPHER_NAME, key, nonce);
    decipher.setAuthTag(tag);
    const clear = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final()]);
    return validateConfig(JSON.parse(clear.toString("utf8")));
  } catch {
    throw new Error("Incorrect master password or damaged vault");
  } finally {
    key.fill(0);
  }
}

export function loadVault(filename, password) {
  return decryptConfig(JSON.parse(fs.readFileSync(filename, "utf8")), password);
}

export function atomicWrite(filename, contents) {
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const temporary = filename + "." + process.pid + ".tmp";
  try {
    fs.writeFileSync(temporary, contents, { mode: 0o600, flag: "wx" });
    fs.renameSync(temporary, filename);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function saveVault(filename, config, password) {
  atomicWrite(filename, JSON.stringify(encryptConfig(config, password), null, 2) + "\n");
}

export function upsertProvider(config, item) {
  validateConfig(config);
  if (!/^[a-z0-9_-]+$/i.test(item.platform) || !item.key.trim() || !item.label.trim()) {
    throw new Error("Invalid provider information");
  }
  const index = config.keys.findIndex(k => k.platform === item.platform && k.label === item.label);
  if (index >= 0) config.keys[index] = { ...item, enabled: true };
  else config.keys.push({ ...item, enabled: true });
  return config;
}

export function publicProviderSummary(config) {
  return config.keys.map(k => ({ platform: k.platform, label: k.label, enabled: k.enabled !== false }));
}
