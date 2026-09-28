/**
 * The counts the documentation quotes, computed from the source (CHARTER
 * DOC-04), and the markers that carry them into the Markdown.
 *
 * A quoted count is written once, between two HTML comments:
 *
 *   <!-- metric:clients -->39<!-- /metric -->
 *
 * GitHub and VitePress render neither comment, so the reader sees the number.
 * `npm run docs:metrics` recomputes every metric into `etc/doc-metrics.json`
 * and rewrites the number between each pair of markers;
 * `npm run docs:metrics -- --check`, and `validate:versions`, fail on a
 * marked number or a JSON file that no longer matches the source.
 *
 * Nothing here runs a test or reaches the network: the counts come from the
 * file tree, the endpoint maps, the generated operations, the feature files
 * and the charter. Test counts that only a Jest run can produce stay dated
 * prose, unmarked.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 * `scripts/docs/doc-metrics.ts` gathers the inputs and writes the files.
 */
import { parseFeature } from 'jest-cucumber';

import { outlineFeature } from '../../tests/bdd/support/outline';
import { parseCharter } from '../quality/charter-audit-core';

/** Every metric, in the order `etc/doc-metrics.json` lists them. */
export const METRIC_NAMES = [
  'version',
  'compatibilityDate',
  'clients',
  'endpointMaps',
  'routes',
  'trailingSlashRoutes',
  'operations',
  'streamMethods',
  'streamClients',
  'schemaModules',
  'typeModules',
  'examples',
  'featureFiles',
  'featureFilesCore',
  'featureFilesIntegration',
  'featureFilesPerformance',
  'featureFilesSde',
  'requirements',
  'scenarios',
  'plainScenarios',
  'scenarioOutlines',
  'testFiles',
  'unitSuites',
  'compositionSuites',
  'bddSuites',
  'typeTestFiles',
  'fuzzSuites',
  'faultSuites',
  'faultNightlySuites',
  'replaySuites',
  'contractSuites',
  'integrationSuites',
  'charterRequirements',
  'charterEnforced',
  'charterPractised',
  'charterPartial',
  'charterGap',
] as const;
export type MetricName = (typeof METRIC_NAMES)[number];
export type Metrics = Record<MetricName, number | string>;

/** The committed metrics file, relative to the repository root. */
export const METRICS_FILE = 'etc/doc-metrics.json';

/**
 * The test files each suite count covers, as the Jest configurations in
 * `config/jest/` and tsd match them. `testFiles` is every file matched by
 * any of them, counted once.
 */
type TestMetric =
  | 'unitSuites'
  | 'compositionSuites'
  | 'bddSuites'
  | 'typeTestFiles'
  | 'fuzzSuites'
  | 'faultSuites'
  | 'faultNightlySuites'
  | 'replaySuites'
  | 'contractSuites'
  | 'integrationSuites';

const TEST_TIERS: ReadonlyArray<{
  metric: TestMetric;
  include: RegExp;
  exclude?: RegExp;
}> = [
  {
    metric: 'unitSuites',
    include: /^tests\/tdd\/.+\.test\.ts$/,
    exclude: /^tests\/tdd\/composition\//,
  },
  {
    metric: 'compositionSuites',
    include: /^tests\/tdd\/composition\/.+\.test\.ts$/,
  },
  {
    metric: 'bddSuites',
    include:
      /^tests\/bdd\/(?:step-definitions\/.+\.steps\.ts|specs\/.+\.spec\.ts)$/,
  },
  { metric: 'typeTestFiles', include: /^tests\/typetests\/.+\.test-d\.ts$/ },
  { metric: 'fuzzSuites', include: /^tests\/fuzz\/.+\.test\.ts$/ },
  {
    metric: 'faultSuites',
    include: /^tests\/faults\/.+\.test\.ts$/,
    exclude: /\.nightly\.test\.ts$/,
  },
  {
    metric: 'faultNightlySuites',
    include: /^tests\/faults\/.+\.nightly\.test\.ts$/,
  },
  {
    metric: 'replaySuites',
    include: /^tests\/contract\/replay\/.+\.test\.ts$/,
  },
  {
    metric: 'contractSuites',
    include: /^tests\/contract\/.+\.test\.ts$/,
    exclude: /^tests\/contract\/replay\//,
  },
  {
    metric: 'integrationSuites',
    include: /^tests\/integration\/.+\.test\.ts$/,
  },
];

