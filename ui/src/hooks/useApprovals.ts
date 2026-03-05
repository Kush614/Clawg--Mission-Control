// Polls the mission-control plugin's approval queue.
// Agent events themselves come through CopilotKit/clawg-ui.

import { useState, useEffect } from "react";
import { api } from "../lib/api";

export interface Approval {
  callId: string;
  toolName: string;
  description: string;
  args: any;
}

export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    const poll = setInterval(async () => {
      try { setApprovals(await api.getApprovals()); } catch {}
    }, 1000);
    return () => clearInterval(poll);
  }, []);

  const resolve = async (callId: string, approved: boolean) => {
    setApprovals((prev) => prev.filter((a) => a.callId !== callId));
    approved ? await api.approveAction(callId) : await api.rejectAction(callId);
  };

  return { approvals, resolve };
}
