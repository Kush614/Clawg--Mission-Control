# Open Issues

Known issues carried forward from the initial build. These were identified during spec review and deferred for a spec-exact first pass.

## Resolved — OpenClaw 2026.3.2 Migration (`fix/migrate-to-registerHttpRoute`)

The following breaking changes were identified and fixed:

- **`api.registerGatewayHttpHandler` removed** — migrated to `api.registerHttpRoute({ path, auth, match, handler })`
- **Hooks API changed** — `api.hooks.on("tool:before/after")` → `api.on("before_tool_call/after_tool_call")` with return shape `{ block, blockReason }` instead of `{ abort, reason }`
- **Event field rename** — `event.callId` → `event.toolCallId` (was causing approval queue to store entries with key `undefined`)
- **Config API changed** — `api.getConfig()/patchConfig()` → `api.runtime.config.loadConfig()/writeConfigFile()`. Note: `loadConfig()` returns a frozen object; must deep clone before mutation.
- **Slack config location** — belongs at `channels.slack` in the top-level OpenClawConfig, not inside the plugin's own config section
- **Plugin config access** — `api.config` → `api.pluginConfig`
- **CopilotKit → clawg-ui connection** — `runtimeUrl` triggers CopilotRuntime RPC protocol (with /info discovery). Replaced with `agents__unsafe_dev_only` + `HttpAgent` from `@ag-ui/client` for direct AG-UI communication.
- **Package name mismatch** — `package.json` name didn't match `openclaw.plugin.json` id

---

## Bugs / Broken Features

### 1. `ActionCard` imported but never rendered
**File:** `ui/src/screens/LiveFeed.tsx`

`ActionCard` is imported and `events` state is accumulated via `useCoAgentStateRender`, but there is no JSX in `LiveFeed` that renders those events. The component exists and works — it's just never used. Decide whether to add a scrollable agent event history above/alongside `CopilotChat`, or remove the dead import and state.

### 2. `useCoAgentStateRender` side-effect anti-pattern
**File:** `ui/src/screens/LiveFeed.tsx`

The `render` callback passed to `useCoAgentStateRender` calls `setEvents(...)` — a state update — inside a render function. React disallows side effects during render and will double-invoke this in Strict Mode. Move the event capture to a `useEffect` or a proper event listener pattern.

### 3. SSE stream defined server-side but unused by UI
**File:** `src/server.ts` (SSE endpoint), `ui/src/hooks/useApprovals.ts` (polls REST instead)

The plugin exposes a full SSE stream at `/events` that emits `APPROVAL_REQUIRED` / `APPROVAL_RESOLVED` events in real time, but `useApprovals` ignores it and polls the REST endpoint every second. Either switch the hook to consume the SSE stream (lower latency, no polling overhead) or remove the dead SSE endpoint.

---

## Security

### 4. No authentication on approval endpoints
**Files:** `src/server.ts` routes `/api/approvals/:id/approve` and `/api/approvals/:id/reject`

Anyone who can reach the OpenClaw gateway can approve or reject pending tool calls — which is exactly what this plugin exists to gate. These endpoints should require the same device token used by `clawg-ui` (Bearer token in `Authorization` header), or at minimum a shared secret configurable in `openclaw.plugin.json`.

### 5. CORS wildcard on all routes
**File:** `src/server.ts`

All HTTP handlers set `Access-Control-Allow-Origin: *`. This is fine during development but overly permissive for a tool that controls agent actions. Consider restricting to the gateway origin or making it configurable.

---

## Code Quality

### 6. Tailwind CSS loaded via CDN instead of Vite/PostCSS
**File:** `ui/index.html`

The `<script src="https://cdn.tailwindcss.com">` CDN approach means no tree-shaking (full Tailwind ships to the browser), an external network dependency at runtime, and a broken UI in offline/air-gapped environments. Replace with `tailwindcss` + `@tailwindcss/vite` (or PostCSS) as dev dependencies so Vite handles it at build time.

### ~~7. CopilotKit packages pinned to `latest`~~ — RESOLVED
**File:** `ui/package.json`

~~`"@copilotkit/react-core": "latest"` and `"@copilotkit/react-ui": "latest"` will silently pull breaking changes.~~
Pinned to `1.51.4` in the `fix/migrate-to-registerHttpRoute` branch.

### 8. `zod` declared as a dependency but never used
**File:** `package.json` (plugin root)

`zod` is listed under `dependencies` but imported nowhere. Either add input validation where it makes sense (e.g. parsing request bodies in `server.ts`) or remove it.

### 9. `DEVICE_TOKEN` falls back to empty string
**File:** `ui/src/config.ts`

`VITE_CLAWG_AI_DEVICE_TOKEN ?? ""` means a missing token produces a `Bearer ` header with no value, causing silent auth failures against `clawg-ui`. Should log a console warning or display a setup prompt when the token is absent.

Note: `envDir: ".."` was added to `vite.config.ts` so Vite correctly reads `.env` from the repo root, which was the main cause of empty tokens in practice.

---

## Design Limitations

### 10. `RISKY_TOOLS` list is hardcoded and non-configurable
**File:** `src/approval-queue.ts`

The set of tools that trigger approval is static. Users cannot add custom tool names, whitelist specific commands, or configure per-tool behaviour through `openclaw.plugin.json`. Consider exposing a `riskyTools` array in the plugin config schema.

### 11. No Slack token validation on connect
**File:** `src/server.ts` (`/api/slack/connect` handler)

Tokens are stored as-is without verification. A typo in `botToken` or `appToken` is only discovered after restarting the gateway. Consider making a lightweight call to Slack's `auth.test` API before saving, and returning a clear error if it fails.
