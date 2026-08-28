import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';

const rootArgument = process.argv.find((argument) => argument.startsWith('--root='))?.slice(7);
const root = resolve(rootArgument || process.cwd());
const requireLock = process.argv.includes('--require-lock');
const requireSingleCommit = process.argv.includes('--require-single-commit');

const allowedTopLevel = new Set([
  '.env.example',
  '.github',
  '.gitignore',
  '.gitleaks.toml',
  'LICENSE',
  'NOTICE.md',
  'PUBLIC_INTEGRITY.json',
  'README.md',
  'app',
  'docs',
  'next-env.d.ts',
  'next.config.js',
  'package-lock.json',
  'package.json',
  'postcss.config.js',
  'scripts',
  'src',
  'tsconfig.json',
  'vitest.config.mts',
]);

const allowedDocs = new Set([
  'DEMO.md',
  'EVALS.md',
  'JUDGE-SCORECARD.md',
  'NARRATIVE.md',
  'NATIVE-CHROME-EVIDENCE.md',
  'SOURCE-MANIFEST.md',
  'SUBMISSION.md',
  'VERIFICATION.md',
  'VIDEO-EVIDENCE.md',
]);

const blockedPathSegments = new Set([
  'android',
  'ios',
  'hunt',
  'in-season',
  'mcp-apps',
  'storefront',
  'supabase',
  'video',
]);

