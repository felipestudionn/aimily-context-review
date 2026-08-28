import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const chromePath = process.env.WEBMCP_CHROME_PATH
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const challengeUrl = process.env.WEBMCP_CHALLENGE_URL
  ?? 'http://localhost:3101/webmcp-challenge';
const evidenceDir = process.env.WEBMCP_EVIDENCE_DIR;
const screencastPath = process.env.WEBMCP_SCREENCAST_PATH;
const capturePauseMs = Number(process.env.WEBMCP_CAPTURE_PAUSE_MS ?? 0);
const headless = process.env.WEBMCP_HEADLESS !== 'false';
const viewportWidth = Number(process.env.WEBMCP_VIEWPORT_WIDTH ?? 1440);
const viewportHeight = Number(process.env.WEBMCP_VIEWPORT_HEIGHT ?? 1000);

const revisionInput = {
  source: {
    kind: 'audio',
    title: '03:18 collection voice note',
    summary: 'The personal agent transcribed a collection director voice note requesting warmer tactility, ramie, a tighter core price tier and a protected showroom date.',
    references: [{
      label: '03:18 voice note interpreted by the personal agent',
      reference: 'agent://attachments/collection-direction-audio',
      original_file_saved: false,
    }],
  },
  changes: [
    {
      area: 'creative_direction',
      target: {
        domain: 'creative',
        subdomain: 'direction',
        key: 'collection_tension',
        label: 'Collection tension',
      },
      proposed_value: 'Polished structure warmed by tactile coastal ease',
      rationale: 'The buyer understood the precision but asked for more emotional warmth in the opening story.',
      evidence: ['Buyer language in the meeting recap', 'Texture response observed in the fitting discussion'],
      confidence: 0.93,
    },
    {
      area: 'materials',
      target: {
        domain: 'design',
        subdomain: 'materials',
        key: 'hero_materials',
        label: 'Hero materials',
      },
      proposed_value: ['linen twill', 'washed cotton poplin', 'ramie voile'],
      rationale: 'Ramie adds the dry lustre and movement requested without breaking the natural-material logic.',
      evidence: ['Material note from the fitting photo', 'Supplier swatch reference discussed in the meeting'],
      confidence: 0.88,
    },
    {
      area: 'pricing',
      target: {
        domain: 'merchandising',
        subdomain: 'pricing',
        key: 'core_tier',
        label: 'Core price tier',
      },
      proposed_value: { min: 145, max: 205, currency: 'EUR' },
      rationale: 'A tighter band makes the wholesale story easier to buy while preserving the premium anchor.',
      evidence: ['Buyer threshold discussed explicitly in the meeting'],
      confidence: 0.96,
    },
    {
      area: 'calendar',
      target: {
        domain: 'design',
        subdomain: 'calendar',
        key: 'sample_rounds',
        label: 'Sample rounds',
      },
      proposed_value: 2,
      rationale: 'Remove the intermediate cosmetic round, retain fit and pre-production approvals, and protect the showroom date.',
      evidence: ['Calendar trade-off agreed in the meeting'],
      confidence: 0.91,
    },
  ],
  presentation: {
    requested: true,
    audience: 'Wholesale buyer and collection director',
    objective: 'Explain the revised direction, commercial logic and calendar trade-off in one review.',
  },
  idempotency_key: `webmcp-native-${Date.now()}`,
};

