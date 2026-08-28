# Submission draft

## Project name

Aimily Context Review

## Tagline

From agent signal to governed collection truth.

## One-line description

Aimily turns meetings, fitting images, voice notes and personal-agent instructions into a governed fashion collection revision with a Context Graph, evidence, exact-hash approval, server-verified receipts inside signed state and undo.

## Short pitch

Fashion decisions arrive as messy human context, not database fields. Aimily lets a personal agent carry that context into the live collection workspace through WebMCP. Instead of mutating product truth, the agent creates a reviewable revision. Aimily resolves the diff, maps downstream consequences, marks evidence and uncertainty, waits for exact human approval, then applies only the approved artifact with a receipt and recovery.

## What we built

Aimily Context Review is a public, signed sandbox built on Aimily's existing collection-creation domain layer. A reviewer can choose a buyer meeting, fitting image, voice note or direct instruction. Every route produces the same governed journey:

1. The agent reads the current collection Context Graph.
2. It drafts four connected intent-level changes across creative direction, materials, pricing and calendar.
3. Aimily resolves before and after values, rationale, evidence and confidence.
4. The impact map separates explicit evidence, deterministic consequences and labelled inference.
5. Two bounded alternatives remain visible and unselected.
6. A human approves the exact SHA-256 artifact hash.
7. A buyer-ready review brief unlocks only after that approval.
8. The agent can apply only the approved artifact to the isolated preview.
9. Every transition creates a SHA-256 chained receipt; the server verifies its hash, link, artifact, sequence, policy, chronology and identity before signing the next session state.
10. Undo restores the preview while preserving the decision record.

## Why it matters

Most agent demos optimise for how much the model can do. Aimily optimises for how confidently a team can let an agent participate in decisions that become product truth.

- Personal agents can bring rich context without becoming the system of record.
- Creative and commercial teams see what changed, why, from which evidence and with what confidence.
- Human approval is a server-enforced policy boundary, not conversational theatre.
- The generated brief is bound to the approved revision instead of being a free-floating summary.
- Recovery is part of the primary workflow.

## Why WebMCP is essential

The value is not a generic chatbot beside the product. WebMCP gives the personal agent narrow, page-scoped access to the same live collection state the human is reviewing.

The page registers typed intent tools through `document.modelContext.registerTool()`. Availability changes with the governed lifecycle:

| Stage | Available agent intents |
|---|---|
| Context ready | `read_creation_context`, `draft_collection_revision`, `get_collection_revision` |
| Draft ready | Read tools plus `inspect_revision_impact` |
| Human approved | Read tools, `read_approved_brief`, `apply_approved_revision` |
| Preview applied | Read tools, approved brief and `undo_revision_preview` |

Human approval is never agent-callable. Apply appears only after approval of the current hash. Undo appears only while an applied preview exists.

The page makes that changing authority legible in a live boundary generated from the exact tool objects being registered. A judge can see each current read or action intent alongside the human-only hash approval, and the native acceptance runner fails if the visible list ever diverges from the browser inventory. Registration itself waits for the signed server session, so no tool can race ahead of authorization.

Every source-bearing tool uses `untrustedContentHint: true`. Read operations use `readOnlyHint: true`; draft, apply and undo use `false`. Inputs use strict JSON Schema, outputs are structured objects, cancellation propagates with `AbortSignal`, and every result states the next valid action and whether production data changed.

The tools never read the DOM and never interpret screenshots. They call the same-origin server boundary and the shared collection domain builder.

## The original idea

Aimily treats agent participation as a governed state machine:

**signal → revision artifact → Context Graph impact → exact-hash approval → approved brief → apply receipt → undo**

That produces a different human-agent relationship:

- Context Graph instead of page scraping.
- Revision artifact instead of direct mutation.
- Exact-hash approval instead of vague confirmation.
- Evidence and uncertainty instead of hidden inference.
- Dynamic capabilities instead of one permanently powerful tool.
- Chained receipts and undo instead of a final “done”.

## Technical execution

- Separate experimental repository and deployment, isolated from the canonical product.
- Separate Vercel project with deployment-only signing secrets and no canonical Aimily credential.
- Public sample collection only, with no Supabase or production Aimily credentials.
- Pure revision, impact and brief builders reused across UI, WebMCP and tests.
- HMAC-signed HttpOnly session and signed state pointer.
- Same-origin enforcement, per-IP rate limiting and strict Zod validation.
- Replay, stale-state, cross-session and exact-hash protections.
- SHA-256 artifact identity plus server-verified receipt hashes, links, artifact binding, action sequence, policy, chronology and identity.
- Strict Content Security Policy and no third-party runtime dependency.
- 37 focused Challenge evals and 232 repository tests passing.
- Native discovery, execution and dynamic registration proven on public HTTPS in Chrome 151.
- Visible authority and native inventory proven identical across all five lifecycle states on desktop and mobile.
- State-aware copy prompts let a cold judge reproduce each next step without requesting unavailable or human-only authority.
- Production red team: 16/16 controls, including the full approval, apply and undo receipt chain.
- A 75.05-second Remotion cut embeds the real Chrome-native lifecycle instead of a simulated client insert, with synchronized synthetic narration, English captions and disclosure.
- Responsive browser QA at 375, 1280 and 1728 px.

## Working demo

- Live HTTPS app: [Aimily Context Review](https://aimily-webmcp-challenge.vercel.app/webmcp-challenge)
- Public 75-second film: [Aimily Context Review film](https://aimily-webmcp-challenge.vercel.app/aimily-context-review.mp4)
- Judge repository: [aimily-webmcp-challenge](https://github.com/felipestudionn/aimily-webmcp-challenge) (standalone evaluation package)
- Reproduction guide: [DEMO.md](./DEMO.md)
- Evals: [EVALS.md](./EVALS.md)
- Verification record: [VERIFICATION.md](./VERIFICATION.md)

## Honest beta boundary

The full signed browser journey, native tool discovery, native invocation, dynamic registration and seven-check receipt verification are proven on the public HTTPS deployment in Chrome 151 with WebMCP enabled. The exact runner, artifact hash, tool inventories and screenshots are versioned in `NATIVE-CHROME-EVIDENCE.md`.

The ChatGPT Codex in-app browser also natively discovered and invoked the live tools. It proved context read, governed draft, dynamic registration, stale-handle rejection, revision readback and impact inspection. That run is recorded in the public verification matrix. It did not execute or record the human approval, apply and undo stages, so those stages are claimed only from the complete Chrome-native proof.

No production collection is modified. “Apply” changes only the signed Challenge preview, which is stated in the interface, tool results and receipts.