/** One endpoint definition from a `src/core/endpoints/*Endpoints.ts` map. */
export interface EndpointDef {
  method: string;
  path: string;
}

/** A domain client class and the method names on its own prototype. */
export interface ClientMethods {
  client: string;
  methods: readonly string[];
}

export interface FeatureFile {
  /** Repository-relative, e.g. `tests/bdd/features/core/status.feature`. */
  file: string;
  source: string;
}

export interface MetricInputs {
  /** `version` from package.json. */
  packageVersion: string;
  /** The text of `src/core/constants.ts`. */
  constantsSource: string;
  /**
   * Repository-relative paths, forward slashes, of every file under
   * `src/clients`, `src/core/endpoints`, `src/schemas`, `src/types`,
   * `examples` and `tests`.
   */
  files: readonly string[];
  endpoints: readonly EndpointDef[];
  /** How many `*Meta` operations `src/generated/operations.generated.ts` exports. */
  operations: number;
  clients: readonly ClientMethods[];
  features: readonly FeatureFile[];
  /** The text of `guides/CHARTER.md`. */
  charter: string;
}

/** Files directly in `dir` (no subdirectories) whose name matches `name`. */
function filesIn(
  files: readonly string[],
  dir: string,
  name: RegExp,
): string[] {
  const prefix = `${dir}/`;
  return files.filter((f) => {
    if (!f.startsWith(prefix)) return false;
    const rest = f.slice(prefix.length);
    return !rest.includes('/') && name.test(rest);
  });
}

function basename(file: string): string {
  return file.slice(file.lastIndexOf('/') + 1);
}

/**
 * A route is a method and a path. Two definitions of the same route (one in
 * each of two clients) count once; parameter names and a trailing slash do
 * not make a route different.
 */
function routeKey(def: EndpointDef): string {
  const p = def.path
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/\{[^}]+\}/g, '{}');
  return `${def.method.toUpperCase()} ${p}`;
}

export function countRoutes(endpoints: readonly EndpointDef[]): {
  routes: number;
  trailingSlashRoutes: number;
} {
  const all = new Set<string>();
  const slash = new Set<string>();
  for (const def of endpoints) {
    all.add(routeKey(def));
    if (def.path.endsWith('/')) slash.add(routeKey(def));
  }
  return { routes: all.size, trailingSlashRoutes: slash.size };
}

export function countStreams(clients: readonly ClientMethods[]): {
  streamMethods: number;
  streamClients: number;
} {
  let streamMethods = 0;
  let streamClients = 0;
  for (const c of clients) {
    const n = c.methods.filter((m) => /^stream[A-Z]/.test(m)).length;
    streamMethods += n;
    if (n > 0) streamClients += 1;
  }
  return { streamMethods, streamClients };
}

/**
 * Requirements are `Rule:` blocks with at least one scenario, which is what
 * `spec:audit` counts once it passes; a scenario is a `Scenario` or a
 * `Scenario Outline`, not each row of its examples.
 */
export function countFeatures(features: readonly FeatureFile[]): {
  requirements: number;
  plainScenarios: number;
  scenarioOutlines: number;
} {
  let requirements = 0;
  let plainScenarios = 0;
  let scenarioOutlines = 0;
  for (const { source } of features) {
    requirements += outlineFeature(source).rules.filter(
      (r) => r.title !== null,
    ).length;
    const parsed = parseFeature(source);
    plainScenarios += parsed.scenarios.length;
    scenarioOutlines += parsed.scenarioOutlines.length;
  }
  return { requirements, plainScenarios, scenarioOutlines };
}

export function countTestFiles(
  files: readonly string[],
): Record<TestMetric | 'testFiles', number> {
  const counts = {} as Record<TestMetric, number>;
  const matched = new Set<string>();
  for (const tier of TEST_TIERS) {
    const hits = files.filter(
      (f) => tier.include.test(f) && !(tier.exclude && tier.exclude.test(f)),
    );
    counts[tier.metric] = hits.length;
    for (const f of hits) matched.add(f);
  }
  return { ...counts, testFiles: matched.size };
}

