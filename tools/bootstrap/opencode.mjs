export function buildOpenCodeConfig(models, baseURL) {
  if (!Array.isArray(models)) throw new Error("Gateway returned an invalid model list");
  const entries = Object.create(null);
  for (const model of models) {
    if (typeof model?.id !== "string" || !model.id.trim() || ["__proto__", "constructor", "prototype"].includes(model.id)) continue;
    entries[model.id] = { name: model.name ?? model.id };
  }
  if (Object.keys(entries).length === 0) throw new Error("No chat models available; check providers and model catalog");
  return {
    $schema: "https://opencode.ai/config.json",
    providers: {
      freellmapi: {
        name: "FreeLLMAPI",
        env: ["FREELLMAPI_API_KEY"],
        package: "@opencode/ai/providers/openai-compatible",
        settings: { baseURL: baseURL.replace(/\/+$/, "") + "/v1" },
        models: entries
      }
    }
  };
}

export function normalizeKeyStatuses(rows, expected) {
  if (!Array.isArray(rows)) throw new Error("Invalid provider list from API");
  return expected.map(item => {
    const match = rows.find(row => row.platform === item.platform && row.label === item.label);
    return { platform: item.platform, label: item.label, registered: Boolean(match), status: match?.status || "missing" };
  });
}
