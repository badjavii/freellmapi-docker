import fs from "node:fs";
import path from "node:path";
import { buildOpenCodeConfig, normalizeKeyStatuses } from "./opencode.mjs";

const runtime = path.resolve(".runtime");
const config = JSON.parse(fs.readFileSync(path.join(runtime, "providers.json"), "utf8"));
const origin = process.env.FREELLMAPI_INTERNAL_URL || "http://freellmapi:3001";
const publicOrigin = process.env.FREELLMAPI_PUBLIC_URL || "http://localhost:3001";
const prefix = "[freellmapi-setup]";

async function request(endpoint, options = {}) {
  const response = await fetch(origin + endpoint, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(endpoint + " returned HTTP " + response.status);
  return response.json();
}
function writeAtomic(filename, content) {
  const target = path.join(runtime, filename);
  const temp = target + "." + process.pid + ".tmp";
  try {
    fs.writeFileSync(temp, content, { mode: 0o600, flag: "wx" });
    fs.renameSync(temp, target);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}
async function main() {
  if (!config.admin?.email || !config.admin.password) throw new Error("Dashboard credentials missing; unlock vault again");
  console.log(prefix, "FreeLLMAPI is responding. Checking declared configuration...");
  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config.admin)
  });
  if (!login.token) throw new Error("Dashboard login returned no session token");
  const auth = { Authorization: "Bearer " + login.token };
  const [settings, rows] = await Promise.all([
    request("/api/settings/api-key", { headers: auth }),
    request("/api/keys", { headers: auth })
  ]);
  if (!settings.apiKey) throw new Error("Unified API key unavailable");
  const checks = normalizeKeyStatuses(rows, config.keys || []);
  for (const item of checks) {
    if (!item.registered) throw new Error("Credential was not provisioned: " + item.platform + "/" + item.label);
    console.log(prefix, "[OK] Imported", item.platform + "/" + item.label, "(upstream status:", item.status + ")");
  }
  const models = await request("/v1/models", { headers: { Authorization: "Bearer " + settings.apiKey } });
  const generated = buildOpenCodeConfig(models.data, publicOrigin);
  writeAtomic("opencode.json", JSON.stringify(generated, null, 2) + "\n");
  writeAtomic("opencode.env", "FREELLMAPI_API_KEY=" + settings.apiKey + "\n");
  console.log(prefix, "[OK] " + checks.length + " credential(s) imported; actual upstream validity must be tested separately");
  console.log(prefix, "[OK] " + Object.keys(generated.providers.freellmapi.models).length + " model(s) exposed by the gateway");
  console.log(prefix, "[OK] Local OpenCode config: .runtime/opencode.json");
  console.log(prefix, "[OK] Base URL:", publicOrigin + "/v1");
  console.log(prefix, "[OK] Dashboard:", publicOrigin);
  console.log(prefix, "Use ./scripts/opencode.sh (Linux/macOS) or .\\scripts\\opencode.ps1 (Windows). No key is printed in logs.");
}
main().catch(error => {
  console.error(prefix, "[ERROR]", error.message);
  process.exitCode = 1;
});
