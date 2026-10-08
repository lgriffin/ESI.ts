/**
 * The pure half of npm run quality:trend: aggregating measurements, ranking
 * hotspots, and rendering the report. scripts/quality/quality-trend.ts does
 * the measuring (git, ESLint, the TypeScript checker).
 *
 * Every number is recomputed from git history, so the trend needs no stored
 * state: a weekly run measures the last N weekly commits of master and draws
 * the line, and anyone can reproduce it locally.
 */

/** Cognitive complexity above this is what sonarjs/cognitive-complexity warns on in src/. */
export const COMPLEXITY_LIMIT = 20;

/** The measurements taken at one commit. */
export interface TrendPoint {
  sha: string;
  /** Commit date, YYYY-MM-DD. */
  date: string;
  srcFiles: number;
  /** Non-blank lines under src/. */
  srcLines: number;
  /** Sum of every function's cognitive complexity under src/. */
  complexity: number;
  /** Functions whose cognitive complexity is above COMPLEXITY_LIMIT. */
  functionsOverLimit: number;
  maxFunctionComplexity: number;
  /** Identifiers under src/ the checker types as `any`, and all identifiers. */
  anyIdentifiers: number;
  identifiers: number;
  /** `eslint-disable` comments under src/. */
  eslintDisables: number;
  /** Total from config/eslint/warning-baseline.json, when the commit has one. */
  lintWarnings: number | null;
}

export interface FunctionComplexity {
  file: string;
  line: number;
  complexity: number;
}

/** An identifier in a value position the checker types as `any`. */
export interface AnySite {
  file: string;
  line: number;
  name: string;
}

export interface Hotspot {
  file: string;
  /** Commits that touched the file in the churn window. */
  churn: number;
  /** Sum of the file's function complexities. */
  complexity: number;
  maxFunctionComplexity: number;
  /** churn × complexity: where change and difficulty meet. */
  score: number;
}

/** Cognitive complexity per function, from sonarjs messages ("... from 27 to the 0 allowed"). */
export function complexityFromMessage(message: string): number | null {
  const match = /from (\d+) to the \d+ allowed/.exec(message);
  return match ? Number(match[1]) : null;
}

export function summariseComplexity(functions: FunctionComplexity[]): {
  complexity: number;
  functionsOverLimit: number;
  maxFunctionComplexity: number;
} {
  let complexity = 0;
  let functionsOverLimit = 0;
  let maxFunctionComplexity = 0;
  for (const f of functions) {
    complexity += f.complexity;
    if (f.complexity > COMPLEXITY_LIMIT) functionsOverLimit += 1;
    maxFunctionComplexity = Math.max(maxFunctionComplexity, f.complexity);
  }
  return { complexity, functionsOverLimit, maxFunctionComplexity };
}

/** Commits per file from `git log --name-only --format=` output. */
export function churnFromLog(log: string): Map<string, number> {
  const churn = new Map<string, number>();
  for (const line of log.split('\n')) {
    const file = line.trim();
    if (file !== '') churn.set(file, (churn.get(file) ?? 0) + 1);
  }
  return churn;
}

/** Files ranked by churn × complexity, highest first; files with neither are left out. */
export function rankHotspots(
  functions: FunctionComplexity[],
  churn: Map<string, number>,
  limit: number,
): Hotspot[] {
  const byFile = new Map<string, FunctionComplexity[]>();
  for (const f of functions) {
    const list = byFile.get(f.file) ?? [];
    list.push(f);
    byFile.set(f.file, list);
  }
  const hotspots: Hotspot[] = [];
  for (const [file, list] of byFile) {
    const { complexity, maxFunctionComplexity } = summariseComplexity(list);
    const commits = churn.get(file) ?? 0;
    if (commits === 0) continue;
    hotspots.push({
      file,
      churn: commits,
      complexity,
      maxFunctionComplexity,
      score: commits * complexity,
    });
  }
  hotspots.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
  return hotspots.slice(0, limit);
}

export function typeCoverage(point: TrendPoint): number {
  if (point.identifiers === 0) return 100;
  return (
    Math.floor(
      ((point.identifiers - point.anyIdentifiers) / point.identifiers) * 10000,
    ) / 100
  );
}

/** Cognitive complexity per 1,000 hand-written lines: growth that is not just size. */
export function complexityDensity(point: TrendPoint): number {
  if (point.srcLines === 0) return 0;
  return Math.round((point.complexity / point.srcLines) * 10000) / 10;
}

