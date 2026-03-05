import type { Approval } from "../hooks/useApprovals";

export default function ApprovalCard({ approval, onApprove, onReject }: {
  approval: Approval; onApprove: () => void; onReject: () => void;
}) {
  return (
    <div className="bg-gray-900 border border-orange-500/40 rounded-xl p-4">
      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Action Pending</p>
      <p className="text-sm text-white font-medium leading-snug mb-1">{approval.description}</p>
      <p className="text-xs text-gray-500 mb-4">Tool: <code className="text-gray-400">{approval.toolName}</code></p>
      <div className="flex gap-2">
        <button onClick={onApprove} className="flex-1 bg-green-600 hover:bg-green-500 active:scale-95 text-white text-sm py-2 rounded-lg font-medium transition-all">✓ Allow</button>
        <button onClick={onReject} className="flex-1 bg-gray-800 hover:bg-red-950 active:scale-95 text-red-400 hover:text-red-300 text-sm py-2 rounded-lg transition-all">✕ Block</button>
      </div>
    </div>
  );
}
