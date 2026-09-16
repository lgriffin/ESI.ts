/**
 * Schema Drift Detection
 *
 * Compares the hand-written Zod response schema of every endpoint definition
 * with the response body the ESI OpenAPI spec defines for that operation:
 * fields missing on either side, required/optional disagreements and kind
 * mismatches, at any depth.
 *
 * Known drift is listed in scripts/schema-drift-baseline.json, each entry
 * tagged with the bead that tracks fixing it. The baseline is a shrink-only
 * ratchet; see guides/QUALITY-GATES.md.
 *
 * Usage: npm run schema:drift                 report; exits 0 unless the check is broken
 *        npm run schema:drift:ci              also fails on drift that disagrees with the baseline
 *        npm run schema:drift -- --update-baseline [--bead=esi-xxx]
 *                                             rewrite the baseline from the current findings,
 *                                             keeping existing bead ids; new entries need --bead
 *
 * Exit codes: 0 pass, 1 drift disagrees with the baseline (--ci), 2 the check
 * itself is broken (compared nothing, matched too little, bad baseline, spec
 * fetch failed under --ci).
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  BaseBaseline,
  DriftBaseline,
  DriftExceptions,
  DriftFinding,
  EXIT_INTEGRITY,
  OpenApiSpec,
  RatchetResult,
  SchemaDriftReport,
  applyBaseline,
  buildDriftReport,
  emptyBaseline,
  exitCodeFor,
  findingKey,
  integrityProblems,
  mappingsFromEndpointModules,
  parseBaseline,
  ratchetProblems,
  serializeBaseline,
} from './schema-drift-core';

const ciMode = process.argv.includes('--ci');
const updateBaseline = process.argv.includes('--update-baseline');
const beadArg = process.argv
  .find((arg) => arg.startsWith('--bead='))
  ?.slice('--bead='.length);

const COMPATIBILITY_DATE = '2025-12-16';
const ESI_OPENAPI_URL = `https://esi.evetech.net/meta/openapi.json?compatibility_date=${COMPATIBILITY_DATE}`;

const REPO_ROOT = path.resolve(__dirname, '..');
const ENDPOINTS_DIR = path.join(REPO_ROOT, 'src', 'core', 'endpoints');
const EXCEPTIONS_PATH = path.join(__dirname, 'schema-drift-exceptions.json');
const BASELINE_PATH = path.join(__dirname, 'schema-drift-baseline.json');

const BASELINE_COMMENT =
  'Known schema drift against the ESI spec (compatibility_date ' +
  `${COMPATIBILITY_DATE}), each entry tagged with the bead that tracks fixing it. ` +
  'A shrink-only ratchet: schema:drift:ci fails on drift not listed here, on ' +
  'entries that no longer occur (remove them), and on entries absent from the ' +
  "base branch's copy. Keys: '<endpoint> <field> <kind>' under findings, " +
  "'<endpoint>' under unmatched. See guides/QUALITY-GATES.md.";

// --- Loading ---------------------------------------------------------------

function loadExceptions(): DriftExceptions {
  if (!fs.existsSync(EXCEPTIONS_PATH)) return {};
  const parsed = JSON.parse(
    fs.readFileSync(EXCEPTIONS_PATH, 'utf-8'),
  ) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, string[]] =>
        !entry[0].startsWith('_') &&
        !entry[0].startsWith('$') &&
        Array.isArray(entry[1]),
    ),
  );
}

async function loadMappings() {
  const schemaExports = (await import('../src/schemas')) as Record<
    string,
    unknown
  >;
  const schemaNames = new Map<unknown, string>();
  for (const [name, value] of Object.entries(schemaExports)) {
    if (name.endsWith('Schema') && !schemaNames.has(value)) {
      schemaNames.set(value, name);
    }
  }

  const modules: Record<string, Record<string, unknown>> = {};
  for (const file of fs.readdirSync(ENDPOINTS_DIR)) {
    if (!file.endsWith('Endpoints.ts') || file.endsWith('.generated.ts')) {
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modules[file] = require(path.join(ENDPOINTS_DIR, file)) as Record<
      string,
      unknown
    >;
  }
  return mappingsFromEndpointModules(modules, schemaNames);
}

function loadBaseline(): DriftBaseline {
  if (!fs.existsSync(BASELINE_PATH)) return emptyBaseline();
  return parseBaseline(fs.readFileSync(BASELINE_PATH, 'utf-8'));
}

/**
 * The baseline on the integration branch. SCHEMA_DRIFT_BASE_REF comes first:
 * CI sets it to the pull request's base tip (`HEAD^1`), because a shallow
 * pull request checkout has no `origin/master`.
 */
