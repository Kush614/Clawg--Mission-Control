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
  const cfg = api.runtime?.config?.loadConfig?.();
  if (!cfg || typeof cfg !== "object") return null;
  // Plugin config stores slack settings at the top level
  if (cfg.botToken !== undefined || cfg.enabled !== undefined) return cfg as SlackConfig;
  // Fallback: check legacy nested path
  return (cfg as any)?.channels?.slack ?? null;
}

export function isSlackConnected(api: any): boolean {
  const cfg = getSlackConfig(api);
  return !!(cfg?.enabled && cfg?.botToken);
}

export async function saveSlackConfig(api: any, slack: SlackConfig): Promise<void> {
  await api.runtime?.config?.writeConfigFile?.(slack);
}

export async function disconnectSlack(api: any): Promise<void> {
  const current = getSlackConfig(api) ?? {};
  await api.runtime?.config?.writeConfigFile?.({ ...current, enabled: false });
}
