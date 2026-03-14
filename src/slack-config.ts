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

export function getSlackConfig(api: any): SlackConfig | null {
  const full = api.runtime?.config?.loadConfig?.();
  return full?.channels?.slack ?? null;
}

export function isSlackConnected(api: any): boolean {
  const cfg = getSlackConfig(api);
  return !!(cfg?.enabled && cfg?.botToken);
}

export async function saveSlackConfig(api: any, slack: SlackConfig): Promise<void> {
  const raw = api.runtime?.config?.loadConfig?.();
  if (!raw) {
    api.logger?.warn("[mission-control] saveSlackConfig: loadConfig() returned falsy");
    return;
  }
  // Deep clone to avoid mutating a frozen config object
  const full = JSON.parse(JSON.stringify(raw));
  if (!full.channels) full.channels = {};
  full.channels.slack = { ...full.channels.slack, ...slack };
  api.logger?.info("[mission-control] saveSlackConfig: writing channels.slack");
  await api.runtime.config.writeConfigFile(full);
}

export async function disconnectSlack(api: any): Promise<void> {
  const raw = api.runtime?.config?.loadConfig?.();
  if (!raw) return;
  const full = JSON.parse(JSON.stringify(raw));
  if (full.channels?.slack) {
    full.channels.slack.enabled = false;
    await api.runtime.config.writeConfigFile(full);
  }
}
