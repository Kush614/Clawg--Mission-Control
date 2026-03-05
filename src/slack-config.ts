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
  return api.getConfig?.()?.channels?.slack ?? null;
}

export function isSlackConnected(api: any): boolean {
  const cfg = getSlackConfig(api);
  return !!(cfg?.enabled && cfg?.botToken);
}

export async function saveSlackConfig(api: any, slack: SlackConfig): Promise<void> {
  await api.patchConfig?.({ channels: { slack: slack } });
}

export async function disconnectSlack(api: any): Promise<void> {
  await api.patchConfig?.({ channels: { slack: { enabled: false } } });
}
