/**
 * Generate the counts the documentation quotes (CHARTER DOC-04):
 * `npm run docs:metrics`.
 *
 * Computes every metric in `scripts/docs/doc-metrics-core.ts` from the
 * source, writes `etc/doc-metrics.json`, and rewrites each
 * `<!-- metric:name -->value<!-- /metric -->` in README.md, guides/*.md and
 * docs-site/index.md. Runs no test and makes no network call.
 *
 * With `--check` it writes nothing and exits 1, naming each stale file and
 * metric, when a marked number or the JSON file differs from the source, or
 * when a marker is malformed or names an unknown metric. `validate:versions`
 * runs the same check.
 */
import * as fs from 'fs';
import * as path from 'path';

import { metasOf } from '../spec/spec-coverage-core';
import {
  CheckReport,
  ClientMethods,
  DocFile,
  EndpointDef,
  METRICS_FILE,
  Metrics,
  checkDocs,
  computeMetrics,
  formatMetricsJson,
  formatProblems,
} from './doc-metrics-core';

const ROOT = path.join(__dirname, '../..');

/** The directories whose files the metrics count. */
const COUNTED_DIRS = [
  'src/clients',
  'src/core/endpoints',
  'src/schemas',
  'src/types',
  'examples',
  'tests',
];

function walk(rel: string): string[] {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const child = `${rel}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walk(child));
    else if (entry.isFile()) out.push(child);
  }
  return out;
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

/** Every definition in the endpoint maps, read from the loaded modules. */
function endpointDefs(files: readonly string[]): EndpointDef[] {
  const defs: EndpointDef[] = [];
  for (const file of files.filter((f) =>
    /^src\/core\/endpoints\/\w+Endpoints\.ts$/.test(f),
  )) {
    const mod = require(path.join(ROOT, file)) as Record<string, unknown>;
    for (const map of Object.values(mod)) {
      if (!map || typeof map !== 'object') continue;
      for (const def of Object.values(map)) {
        if (
          def &&
          typeof def === 'object' &&
          'path' in def &&
          'method' in def
        ) {
          const d = def as { path: unknown; method: unknown };
          defs.push({ path: String(d.path), method: String(d.method) });
        }
      }
    }
  }
  return defs;
}

/** Each domain client class and the methods it declares itself. */
function clientMethods(files: readonly string[]): ClientMethods[] {
  const clients: ClientMethods[] = [];
  for (const file of files.filter(
    (f) =>
      /^src\/clients\/\w+Client\.ts$/.test(f) &&
      !f.endsWith('/BaseEsiClient.ts'),
  )) {
    const mod = require(path.join(ROOT, file)) as Record<string, unknown>;
    const classes = Object.entries(mod).filter(
      ([name, value]) =>
        typeof value === 'function' && /^[A-Z]\w*Client$/.test(name),
    );
    if (classes.length !== 1) {
      throw new Error(`${file} should export exactly one client class`);
    }
    const [name, cls] = classes[0]!;
    clients.push({
      client: name,
      methods: Object.getOwnPropertyNames(
        (cls as { prototype: object }).prototype,
      ),
    });
  }
  return clients;
}

export function gatherMetrics(): Metrics {
  const files = COUNTED_DIRS.flatMap(walk).sort();
  const pkg = JSON.parse(read('package.json')) as { version: string };
  const generated = require(
    path.join(ROOT, 'src/generated/operations.generated.ts'),
  ) as Record<string, unknown>;
  const features = files
    .filter((f) => /^tests\/bdd\/features\/.+\.feature$/.test(f))
    .map((file) => ({ file, source: read(file) }));
  return computeMetrics({
    packageVersion: pkg.version,
    constantsSource: read('src/core/constants.ts'),
    files,
    endpoints: endpointDefs(files),
    operations: metasOf(generated).size,
    clients: clientMethods(files),
    features,
    charter: read('guides/CHARTER.md'),
  });
}

/** The documents that may carry markers: README.md, guides/*.md, docs-site/index.md. */
function docFiles(): DocFile[] {
  const guides = fs
    .readdirSync(path.join(ROOT, 'guides'))
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => `guides/${f}`);
  return ['README.md', ...guides, 'docs-site/index.md'].map((p) => ({
    path: p,
    text: read(p),
  }));
}

function committedJson(): string | null {
  const file = path.join(ROOT, METRICS_FILE);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : null;
}

/** The metrics check `--check` and `validate:versions` run. */
export function checkMetrics(): { metrics: Metrics; report: CheckReport } {
  const metrics = gatherMetrics();
  return { metrics, report: checkDocs(docFiles(), metrics, committedJson()) };
}

function main(): void {
  const check = process.argv.includes('--check');
  const { metrics, report } = checkMetrics();

  if (report.errors.length > 0 || check) {
    const problems = formatProblems(report);
    if (problems.length > 0) {
      for (const p of problems) console.error(p);
      console.error(
        report.errors.length > 0
          ? '\ndocs:metrics: fix the markers above.'
          : '\ndocs:metrics: counts are stale; run `npm run docs:metrics`.',
      );
      process.exit(1);
    }
    console.log(
      `docs:metrics: ${METRICS_FILE} and every marked count are current.`,
    );
    return;
  }

  if (report.staleJson) {
    fs.writeFileSync(path.join(ROOT, METRICS_FILE), formatMetricsJson(metrics));
    console.log(`wrote ${METRICS_FILE}`);
  }
  for (const doc of report.rewritten) {
    fs.writeFileSync(path.join(ROOT, doc.path), doc.text);
  }
  for (const s of report.stale) {
    for (const c of s.changes) {
      console.log(`${s.path}:${c.line}: ${c.metric} ${c.from} -> ${c.to}`);
    }
  }
  if (!report.staleJson && report.stale.length === 0) {
    console.log('docs:metrics: nothing to update.');
  }
}

if (require.main === module) main();
