import { eventBus } from "./event-bus.js";

interface Pending {
  callId: string;
  toolName: string;
  description: string;
  args: any;
  resolve: (approved: boolean) => void;
}

const TOOL_DESCRIPTIONS: Record<string, (a: any) => string> = {
  bash:       (a) => `Run terminal command: ${a?.command ?? ""}`,
  exec:       (a) => `Execute: ${a?.command ?? ""}`,
  write:      (a) => `Write to file: ${a?.path ?? ""}`,
  write_file: (a) => `Write to file: ${a?.path ?? ""}`,
  delete:     (a) => `Delete: ${a?.path ?? ""}`,
  browser:    (a) => `Open browser: ${a?.url ?? ""}`,
  email:      (a) => `Send email to: ${a?.to ?? ""}`,
  send_email: (a) => `Send email to: ${a?.to ?? ""}`,
};

export const RISKY_TOOLS = new Set([
  "bash", "exec", "shell",
  "write", "write_file", "edit",
  "delete", "rm",
  "browser", "fetch",
  "email", "send_email",
]);

class ApprovalQueue {
  private pending = new Map<string, Pending>();

  async request(callId: string, toolName: string, args: any): Promise<boolean> {
    const descFn = TOOL_DESCRIPTIONS[toolName.toLowerCase()];
    const description = descFn ? descFn(args) : `Use tool: ${toolName}`;
    return new Promise((resolve) => {
      this.pending.set(callId, { callId, toolName, description, args, resolve });
      eventBus.emit({ type: "APPROVAL_REQUIRED", callId, toolName, description, args, timestamp: Date.now() });
    });
  }

  resolve(callId: string, approved: boolean): boolean {
    const p = this.pending.get(callId);
    if (!p) return false;
    this.pending.delete(callId);
    p.resolve(approved);
    eventBus.emit({ type: "APPROVAL_RESOLVED", callId, approved, timestamp: Date.now() });
    return true;
  }

  list() {
    return Array.from(this.pending.values()).map(
      ({ callId, toolName, description, args }) => ({ callId, toolName, description, args })
    );
  }
}

export const approvalQueue = new ApprovalQueue();
