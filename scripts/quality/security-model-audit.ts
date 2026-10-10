/**
 * Security model audit: the prose, its index, the tagged Rules, the triage
 * log and the network and header sites in `src/` held together (CHARTER
 * SEC-09 to SEC-12, guides/SECURITY-MODEL.md). The rules are in
 * `security-model-core.ts`, which the unit suite drives with fixtures; this
 * file reads what exists and prints the findings.
 *
 * Usage: npm run security:model [-- --results=<jest json>] [-- --base-ref=<ref>]
 *
 * --results  Jest's JSON output from a BDD run (npm run bdd -- --json
 *            --outputFile=<path>). Every Rule tagged @sec-<id> must have run
 *            and passed in it. Without it that check is skipped and said so.
 * --base-ref The ref whose index the gap count is held against; default
 *            origin/master, or WARNING_BASE_REF when set. Missing there, the
 *            ratchet is skipped (the index's first landing).
 *
 * Exit code 0 on pass, 1 on any finding, 2 when an input cannot be read.
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
  DiscoveredSites,
  SecurityIndex,
  auditSecurityModel,
  formatFindings,
  scanSource,
} from './security-model-core';
import { buildLedger, JestResults, readFeatures } from './bdd-report-core';
import { featureBindings } from '../spec/spec-audit-steps';

const ROOT = path.resolve(__dirname, '../..');
const PROSE = 'guides/SECURITY-MODEL.md';
const INDEX = 'guides/security-model.yaml';
const TRIAGE_LOG = 'guides/security-triage-log.md';
const FEATURES = 'tests/bdd/features';
const IS_CI = process.env.GITHUB_ACTIONS === 'true';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .slice(2)
    .find((a) => a.startsWith(prefix))
    ?.slice(prefix.length);
}

function walk(rel: string, keep: (file: string) => boolean): string[] {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .sort()
    .flatMap((entry) => {
      const child = `${rel}/${entry}`;
      if (statSync(path.join(ROOT, child)).isDirectory())
        return walk(child, keep);
      return keep(child) ? [child] : [];
    });
}

function read(rel: string): string {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) {
    console.error(`FAIL: ${rel} not found.`);
    process.exit(2);
  }
  return readFileSync(abs, 'utf-8');
}

function baseIndex(): SecurityIndex | undefined {
  const ref =
    arg('base-ref') ??
    (process.env.WARNING_BASE_REF
      ? `origin/${process.env.WARNING_BASE_REF}`
      : 'origin/master');
  try {
    const text = execFileSync('git', ['show', `${ref}:${INDEX}`], {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return yaml.load(text) as SecurityIndex;
  } catch {
    console.log(`(No ${INDEX} at ${ref}: the gap ratchet is skipped.)`);
    return undefined;
  }
}

/** Rule title to whether every scenario under it passed. */
function ruleResults(resultsPath: string): Map<string, boolean> {
  const abs = path.resolve(ROOT, resultsPath);
  if (!existsSync(abs)) {
    console.error(`FAIL: ${resultsPath} does not exist.`);
    process.exit(2);
  }
  const results = JSON.parse(readFileSync(abs, 'utf-8')) as JestResults;
  const features = walk(FEATURES, (f) => f.endsWith('.feature'));
  const ledger = buildLedger(
    ROOT,
    readFeatures(ROOT, features),
    featureBindings(ROOT),
    results,
  );
  const passed = new Map<string, boolean>();
  for (const c of ledger.cases) {
    if (c.rule === null) continue;
    passed.set(c.rule, (passed.get(c.rule) ?? true) && c.status === 'passed');
  }
  return passed;
}

/** The ids of the fault catalogue's entries, read from its source. */
function faultIds(): Set<string> {
  const source = read('tests/faults/catalogue.ts');
  return new Set(
    [...source.matchAll(/^ {4}id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]!),
  );
}

function main(): void {
  const index = yaml.load(read(INDEX)) as SecurityIndex;
  const sites: DiscoveredSites = { network: new Set(), headers: new Map() };
  for (const file of walk('src', (f) => f.endsWith('.ts'))) {
    scanSource(file, read(file), sites);
  }
  const resultsPath = arg('results');

  const findings = auditSecurityModel({
    prose: read(PROSE),
    index,
    baseIndex: baseIndex(),
    features: walk(FEATURES, (f) => f.endsWith('.feature')).map((file) => ({
      file,
      source: read(file),
    })),
    triageLog: read(TRIAGE_LOG),
    sites,
    faultIds: faultIds(),
    exists: (file) => existsSync(path.join(ROOT, file)),
    today: new Date().toISOString().slice(0, 10),
    ruleResults: resultsPath ? ruleResults(resultsPath) : undefined,
  });

  if (!resultsPath) {
    console.log(
      '(No --results: the check that every tagged Rule ran and passed is skipped.)',
    );
  }

  if (findings.length > 0) {
    console.error(
      `FAIL: ${findings.length} security model finding(s):\n${formatFindings(findings)}`,
    );
    if (IS_CI) {
      for (const x of findings) console.log(`::error::${x.check} ${x.message}`);
    }
    process.exit(1);
  }
  console.log(
    `Security model: ${index.properties.length} properties, ${sites.network.size} network call sites and ${sites.headers.size} header read sites agree with ${INDEX}.`,
  );
}

main();
