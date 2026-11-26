import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { encryptConfig, decryptConfig, upsertProvider, validateConfig, cleanLocalVault } from "../tools/vault/core.mjs";

const demo = () => ({
  encryptionKey: "a".repeat(64),
  admin: { email: "demo@example.com", password: "secure-test-password" },
  keys: [], routing: { strategy: "balanced" }
});
test("encrypts and decrypts without exposing plaintext", () => {
  const input = demo();
  upsertProvider(input, { platform: "nvidia", label: "primary", key: "sensitive-demo-key" });
  const encrypted = encryptConfig(input, "correct horse battery staple");
  assert.equal(JSON.stringify(encrypted).includes("sensitive-demo-key"), false);
  assert.deepEqual(decryptConfig(encrypted, "correct horse battery staple"), input);
});
test("rejects wrong password and tampering", () => {
  const encrypted = encryptConfig(demo(), "correct horse battery staple");
  assert.throws(() => decryptConfig(encrypted, "wrong"));
  encrypted.ciphertext = Buffer.from("malicious-content").toString("base64");
  assert.throws(() => decryptConfig(encrypted, "correct horse battery staple"));
});
test("upserts a provider by platform and label", () => {
  const input = demo();
  upsertProvider(input, { platform: "openrouter", label: "one", key: "first" });
  upsertProvider(input, { platform: "openrouter", label: "one", key: "second" });
  assert.equal(input.keys.length, 1);
  assert.equal(input.keys[0].key, "second");
});
test("rejects invalid configuration", () => {
  assert.throws(() => validateConfig({}));
});

test("clean removes only the encrypted vault and local runtime state", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "freellmapi-clean-"));
  try {
    fs.mkdirSync(path.join(root, "vault"));
    fs.mkdirSync(path.join(root, ".runtime", "data"), { recursive: true });
    fs.writeFileSync(path.join(root, "compose.yaml"), "services: {}\n");
    fs.writeFileSync(path.join(root, "README.md"), "keep");
    fs.writeFileSync(path.join(root, "vault", "credentials.enc.json"), "encrypted sample");
    fs.writeFileSync(path.join(root, ".runtime", "data", "freeapi.db"), "local sample");
    fs.writeFileSync(path.join(root, ".env"), "LOCAL=test");
    cleanLocalVault(root);
    assert.equal(fs.existsSync(path.join(root, "vault", "credentials.enc.json")), false);
    assert.equal(fs.existsSync(path.join(root, ".runtime")), false);
    assert.equal(fs.existsSync(path.join(root, ".env")), false);
    assert.equal(fs.readFileSync(path.join(root, "README.md"), "utf8"), "keep");
    assert.doesNotThrow(() => cleanLocalVault(root));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test("clean refuses to operate outside a project root", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "freellmapi-wrong-root-"));
  try {
    assert.throws(() => cleanLocalVault(root), /project root/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
