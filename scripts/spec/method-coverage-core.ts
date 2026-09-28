/**
 * What the two method-level specification coverage checks share:
 * `spec:coverage:sde` (every `IStaticDataProvider` method, see
 * `scripts/sde/sde-spec-coverage-core.ts`) and `spec:coverage:clients` (every
 * public method of the domain clients, see `client-spec-coverage-core.ts`).
 *
 * Both ask the reverse of `spec:audit`: not "has every Rule a scenario" but
 * "has every method a Rule". Each check says what a method is and which call
 * counts as calling it; this module holds the rest:
 *
 * - the step files loaded into one TypeScript program, so the type checker
 *   decides what a call's receiver is and where a callee is declared;
 * - the call graph from a step function through any `tests/bdd` function it
 *   calls, however deep, within a module or across them;
 * - the step patterns, compiled the way the runner compiles them;
 * - the shrink-only baseline of uncovered methods, grouped (by entity family,
 *   by client), with its check against the working tree and against the base
 *   branch's copy;
 * - the command line both scripts run.
 */
import { execFileSync } from 'child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import { compileExpression } from '../../tests/bdd/support/steps';

export const EXIT_RATCHET = 1;
export const EXIT_INTEGRITY = 2;

export function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

/** Every file under `dir` whose name `keep` accepts, depth first, sorted. */
export function walk(dir: string, keep: (name: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) found.push(...walk(abs, keep));
    else if (keep(entry)) found.push(abs);
  }
  return found;
}

export function parseSource(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf-8'),
    ts.ScriptTarget.Latest,
    true,
  );
}

// ---------------------------------------------------------------------------
// Step files, read with the type checker
// ---------------------------------------------------------------------------

/** The options the checker resolves the step files under; mirrors tsconfig. */
const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  types: [],
};

export interface StepPattern {
  file: string;
  regexp: RegExp;
  /** The function registered for the pattern; null when it is not inline. */
  callback: ts.Node | null;
}

const KEYWORDS = new Set(['Given', 'When', 'Then']);

/** A function-like node's body, whatever form the declaration takes. */
export function bodyOf(node: ts.Node): ts.Node | null {
  if (
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)) &&
    node.body
  ) {
    return node.body;
  }
  if (
    ts.isVariableDeclaration(node) &&
    node.initializer &&
    (ts.isArrowFunction(node.initializer) ||
      ts.isFunctionExpression(node.initializer))
  ) {
    return node.initializer.body;
  }
  return null;
}

/**
 * The method keys one call credits: the call's callee is a property access,
 * and the check decides from the checker whether it reaches one of its
 * methods, and which.
 */
export type CallCredit = (callee: ts.PropertyAccessExpression) => string[];

/**
 * The step files of a root, loaded once into a TypeScript program so the
 * checker can say what a call's receiver is and where a callee is declared.
 * Only files under `tests/bdd` are followed: a call into `src/` is the code
 * under test being used, not specified.
 */
export class StepProject {
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  readonly testsDir: string;
  private credit: CallCredit = () => [];
  private readonly reachedByBody = new Map<ts.Node, Set<string>>();

  constructor(
    readonly root: string,
    rootFiles: readonly string[],
  ) {
    this.program = ts.createProgram([...rootFiles], COMPILER_OPTIONS);
    this.checker = this.program.getTypeChecker();
    this.testsDir = toPosix(path.join(root, 'tests', 'bdd')) + '/';
  }

  /** Sets what a call credits; call before the first `methodsReachedBy`. */
  creditWith(credit: CallCredit): void {
    this.credit = credit;
  }

  /** Whether a source file is one of the root's `tests/bdd` files. */
  isTestFile(fileName: string): boolean {
    return toPosix(path.normalize(fileName)).startsWith(this.testsDir);
  }

