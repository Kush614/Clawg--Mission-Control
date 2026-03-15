// Bridges approval queue data into the CopilotKit agent's context
// so the chat agent can see and discuss pending approvals.

import { useCopilotReadable, useCopilotAdditionalInstructions } from "@copilotkit/react-core";
import type { Approval } from "./useApprovals";

export function useApprovalContext(approvals: Approval[]) {
  useCopilotReadable({
    description:
      "Pending tool-call approvals waiting for human review. " +
      "Each entry has a callId, toolName, description, and args.",
    value: approvals,
  }, [approvals]);

  const instructions =
    approvals.length > 0
      ? `There are ${approvals.length} tool call(s) pending human approval in the approval queue:\n` +
        approvals
          .map((a) => `- ${a.toolName}: ${a.description}`)
          .join("\n") +
        "\nProactively inform the user about these pending approvals. " +
        "Offer a risk assessment and recommendation (approve, approve with caution, or block) for each."
      : "";

  useCopilotAdditionalInstructions({
    instructions,
    available: approvals.length > 0 ? "enabled" : "disabled",
  }, [approvals]);
}
