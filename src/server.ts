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
  // ── Serve UI (prefix match for index + static assets) ──────────────────

  api.registerHttpRoute({
    path: routePrefix,
    auth: "plugin",
    match: "prefix",
    handler: async (req: any, res: any) => {
      if (req.method !== "GET") return false;

      const rel = req.url.split("?")[0].replace(routePrefix, "") || "/";

      // Serve index.html for the root path
      if (rel === "/" || rel === "") {
        const p = path.join(UI_DIST, "index.html");
        if (!fs.existsSync(p)) {
          res.writeHead(503, { "Content-Type": "text/plain" });
          res.end("UI not built. Run: npm run build:ui");
          return true;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(p));
        return true;
      }

      // Serve static assets from /assets/*
      if (rel.startsWith("/assets/")) {
        const filePath = path.join(UI_DIST, rel);
        if (!fs.existsSync(filePath)) { res.writeHead(404); res.end(); return true; }
        const mime: Record<string, string> = {
          ".js": "application/javascript", ".css": "text/css",
          ".svg": "image/svg+xml", ".png": "image/png",
        };
        res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] ?? "application/octet-stream" });
        res.end(fs.readFileSync(filePath));
        return true;
      }

      return false;
    },
  });

  // ── SSE — approval events only ────────────────────────────────────────────
  // Note: agent events (messages, tool calls) come through clawg-ui via CopilotKit.
  // This SSE stream is only for approval queue events from this plugin.

  api.registerHttpRoute({
    path: `${routePrefix}/events`,
    auth: "plugin",
    match: "exact",
    handler: async (req: any, res: any) => {
      if (req.method !== "GET") return false;
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
      return true;
    },
  });

  // ── Approvals ─────────────────────────────────────────────────────────────

  api.registerHttpRoute({
    path: `${routePrefix}/api/approvals`,
    auth: "plugin",
    match: "prefix",
    handler: async (req: any, res: any) => {
      const relPath = req.url.split("?")[0].replace(`${routePrefix}/api/approvals`, "") || "/";

      // GET /api/approvals — list pending
      if (req.method === "GET" && (relPath === "/" || relPath === "")) {
        json(res, approvalQueue.list());
        return true;
      }

      // POST /api/approvals/:id/approve
      if (req.method === "POST" && relPath.endsWith("/approve")) {
        const callId = seg(req.url, -2);
        json(res, { ok: approvalQueue.resolve(callId, true) });
        return true;
      }

      // POST /api/approvals/:id/reject
      if (req.method === "POST" && relPath.endsWith("/reject")) {
        const callId = seg(req.url, -2);
        json(res, { ok: approvalQueue.resolve(callId, false) });
        return true;
      }

      return false;
    },
  });

  // ── Slack Config ──────────────────────────────────────────────────────────

  api.registerHttpRoute({
    path: `${routePrefix}/api/slack`,
    auth: "plugin",
    match: "prefix",
    handler: async (req: any, res: any) => {
      const relPath = req.url.split("?")[0].replace(`${routePrefix}/api/slack`, "") || "/";

      // GET /api/slack — connection status
      if (req.method === "GET" && (relPath === "/" || relPath === "")) {
        const config = getSlackConfig(api);
        json(res, {
          connected: isSlackConnected(api),
          mode: config?.mode ?? "socket",
          hasBotToken: !!config?.botToken,
          hasAppToken: !!config?.appToken,
          respondToAll: config?.requireMention === false,
        });
        return true;
      }

      // POST /api/slack/connect
      if (req.method === "POST" && relPath === "/connect") {
        const { botToken, appToken, mode = "socket" } = JSON.parse(await readBody(req));
        if (!botToken) { json(res, { ok: false, error: "botToken required" }, 400); return true; }
        if (mode === "socket" && !appToken) { json(res, { ok: false, error: "appToken required for socket mode" }, 400); return true; }
        try {
          await saveSlackConfig(api, {
            enabled: true, mode, botToken,
            ...(mode === "socket" ? { appToken } : { signingSecret: "", webhookPath: "/slack/events" }),
            groupPolicy: "allowlist",
          });
          json(res, { ok: true, message: "Slack connected. Restart gateway to apply." });
        } catch (err: any) {
          api.logger?.error("[mission-control] saveSlackConfig error:", err);
          json(res, { ok: false, error: err.message ?? "Failed to save config" }, 500);
        }
        return true;
      }

      // POST /api/slack/disconnect
      if (req.method === "POST" && relPath === "/disconnect") {
        await disconnectSlack(api);
        json(res, { ok: true });
        return true;
      }

      // PATCH /api/slack/settings
      if (req.method === "PATCH" && relPath === "/settings") {
        const body = JSON.parse(await readBody(req));
        // Translate UI's respondToAll → OpenClaw's requireMention
        const patch: Record<string, any> = {};
        if ("respondToAll" in body) {
          patch.requireMention = !body.respondToAll;
        }
        if (Object.keys(patch).length > 0) {
          const current = getSlackConfig(api) ?? { enabled: true, mode: "socket" as const };
          await saveSlackConfig(api, { ...current, ...patch });
        }
        json(res, { ok: true });
        return true;
      }

      return false;
    },
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
