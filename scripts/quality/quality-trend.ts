/**
 * npm run quality:trend [-- --weeks 12] [--churn-days 90] [--ref HEAD]
 *
 * Measures the last N weekly commits of --ref (first parent) in temporary git
 * worktrees and writes reports/quality/trend.{md,csv,json}:
 *
 * - hand-written src/ size, total cognitive complexity (sonarjs, every
 *   function), functions over the limit and the worst one;
 * - identifiers the TypeScript checker types as `any`, as a type coverage;
 * - `eslint-disable` comments, and the lint warning total when the commit has
 *   config/eslint/warning-baseline.json;
 * - for --ref itself, hotspots: churn over --churn-days × complexity per file.
 *
 * Generated files (`*.generated.ts`, `src/types/generated/`) are left out:
 * their size follows the spec, not the code. Reporting only: it never fails
 * on a number. Exit 2 if it could not measure.
 */
import { execFileSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ESLint } from 'eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';
import ts from 'typescript';
import {
  AnySite,
  COMPLEXITY_LIMIT,
  FunctionComplexity,
  TrendPoint,
  churnFromLog,
  complexityFromMessage,
  rankHotspots,
  renderReport,
  summariseComplexity,
  toCsv,
} from './quality-trend-core';

interface Measurement {
  point: TrendPoint;
  functions: FunctionComplexity[];
  anySites: AnySite[];
}

const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(REPO_ROOT, 'reports/quality');

function option(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

function git(args: string[], cwd = REPO_ROOT): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function isGenerated(rel: string): boolean {
  return rel.endsWith('.generated.ts') || rel.includes('/generated/');
}

function sourceFiles(root: string, dir = 'src'): string[] {
  const abs = path.join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true })
    .flatMap((entry) => {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return sourceFiles(root, rel);
      return entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')
        ? [rel]
        : [];
    })
    .filter((rel) => !isGenerated(rel))
    .sort();
}

async function functionComplexities(
  root: string,
  files: string[],
): Promise<FunctionComplexity[]> {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    allowInlineConfig: false,
    overrideConfig: [
      {
        files: ['**/*.ts'],
        languageOptions: { parser: tseslint.parser },
        plugins: { sonarjs },
        // A threshold of 0 reports every function with its complexity.
        rules: { 'sonarjs/cognitive-complexity': ['warn', 0] },
      },
    ],
  });
  const results = await eslint.lintFiles(files);
  const found: FunctionComplexity[] = [];
  for (const result of results) {
    const file = path.relative(root, result.filePath).split(path.sep).join('/');
    for (const m of result.messages) {
      const complexity = complexityFromMessage(m.message);
      if (complexity !== null) found.push({ file, line: m.line, complexity });
    }
  }
  return found;
}