export function countCharter(markdown: string): {
  charterRequirements: number;
  charterEnforced: number;
  charterPractised: number;
  charterPartial: number;
  charterGap: number;
} {
  const blocks = parseCharter(markdown);
  const status = (s: string): number =>
    blocks.filter((b) => b.status === s).length;
  return {
    charterRequirements: blocks.length,
    charterEnforced: status('Enforced'),
    charterPractised: status('Practised'),
    charterPartial: status('Partial'),
    charterGap: status('Gap'),
  };
}

export function compatibilityDateOf(constantsSource: string): string {
  const match = /COMPATIBILITY_DATE\s*=\s*['"]([^'"]+)['"]/.exec(
    constantsSource,
  );
  if (!match) throw new Error('No COMPATIBILITY_DATE in src/core/constants.ts');
  return match[1]!;
}

export function computeMetrics(input: MetricInputs): Metrics {
  const { files } = input;
  const featureDir = (dir: string): number =>
    input.features.filter((f) =>
      f.file.startsWith(`tests/bdd/features/${dir}/`),
    ).length;
  const features = countFeatures(input.features);
  const metrics: Metrics = {
    version: input.packageVersion,
    compatibilityDate: compatibilityDateOf(input.constantsSource),
    clients: filesIn(files, 'src/clients', /^\w+Client\.ts$/).filter(
      (f) => basename(f) !== 'BaseEsiClient.ts',
    ).length,
    endpointMaps: filesIn(files, 'src/core/endpoints', /^\w+Endpoints\.ts$/)
      .length,
    ...countRoutes(input.endpoints),
    operations: input.operations,
    ...countStreams(input.clients),
    schemaModules: filesIn(files, 'src/schemas', /\.ts$/).filter(
      (f) => !['index.ts', 'common.ts', 'esiEnum.ts'].includes(basename(f)),
    ).length,
    typeModules: filesIn(files, 'src/types', /\.ts$/).filter(
      (f) =>
        !['common.ts', 'branded.ts', 'api-responses.ts'].includes(basename(f)),
    ).length,
    examples: filesIn(files, 'examples', /\.ts$/).length,
    featureFiles: input.features.length,
    featureFilesCore: featureDir('core'),
    featureFilesIntegration: featureDir('integration'),
    featureFilesPerformance: featureDir('performance'),
    featureFilesSde: featureDir('sde'),
    requirements: features.requirements,
    scenarios: features.plainScenarios + features.scenarioOutlines,
    plainScenarios: features.plainScenarios,
    scenarioOutlines: features.scenarioOutlines,
    ...countTestFiles(files),
    ...countCharter(input.charter),
  };
  return orderMetrics(metrics);
}

function orderMetrics(metrics: Metrics): Metrics {
  const ordered = {} as Metrics;
  for (const name of METRIC_NAMES) ordered[name] = metrics[name];
  return ordered;
}

/** `etc/doc-metrics.json`: the metrics in `METRIC_NAMES` order, with a trailing newline. */
export function formatMetricsJson(metrics: Metrics): string {
  return `${JSON.stringify(orderMetrics(metrics), null, 2)}\n`;
}

