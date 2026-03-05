import { MISSION_CONTROL_API } from "../config";

const get  = (p: string) => fetch(`${MISSION_CONTROL_API}${p}`).then((r) => r.json());
const post = (p: string, body?: any) =>
  fetch(`${MISSION_CONTROL_API}${p}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => r.json());
const patch = (p: string, body: any) =>
  fetch(`${MISSION_CONTROL_API}${p}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export const api = {
  getSlackStatus:      ()                       => get("/slack"),
  connectSlack:        (body: any)              => post("/slack/connect", body),
  disconnectSlack:     ()                       => post("/slack/disconnect"),
  updateSlackSettings: (body: any)              => patch("/slack/settings", body),
  getApprovals:        ()                       => get("/approvals"),
  approveAction:       (callId: string)         => post(`/approvals/${callId}/approve`),
  rejectAction:        (callId: string)         => post(`/approvals/${callId}/reject`),
};
