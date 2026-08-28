# Native WebMCP evidence

Date: 28 August 2026

This record proves the experimental Aimily journey through the browser's native WebMCP testing surface. It does not use the visible fallback controls to invoke agent tools.

## Environment

- Browser: Google Chrome `151.0.7922.174`
- Capability flags: `--enable-experimental-web-platform-features --enable-features=WebMCP`
- Page capability: `typeof document.modelContext === "object"`
- Native test capability: `typeof navigator.modelContextTesting === "object"`
- Public HTTPS deployment: [Aimily Context Review](https://aimily-webmcp-challenge.vercel.app/webmcp-challenge)
- Viewports exercised: 2560x1440, 1728x1100 and 375x900

Chrome with the experimental WebMCP capability is an official Challenge testing route. ChatGPT Desktop Site Tools remains a preferred optional insert because it demonstrates the end-user surface directly; it is not claimed or required for the current proven film.

## What the native harness does

1. Opens the public HTTPS page in a clean browser profile.
2. Waits until the signed server session exists before any tool can register.
3. Reads the native inventory from `navigator.modelContextTesting.listTools()`.
4. Confirms the live authority strip contains those exact tool names and preserves approval as human-only.
5. Copies the state-aware launch prompt and confirms later prompt controls change with review, approval, apply and recovery.
6. Invokes `read_creation_context` through `executeTool()`.
7. Invokes `draft_collection_revision` with an untrusted audio-derived signal.
8. Invokes `inspect_revision_impact` and focuses the exact pricing decision through the tool result event.
9. Clicks the page's human-only **Approve exact revision** control.
10. Confirms there is no agent-callable approval tool.
11. Invokes `read_approved_brief` and `apply_approved_revision` natively.
12. Confirms the result is bound to the approved hash and `production_data_changed` is `false`.
13. Confirms `undo_revision_preview` appears only after apply, invokes it natively and verifies receipt hashes, links, artifact binding, action sequence, policy, chronology and identity.
14. Fails on any mismatch between visible and native authority, prompt stage, page exception, HTTP error or unexpected console error.

## Dynamic capability proof

| Lifecycle state | Native tools discovered |
|---|---|
| Context ready | `draft_collection_revision`, `get_collection_revision`, `read_creation_context` |
| Draft ready | Previous tools plus `inspect_revision_impact` |
| Human approved | `apply_approved_revision`, `get_collection_revision`, `inspect_revision_impact`, `read_approved_brief`, `read_creation_context` |
| Preview applied | Read tools plus `undo_revision_preview` |
| Preview reverted | Draft capability returns; undo disappears |

Human approval never appears in any native inventory.

The page renders this same inventory as a live authority boundary. It is generated from the exact tool objects passed to `document.modelContext`, not from a separate marketing list. The native harness compares both surfaces at every lifecycle state.

## Exact result

- Completed states: `context_ready`, `draft_ready`, `approved`, `preview_applied`, `preview_reverted`
- Artifact SHA-256: `5e79cfd28b2dd47330714cb61393d450da6e7f89f42cb60f8a7d6f1eed805552`
- Chained receipts: 3
- Receipt integrity: verified, seven of seven checks valid
- State token: `server_hmac_signed_current_session`
- Visible proof: `Verified in signed state`
- Latest visible receipt: Preview restored
- Native activity ledger: undo completed, Preview restored
- Production data changed: false
- Page exceptions: 0
- HTTP errors: 0
- Unexpected console errors: 0
- Visible/native authority match: exact at all five lifecycle states
- Registration boundary: tools remain absent until the signed server session is ready
- Prompt launcher: copy succeeds and the control matches all five lifecycle states
- Production deployment: `current production deployment`, `READY`

## Reproduce in one command

```bash
WEBMCP_CHALLENGE_URL='https://aimily-webmcp-challenge.vercel.app/webmcp-challenge' \
WEBMCP_EVIDENCE_DIR='/tmp/aimily-webmcp-native' \
WEBMCP_VIEWPORT_WIDTH=2560 \
WEBMCP_VIEWPORT_HEIGHT=1440 \
npm run eval:webmcp-native
```

The runner is `scripts/evals/run-webmcp-chrome-native.mjs`. It launches a fresh Chrome process and exits non-zero if the native lifecycle, dynamic tool inventory, governance boundary or browser quality checks fail.

To generate the versioned film insert from the exact same acceptance run:

```bash
WEBMCP_CHALLENGE_URL='https://aimily-webmcp-challenge.vercel.app/webmcp-challenge' \
WEBMCP_SCREENCAST_PATH='/tmp/aimily-webmcp-native/native-lifecycle.webm' \
WEBMCP_CAPTURE_PAUSE_MS=1400 \
WEBMCP_VIEWPORT_WIDTH=1920 \
WEBMCP_VIEWPORT_HEIGHT=1080 \
npm run eval:webmcp-native
```

The optional screencast mode pauses on the review artifact, native tool ledger, Context Graph, approved brief and receipt chain while retaining every acceptance assertion.

## Honest remaining client gate

This proves the complete native WebMCP lifecycle in Chrome 151. A separate 28 August run also proved native discovery, context read, draft, dynamic inventory, readback and impact inspection in the ChatGPT Codex in-app browser; see `CHATGPT-IN-APP-EVIDENCE.md`. This Chrome evidence is not a recording of ChatGPT Desktop's gray or blue Site Tools arrow. The verified Chrome-native recording remains the full-lifecycle audiovisual proof.

Official references:

- [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/)
- [Using Site Tools in the ChatGPT desktop app](https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app)
- [OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
