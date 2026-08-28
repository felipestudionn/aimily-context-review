# Verification record

Date: 28 August 2026

This record covers the experimental WebMCP Challenge branch for Aimily.

## Proven in code and automated evaluation

- The implementation is exported into a separate experimental repository with no canonical product history.
- The isolated app imports Aimily's shared collection revision domain layer. It does not duplicate collection business logic.
- Seven page-scoped intent tools are defined across the governed lifecycle.
- The page's live authority boundary is derived from the exact tool objects registered through `document.modelContext`, not a parallel capability list.
- Tool registration is withheld until the server has established the signed session, preventing an initial invocation race.
- The adapter calls `document.modelContext.registerTool()` and unregisters tools when page state changes.
- Registration and in-flight requests use `AbortController` and `AbortSignal`.
- Inputs use strict JSON Schema. Tool outputs are structured objects.
- Read tools use `readOnlyHint: true`.
- Every source-bearing tool uses `untrustedContentHint: true`.
- No site tool reads the DOM or interprets screenshots.
- Human approval is not agent-callable.
- Apply appears only after exact-hash human approval.
- Undo appears only while an applied preview exists.
- The pure builders create the revision diff, impact graph and approved brief deterministically.
- Approval, apply and undo produce chained receipt hashes.
- Before signing a new state token, the server verifies each receipt hash, previous link, artifact binding, action sequence, actor and undo policy, chronology and unique identity.
- The verifier detects actor changes, wrong artifacts and reordered chains in focused evaluation.
- Tampered session state, cross-session state, replay, cross-origin calls and stale hashes are rejected.
- Over-parameterized inputs and invalid nested values are rejected.
- Prompt-like evidence remains inert and cannot trigger a state transition.
- 37 focused Challenge checks pass.
- The complete suite passes: 29 files and 232 tests.
- `npm run build` passes TypeScript and produces only the isolated page and API routes.

## Proven on the public HTTPS deployment

