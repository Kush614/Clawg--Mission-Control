import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface SlackStatus { connected: boolean; mode: string; hasBotToken: boolean; hasAppToken: boolean; respondToAll: boolean; }

export default function SlackSettings({ onDisconnect }: { onDisconnect: () => void }) {
  const [status, setStatus] = useState<SlackStatus | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getSlackStatus().then(setStatus); }, []);

  const toggleRespondToAll = async () => {
    if (!status) return;
    setSaving(true);
    const updated = { ...status, respondToAll: !status.respondToAll };
    await api.updateSlackSettings({ respondToAll: updated.respondToAll });
    setStatus(updated); setSaving(false);
  };

  if (!status) return <div className="flex items-center justify-center h-full text-gray-600">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-800">
        <h1 className="text-base font-semibold text-white">Slack Settings</h1>
        <p className="text-xs text-gray-500">Manage your OpenClaw ↔ Slack connection</p>
      </div>
      <div className="p-6 max-w-lg space-y-6">
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🟣</span>
            <div>
              <p className="text-white font-semibold">Slack</p>
              <p className="text-xs text-green-400">● Connected via {status.mode} mode</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex justify-between"><span>Bot Token</span><span className={status.hasBotToken ? "text-green-400" : "text-red-400"}>{status.hasBotToken ? "✓ Set" : "✕ Missing"}</span></div>
            <div className="flex justify-between"><span>App Token</span><span className={status.hasAppToken ? "text-green-400" : "text-gray-600"}>{status.hasAppToken ? "✓ Set" : "— N/A"}</span></div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Behavior</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Respond to all messages</p>
              <p className="text-xs text-gray-500 mt-0.5">When off, only responds to @mentions</p>
            </div>
            <button onClick={toggleRespondToAll} disabled={saving}
              className={`w-12 h-6 rounded-full transition-all relative ${status.respondToAll ? "bg-orange-500" : "bg-gray-700"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${status.respondToAll ? "left-7" : "left-1"}`} />
            </button>
          </div>
        </div>

        <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-xs text-yellow-400">⚠ Config changes take effect after restarting the gateway:</p>
          <code className="text-xs text-gray-400 block mt-2">openclaw gateway restart</code>
        </div>

        <button onClick={async () => { await api.disconnectSlack(); onDisconnect(); }}
          className="w-full py-3 border border-red-900 text-red-400 hover:bg-red-950/30 rounded-xl text-sm transition-all">
          Disconnect Slack
        </button>
      </div>
    </div>
  );
}