function loadBaseBaseline(): BaseBaseline {
  const relPath = path
    .relative(REPO_ROOT, BASELINE_PATH)
    .split(path.sep)
    .join('/');
  const refs = [
    process.env.SCHEMA_DRIFT_BASE_REF,
    'origin/master',
    'master',
  ].filter((ref): ref is string => Boolean(ref));

  const git = (args: string[]) =>
    execFileSync('git', args, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

  for (const ref of refs) {
    try {
      git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    } catch {
      continue; // Ref not available in this checkout; try the next one.
    }
    let raw: string;
    try {
      raw = git(['show', `${ref}:${relPath}`]);
    } catch {
      return { ref, baseline: null }; // The ref predates the baseline file.
    }
    try {
      return { ref, baseline: parseBaseline(raw) };
    } catch {
      // An unreadable base copy cannot vouch for any entry: fail closed.
      return { ref, baseline: emptyBaseline() };
    }
  }
  return { ref: null, baseline: null };
}

// --- Output ----------------------------------------------------------------

function printFindings(
  report: SchemaDriftReport,
  baseline: DriftBaseline,
): void {
  const byEndpoint = new Map<string, DriftFinding[]>();
  for (const finding of report.findings) {
    const list = byEndpoint.get(finding.endpoint) ?? [];
    list.push(finding);
    byEndpoint.set(finding.endpoint, list);
  }
  for (const [endpoint, findings] of byEndpoint) {
    const first = findings[0]!;
    console.log(
      `--- ${endpoint}: ${first.schemaName} vs ${first.specPath} ---`,
    );
    for (const finding of findings) {
      const bead = baseline.findings[findingKey(finding)];
      const tag = bead ? `baselined ${bead}` : 'NEW';
      console.log(
        `  [${tag}] ${finding.field} ${finding.kind}: ${finding.detail}`,
      );
    }
    console.log('');
  }

  if (report.unmatched.length > 0) {
    console.log(
      `--- Endpoints with no operation in the ${COMPATIBILITY_DATE} spec ---`,
    );
    for (const u of report.unmatched) {
      const bead = baseline.unmatched[u.endpoint];
      const tag = bead ? `baselined ${bead}` : 'NEW';
      console.log(
        `  [${tag}] ${u.endpoint}: ${u.method.toUpperCase()} ${u.path} (${u.reason})`,
      );
    }
    console.log('');
  }

  if (report.uncompared.length > 0) {
    console.log('--- Matched but not compared ---');
    for (const u of report.uncompared) {
      console.log(`  ${u.endpoint}: ${u.specPath} (${u.reason})`);
    }
    console.log('');
  }
}

function printRatchet(ratchet: RatchetResult, base: BaseBaseline): void {
  const list = (title: string, items: string[]) => {
    if (items.length === 0) return;
    console.log(title);
    for (const item of items) console.log(`  ${item}`);
    console.log('');
  };
  list(
    'Drift not in the baseline (fix the schema):',
    ratchet.newFindings.map(findingKey),
  );
  list(
    'Unmatched endpoints not in the baseline:',
    ratchet.newUnmatched.map((u) => u.endpoint),
  );
  list(
    'Baseline entries that no longer occur (remove them, e.g. with --update-baseline):',
    ratchet.stale,
  );
  list(
    base.ref === null
      ? 'Baseline entries that could not be checked against a base ref (fails closed):'
      : `Baseline entries not in ${base.ref}'s baseline (it only shrinks):`,
    ratchet.added,
  );
}

// --- Main ------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`Fetching ESI OpenAPI spec (${COMPATIBILITY_DATE})...`);
  const response = await fetch(ESI_OPENAPI_URL);
  if (!response.ok) {
    // CI greps for "HTTP 503" to tell Tranquility downtime from a real failure.
    console.error(
      `Failed to fetch spec: HTTP ${response.status} ${response.statusText}`,
    );
    process.exit(ciMode ? EXIT_INTEGRITY : 0);
  }
  const spec = (await response.json()) as OpenApiSpec;
  console.log(`Spec loaded: ${Object.keys(spec.paths).length} paths\n`);

  const exceptions = loadExceptions();
  const mappings = await loadMappings();
  const report = buildDriftReport(spec, mappings, exceptions);

  let baseline: DriftBaseline;
  try {
    baseline = loadBaseline();
  } catch (err) {
    console.error(
      `::error::scripts/schema-drift-baseline.json is invalid: ${(err as Error).message}`,
    );
    process.exit(EXIT_INTEGRITY);
  }

  if (updateBaseline) {
    const next = emptyBaseline();
    const missingBead: string[] = [];
    const tag = (key: string, existing: string | undefined) => {
      const bead = existing ?? beadArg;
      if (!bead) missingBead.push(key);
      return bead ?? '';
    };
    for (const finding of report.findings) {
      const key = findingKey(finding);
      next.findings[key] = tag(key, baseline.findings[key]);
    }
    for (const u of report.unmatched) {
      next.unmatched[u.endpoint] = tag(
        u.endpoint,
        baseline.unmatched[u.endpoint],
      );
    }
    if (missingBead.length > 0) {
      console.error(
        `${missingBead.length} new baseline entries need a bead: rerun with --bead=esi-<id>.`,
      );
      process.exit(EXIT_INTEGRITY);
    }
    fs.writeFileSync(BASELINE_PATH, serializeBaseline(next, BASELINE_COMMENT));
    baseline = next;
    console.log(
      `Wrote ${Object.keys(next.findings).length} findings and ` +
        `${Object.keys(next.unmatched).length} unmatched endpoints to the baseline.\n`,
    );
  }

  const base = loadBaseBaseline();
  const ratchet = applyBaseline(report, baseline, base);

  printFindings(report, baseline);
  printRatchet(ratchet, base);

  const integrity = integrityProblems(report);
  const ratchetIssues = ratchetProblems(ratchet);

  console.log('='.repeat(60));
  console.log('SCHEMA DRIFT REPORT');
  console.log('='.repeat(60));
  console.log(`Compatibility date:       ${COMPATIBILITY_DATE}`);
  console.log(`Mappings:                 ${report.mappings}`);
  console.log(`Matched a spec operation: ${report.matched}`);
  console.log(`Unmatched:                ${report.unmatched.length}`);
  console.log(`Compared:                 ${report.compared}`);
  console.log(
    `Endpoints with drift:     ${new Set(report.findings.map((f) => f.endpoint)).size}`,
  );
  console.log(`Drift findings:           ${report.findings.length}`);
  console.log(
    `Baselined:                ${report.findings.length - ratchet.newFindings.length} findings, ` +
      `${report.unmatched.length - ratchet.newUnmatched.length} unmatched`,
  );
  console.log(`Baseline compared with:   ${base.ref ?? '(no base ref)'}`);
  for (const key of report.unusedExceptions) {
    console.log(
      `::warning::schema-drift-exceptions.json entry ${key} suppressed nothing`,
    );
  }
  for (const problem of integrity) {
    console.log(`::error::Schema drift check is broken: ${problem}`);
  }
  for (const problem of ratchetIssues) {
    console.log(`${ciMode ? '::error::' : ''}${problem}`);
  }
  if (integrity.length === 0 && ratchetIssues.length === 0) {
    console.log('All drift is baselined and the baseline is current.');
  }

  process.exit(exitCodeFor(report, { ci: ciMode, ratchet }));
}

main().catch((err) => {
  console.error('Schema drift detection failed:', err);
  process.exit(ciMode ? EXIT_INTEGRITY : 0);
});