- Live URL: [Aimily Context Review](https://aimily-webmcp-challenge.vercel.app/webmcp-challenge)
- Vercel production deployment: `current production deployment`, status `READY`.
- The page returns HTTP 200 anonymously.
- A signed HttpOnly session bootstraps without product credentials.
- Draft, exact-hash approval, approved brief, isolated apply and undo complete through the real API.
- Meeting, fitting image, audio and instruction stories use the same domain path.
- The audio story persists its source, headline, evidence and artifact identity after reload.
- The Context Graph displays explicit, computed and inferred consequences plus two unselected alternatives.
- Human approval, apply and revert receipts remain visible and ordered.
- The receipt area visibly reports `Verified in signed state`; native tool results report all seven integrity checks valid.
- Undo restores the original preview without deleting the approved record.
- Responsive checks pass at 375×812, 1280×900 and 1728×1000 with no horizontal overflow.
- Accessibility exposes the icon-only reset label and selected-state semantics.
- Latest observed production page load: 268 ms TTFB and 354 ms total; the 13.5 MB video remains byte-identical and supports partial delivery.
- The delivery MP4 returns `video/mp4`, supports byte ranges with `206 Partial Content`, and downloads with the expected SHA-256.
- Production environment inventory contains only the hidden `WEBMCP_CHALLENGE_SECRET`; no canonical Aimily credential is present.
- Response headers include CSP, HSTS, `nosniff`, `DENY` framing and `no-referrer`.
- Canonical, Open Graph and Twitter metadata point to a locally rendered 1200x630 Aimily Challenge card.
- The production Open Graph PNG matches the reviewed render at SHA-256 `01008e80…9e713b`.

## Deliberate isolation

- Public sample collection only: Asteria SS27.
- Separate hidden signing secrets for Preview and Production; neither is a canonical Aimily credential.
- No Supabase keys or canonical Aimily credentials.
- No migration, schema change or production data access.
- “Apply” changes only the signed Challenge preview.
- Pricing, public landing, iOS, Android and the vintage product were not touched.
- The canonical remote Aimily MCP project remains separate.

## Proven in a native WebMCP client

- Chrome `151.0.7922.174` exposes both `document.modelContext` and `navigator.modelContextTesting` with WebMCP enabled.
- The public HTTPS page reports 3 initial live tools and the native inventory returns their exact names.
- The visible authority boundary matches the native inventory at every lifecycle state on desktop and mobile.
- Human approval remains visibly human-only and absent from both inventories.
- The prompt launcher copies successfully in the browser and changes from launch to review, apply, recovery and proof without asking for unavailable authority.
- Native calls complete read, draft, impact, approved brief, apply and undo.
- The native inventory changes at every governed state and never includes human approval.
- Apply is bound to artifact `5e79cfd28b2dd47330714cb61393d450da6e7f89f42cb60f8a7d6f1eed805552`.
- The final result preserves 3 chained receipts and reports `production_data_changed: false`.
- The final result reports `integrity: verified`, seven valid receipt checks and `server_hmac_signed_current_session` on desktop and mobile.
- Desktop and mobile native runs complete with no page exception, HTTP error or unexpected console error.
- A 1920x1080 Chrome screencast of the same native run is encoded to a 23.28-second H.264 source insert.
- The 75.05-second Remotion master embeds that insert and renders successfully at 1920x1080, H.264 plus 48 kHz AAC, 30 fps.
- Scene-synchronized OpenAI synthetic narration, burned-in English captions and an explicit disclosure are present.
- Eight representative final-cut moments have been visually inspected with no clipping or narrative contradiction; machine transcription recognizes the approval, signed-state, undo and closing claims.
- The stable production API passes a separate 16-control red team covering origin, schema, session, tampering, injection evidence, approval ordering, artifact hash, replay, cross-session isolation and the approval, apply and undo receipt chain.
- Independent GitHub Actions verification for the sanitized package passes install, production audit, the focused suite and build from the current sanitized repository.

The exact Chrome-native command and result are in `NATIVE-CHROME-EVIDENCE.md`; the ChatGPT in-app browser evidence is recorded below; final media properties and hashes are in `VIDEO-EVIDENCE.md`.

## Proven in the ChatGPT in-app browser

- The live HTTPS page exposes WebMCP through the browser's native capability surface.
- The initial inventory contains exactly `read_creation_context`, `draft_collection_revision` and `get_collection_revision`.
- The browser reports the correct `readOnlyHint` values and `untrustedContentHint: true` for all source-bearing tools.
- A native read returned the Asteria SS27 context with `production_data_changed: false`.
- A native draft created revision `d82665c8-fc6b-4aa2-be33-e337d1a9a3dd`, bound to artifact hash `7b5f55ce8e0ff40194c6b829a9f8a85bc2e94d5d2f02849c278cf1014638af0b` and `pending_human_approval`.
- After the draft, a fresh native inventory revealed `inspect_revision_impact`; a stale tool handle was rejected before the inventory was refreshed.
- Native readback and impact inspection returned four changed decisions, explicit, computed and inferred consequences, seven affected areas, two unselected alternatives and average confidence `0.92`.
- Results reported seven of seven receipt integrity checks valid, `server_hmac_signed_current_session` and `production_data_changed: false`.

The ChatGPT run proves native context, draft, dynamic registration, readback and impact inspection. Human approval, apply and undo were intentionally not executed in that run. Their full native lifecycle remains proven in Chrome 151. No ChatGPT video capture is claimed.

## Devpost form verification

- Felipe completed the human reCAPTCHA once. Automation did not retry, solve or bypass it.
- Registration is complete and Devpost submission draft `1158510` exists.
- All five submission steps and their current fields were inspected without transmitting project claims or submitting the entry.
- Official rules and the form require a public live URL, a public repository with a visible open-source license and a public YouTube demo under three minutes with audio.
- Because Aimily is an existing product, the submission must distinguish pre-existing architecture from the WebMCP Challenge extension created during the submission period. The branch history provides dated commits beginning 27 August 2026.
- Spain is eligible under the published rules.

## Official basis

The official OpenAI and Devpost materials available on 28 August 2026 describe a 10-day build window, submissions closing 3 September at 1:00 PM PT, equivalent to 22:00 CEST, a working live app, a public open-source code repository and a public YouTube demo under three minutes with audio. Judging covers usefulness, originality, execution, thoughtful WebMCP use and human-agent experience. Existing applications are allowed only when the Challenge-period WebMCP extension is clearly distinguished from prior work.

Sources:

- [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/)
- [OpenAI announcement](https://community.openai.com/t/the-webmcp-challenge-is-here/1392582)
- [Official Challenge rules](https://webmcp.devpost.com/rules)
- [Using Site Tools in the ChatGPT desktop app](https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app)
- [OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