function anyIdentifiers(
  root: string,
  files: string[],
): { any: number; total: number; sites: AnySite[] } {
  const configPath = path.join(root, 'tsconfig.json');
  const read = ts.readConfigFile(configPath, (f) => ts.sys.readFile(f));
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, root);
  const program = ts.createProgram(parsed.fileNames, {
    ...parsed.options,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  let any = 0;
  let total = 0;
  const sites: AnySite[] = [];
  for (const rel of files) {
    const source = program.getSourceFile(path.join(root, rel));
    if (!source) continue;
    const visit = (node: ts.Node): void => {
      // Value positions only: the checker reports a type name, an imported
      // or exported binding, or a type predicate's parameter as `any`.
      if (
        ts.isTypeNode(node) ||
        ts.isImportDeclaration(node) ||
        ts.isExportDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node)
      ) {
        return;
      }
      if (ts.isIdentifier(node)) {
        total += 1;
        if (checker.getTypeAtLocation(node).flags & ts.TypeFlags.Any) {
          any += 1;
          const { line } = source.getLineAndCharacterOfPosition(
            node.getStart(source),
          );
          sites.push({ file: rel, line: line + 1, name: node.text });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return { any, total, sites };
}

function lintWarningTotal(root: string): number | null {
  const file = path.join(root, 'config/eslint/warning-baseline.json');
  if (!existsSync(file)) return null;
  const { sites } = JSON.parse(readFileSync(file, 'utf-8')) as {
    sites: Record<string, Record<string, number>>;
  };
  return Object.values(sites)
    .flatMap((perFile) => Object.values(perFile))
    .reduce((a, b) => a + b, 0);
}

async function measure(
  root: string,
  sha: string,
  date: string,
): Promise<Measurement> {
  const files = sourceFiles(root);
  let srcLines = 0;
  let eslintDisables = 0;
  for (const rel of files) {
    const text = readFileSync(path.join(root, rel), 'utf-8');
    srcLines += text.split('\n').filter((l) => l.trim() !== '').length;
    eslintDisables += (text.match(/eslint-disable/g) ?? []).length;
  }
  const functions = await functionComplexities(root, files);
  const types = anyIdentifiers(root, files);
  return {
    functions,
    anySites: types.sites,
    point: {
      sha,
      date,
      srcFiles: files.length,
      srcLines,
      ...summariseComplexity(functions),
      anyIdentifiers: types.any,
      identifiers: types.total,
      eslintDisables,
      lintWarnings: lintWarningTotal(root),
    },
  };
}

/** One commit per week, newest last, deduplicated. */
function weeklyCommits(ref: string, weeks: number): string[] {
  const head = git(['rev-parse', ref]).trim();
  const headTime = Number(git(['show', '-s', '--format=%ct', head]).trim());
  const shas: string[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const before = new Date((headTime - i * 7 * 86400) * 1000).toISOString();
    const sha = git([
      'rev-list',
      '-1',
      '--first-parent',
      `--before=${before}`,
      head,
    ]).trim();
    if (sha !== '' && !shas.includes(sha)) shas.push(sha);
  }
  return shas;
}

async function measureCommit(sha: string): Promise<Measurement> {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'quality-trend-'));
  git(['worktree', 'add', '--detach', dir, sha]);
  try {
    symlinkSync(
      path.join(REPO_ROOT, 'node_modules'),
      path.join(dir, 'node_modules'),
      'dir',
    );
    const date = git(['show', '-s', '--format=%cs', sha]).trim();
    return await measure(dir, sha.slice(0, 8), date);
  } finally {
    git(['worktree', 'remove', '--force', dir]);
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main(): Promise<number> {
  const weeks = Number(option('weeks', '12'));
  const churnDays = Number(option('churn-days', '90'));
  const ref = option('ref', 'HEAD');
  if (!Number.isInteger(weeks) || weeks < 1 || !Number.isInteger(churnDays)) {
    console.error('--weeks and --churn-days must be positive integers');
    return 2;
  }

  const shas = weeklyCommits(ref, weeks);
  if (shas.length === 0) {
    console.error(`No commits found on ${ref}.`);
    return 2;
  }
  const points: TrendPoint[] = [];
  let latest: Measurement | null = null;
  for (const sha of shas) {
    const measurement = await measureCommit(sha);
    const { point } = measurement;
    console.log(
      `${point.date} ${point.sha}: ${point.srcLines} lines, complexity ${point.complexity}, ${point.anyIdentifiers} any`,
    );
    points.push(point);
    latest = measurement;
  }
  if (latest === null) return 2;

  const since = `${churnDays} days ago`;
  const churn = churnFromLog(
    git([
      'log',
      `--since=${since}`,
      '--name-only',
      '--format=',
      ref,
      '--',
      'src',
    ]),
  );
  const hotspots = rankHotspots(latest.functions, churn, 15);
  const overLimit = latest.functions
    .filter((f) => f.complexity > COMPLEXITY_LIMIT)
    .sort(
      (a, b) => b.complexity - a.complexity || a.file.localeCompare(b.file),
    );

  mkdirSync(OUT_DIR, { recursive: true });
  const report = renderReport(
    points,
    hotspots,
    overLimit,
    churnDays,
    latest.anySites,
  );
  writeFileSync(path.join(OUT_DIR, 'trend.md'), report);
  writeFileSync(path.join(OUT_DIR, 'trend.csv'), toCsv(points));
  writeFileSync(
    path.join(OUT_DIR, 'trend.json'),
    `${JSON.stringify({ points, hotspots, overLimit, anySites: latest.anySites }, null, 2)}\n`,
  );
  console.log(`\nWrote reports/quality/trend.{md,csv,json}.`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error);
    process.exit(2);
  },
);
