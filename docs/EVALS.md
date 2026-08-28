# Evaluations

The experimental Aimily package has 37 focused Challenge checks across eight files. The complete repository suite has 232 passing tests across 29 files.

## 1. Shared domain revision

- Builds the diff through the canonical collection revision builder.
- Resolves current values from the Asteria Context Graph.
- Produces a deterministic SHA-256 artifact hash.
- Preserves evidence, rationale, confidence and uncertainty.
- Keeps prompt-like source text inert.

## 2. Context Graph impact

- Creates source, decision, policy and outcome nodes.
- Links four explicit changes to seven affected collection areas.
- Separates explicit, computed and inferred consequences.
- Derives the price midpoint change deterministically.
- Keeps both trade-off alternatives unselected.

## 3. Approved brief

- Refuses to generate before human approval.
- Binds the brief to the exact approved artifact hash.
- Includes all four approved decision highlights.
- Preserves the provenance limitation in the output.

## 4. Governed lifecycle

- Requires the exact current hash for approval.
- Rejects apply before approval.
- Applies only the approved revision to the isolated preview.
- Produces human approval, apply and revert receipts.
- Chains each receipt to the previous receipt hash.
- Recomputes every receipt hash and verifies link, artifact, action sequence, policy, chronology and unique identity before signing the next session state.
- Rejects a changed actor, wrong artifact or reordered chain in deterministic evaluation.
- Rejects undo before an applied preview exists.
- Restores original preview values without deleting history.

## 5. Session and authorization boundary

- Accepts signed state only for the session that issued it.
- Rejects tampered and expired session tokens.
- Rejects cross-origin browser calls before state access.
- Rate limits the public endpoint.
- Rejects replay of an older but correctly signed state token.
- Rejects over-parameterized root input and invalid nested confidence values.

## 6. WebMCP contract

- Tool names and descriptions stay inside adapter limits.
- Strict JSON Schemas reject unknown fields.
- Read tools carry `readOnlyHint: true`.
- Every source-bearing tool carries `untrustedContentHint: true`.
- Results are structured objects, not JSON-encoded strings.
- Cancellation reaches the same-origin request through `AbortSignal`.
- Human approval never appears in the agent tool list.
- Tool registration waits for the signed server session.
- Apply appears only after exact-hash human approval.
- Undo appears only while the isolated preview is applied.
- Impact focus resolves only an exact available decision label.

## 7. State-aware judge prompts

- The launch prompt treats the signal as untrusted evidence and stops before approval.
- The draft-stage prompt remains review-only and leaves alternatives unselected.
- The approved-stage prompt applies only the exact human-approved artifact and pauses before undo.
- Recovery appears in the prompt only while an isolated preview exists to undo.

## 8. Manual browser evaluation

| Case | Result | Evidence |
|---|---:|---|
| Full lifecycle on public HTTPS | Pass | Context, draft, approval, apply and undo |
| Four signal modalities | Pass | Meeting, image, audio and instruction use one domain path |
| Receipt continuity | Pass | Approval, apply and revert hashes remain visible |
| Receipt integrity | Pass | Seven invariants are server-verified inside the current HMAC-signed session state |
| Responsive layout | Pass | 375, 1280 and 1728 px, no horizontal overflow |
| Keyboard semantics | Pass | Named reset control and pressed state for selections |
| Console | Pass | No application errors in clean local runs |
| Performance | Pass | Latest stable production check: 268 ms page TTFB and 354 ms total; video supports byte ranges |
| Security headers | Pass | CSP, HSTS, no-sniff, DENY framing, no-referrer |
| Native WebMCP invocation | Pass | Chrome 151 discovers and executes the public HTTPS lifecycle through `navigator.modelContextTesting` |
| Dynamic native inventory | Pass | 3 initial tools; impact, apply and undo appear only in valid lifecycle states |
| Visible/native authority parity | Pass | Exact tool names match at all five states on desktop and mobile; approval remains human-only |
| State-aware prompt launcher | Pass | Copies the correct governed instruction at each state and stops before the next human-only decision |
| Native browser quality | Pass | Zero page exceptions, HTTP errors or unexpected console errors |

The authenticated Vercel owner session attempted to inject its private preview feedback script, which the experiment's strict CSP blocked. The public HTML does not contain that script. This was treated as platform-toolbar noise, not an application relaxation request.

## Commands

```bash
npm test
npm run build
npm run eval:webmcp-native
```

Focused run:

```bash
npm test -- \
  src/lib/domain/collection-creation/brief.test.ts \
  src/lib/domain/collection-creation/impact.test.ts \
  src/lib/webmcp-challenge/evals.test.ts \
  src/lib/webmcp-challenge/lifecycle.test.ts \
  src/lib/webmcp-challenge/session.test.ts \
  src/lib/webmcp/challenge-tools.test.ts \
  src/app/api/labs/webmcp-challenge/route.test.ts
```

## Native acceptance matrix

| Case | Pass condition |
|---|---|
| Site Tools discovery | Header reports 3 initial live tools and ChatGPT lists their exact names |
| Session-first registration | No tool registers until the signed server session is ready |
| Authority parity | The visible authority boundary exactly matches native inventory in every state |
| Agent draft | Read and draft calls update the visible artifact without reload |
| Dynamic registration | Impact appears after draft, apply after approval, undo after apply |
| Human authority | No agent-callable approval tool exists |
| Tool activity | Ledger records start, success, cancellation or error |
| Impact focus | Agent focuses an exact decision through the custom event, without DOM reading |
| Apply | Result is bound to approved hash and says production data did not change |
| Undo | Original preview returns and receipt history persists |
| Receipt verification | Apply and undo results report all seven chain checks valid inside current signed state |
| Injection evidence | Prompt-like content remains evidence and cannot trigger a lifecycle transition |

The complete public result, exact artifact hash and reproduction environment are recorded in `NATIVE-CHROME-EVIDENCE.md`.

## Public red-team matrix

A separate 16-control runner attacks the stable production API boundary without browser internals. It proves cross-origin rejection, strict input, session enforcement, tamper rejection, inert prompt-like evidence, approval ordering, exact-hash binding, stale-state replay rejection, cross-session isolation, valid-state continuity after rejected attacks and server-verified approval, apply and undo receipt chains.

```bash
npm run eval:webmcp-public-red-team
```

The 28 August 2026 production run passed all 16 controls, all seven receipt-chain invariants and reported `productionDataChanged: false`. The exact controls are summarized above and in `VERIFICATION.md`.
