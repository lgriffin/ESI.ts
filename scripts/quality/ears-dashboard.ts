/**
 * Build the EARS dashboard: one self-contained HTML page showing every
 * requirement in the specification, its EARS pattern, what runs it and its
 * verdict, with a guide to writing the next one.
 *
 * Reads the feature files, the spec audit's checks and feature bindings, and
 * the `npm run ears` report when one exists, so run `npm run ears` first to
 * see verdicts. Without a report the page still lists every requirement and
 * its audit findings, marked "no run".
 *
 * Usage:
 *   npm run ears:dashboard
 *   npm run ears:dashboard -- --since=v12.0.0      # mark Rules added, changed or removed since a ref
 *   npm run ears:dashboard -- --report=<ears-report.json>
 *   npm run ears:dashboard -- --out=<file>         # default reports/ears/ears-dashboard.html
 */
import { execFileSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';

import { outlineFeature } from '../../tests/bdd/support/outline';
import { featureBindings } from '../spec/spec-audit-steps';
import {
  FeatureInput,
  RulesAt,
  buildDashboard,
  ruleSource,
} from './ears-dashboard-core';
import { renderPage } from './ears-dashboard-page';
import type { EarsReport } from './ears-core';

const ROOT = path.resolve(__dirname, '../..');
const FEATURES = 'tests/bdd/features';
const REPO_URL = 'https://github.com/lgriffin/ESI.ts';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .slice(2)
    .find((a) => a.startsWith(prefix))
    ?.slice(prefix.length);
}

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function featureFiles(rel: string): string[] {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .sort()
    .flatMap((entry) => {
      const child = `${rel}/${entry}`;
      if (statSync(path.join(ROOT, child)).isDirectory())
        return featureFiles(child);
      return entry.endsWith('.feature') ? [child] : [];
    });
}

function git(args: string[]): string {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function headRef(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return git(['rev-parse', 'HEAD']).trim();
  } catch {
    return 'master';
  }
}

/** Every feature's Rules as they stood at `ref`, read with `git show`. */
function rulesAt(ref: string): RulesAt[] {
  let files: string[];
  try {
    files = git(['ls-tree', '-r', '--name-only', ref, '--', FEATURES])
      .split('\n')
      .filter((f) => f.endsWith('.feature'));
  } catch (error) {
    fail(
      `Cannot read ${FEATURES} at ${ref}: ${(error as Error).message.split('\n')[0]}`,
    );
  }
  return files.map((file) => {
    const source = git(['show', `${ref}:${file}`]);
    const rules = outlineFeature(source).rules.flatMap((r) =>
      r.title !== null && r.line !== null
        ? [{ title: r.title, source: ruleSource(source, r.line).text }]
        : [],
    );
    return { file, rules };
  });
}

function readReport(file: string): { report: EarsReport; at: string } | null {
  if (!existsSync(file)) return null;
  try {
    const report = JSON.parse(readFileSync(file, 'utf-8')) as EarsReport;
    if (!Array.isArray(report.requirements))
      throw new Error('no requirements array');
    return { report, at: statSync(file).mtime.toISOString() };
  } catch (error) {
    fail(
      `${path.relative(ROOT, file)} is not an ears report: ${(error as Error).message}`,
    );
  }
}

function main(): void {
  const out = path.resolve(
    ROOT,
    arg('out') ?? 'reports/ears/ears-dashboard.html',
  );
  const reportPath = path.resolve(
    ROOT,
    arg('report') ?? 'reports/ears/ears-report.json',
  );
  const since = arg('since');

  const files = featureFiles(FEATURES);
  if (files.length === 0) fail(`No .feature files under ${FEATURES}.`);

  const bindings = featureBindings(ROOT);
  const features: FeatureInput[] = files.map((file) => {
    const source = readFileSync(path.join(ROOT, file), 'utf-8');
    return {
      file,
      source,
      outline: outlineFeature(source),
      boundBy: bindings.get(file) ?? [],
    };
  });

  const found = readReport(reportPath);
  const data = buildDashboard({
    features,
    report: found?.report ?? null,
    reportFrom: found?.at ?? null,
    repoUrl: REPO_URL,
    ref: headRef(),
    generatedAt: new Date().toISOString(),
    ...(since ? { since: { ref: since, rules: rulesAt(since) } } : {}),
  });

  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, renderPage(data));

  const rules = data.features.reduce((n, f) => n + f.rules.length, 0);
  console.log(
    `EARS dashboard: ${rules} requirements in ${data.features.length} features` +
      (found
        ? `, verdicts from ${path.relative(ROOT, reportPath)}`
        : ' (no ears report found, so no verdicts; run npm run ears first)') +
      (since ? `, changes since ${since}` : '') +
      '.',
  );
  console.log(`Page: ${path.relative(ROOT, out)}`);
}

main();