const blockedTextPatterns = [
  ['private source branch', /codex\/openai-webmcp-challenge/i],
  ['private canonical repository', /felipestudionn\/aimily(?!-(?:webmcp-challenge|context-review))/i],
  ['internal gbrain wikilink', /\[\[default:/i],
  ['private provenance file', /SOURCE_PROVENANCE\.json/i],
  ['private provenance field', /"source(?:Repository|Branch|Commit|Sha256)"/i],
  ['private workspace path', /\/Users\/[A-Za-z0-9._-]+\//],
  ['private worktree path', /\.codex\/worktrees/i],
  ['film source path', /experiments\/webmcp-challenge-video/i],
  ['OpenAI narration credential name', /OPENAI_API_KEY/],
  ['internal publication gate', /staged privately|remaining human submission gates|exact ChatGPT Desktop gate/i],
  ['named operator gate', /Felipe(?:'s)? account|Felipe must/i],
  ['Vercel deployment identifier', /dpl_[A-Za-z0-9]{16,}/],
];

const credentialPatterns = [
  ['AWS access key', /AKIA[0-9A-Z]{16}/],
  ['GitHub token', /(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}/],
  ['OpenAI or Anthropic key', /(?:sk-(?:live|test|ant)-)[A-Za-z0-9_-]{16,}/],
  ['Slack token', /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['credentialed database URL', /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s:]+:[^\s@]+@/i],
];

const textualExtensions = new Set([
  '', '.css', '.example', '.gitignore', '.js', '.json', '.md', '.mjs', '.svg',
  '.toml', '.ts', '.tsx', '.txt', '.yaml', '.yml',
]);

const failures = [];
const files = [];

function fail(message) {
  failures.push(message);
}

function publicPath(path) {
  return relative(root, path).split(sep).join('/');
}

async function walk(directory) {
  for (const name of await readdir(directory)) {
    if (name === '.git' || name === '.next' || name === 'node_modules') continue;
    const path = join(directory, name);
    const metadata = await lstat(path);
    const relativePath = publicPath(path);
    if (metadata.isSymbolicLink()) {
      fail(`Symlink is not allowed: ${relativePath}`);
      continue;
    }
    if (metadata.isDirectory()) {
      await walk(path);
      continue;
    }
    files.push({ path, relativePath, size: metadata.size });
  }
}

await walk(root);

for (const entry of await readdir(root)) {
  if (!allowedTopLevel.has(entry) && entry !== '.git' && entry !== '.next' && entry !== 'node_modules') {
    fail(`Unexpected top-level entry: ${entry}`);
  }
}

for (const file of files) {
  const segments = file.relativePath.toLocaleLowerCase().split('/');
  const blockedSegment = segments.find((segment) => blockedPathSegments.has(segment));
  if (blockedSegment) fail(`Blocked product path segment "${blockedSegment}": ${file.relativePath}`);
  if (file.relativePath.startsWith('docs/') && !file.relativePath.startsWith('docs/screenshots/')) {
    const doc = file.relativePath.slice('docs/'.length);
    if (!allowedDocs.has(doc)) fail(`Unexpected public document: ${file.relativePath}`);
  }
  if (/\.(?:env|pem|key|p12|pfx|map)$/i.test(file.relativePath) && file.relativePath !== '.env.example') {
    fail(`Sensitive file type is not allowed: ${file.relativePath}`);
  }
  if (file.size > 5_000_000) fail(`File exceeds the 5 MB publication budget: ${file.relativePath}`);
  if (!textualExtensions.has(extname(file.relativePath).toLocaleLowerCase())) continue;
  const value = await readFile(file.path, 'utf8');
  if (file.relativePath === 'scripts/audit-webmcp-public-export.mjs') continue;
  for (const [label, pattern] of [...credentialPatterns, ...blockedTextPatterns]) {
    if (pattern.test(value)) fail(`${label} found in ${file.relativePath}`);
  }
}

const packagePath = join(root, 'package.json');
try {
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  if (packageJson.private !== true) fail('package.json must keep private: true to prevent npm publication.');
  const envNames = new Set();
  for (const file of files.filter((item) => textualExtensions.has(extname(item.relativePath)))) {
    const value = await readFile(file.path, 'utf8');
    for (const match of value.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) envNames.add(match[1]);
  }
  const allowedEnv = new Set([
    'NODE_ENV',
    'WEBMCP_CAPTURE_PAUSE_MS',
    'WEBMCP_CHALLENGE_SECRET',
    'WEBMCP_CHALLENGE_URL',
    'WEBMCP_CHROME_PATH',
    'WEBMCP_EVIDENCE_DIR',
    'WEBMCP_HEADLESS',
    'WEBMCP_SCREENCAST_PATH',
    'WEBMCP_VIEWPORT_HEIGHT',
    'WEBMCP_VIEWPORT_WIDTH',
  ]);
  const unexpectedEnv = [...envNames].filter((name) => !allowedEnv.has(name));
  if (unexpectedEnv.length) fail(`Unexpected environment variables: ${unexpectedEnv.sort().join(', ')}`);
} catch (error) {
  fail(`Could not validate package.json: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const manifest = JSON.parse(await readFile(join(root, 'PUBLIC_INTEGRITY.json'), 'utf8'));
  if (manifest.sourceRepository || manifest.sourceBranch || manifest.sourceCommit) {
    fail('PUBLIC_INTEGRITY.json contains private source provenance.');
  }
  for (const entry of manifest.files ?? []) {
    if (!entry.path || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? '')) {
      fail('PUBLIC_INTEGRITY.json contains an invalid file record.');
      continue;
    }
    try {
      const value = await readFile(join(root, entry.path));
      const actual = createHash('sha256').update(value).digest('hex');
      if (actual !== entry.sha256) fail(`Integrity mismatch: ${entry.path}`);
    } catch {
      fail(`Integrity file is missing: ${entry.path}`);
    }
  }
} catch (error) {
  fail(`Could not validate PUBLIC_INTEGRITY.json: ${error instanceof Error ? error.message : String(error)}`);
}

if (requireLock) {
  try {
    await lstat(join(root, 'package-lock.json'));
  } catch {
    fail('package-lock.json is required for the publication candidate.');
  }
}

if (requireSingleCommit) {
  try {
    const count = Number(execFileSync('git', ['rev-list', '--count', '--all'], {
      cwd: root,
      encoding: 'utf8',
    }).trim());
    const branches = execFileSync('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads'], {
      cwd: root,
      encoding: 'utf8',
    }).trim().split('\n').filter(Boolean);
    if (count !== 1) fail(`Publication history must contain exactly one commit; observed ${count}.`);
    if (branches.length !== 1 || branches[0] !== 'main') {
      fail(`Publication candidate must contain only the main branch; observed ${branches.join(', ') || 'none'}.`);
    }
  } catch (error) {
    fail(`Could not validate publication git history: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
if (files.length > 80) fail(`Publication package exceeds the 80-file budget: ${files.length}.`);
if (totalBytes > 8_000_000) fail(`Publication package exceeds the 8 MB budget: ${totalBytes} bytes.`);

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures: [...new Set(failures)].sort() }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  root,
  files: files.length,
  bytes: totalBytes,
  integrity: 'verified',
  gitHistory: requireSingleCommit ? 'single-commit-main' : 'not-required',
}, null, 2));
