// Only used for approval state events — main agent events render inside CopilotChat
export default function ActionCard({ event }: { event: any }) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (event.type === "APPROVAL_REQUIRED") {
    return (
      <div className="flex gap-3 items-start">
        <span className="text-lg">⚠️</span>
        <div className="bg-orange-950/30 border border-orange-500/30 rounded-xl px-4 py-3 flex-1">
          <p className="text-sm text-orange-300">Waiting for approval...</p>
          <p className="text-xs text-gray-500 mt-1">{event.description}</p>
          <p className="text-xs text-gray-600 mt-1">{time}</p>
        </div>
      </div>
    );
  }

  if (event.type === "APPROVAL_RESOLVED") {
    return (
      <div className="flex gap-2 items-center pl-1">
        <span className={event.approved ? "text-green-500" : "text-red-500"}>{event.approved ? "✓" : "✕"}</span>
        <span className="text-xs text-gray-600">Action {event.approved ? "approved" : "blocked"} at {time}</span>
      </div>
    );
  }

  return null;
}
