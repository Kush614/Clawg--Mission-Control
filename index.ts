import { registerRoutes } from "./src/server.js";
import { eventBus } from "./src/event-bus.js";
import { approvalQueue, RISKY_TOOLS } from "./src/approval-queue.js";

export default function register(api: any) {
  api.logger.info("[mission-control] Loading...");
  const routePrefix = api.pluginConfig?.routePrefix ?? "/mission-control";

  // Hook into tool calls for the approval queue
  // Agent event streaming (messages, tool calls) is handled by clawg-ui/CopilotKit
  api.on(
    "before_tool_call",
    async (event: any) => {
      const toolName = event.toolName;
      if (RISKY_TOOLS.has(toolName?.toLowerCase())) {
        const approved = await approvalQueue.request(event.callId, toolName, event.params);
        if (!approved) return { block: true, blockReason: "Blocked by Mission Control." };
      }
    },
    { priority: 10 },
  );

  api.on(
    "after_tool_call",
    (event: any) => {
      // Resolve any lingering approval entries
      approvalQueue.resolve(event.callId, true);
    },
    { priority: 10 },
  );

  registerRoutes(api, { routePrefix, eventBus });

  api.logger.info(`[mission-control] Dashboard → http://localhost:18789${routePrefix}`);
}
