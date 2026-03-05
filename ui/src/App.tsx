import { useState, useEffect } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import SetupWizard from "./screens/SetupWizard";
import LiveFeed from "./screens/LiveFeed";
import SlackSettings from "./screens/SlackSettings";
import { api } from "./lib/api";
import { CLAWG_AI_URL, DEVICE_TOKEN } from "./config";

type Screen = "feed" | "settings";

export default function App() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [screen, setScreen] = useState<Screen>("feed");

  useEffect(() => {
    api.getSlackStatus()
      .then((s) => setConnected(s.connected))
      .catch(() => setConnected(false));
  }, []);

  if (connected === null) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-600 text-sm">Starting up...</div>
  );

  return (
    // CopilotKit wraps everything — connects to clawg-ui for agent event streaming
    <CopilotKit
      runtimeUrl={CLAWG_AI_URL}
      headers={{ Authorization: `Bearer ${DEVICE_TOKEN}` }}
    >
      <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
        <nav className="w-16 bg-gray-900 flex flex-col items-center py-6 gap-4 border-r border-gray-800 shrink-0">
          <div className="text-2xl mb-2">🦞</div>
          {connected && (
            <>
              <NavBtn icon="📡" label="Live Feed"      active={screen === "feed"}     onClick={() => setScreen("feed")} />
              <NavBtn icon="⚙️" label="Slack Settings" active={screen === "settings"} onClick={() => setScreen("settings")} />
            </>
          )}
        </nav>
        <main className="flex-1 overflow-hidden">
          {!connected      && <SetupWizard onComplete={() => setConnected(true)} />}
          {connected && screen === "feed"     && <LiveFeed />}
          {connected && screen === "settings" && <SlackSettings onDisconnect={() => setConnected(false)} />}
        </main>
      </div>
    </CopilotKit>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label}
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
        active ? "bg-orange-500 shadow-lg shadow-orange-500/30" : "text-gray-500 hover:bg-gray-800 hover:text-white"
      }`}>
      {icon}
    </button>
  );
}