/** A number as the prose writes it: `7198` becomes `7,198`. */
export function formatValue(value: number | string): string {
  if (typeof value === 'string') return value;
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ---------------------------------------------------------------------------
// Markers
// ---------------------------------------------------------------------------

const MARKER =
  /<!--\s*metric:([A-Za-z][A-Za-z0-9]*)\s*-->([^<\n]*)<!--\s*\/metric\s*-->/g;
/** Anything that starts a marker, well-formed or not. */
const MARKER_START = /<!--\s*\/?metric\b/g;

export interface MarkerChange {
  metric: string;
  line: number;
  from: string;
  to: string;
}

export interface MarkerError {
  line: number;
  message: string;
}

export interface RewriteResult {
  text: string;
  changes: MarkerChange[];
  errors: MarkerError[];
}

/**
 * The text with fenced code blocks and inline code spans blanked out, offsets
 * unchanged, so a marker written as an example in code is not a marker.
 */
export function maskCode(text: string): string {
  let fence: string | null = null;
  return text
    .split('\n')
    .map((line) => {
      const open = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (fence) {
        if (open && open[1]!.startsWith(fence)) fence = null;
        return ' '.repeat(line.length);
      }
      if (open) {
        fence = open[1]!;
        return ' '.repeat(line.length);
      }
      return line.replace(/(`+)(?:(?!\1)[^`]|`(?!\1))*?\1/g, (span) =>
        ' '.repeat(span.length),
      );
    })
    .join('\n');
}

function lineAt(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

/**
 * Put each metric's current value between its markers. An unknown metric
 * name, a marker that does not form a well-formed pair on one line, or a
 * marker at the start of a line is an error; the text is returned unchanged
 * for those markers.
 */
export function rewriteMarkers(text: string, metrics: Metrics): RewriteResult {
  const changes: MarkerChange[] = [];
  const errors: MarkerError[] = [];
  const known = new Set<string>(METRIC_NAMES);
  const masked = maskCode(text);
  const covered: Array<[number, number]> = [];
  let out = '';
  let copied = 0;

  for (const match of masked.matchAll(MARKER)) {
    const offset = match.index;
    const whole = match[0];
    const name = match[1]!;
    const value = match[2]!;
    covered.push([offset, offset + whole.length]);
    const line = lineAt(text, offset);
    if (!known.has(name)) {
      errors.push({ line, message: `unknown metric "${name}"` });
      continue;
    }
    // A line that opens with an HTML comment starts an HTML block, and
    // Markdown stops rendering the rest of that line.
    const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
    if (text.slice(lineStart, offset).trim() === '') {
      errors.push({
        line,
        message: `metric "${name}" starts a line; put a word before it`,
      });
      continue;
    }
    const to = formatValue(metrics[name as MetricName]);
    if (value === to) continue;
    changes.push({ metric: name, line, from: value, to });
    const valueStart = offset + whole.indexOf('-->') + 3;
    out += text.slice(copied, valueStart) + to;
    copied = valueStart + value.length;
  }
  out += text.slice(copied);

  for (const m of masked.matchAll(MARKER_START)) {
    const at = m.index;
    if (!covered.some(([start, end]) => at >= start && at < end)) {
      errors.push({
        line: lineAt(text, at),
        message:
          'malformed metric marker: write <!-- metric:name -->value<!-- /metric --> on one line',
      });
    }
  }
  errors.sort((a, b) => a.line - b.line);
  return { text: out, changes, errors };
}

export interface DocFile {
  path: string;
  text: string;
}

export interface CheckReport {
  /** Marked numbers that differ from the metrics, per file. */
  stale: Array<{ path: string; changes: MarkerChange[] }>;
  errors: Array<{ path: string; line: number; message: string }>;
  /** True when the committed JSON differs from the computed one. */
  staleJson: boolean;
  /** Files with their markers rewritten, for the writer. */
  rewritten: DocFile[];
}

/**
 * Whether the committed file holds exactly these metrics in this order.
 * Whitespace is left to Prettier, so release-please's JSON updater, which
 * rewrites `version` at release, cannot make the file look stale.
 */
function sameJson(committed: string | null, metrics: Metrics): boolean {
  if (committed === null) return false;
  try {
    return (
      JSON.stringify(JSON.parse(committed)) ===
      JSON.stringify(orderMetrics(metrics))
    );
  } catch {
    return false;
  }
}

export function checkDocs(
  docs: readonly DocFile[],
  metrics: Metrics,
  committedJson: string | null,
): CheckReport {
  const report: CheckReport = {
    stale: [],
    errors: [],
    staleJson: !sameJson(committedJson, metrics),
    rewritten: [],
  };
  for (const doc of docs) {
    const result = rewriteMarkers(doc.text, metrics);
    for (const e of result.errors) report.errors.push({ path: doc.path, ...e });
    if (result.changes.length > 0) {
      report.stale.push({ path: doc.path, changes: result.changes });
      report.rewritten.push({ path: doc.path, text: result.text });
    }
  }
  return report;
}

/** The lines `--check` prints; empty when everything is current. */
export function formatProblems(report: CheckReport): string[] {
  const lines: string[] = [];
  for (const e of report.errors) {
    lines.push(`${e.path}:${e.line}: ${e.message}`);
  }
  for (const s of report.stale) {
    for (const c of s.changes) {
      lines.push(
        `${s.path}:${c.line}: ${c.metric} is ${c.to}, the text says ${c.from}`,
      );
    }
  }
  if (report.staleJson) {
    lines.push(`${METRICS_FILE} is stale`);
  }
  return lines;
}
