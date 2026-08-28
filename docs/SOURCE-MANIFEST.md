# Challenge source manifest

The Challenge is an isolated delivery surface around Aimily's shared collection revision domain. This manifest lets a reviewer find the relevant code without walking through the rest of the product repository.

## Deployed surface

The separate Vercel project builds only this isolated Challenge application.

| Responsibility | Source |
|---|---|
| Isolated Next.js entry | `app` |
| Social preview card | `app/opengraph-image.tsx` |
| Public Challenge page | `src/components/webmcp-challenge/ChallengeExperience.tsx` |
| Live authority boundary | `src/components/webmcp-challenge/AgentAuthorityStrip.tsx` |
| State-aware agent prompts | `src/lib/webmcp-challenge/agent-prompt.ts` |
| Context Graph | `src/components/webmcp-challenge/ContextImpactGraph.tsx` |
| Approved review brief | `src/components/webmcp-challenge/ApprovedReviewBrief.tsx` |
| Page-scoped registration | `src/components/webmcp/ChallengeTools.tsx` |
| Tool contracts and callbacks | `src/lib/webmcp/challenge-tools.ts` |
| Same-origin client | `src/lib/webmcp-challenge/client.ts` |
| Server lifecycle API | `app/api/labs/webmcp-challenge/route.ts` |
| Signed session boundary | `src/lib/webmcp-challenge/session.ts` |
| State machine, receipt creation and seven-check verifier | `src/lib/webmcp-challenge/lifecycle.ts` |
| Public sample and signal stories | `src/lib/webmcp-challenge/demo.ts` |

## Shared domain reused by the Challenge

| Domain capability | Source |
|---|---|
| Revision contract | `src/lib/domain/collection-creation/contracts.ts` |
| Deterministic diff and artifact hash | `src/lib/domain/collection-creation/revision-draft.ts` |
| Context Graph impact | `src/lib/domain/collection-creation/impact.ts` |
| Approved buyer brief | `src/lib/domain/collection-creation/brief.ts` |

The page, WebMCP adapter, API and tests all call these shared builders. There is no second WebMCP-specific implementation of collection business logic.

## Evidence and reproduction

| Evidence | Source |
|---|---|
| Native Chrome lifecycle runner | `scripts/evals/run-webmcp-chrome-native.mjs` |
| Public production red team | `scripts/evals/run-webmcp-public-red-team.mjs` |
| Focused automated evals | `src/lib/webmcp-challenge/*.test.ts`, `src/lib/webmcp/challenge-tools.test.ts`, `app/api/labs/webmcp-challenge/route.test.ts` |
| Demo instructions | `docs/DEMO.md` |
| Native proof record | `docs/NATIVE-CHROME-EVIDENCE.md` |
| Submission-video proof | `docs/VIDEO-EVIDENCE.md` |
| Verification matrix | `docs/VERIFICATION.md` |
| Submission copy | `docs/SUBMISSION.md` |

## Isolation proof

- The deployment has no Supabase key and no canonical Aimily credential.
- It exposes only `/`, `/webmcp-challenge`, `/api/labs/webmcp-challenge` and its icon.
- Commercial pricing and billing, the public landing, iOS, Android and the vintage application are outside the deployed source tree.
- The canonical remote MCP routes are not part of the isolated build.
- Every write-like Challenge action is bound to the signed sandbox state and reports `production_data_changed: false`.