const COLUMNS: Array<[string, (p: TrendPoint) => string | number]> = [
  ['date', (p) => p.date],
  ['sha', (p) => p.sha],
  ['src_files', (p) => p.srcFiles],
  ['src_lines', (p) => p.srcLines],
  ['complexity', (p) => p.complexity],
  ['complexity_per_kloc', (p) => complexityDensity(p)],
  ['functions_over_limit', (p) => p.functionsOverLimit],
  ['max_function_complexity', (p) => p.maxFunctionComplexity],
  ['any_identifiers', (p) => p.anyIdentifiers],
  ['type_coverage_pct', (p) => typeCoverage(p)],
  ['eslint_disables', (p) => p.eslintDisables],
  ['lint_warnings', (p) => p.lintWarnings ?? ''],
];

/** Oldest first, one row per point. */
export function toCsv(points: TrendPoint[]): string {
  const header = COLUMNS.map(([name]) => name).join(',');
  const rows = points.map((p) => COLUMNS.map(([, get]) => get(p)).join(','));
  return `${[header, ...rows].join('\n')}\n`;
}

function delta(now: number, then: number): string {
  const d = now - then;
  if (d === 0) return '±0';
  return d > 0 ? `+${d}` : `${d}`;
}

/** A mermaid xychart GitHub renders in a step summary or a Markdown file. */
export function xyChart(
  title: string,
  points: TrendPoint[],
  value: (p: TrendPoint) => number,
): string {
  const values = points.map(value);
  const labels = points.map((p) => `"${p.date.slice(5)}"`).join(', ');
  return [
    '```mermaid',
    'xychart-beta',
    `  title "${title}"`,
    `  x-axis [${labels}]`,
    `  line [${values.join(', ')}]`,
    '```',
  ].join('\n');
}

export function renderReport(
  points: TrendPoint[],
  hotspots: Hotspot[],
  overLimit: FunctionComplexity[],
  churnDays: number,
  anySites: AnySite[] = [],
): string {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return '# Quality trend\n\nNo commits were measured.\n';

  const rows = points.map(
    (p) =>
      `| ${p.date} | \`${p.sha}\` | ${p.srcLines} | ${p.complexity} | ${complexityDensity(p)} | ${p.functionsOverLimit} | ${p.maxFunctionComplexity} | ${typeCoverage(p)}% (${p.anyIdentifiers}) | ${p.eslintDisables} | ${p.lintWarnings ?? '·'} |`,
  );
  const change = (get: (p: TrendPoint) => number) =>
    delta(get(last), get(first));

  return [
    '# Quality trend',
    '',
    `${points.length} weekly points of master, ${first.date} to ${last.date}. Recomputed from git on every run; nothing is stored.`,
    '',
    `Since ${first.date}: src lines ${change((p) => p.srcLines)}, total cognitive complexity ${change((p) => p.complexity)} (${complexityDensity(first)} → ${complexityDensity(last)} per 1,000 lines), functions over ${COMPLEXITY_LIMIT} ${change((p) => p.functionsOverLimit)}, \`any\` identifiers ${change((p) => p.anyIdentifiers)}, eslint-disable comments ${change((p) => p.eslintDisables)}.`,
    '',
    '| Week | Commit | src lines | Complexity | per kLOC | Fns > 20 | Max fn | Type coverage (any) | eslint-disable | Lint warnings |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows,
    '',
    xyChart('Total cognitive complexity in src/', points, (p) => p.complexity),
    '',
    xyChart(
      'Cognitive complexity per 1,000 lines of src/',
      points,
      complexityDensity,
    ),
    '',
    xyChart('Identifiers typed any in src/', points, (p) => p.anyIdentifiers),
    '',
    `## Hotspots: churn × complexity (last ${churnDays} days)`,
    '',
    'Files that change often and are hard to change. The top of this list is where a refactor pays back first, and where mutation testing, review and tests matter most.',
    '',
    '| Score | Commits | Complexity | Max fn | File |',
    '| ---: | ---: | ---: | ---: | --- |',
    ...hotspots.map(
      (h) =>
        `| ${h.score} | ${h.churn} | ${h.complexity} | ${h.maxFunctionComplexity} | \`${h.file}\` |`,
    ),
    '',
    `## Functions over cognitive complexity ${COMPLEXITY_LIMIT}`,
    '',
    '| Complexity | Function at |',
    '| ---: | --- |',
    ...overLimit.map((f) => `| ${f.complexity} | \`${f.file}:${f.line}\` |`),
    '',
    `## Identifiers typed \`any\` (${anySites.length})`,
    '',
    'Value positions only; type names and import bindings are not counted.',
    '',
    ...anySites.map((a) => `- \`${a.file}:${a.line}\` ${a.name}`),
    '',
  ].join('\n');
}
