// Agent event stream comes from CopilotKit (clawg-ui).
// Approval queue comes from this plugin's REST API.

import { useCoAgent, useCoAgentStateRender } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useApprovals } from "../hooks/useApprovals";
import { useApprovalContext } from "../hooks/useApprovalContext";
import ApprovalCard from "../components/ApprovalCard";
import ActionCard from "../components/ActionCard";
import { useState } from "react";

export default function LiveFeed() {
  const { approvals, resolve } = useApprovals();
  useApprovalContext(approvals);
  const [events, setEvents] = useState<any[]>([]);

  // useCoAgentStateRender lets us observe agent state changes from clawg-ui
  useCoAgentStateRender({
    name: "main",
    render: ({ state, nodeName, status }) => {
      // Capture tool call events as they stream through CopilotKit
      if (nodeName && status) {
        setEvents((prev) => [
          ...prev.slice(-200),
          { type: "AGENT_STATE", nodeName, status, state, timestamp: Date.now() },
        ]);
      }
      return null;
    },
  });

  const agentRunning = approvals.length > 0 ||
    events.at(-1)?.status === "inProgress";

  return (
    <div className="h-full flex">
      {/* Left: CopilotKit chat — powered by clawg-ui */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800 shrink-0">
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            Live Feed
            <span className={`w-2 h-2 rounded-full ${agentRunning ? "bg-orange-400 animate-pulse" : "bg-green-500"}`} />
          </h1>
          <p className="text-xs text-gray-500">Agent messages and actions — via CopilotKit + clawg-ui</p>
        </div>

        {/* CopilotChat renders the full conversation + agent events from clawg-ui */}
        <div className="flex-1 overflow-hidden">
          <CopilotChat
            className="h-full"
            labels={{
              title: "",
              initial: "Your agent is standing by. Send a task to get started. 🦞",
              placeholder: "Send a task to your agent...",
            }}
          />
        </div>
      </div>

      {/* Right: Approval Rail */}
      {approvals.length > 0 && (
        <div className="w-72 flex flex-col shrink-0 bg-gray-950">
          <div className="px-4 py-4 border-b border-orange-500/20 bg-orange-950/20">
            <h2 className="text-sm font-semibold text-orange-400">⚠️ Needs Approval</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {approvals.length} action{approvals.length > 1 ? "s" : ""} waiting
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {approvals.map((a) => (
              <ApprovalCard
                key={a.callId}
                approval={a}
                onApprove={() => resolve(a.callId, true)}
                onReject={() => resolve(a.callId, false)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