function parseToolResult(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

async function listToolNames(page) {
  return page.evaluate(async () => {
    const tools = await navigator.modelContextTesting.listTools();
    return tools.map((tool) => tool.name).sort();
  });
}

async function waitForTools(page, expected, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  const sortedExpected = [...expected].sort();
  while (Date.now() < deadline) {
    const actual = await listToolNames(page);
    if (JSON.stringify(actual) === JSON.stringify(sortedExpected)) return actual;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.deepEqual(await listToolNames(page), sortedExpected);
}

async function expectVisibleAuthority(page, expected) {
  const visible = await page.evaluate(() => ({
    names: [...document.querySelectorAll('[data-webmcp-tool-name]')]
      .map((element) => element.getAttribute('data-webmcp-tool-name'))
      .filter(Boolean)
      .sort(),
    copy: document.querySelector('[data-testid="agent-authority-strip"]')?.textContent ?? '',
  }));
  assert.deepEqual(visible.names, [...expected].sort());
  assert.match(visible.copy, /human-only authority/i);
  assert.match(visible.copy, /approve exact artifact hash/i);
  return visible;
}

async function expectAgentPrompt(page, stage, label) {
  const launcher = await page.evaluate(() => {
    const element = document.querySelector('[data-testid="agent-prompt-launcher"]');
    return {
      stage: element?.getAttribute('data-agent-prompt-stage') ?? null,
      copy: element?.textContent ?? '',
    };
  });
  assert.equal(launcher.stage, stage);
  assert.match(launcher.copy, label);
}

async function executeTool(page, name, input = {}) {
  return page.evaluate(async ({ toolName, args }) => {
    return navigator.modelContextTesting.executeTool(toolName, JSON.stringify(args));
  }, { toolName: name, args: input }).then(parseToolResult);
}

async function capture(page, filename) {
  if (!evidenceDir) return;
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({
    path: path.join(evidenceDir, filename),
    fullPage: true,
  });
}

async function holdForScreencast(page, selector) {
  if (!screencastPath || capturePauseMs <= 0) return;
  if (selector) {
    await page.evaluate((targetSelector) => {
      document.querySelector(targetSelector)?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }, selector);
  }
  await new Promise((resolve) => setTimeout(resolve, capturePauseMs));
}

async function approveExactRevision(page) {
  await page.waitForFunction(() => (
    [...document.querySelectorAll('button')]
      .some((button) => button.textContent?.includes('Approve exact revision'))
  ));
  const clicked = await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')]
      .find((candidate) => candidate.textContent?.includes('Approve exact revision'));
    if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
    button.click();
    return true;
  });
  assert.equal(clicked, true, 'The human approval control was not clickable.');
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless,
  defaultViewport: { width: viewportWidth, height: viewportHeight, deviceScaleFactor: 1 },
  args: [
    '--enable-experimental-web-platform-features',
    '--enable-features=WebMCP',
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

const pageErrors = [];
const consoleErrors = [];
const httpErrors = [];
let recorder;

function isKnownBrowserNoise(message) {
  return message.includes('vercel.live')
    || message.includes('Hash of blocked script: "eval-sha256-+CsItOgDyYUV0cButNNF02fx9NeCL52rS31Mq6+jjQM="')
    || message === 'Failed to load resource: the server responded with a status of 404 (Not Found)';
}

try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      httpErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !isKnownBrowserNoise(message.text())) {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(challengeUrl, { waitUntil: 'networkidle2', timeout: 30_000 });
  if (screencastPath) {
    await mkdir(path.dirname(screencastPath), { recursive: true });
    recorder = await page.screencast({
      path: screencastPath,
      fps: 30,
      quality: 18,
    });
  }

  await page.waitForFunction(() => {
    const status = document.querySelector('[data-testid="webmcp-status"]')?.textContent ?? '';
    return /3 (?:live )?site tools/.test(status)
      && Boolean(window.localStorage.getItem('aimily:webmcp-challenge:state'));
  }, { timeout: 30_000 });

  const capability = await page.evaluate(() => ({
    documentModelContext: typeof document.modelContext,
    testingApi: typeof navigator.modelContextTesting,
    header: document.body.innerText.match(/\d+ (?:live )?site tools/)?.[0] ?? null,
  }));
  assert.equal(capability.documentModelContext, 'object');
  assert.equal(capability.testingApi, 'object');
  assert.match(capability.header ?? '', /^3 (?:live )?site tools$/);

  const initialTools = await waitForTools(page, [
    'draft_collection_revision',
    'get_collection_revision',
    'read_creation_context',
  ]);
  await expectVisibleAuthority(page, initialTools);
  await expectAgentPrompt(page, 'context_ready', /copy agent launch prompt/i);
  const promptClicked = await page.evaluate(() => {
    const button = document.querySelector('[data-testid="agent-prompt-launcher"]');
    if (!(button instanceof HTMLButtonElement)) return false;
    button.click();
    return true;
  });
  assert.equal(promptClicked, true);
  await page.waitForFunction(() => (
    /prompt copied/i.test(document.querySelector('[data-testid="agent-prompt-launcher"]')?.textContent ?? '')
  ));
  await capture(page, '01-native-discovery.png');
  await holdForScreencast(page, '[data-testid="review-artifact"]');

  const context = await executeTool(page, 'read_creation_context');
  assert.equal(context.stage, 'context_ready');
  assert.equal(context.context.collection.name, 'Asteria');
  assert.equal(context.safety.production_data_changed, false);
  await holdForScreencast(page, '[data-testid="webmcp-tool-activity"]');

  const draft = await executeTool(page, 'draft_collection_revision', revisionInput);
  assert.equal(draft.stage, 'draft_ready');
  assert.equal(draft.revision.diff.length, 4);
  assert.equal(draft.safety.production_data_changed, false);
  const draftTools = await waitForTools(page, [
    'draft_collection_revision',
    'get_collection_revision',
    'inspect_revision_impact',
    'read_creation_context',
  ]);
  await expectVisibleAuthority(page, draftTools);
  await expectAgentPrompt(page, 'draft_ready', /copy review prompt/i);

  const impact = await executeTool(page, 'inspect_revision_impact', {
    focus_target: 'Core price tier',
  });
  assert.equal(impact.stage, 'draft_ready');
  assert.equal(impact.focus.resolved, 'Core price tier');
  assert.ok(impact.impact.nodes.some((node) => node.evidenceKind === 'policy'));
  await capture(page, '02-native-draft.png');
  await holdForScreencast(page, '[data-testid="context-impact-graph"]');

  await approveExactRevision(page);
  const approvedTools = await waitForTools(page, [
    'apply_approved_revision',
    'get_collection_revision',
    'inspect_revision_impact',
    'read_approved_brief',
    'read_creation_context',
  ]);
  await expectVisibleAuthority(page, approvedTools);
  await expectAgentPrompt(page, 'approved', /copy apply prompt/i);
  assert.ok(!approvedTools.includes('approve_collection_revision'));
  await capture(page, '03-human-approval.png');
  await holdForScreencast(page, '[data-testid="approved-review-brief"]');

  const brief = await executeTool(page, 'read_approved_brief');
  assert.equal(brief.stage, 'approved');
  assert.equal(brief.brief.artifactHash, draft.revision.artifact_hash);

  const applied = await executeTool(page, 'apply_approved_revision');
  assert.equal(applied.stage, 'preview_applied');
  assert.equal(applied.safety.production_data_changed, false);
  assert.ok(applied.receipts.length >= 2);
  assert.equal(applied.receipt_chain_verification.valid, true);
  assert.equal(applied.receipt_chain_verification.receiptCount, 2);
  assert.ok(Object.values(applied.receipt_chain_verification.checks).every(Boolean));
  const appliedTools = await waitForTools(page, [
    'get_collection_revision',
    'inspect_revision_impact',
    'read_approved_brief',
    'read_creation_context',
    'undo_revision_preview',
  ]);
  await expectVisibleAuthority(page, appliedTools);
  await expectAgentPrompt(page, 'preview_applied', /copy recovery prompt/i);
  await capture(page, '04-native-apply.png');
  await holdForScreencast(page, '[data-testid="receipt-chain"]');

  const reverted = await executeTool(page, 'undo_revision_preview');
  assert.equal(reverted.stage, 'preview_reverted');
  assert.equal(reverted.safety.production_data_changed, false);
  assert.ok(reverted.receipts.length >= 3);
  assert.equal(reverted.receipt_chain_verification.valid, true);
  assert.equal(reverted.receipt_chain_verification.receiptCount, 3);
  assert.equal(
    reverted.receipt_chain_verification.stateTokenStatus,
    'server_hmac_signed_current_session',
  );
  assert.ok(Object.values(reverted.receipt_chain_verification.checks).every(Boolean));
  const revertedTools = await waitForTools(page, [
    'draft_collection_revision',
    'get_collection_revision',
    'inspect_revision_impact',
    'read_approved_brief',
    'read_creation_context',
  ]);
  await expectVisibleAuthority(page, revertedTools);
  await expectAgentPrompt(page, 'preview_reverted', /copy proof prompt/i);
  await capture(page, '05-native-undo.png');
  await holdForScreencast(page, '[data-testid="receipt-chain"]');

  const visibleEvidence = await page.evaluate(() => ({
    latestReceipt: document.body.innerText.includes('Preview restored'),
    governanceRailComplete: document.body.innerText.includes('Receipt + undo'),
    receiptChainVerified: document.querySelector('[data-testid="receipt-verification"]')?.textContent ?? null,
    nativeLedger: document.querySelector('[data-testid="webmcp-tool-activity"]')?.textContent ?? null,
  }));

  assert.deepEqual(reverted.receipts.map((receipt) => receipt.action), [
    'human_approved',
    'preview_applied',
    'preview_reverted',
  ]);
  assert.equal(visibleEvidence.latestReceipt, true);
  assert.equal(visibleEvidence.governanceRailComplete, true);
  assert.match(visibleEvidence.receiptChainVerified ?? '', /verified in signed state/i);
  assert.match(visibleEvidence.nativeLedger ?? '', /undo revision preview/i);
  assert.match(visibleEvidence.nativeLedger ?? '', /Preview restored/i);
  assert.equal(pageErrors.length, 0, `Page errors: ${pageErrors.join(' | ')}`);
  assert.equal(httpErrors.length, 0, `HTTP errors: ${httpErrors.join(' | ')}`);
  assert.equal(consoleErrors.length, 0, `Console errors: ${consoleErrors.join(' | ')}`);

  console.log(JSON.stringify({
    ok: true,
    browser: await browser.version(),
    url: challengeUrl,
    capability,
    stages: ['context_ready', 'draft_ready', 'approved', 'preview_applied', 'preview_reverted'],
    tools: {
      initial: initialTools,
      draft: draftTools,
      approved: approvedTools,
      applied: appliedTools,
      reverted: revertedTools,
    },
    artifactHash: draft.revision.artifact_hash,
    receiptCount: reverted.receipts.length,
    receiptChainVerification: reverted.receipt_chain_verification,
    productionDataChanged: reverted.safety.production_data_changed,
    visibleEvidence,
    consoleErrors,
    httpErrors,
  }, null, 2));
} finally {
  if (recorder) await recorder.stop();
  await browser.close();
}
