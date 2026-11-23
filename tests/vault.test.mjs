import test from "node:test";
import assert from "node:assert/strict";
import { encryptConfig, decryptConfig, upsertProvider, validateConfig } from "../tools/vault/core.mjs";

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
