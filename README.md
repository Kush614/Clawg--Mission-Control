# clawg-mission-control

Visual Mission Control dashboard for [OpenClaw](https://openclaw.ai) — Slack setup wizard, live agent feed, and human-in-the-loop approval rail.

## What it does

- **Live Feed** — streams all agent messages and tool calls in real time via [CopilotKit](https://copilotkit.ai) + [`clawg-ui`](https://github.com/contextablemark/clawg-ui)
- **Approval Rail** — intercepts risky tool calls (bash, file writes, email, etc.) and pauses execution until you approve or block them from the UI
- **Approval Context for Agent** — the chat agent can see pending approvals and discuss them with you, offering risk assessments and recommendations before you approve or block
- **Slack Setup Wizard** — 4-step guided flow to connect OpenClaw to a Slack workspace, no config file editing required
- **Slack Settings** — toggle respond-to-all vs. mention-only mode, disconnect

## Auditor agent soul

[SOUL.md](SOUL.md) is an OpenClaw "soul" file for an **Auditor** agent. When loaded as a soul, it instructs the agent to proactively surface pending approvals, provide risk assessments, and recommend approve/block decisions — all using the approval context that this plugin shares with the chat agent. Pair it with the **Approval Context for Agent** feature for a fully contextual security review workflow.

## Architecture

```
React UI (this plugin)
  ├── CopilotKit hooks → clawg-ui (AG-UI) → OpenClaw agent
  └── REST polling     → clawg-mission-control plugin API
          └── approval queue, Slack config
```

Two plugins run side by side on the OpenClaw gateway:
1. **`@contextableai/clawg-ui`** — provides the AG-UI endpoint the React UI connects to for agent event streaming
2. **`clawg-mission-control`** (this) — HTTP routes, approval queue, Slack config writer, serves the React UI

## Prerequisites

- [OpenClaw](https://openclaw.ai) gateway installed and running
- Node.js 20+

Install the `clawg-ui` plugin first:

```bash
openclaw plugins install @contextableai/clawg-ui
openclaw gateway restart
```

## Install

```bash
# 1. Clone this repo
git clone <repo-url> clawg-mission-control
cd clawg-mission-control

# 2. Pair a device token for clawg-ui (one time)
curl -X POST http://localhost:18789/v1/clawg-ui \
  -H "Content-Type: application/json" -d '{}'
# Copy "token" from response, share "pairingCode" with the gateway owner, then run:
openclaw pairing approve clawg-ui <pairingCode>

# 3. Configure environment
cp .env.example .env
# Edit .env and paste your device token into VITE_CLAWG_AI_DEVICE_TOKEN

# 4. Install dependencies and build the UI
npm install
cd ui && npm install && npm run build && cd ..

# 5. Install and start
openclaw plugins install -l .
openclaw gateway restart

# 6. Open
open http://localhost:18789/mission-control
```

## Development (hot reload)

```bash
# Terminal 1 — gateway
openclaw gateway run

# Terminal 2 — UI dev server with proxy
cd ui && npm run dev
# → http://localhost:5173/mission-control
```

The Vite dev server proxies `/mission-control/api`, `/mission-control/events`, and `/v1/clawg-ui` to `localhost:18789`.

## Project structure

```
clawg-mission-control/
├── index.ts                    ← plugin entry point: hooks + route registration
├── openclaw.plugin.json        ← plugin manifest
├── src/
│   ├── event-bus.ts            ← in-memory pub/sub for approval events
│   ├── approval-queue.ts       ← pauses risky tool calls pending UI approval
│   ├── slack-config.ts         ← reads/writes Slack config via OpenClaw API
│   └── server.ts               ← HTTP routes served on the gateway
└── ui/
    └── src/
        ├── App.tsx
        ├── config.ts
        ├── lib/api.ts
        ├── hooks/useApprovals.ts
        ├── hooks/useApprovalContext.ts
        ├── components/
        │   ├── ApprovalCard.tsx
        │   ├── ActionCard.tsx
        │   └── WizardStep.tsx
        └── screens/
            ├── LiveFeed.tsx
            ├── SetupWizard.tsx
            └── SlackSettings.tsx
```

## Risky tools that require approval

`bash`, `exec`, `shell`, `write`, `write_file`, `edit`, `delete`, `rm`, `browser`, `fetch`, `email`, `send_email`

## Known issues

See [OPENISSUES.md](OPENISSUES.md).

## License

MIT
