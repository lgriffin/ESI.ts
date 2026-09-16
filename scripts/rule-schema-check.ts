/**
 * Rule ↔ schema consistency check.
 *
 * A Rule title may only promise what the pipeline guarantees. When a title
 * names a response field that the endpoint's Zod schema marks optional, the
 * title has to say so — "carrying home_location when present" — or it tells
 * the reader ESI always supplies a field the library lets it omit.
 *
 * How a feature file finds its schemas: `NNNN-<domain>.feature` below 0050 is
 * one domain client. The domain resolves to `src/core/endpoints/<domain>
 * Endpoints.ts` (or the singular form, `0031-skills` → `skillEndpoints.ts`),
 * and every object schema reachable from any `responseSchema` in that file is
 * a candidate. Cross-cutting (005x), integration, performance and SDE features
 * carry no response schema and are skipped. A domain feature with no endpoint
 * file fails the run rather than being skipped.
 *
 * The matching logic lives in `rule-schema-checks.ts`, which imports no ESM,
 * so Jest can load it; this file owns the Gherkin AST walk and the CLI.
 *
 * Usage: npx ts-node scripts/rule-schema-check.ts [paths...] [--verbose]
 *        npm run validate:spec-consistency
 *
 * Reads `scripts/rule-schema-exceptions.json`. Findings in a file listed under
 * `warnOnly` are printed as warnings; findings anywhere else fail the run. The
 * list is a ratchet: the run also fails when an entry is added relative to the
 * integration branch, when a listed file has no findings left, or when a
 * listed path names no feature file.
 *
 * Exit code 0 on pass, 1 on any error.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import type { GherkinDocument } from '@cucumber/messages';

import {
  REPO_ROOT,
  checkRuleTitle,
  checkWarnOnlyList,
  loadBaselineWarnOnly,
  loadRuleSchemaExceptions,
  mapFeatureToEndpoints,
} from './rule-schema-checks';

const DEFAULT_PATHS = ['tests/bdd/features'];

// @cucumber/gherkin and @cucumber/messages are ESM-only. Loading them with a
// dynamic import that TypeScript cannot downlevel to require() keeps this
// check working on every supported Node; spec-audit.ts explains the shim.
const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<unknown>;

async function importEsm<T>(packageName: string): Promise<T> {
  const url = pathToFileURL(require.resolve(packageName)).href;
  return (await dynamicImport(url)) as T;
}

type ParseGherkin = (source: string) => GherkinDocument;

async function loadGherkinParser(): Promise<ParseGherkin> {
  const [gherkin, messages] = await Promise.all([
    importEsm<typeof import('@cucumber/gherkin')>('@cucumber/gherkin'),
    importEsm<typeof import('@cucumber/messages')>('@cucumber/messages'),
  ]);
  // Incrementing ids: IdGenerator.uuid() needs global crypto.randomUUID(),
  // which Node 18 lacks, and the check never reads node ids.
  return (source) =>
    new gherkin.Parser(
      new gherkin.AstBuilder(messages.IdGenerator.incrementing()),
      new gherkin.GherkinClassicTokenMatcher(),
    ).parse(source);
}
const IS_CI = process.env.GITHUB_ACTIONS === 'true';

interface Finding {
  file: string;
  line: number | null;
  message: string;
}

interface FileResult {
  file: string;
  findings: Finding[];
  checked: boolean;
  rules: number;
}

function collectFeatureFiles(target: string): string[] {
  const abs = path.resolve(REPO_ROOT, target);
  if (!existsSync(abs)) {
    console.error(`Warning: '${target}' does not exist, skipping.`);
    return [];
  }
  if (statSync(abs).isFile()) {
    return abs.endsWith('.feature') ? [abs] : [];
  }
  const found: string[] = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const child = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectFeatureFiles(child));
    } else if (entry.isFile() && entry.name.endsWith('.feature')) {
      found.push(child);
    }
  }
  return found.sort();
}

function checkFile(abs: string, rel: string, parse: ParseGherkin): FileResult {
  const result: FileResult = {
    file: rel,
    findings: [],
    checked: false,
    rules: 0,
  };

  let source;
  try {
    source = mapFeatureToEndpoints(rel);
  } catch (error) {
    result.findings.push({
      file: rel,
      line: null,
      message: (error as Error).message,
    });
    return result;
  }
  if (source === null) return result;
  result.checked = true;

  let document;
  try {
    document = parse(readFileSync(abs, 'utf-8'));
  } catch (error) {
    result.findings.push({
      file: rel,
      line: null,
      message: `Failed to parse Gherkin: ${(error as Error).message}`,
    });
    return result;
  }

  for (const child of document.feature?.children ?? []) {
    if (!child.rule) continue;
    result.rules += 1;
    const title = child.rule.name.trim();
    for (const finding of checkRuleTitle(title, source.objects)) {
      result.findings.push({
        file: rel,
        line: child.rule.location.line,
        message:
          `Rule '${title}': names '${finding.mention}', but ` +
          `${source.file} marks ${finding.field} optional ` +
          `(${finding.schemas.join(', ')}). Qualify it — for example ` +
          `'${finding.mention} when present' — or drop it from the title.`,
      });
    }
  }
  return result;
}

function annotate(
  level: 'error' | 'warning',
  message: string,
  file?: string,
  line?: number | null,
): void {
  if (!IS_CI) return;
  const params: string[] = [];
  if (file) params.push(`file=${file}`);
  if (line) params.push(`line=${line}`);
  const paramStr = params.length > 0 ? ` ${params.join(',')}` : '';
  console.log(`::${level}${paramStr}::${message.replace(/\n/g, ' ')}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const targets = args.filter((a) => !a.startsWith('-'));
  const paths = targets.length > 0 ? targets : DEFAULT_PATHS;

  const files = paths.flatMap(collectFeatureFiles);
  if (files.length === 0) {
    console.error('No .feature files found.');
    process.exit(1);
  }

  const parse = await loadGherkinParser();
  const { warnOnly } = loadRuleSchemaExceptions();
  const warnOnlySet = new Set(warnOnly);

  const results = files.map((abs) =>
    checkFile(
      abs,
      path.relative(REPO_ROOT, abs).split(path.sep).join('/'),
      parse,
    ),
  );

  let errors = 0;
  let warnings = 0;

  for (const result of results) {
    if (result.findings.length === 0) continue;
    const listed = warnOnlySet.has(result.file);
    const level = listed ? 'warning' : 'error';
    console.error(`
--- ${result.file}${listed ? ' (warn-only)' : ''} ---`);
    for (const finding of result.findings) {
      const at = finding.line ? `:${finding.line}` : '';
      console.error(`  [${level.toUpperCase()}]${at} ${finding.message}`);
      annotate(level, finding.message, finding.file, finding.line);
      if (listed) warnings += 1;
      else errors += 1;
    }
  }

  const baseline = warnOnly.length > 0 ? loadBaselineWarnOnly() : null;
  const { added, dangling, stale } =
    warnOnly.length > 0
      ? checkWarnOnlyList(
          warnOnly,
          baseline,
          new Set(results.filter((r) => r.checked).map((r) => r.file)),
          new Set(
            results.filter((r) => r.findings.length > 0).map((r) => r.file),
          ),
        )
      : { added: [], dangling: [], stale: [] };

  const listProblems: string[] = [
    ...stale.map(
      (rel) =>
        `${rel} is listed as warn-only in rule-schema-exceptions.json but has ` +
        'no findings. Remove the entry so the file is gated from now on.',
    ),
    ...added.map(
      (rel) =>
        `${rel} was added to rule-schema-exceptions.json. The warn-only list ` +
        'is a ratchet: entries may only be removed. Reconcile the Rule instead.',
    ),
    ...dangling.map(
      (rel) =>
        `${rel} is listed in rule-schema-exceptions.json but no such .feature ` +
        'file exists. Remove the stale entry.',
    ),
  ];
  for (const message of listProblems) {
    console.error(`
  [ERROR] ${message}`);
    annotate('error', message, 'scripts/rule-schema-exceptions.json');
  }

  const checked = results.filter((r) => r.checked);
  console.log('\n--- Summary ---');
  console.log(`Domain features checked: ${checked.length}`);
  console.log(`Other features skipped:  ${results.length - checked.length}`);
  console.log(`Errors:                  ${errors}`);
  console.log(`Warnings:                ${warnings}`);
  if (verbose) {
    console.log(
      `Rules checked:           ${checked.reduce((n, r) => n + r.rules, 0)}`,
    );
  }

  if (errors > 0 || listProblems.length > 0) {
    console.error(
      `\nFAIL: ${errors} Rule/schema inconsistenc${errors === 1 ? 'y' : 'ies'}` +
        (listProblems.length > 0
          ? `, ${listProblems.length} exception-list problem(s)`
          : '') +
        '.',
    );
    process.exit(1);
  }

  console.log(
    warnings > 0
      ? `\nPASS with ${warnings} warning(s) in warn-only files.`
      : '\nPASS: every Rule title agrees with its response schemas.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
