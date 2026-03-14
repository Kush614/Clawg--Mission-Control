export interface SlackConfig {
  enabled: boolean;
  mode: "socket" | "http";
  botToken?: string;
  appToken?: string;
  signingSecret?: string;
  webhookPath?: string;
  respondToAll?: boolean;
  groupPolicy?: string;
}

export const REQUIRED_SCOPES = [
  "chat:write", "im:history", "im:read",
  "channels:history", "channels:read",
  "app_mentions:read", "connections:write",
];

function getPluginConfig(api: any): Record<string, any> | null {
  const full = api.runtime?.config?.loadConfig?.();
  const id = api.id ?? "mission-control";
  return full?.plugins?.entries?.[id]?.config ?? null;
}

export function getSlackConfig(api: any): SlackConfig | null {
  const cfg = getPluginConfig(api);
  if (!cfg || typeof cfg !== "object") return null;
  return (cfg.slack as SlackConfig) ?? null;
}

export function isSlackConnected(api: any): boolean {
  const cfg = getSlackConfig(api);
  return !!(cfg?.enabled && cfg?.botToken);
}

export async function saveSlackConfig(api: any, slack: SlackConfig): Promise<void> {
  const full = api.runtime?.config?.loadConfig?.();
  if (!full) return;
  const id = api.id ?? "mission-control";
  if (!full.plugins) full.plugins = {};
  if (!full.plugins.entries) full.plugins.entries = {};
  if (!full.plugins.entries[id]) full.plugins.entries[id] = {};
  full.plugins.entries[id].config = { ...full.plugins.entries[id].config, slack };
  await api.runtime.config.writeConfigFile(full);
}

export async function disconnectSlack(api: any): Promise<void> {
  const current = getSlackConfig(api) ?? {} as any;
  await saveSlackConfig(api, { ...current, enabled: false });
}
