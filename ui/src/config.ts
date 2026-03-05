export const OPENCLAW_URL = import.meta.env.VITE_OPENCLAW_URL ?? "http://localhost:18789";
export const CLAWG_AI_URL = `${OPENCLAW_URL}/v1/clawg-ui`;
export const DEVICE_TOKEN = import.meta.env.VITE_CLAWG_AI_DEVICE_TOKEN ?? "";
export const MISSION_CONTROL_API = "/mission-control/api";
