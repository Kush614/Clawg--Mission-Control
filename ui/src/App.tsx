import { useState, useEffect, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { HttpAgent } from "@ag-ui/client";
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
        {connected && screen === "feed"     && (
          <AgentErrorBoundary>
            <CopilotKit
              agents__unsafe_dev_only={{
                default: new HttpAgent({
                  url: CLAWG_AI_URL,
                  headers: { Authorization: `Bearer ${DEVICE_TOKEN}` },
                }),
              }}
            >
              <LiveFeed />
            </CopilotKit>
          </AgentErrorBoundary>
        )}
        {connected && screen === "settings" && <SlackSettings onDisconnect={() => setConnected(false)} />}
      </main>
    </div>
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

class AgentErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[mission-control] Agent connection error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md px-6">
            <h2 className="text-lg font-semibold text-orange-400 mb-2">Agent connection failed</h2>
            <p className="text-sm text-gray-400 mb-4">
              Could not connect to the clawg-ui runtime. Check that the clawg-ui plugin is running and the device token is valid.
            </p>
            <pre className="text-xs text-red-400 bg-gray-900 rounded p-3 text-left overflow-auto mb-4">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-white transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
