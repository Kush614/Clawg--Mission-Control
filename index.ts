import { registerRoutes } from "./src/server.js";
import { eventBus } from "./src/event-bus.js";
import { approvalQueue, RISKY_TOOLS } from "./src/approval-queue.js";

export default function register(api: any) {
  api.logger.info("[mission-control] Loading...");
  const routePrefix = api.config?.routePrefix ?? "/mission-control";

  // Hook into tool calls for the approval queue
  // Agent event streaming (messages, tool calls) is handled by clawg-ui/CopilotKit
  if (api.hooks) {
    api.hooks.on("tool:before", async (ctx: any) => {
      const { toolName, args, callId } = ctx;
      if (RISKY_TOOLS.has(toolName?.toLowerCase())) {
        const approved = await approvalQueue.request(callId, toolName, args);
        if (!approved) return { abort: true, reason: "Blocked by Mission Control." };
      }
    });

    api.hooks.on("tool:after", (ctx: any) => {
      // Resolve any lingering approval entries
      approvalQueue.resolve(ctx.callId, true);
    });
  }

  registerRoutes(api, { routePrefix, eventBus });

  api.logger.info(`[mission-control] Dashboard → http://localhost:18789${routePrefix}`);
}
