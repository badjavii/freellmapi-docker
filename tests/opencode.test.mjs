import test from "node:test";
import assert from "node:assert/strict";
import { buildOpenCodeConfig, normalizeKeyStatuses } from "../tools/bootstrap/opencode.mjs";

test("builds an OpenCode v2 configuration without embedding API keys", () => {
  const config = buildOpenCodeConfig([{ id: "auto" }, { id: "openrouter/coder" }], "http://localhost:3001");
  assert.equal(config.providers.freellmapi.package, "@opencode/ai/providers/openai-compatible");
  assert.equal(config.providers.freellmapi.settings.baseURL, "http://localhost:3001/v1");
  assert.equal(config.providers.freellmapi.env[0], "FREELLMAPI_API_KEY");
  assert.equal(Object.keys(config.providers.freellmapi.models).length, 2);
  assert.equal(JSON.stringify(config).includes("secret"), false);
});

test("rejects empty model catalog", () => {
  assert.throws(() => buildOpenCodeConfig([], "http://localhost:3001"));
});
test("checks provider imports without exposing credentials", () => {
  const status = normalizeKeyStatuses(
    [{ platform: "nvidia", label: "primary", status: "unknown" }],
    [{ platform: "nvidia", label: "primary", key: "private" }]
  );
  assert.equal(status[0].registered, true);
  assert.equal(JSON.stringify(status).includes("private"), false);
});
