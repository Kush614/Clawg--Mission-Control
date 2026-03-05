import { useState } from "react";
import { api } from "../lib/api";
import WizardStep from "../components/WizardStep";

const SCOPES = [
  "chat:write", "im:history", "im:read",
  "channels:history", "channels:read",
  "app_mentions:read", "connections:write",
];

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [botToken, setBotToken] = useState("");
  const [appToken, setAppToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const connect = async () => {
    setConnecting(true); setError("");
    try {
      const res = await api.connectSlack({ botToken, appToken, mode: "socket" });
      if (res.ok) onComplete();
      else setError(res.error ?? "Failed to connect");
    } catch (e: any) { setError(e.message); }
    finally { setConnecting(false); }
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center justify-start py-12 px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🟣</div>
          <h1 className="text-2xl font-bold text-white">Connect OpenClaw to Slack</h1>
          <p className="text-gray-500 text-sm mt-2">4 steps. No config file editing. Takes 5 minutes.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s < step ? "bg-green-600 text-white" :
                s === step ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-500"
              }`}>{s < step ? "✓" : s}</div>
              {s < 4 && <div className={`h-px w-8 ${s < step ? "bg-green-600" : "bg-gray-700"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <WizardStep number={1} title="Create a Slack App" onNext={() => setStep(2)}>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-2"><span className="text-orange-400 font-bold shrink-0">1.</span>
                Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">api.slack.com/apps</a>
              </li>
              <li className="flex gap-2"><span className="text-orange-400 font-bold shrink-0">2.</span>
                Click <strong className="text-white">Create New App</strong> → <strong className="text-white">From scratch</strong>
              </li>
              <li className="flex gap-2"><span className="text-orange-400 font-bold shrink-0">3.</span>
                Name it <em className="text-gray-400">OpenClaw</em> and pick your workspace
              </li>
              <li className="flex gap-2"><span className="text-orange-400 font-bold shrink-0">4.</span>
                Click <strong className="text-white">Create App</strong>
              </li>
            </ol>
          </WizardStep>
        )}

        {step === 2 && (
          <WizardStep number={2} title="Add OAuth Scopes" onBack={() => setStep(1)} onNext={() => setStep(3)}>
            <p className="text-sm text-gray-400 mb-4">
              Go to <strong className="text-white">OAuth & Permissions → Bot Token Scopes</strong> and add:
            </p>
            <div className="bg-gray-900 rounded-xl p-4 flex flex-wrap gap-2 mb-4">
              {SCOPES.map((s) => (
                <span key={s} className="text-xs font-mono bg-gray-800 text-green-400 px-2 py-1 rounded">{s}</span>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Then click <strong className="text-white">Install to Workspace</strong> and copy the <strong className="text-white">Bot Token</strong> (starts with <code className="text-orange-400">xoxb-</code>).
            </p>
          </WizardStep>
        )}

        {step === 3 && (
          <WizardStep number={3} title="Enable Socket Mode" onBack={() => setStep(2)} onNext={() => setStep(4)}>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-2"><span className="text-orange-400 font-bold shrink-0">1.</span>Go to <strong className="text-white">Settings → Socket Mode</strong> and toggle it on</li>
              <li className="flex gap-2"><span className="text-orange-400 font-bold shrink-0">2.</span>Click <strong className="text-white">Generate</strong> to create an App-Level Token</li>
              <li className="flex gap-2"><span className="text-orange-400 font-bold shrink-0">3.</span>Add scope <code className="text-green-400 text-xs bg-gray-900 px-1 rounded">connections:write</code> then click <strong className="text-white">Generate</strong></li>
              <li className="flex gap-2"><span className="text-orange-400 font-bold shrink-0">4.</span>Copy the token — starts with <code className="text-orange-400">xapp-</code></li>
            </ol>
            <p className="text-xs text-gray-500 mt-4">Also go to <strong className="text-white">Event Subscriptions</strong>, enable it, and subscribe to <code className="text-xs bg-gray-900 text-green-400 px-1 rounded">message.im</code> and <code className="text-xs bg-gray-900 text-green-400 px-1 rounded">app_mention</code> bot events.</p>
          </WizardStep>
        )}

        {step === 4 && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-1">Step 4 — Enter Your Tokens</h2>
            <p className="text-xs text-gray-500 mb-6">Stored locally in your OpenClaw config. Never sent anywhere else.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Bot Token <span className="text-gray-600">(xoxb-...)</span></label>
                <input type="password" value={botToken} onChange={(e) => setBotToken(e.target.value)}
                  placeholder="xoxb-..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">App Token <span className="text-gray-600">(xapp-...)</span></label>
                <input type="password" value={appToken} onChange={(e) => setAppToken(e.target.value)}
                  placeholder="xapp-..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-orange-500" />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs mb-4">⚠ {error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 py-2 border border-gray-700 text-gray-400 rounded-xl text-sm hover:text-white transition-all">← Back</button>
              <button onClick={connect} disabled={!botToken || !appToken || connecting}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-sm font-semibold transition-all">
                {connecting ? "Connecting..." : "Connect Slack →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
