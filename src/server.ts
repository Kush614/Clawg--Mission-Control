import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { approvalQueue } from "./approval-queue.js";
import { getSlackConfig, isSlackConnected, saveSlackConfig, disconnectSlack } from "./slack-config.js";
import type { EventBus } from "./event-bus.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIST = path.resolve(__dirname, "../ui/dist");

export function registerRoutes(
  api: any,
  { routePrefix, eventBus }: { routePrefix: string; eventBus: EventBus }
) {
  // ── Serve UI ─────────────────────────────────────────────────────────────

  const serveIndex = (_req: any, res: any) => {
    const p = path.join(UI_DIST, "index.html");
    if (!fs.existsSync(p)) {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("UI not built. Run: npm run build:ui");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(fs.readFileSync(p));
  };

  api.registerGatewayHttpHandler("GET", routePrefix, serveIndex);
  api.registerGatewayHttpHandler("GET", `${routePrefix}/`, serveIndex);

  api.registerGatewayHttpHandler("GET", `${routePrefix}/assets/*`, (req: any, res: any) => {
    const rel = req.url.replace(routePrefix, "");
    const filePath = path.join(UI_DIST, rel);
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end(); return; }
    const mime: Record<string, string> = {
      ".js": "application/javascript", ".css": "text/css",
      ".svg": "image/svg+xml", ".png": "image/png",
    };
    res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] ?? "application/octet-stream" });
    res.end(fs.readFileSync(filePath));
  });

  // ── SSE — approval events only ────────────────────────────────────────────
  // Note: agent events (messages, tool calls) come through clawg-ui via CopilotKit.
  // This SSE stream is only for approval queue events from this plugin.

  api.registerGatewayHttpHandler("GET", `${routePrefix}/events`, (req: any, res: any) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    });
    res.write(": connected\n\n");
    const ping = setInterval(() => res.write(": ping\n\n"), 15_000);
    const unsub = eventBus.subscribe((e) => res.write(`data: ${JSON.stringify(e)}\n\n`));
    req.on("close", () => { clearInterval(ping); unsub(); });
  });

  // ── Approvals ─────────────────────────────────────────────────────────────

  api.registerGatewayHttpHandler("GET", `${routePrefix}/api/approvals`, (_req: any, res: any) => {
    json(res, approvalQueue.list());
  });

  api.registerGatewayHttpHandler("POST", `${routePrefix}/api/approvals/:id/approve`, (req: any, res: any) => {
    const callId = seg(req.url, -2);
    json(res, { ok: approvalQueue.resolve(callId, true) });
  });

  api.registerGatewayHttpHandler("POST", `${routePrefix}/api/approvals/:id/reject`, (req: any, res: any) => {
    const callId = seg(req.url, -2);
    json(res, { ok: approvalQueue.resolve(callId, false) });
  });

  // ── Slack Config ──────────────────────────────────────────────────────────

  api.registerGatewayHttpHandler("GET", `${routePrefix}/api/slack`, (_req: any, res: any) => {
    const config = getSlackConfig(api);
    json(res, {
      connected: isSlackConnected(api),
      mode: config?.mode ?? "socket",
      hasBotToken: !!config?.botToken,
      hasAppToken: !!config?.appToken,
      respondToAll: config?.respondToAll ?? false,
    });
  });

  api.registerGatewayHttpHandler("POST", `${routePrefix}/api/slack/connect`, async (req: any, res: any) => {
    const { botToken, appToken, mode = "socket" } = JSON.parse(await readBody(req));
    if (!botToken) { json(res, { ok: false, error: "botToken required" }, 400); return; }
    if (mode === "socket" && !appToken) { json(res, { ok: false, error: "appToken required for socket mode" }, 400); return; }
    await saveSlackConfig(api, {
      enabled: true, mode, botToken,
      ...(mode === "socket" ? { appToken } : { signingSecret: "", webhookPath: "/slack/events" }),
      groupPolicy: "allowlist",
    });
    json(res, { ok: true, message: "Slack connected. Restart gateway to apply." });
  });

  api.registerGatewayHttpHandler("POST", `${routePrefix}/api/slack/disconnect`, async (_req: any, res: any) => {
    await disconnectSlack(api);
    json(res, { ok: true });
  });

  api.registerGatewayHttpHandler("PATCH", `${routePrefix}/api/slack/settings`, async (req: any, res: any) => {
    const body = JSON.parse(await readBody(req));
    const current = getSlackConfig(api) ?? { enabled: true, mode: "socket" as const };
    await saveSlackConfig(api, { ...current, ...body });
    json(res, { ok: true });
  });
}

function json(res: any, data: any, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(data));
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (c: Buffer) => (b += c.toString()));
    req.on("end", () => resolve(b));
  });
}

function seg(url: string, idx: number): string {
  return url.split("?")[0].split("/").filter(Boolean).at(idx) ?? "";
}