  /** The patterns every step file registers, compiled the way the runner does. */
  stepPatterns(): StepPattern[] {
    const patterns: StepPattern[] = [];
    for (const source of this.program.getSourceFiles()) {
      const file = path.normalize(source.fileName);
      if (!this.isTestFile(file)) continue;
      const visit = (node: ts.Node): void => {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          KEYWORDS.has(node.expression.text)
        ) {
          const [pattern, callback] = node.arguments;
          const fn =
            callback &&
            (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
              ? callback
              : null;
          if (pattern && ts.isStringLiteralLike(pattern)) {
            patterns.push({
              file,
              regexp: compileExpression(pattern.text).regexp,
              callback: fn,
            });
          } else if (pattern && ts.isRegularExpressionLiteral(pattern)) {
            const text = pattern.text;
            const close = text.lastIndexOf('/');
            patterns.push({
              file,
              regexp: new RegExp(text.slice(1, close), text.slice(close + 1)),
              callback: fn,
            });
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    return patterns;
  }

  /**
   * The methods a function reaches: every call the credit accepts, in the
   * function itself or in any `tests/bdd` function it calls, however the call
   * chain runs between modules or within one. The function may be given
   * inline or by name.
   */
  methodsReachedBy(fn: ts.Node): Set<string> {
    const reached = new Set<string>();
    const bodies = ts.isIdentifier(fn)
      ? this.bodiesOf(fn)
      : [bodyOf(fn)].filter((b): b is ts.Node => b !== null);
    for (const body of bodies) {
      for (const m of this.reachedIn(body)) reached.add(m);
    }
    return reached;
  }

  private reachedIn(body: ts.Node): Set<string> {
    const cached = this.reachedByBody.get(body);
    if (cached) return cached;
    const reached = new Set<string>();
    this.reachedByBody.set(body, reached); // Set first, so recursion terminates.

    const visit = (n: ts.Node): void => {
      if (ts.isCallExpression(n)) {
        const callee = n.expression;
        if (ts.isPropertyAccessExpression(callee)) {
          for (const key of this.credit(callee)) reached.add(key);
        }
        for (const calleeBody of this.bodiesOf(callee)) {
          for (const m of this.reachedIn(calleeBody)) reached.add(m);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(body);
    return reached;
  }

  /** The bodies of the `tests/bdd` functions a callee expression names. */
  private bodiesOf(callee: ts.Expression): ts.Node[] {
    const name = ts.isPropertyAccessExpression(callee) ? callee.name : callee;
    if (!ts.isIdentifier(name)) return [];
    let symbol = this.checker.getSymbolAtLocation(name);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
      symbol = this.checker.getAliasedSymbol(symbol);
    }
    const bodies: ts.Node[] = [];
    for (const declaration of symbol?.declarations ?? []) {
      if (!this.isTestFile(declaration.getSourceFile().fileName)) continue;
      const body = bodyOf(declaration);
      if (body) bodies.push(body);
    }
    return bodies;
  }
}

/** The single step a step text resolves to, or null (none or several). */
export function stepFor(
  text: string,
  patterns: readonly StepPattern[],
): StepPattern | null {
  const matches = patterns.filter((p) => p.regexp.test(text));
  return matches.length === 1 ? matches[0]! : null;
}

// ---------------------------------------------------------------------------
// Baseline ratchet
// ---------------------------------------------------------------------------

/** Uncovered methods that are known and tolerated, by group. */
export type GroupedBaseline = Record<string, string[]>;

/** How a check names its methods and groups in what it prints. */
export interface RatchetWords {
  /** Plural, as in "3 provider methods are named by no Rule". */
  methods: string;
  /** Singular, as in "no longer a provider method". */
  method: string;
  /** What a baseline key is: "family", "client". */
  group: string;
  baselineFile: string;
  /** The variable that names the base ref, ahead of origin/master. */
  baseRefEnv: string;
  /**
   * How an entry is compared with the base branch's copy: by method name
   * alone, so a method may move group, or by `Group: method`, when a name is
   * not unique across groups.
   */
  addedBy: 'name' | 'key';
}

export function parseGroupedBaseline(
  raw: string,
  group: string,
): GroupedBaseline {
  const parsed = JSON.parse(raw) as { uncovered?: unknown };
  const section = parsed.uncovered ?? {};
  if (
    typeof section !== 'object' ||
    section === null ||
    Array.isArray(section)
  ) {
    throw new Error(
      `Baseline 'uncovered' must be an object of ${group} → method names.`,
    );
  }
  const baseline: GroupedBaseline = {};
  for (const [key, names] of Object.entries(section)) {
    if (!Array.isArray(names) || names.some((n) => typeof n !== 'string')) {
      throw new Error(
        `Baseline ${group} '${key}' must be an array of method names.`,
      );
    }
    baseline[key] = names as string[];
  }
  return baseline;
}

export function serializeGroupedBaseline(
  comment: string,
  uncovered: GroupedBaseline,
): string {
  return `${JSON.stringify({ $comment: comment, uncovered }, null, 2)}\n`;
}

export interface BaseBaseline {
  ref: string | null;
  baseline: GroupedBaseline | null;
}

/** The baseline as the integration branch has it; see export-coverage-core. */
export function loadGroupedBaseBaseline(
  root: string,
  refs: string[],
  baselineFile: string,
  parse: (raw: string) => GroupedBaseline,
): BaseBaseline {
  const git = (args: string[]) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  for (const ref of refs) {
    try {
      git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    } catch {
      continue;
    }
    let raw: string;
    try {
      raw = git(['show', `${ref}:./${baselineFile}`]);
    } catch {
      return { ref, baseline: null };
    }
    try {
      return { ref, baseline: parse(raw) };
    } catch {
      return { ref, baseline: {} };
    }
  }
  return { ref: null, baseline: null };
}

export interface RatchetResult {
  /** Uncovered methods the baseline does not list under their group: write a Rule. */
  unlisted: string[];
  /** Entries now covered, no longer a method, or under the wrong group: remove them. */
  stale: string[];
  /** Methods absent from the base ref's copy: the list grew. */
  added: string[];
  baseRefMissing: boolean;
}

/** `Group: method` keys, so a method under the wrong group does not pass. */
const groupKeys = (baseline: GroupedBaseline): Set<string> =>
  new Set(
    Object.entries(baseline).flatMap(([group, names]) =>
      names.map((n) => `${group}: ${n}`),
    ),
  );

const methodNames = (baseline: GroupedBaseline): Set<string> =>
  new Set(Object.values(baseline).flat());

/**
 * The working tree against its committed baseline, group by group, and, when
 * `base` is given, the baseline against the base branch's copy, by method
 * name or by key as `addedBy` says.
 */
export function applyGroupedBaseline(
  uncoveredNow: GroupedBaseline,
  baseline: GroupedBaseline,
  base: BaseBaseline | null,
  addedBy: RatchetWords['addedBy'],
): RatchetResult {
  const listed = groupKeys(baseline);
  const uncovered = groupKeys(uncoveredNow);
  const unlisted = [...uncovered].filter((k) => !listed.has(k));
  const stale = [...listed].filter((k) => !uncovered.has(k));
  const added: string[] = [];
  if (base && (base.ref === null || base.baseline !== null)) {
    const entries = addedBy === 'name' ? methodNames : groupKeys;
    const before = entries(base.baseline ?? {});
    added.push(...[...entries(baseline)].filter((m) => !before.has(m)));
  }
  return {
    unlisted,
    stale,
    added,
    baseRefMissing: base !== null && base.ref === null,
  };
}

export function groupedRatchetProblems(
  result: RatchetResult,
  words: RatchetWords,
): string[] {
  const problems: string[] = [];
  if (result.unlisted.length > 0) {
    problems.push(
      `${result.unlisted.length} ${words.methods} are named by no Rule and reached by no bound step, ` +
        `and are not in the baseline under their ${words.group}: ${result.unlisted.join(', ')}. Write a Rule and scenario for each.`,
    );
  }
  if (result.stale.length > 0) {
    problems.push(
      `${result.stale.length} baseline entries are now covered, no longer a ${words.method}, or under the wrong ${words.group}: ` +
        `${result.stale.join(', ')}. Remove them from ${words.baselineFile} to lock the improvement in.`,
    );
  }
  if (result.added.length > 0) {
    problems.push(
      result.baseRefMissing
        ? `No base ref resolved, so every baseline entry counts as added (${result.added.length}). ` +
            `Set ${words.baseRefEnv} or fetch origin/master.`
        : `${result.added.length} baseline entries are not on the base branch: ${result.added.join(', ')}. ` +
            'The list only shrinks; write the Rule instead.',
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Command line
// ---------------------------------------------------------------------------

export interface CoverageCommand<R> {
  /** Heads the step summary and the pass line: "SDE specification coverage". */
  title: string;
  words: RatchetWords;
  analyse(root: string): R;
  render(report: R): string;
  integrity(report: R): string[];
  serialize(report: R): string;
  parse(raw: string): GroupedBaseline;
  apply(
    report: R,
    baseline: GroupedBaseline,
    base: BaseBaseline | null,
  ): RatchetResult;
}

/**
 * `[--ci] [--write-baseline] [--root <dir>]`. Exit 2 when the check itself is
 * broken; exit 1 when the baseline and the working tree disagree, or, under
 * `--ci`, when the baseline lists an entry the base branch's copy lacks.
 * Without `--ci` and without a baseline file it only reports.
 */
export function runCoverageCommand<R>(
  command: CoverageCommand<R>,
  args: readonly string[],
  defaultRoot: string,
): number {
  const { words } = command;
  const ci = args.includes('--ci');
  const rootIndex = args.indexOf('--root');
  const root =
    rootIndex >= 0 && args[rootIndex + 1]
      ? path.resolve(args[rootIndex + 1]!)
      : defaultRoot;

  const report = command.analyse(root);
  const rendered = command.render(report);
  console.log(rendered);

  const broken = command.integrity(report);
  if (broken.length > 0) {
    for (const problem of broken) console.error(`[ERROR] ${problem}`);
    return EXIT_INTEGRITY;
  }

  const baselinePath = path.join(root, words.baselineFile);
  if (args.includes('--write-baseline')) {
    mkdirSync(path.dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, command.serialize(report));
    console.log(`\nBaseline written to ${words.baselineFile}.`);
  }
  if (!ci && !existsSync(baselinePath)) return 0;

  const baseline = existsSync(baselinePath)
    ? command.parse(readFileSync(baselinePath, 'utf-8'))
    : {};
  const hasEntries = Object.values(baseline).some((names) => names.length > 0);
  let base: BaseBaseline | null = null;
  if (ci) {
    base = hasEntries
      ? loadGroupedBaseBaseline(
          root,
          [process.env[words.baseRefEnv], 'origin/master', 'master'].filter(
            (ref): ref is string => Boolean(ref),
          ),
          words.baselineFile,
          command.parse,
        )
      : { ref: null, baseline: {} };
    if (hasEntries && base.ref !== null && base.baseline === null) {
      console.log(
        `\n${base.ref} has no ${words.baselineFile} yet; additions are not checked until it does.`,
      );
    }
  }

  const problems = groupedRatchetProblems(
    command.apply(report, baseline, base),
    words,
  );
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## ${command.title}\n\n\`\`\`\n${rendered}\n\`\`\`\n`,
    );
  }
  if (problems.length === 0) {
    console.log(`\n${command.title} matches the baseline.`);
    return 0;
  }
  for (const problem of problems) {
    console.error(`\n[ERROR] ${problem}`);
    if (process.env.GITHUB_ACTIONS === 'true') {
      console.log(`::error file=${words.baselineFile}::${problem}`);
    }
  }
  return EXIT_RATCHET;
}

/** Runs a command as a script's entry point, mapping a throw to exit 2. */
export function mainOf<R>(command: CoverageCommand<R>, root: string): void {
  try {
    process.exitCode = runCoverageCommand(command, process.argv.slice(2), root);
  } catch (error) {
    console.error(`[ERROR] ${(error as Error).message}`);
    process.exitCode = EXIT_INTEGRITY;
  }
}
