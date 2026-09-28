/**
 * Method-level specification coverage for the SDE provider.
 *
 * `spec:audit` proves every Rule has a scenario; nothing proves every provider
 * method has a Rule. This check asks the reverse question of
 * `IStaticDataProvider`: for each of its methods, how many `Rule:` blocks and
 * scenarios under `tests/bdd/features/sde/` reach it?
 *
 * A method counts as covered when a Rule's text names it, or when the step
 * function a scenario binds calls it on the provider: `provider.getType(id)`
 * in the function itself, or in a `tests/bdd` function it calls, however deep.
 * The TypeScript type checker decides what a call's receiver is, so a
 * same-named method on another object, or on a value typed `any`, does not
 * count, and it resolves each callee to its declaration, so a helper beside
 * the caller and one in another module are followed alike. Steps resolve the
 * way the runner resolves them, so the script runs without Jest.
 *
 * The uncovered list is grouped by the entity families the interface declares
 * with its `// --- Family ---` comments, in the interface's order, which is the
 * order of the API Reference in `guides/sde/REFERENCE.md`. That list is the input to
 * Track S Runs 5 and 6, and `scripts/sde/sde-spec-coverage-baseline.json`
 * holds it as a shrink-only ratchet (the `export-coverage-baseline.json`
 * pattern): the report fails on an uncovered method the baseline does not
 * list under its family and on an entry that is now covered, no longer a
 * method or under the wrong family; `--ci` also fails on a method absent from
 * the base branch's copy.
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import { outlineFeature } from '../../tests/bdd/support/outline';
import { compileExpression } from '../../tests/bdd/support/steps';

export const PROVIDER_FILE = 'src/sde/ports/IStaticDataProvider.ts';
export const PROVIDER_INTERFACE = 'IStaticDataProvider';
export const FEATURES_DIR = 'tests/bdd/features/sde';
export const STEPS_DIR = 'tests/bdd/steps';
export const SUPPORT_DIR = 'tests/bdd/support';
export const BASELINE_FILE = 'scripts/sde/sde-spec-coverage-baseline.json';

export const EXIT_RATCHET = 1;
export const EXIT_INTEGRITY = 2;

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

function walk(dir: string, keep: (name: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) found.push(...walk(abs, keep));
    else if (keep(entry)) found.push(abs);
  }
  return found;
}

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf-8'),
    ts.ScriptTarget.Latest,
    true,
  );
}

// ---------------------------------------------------------------------------
// The provider's methods
// ---------------------------------------------------------------------------

export interface ProviderMethod {
  name: string;
  /** The `// --- Family ---` group the method sits under. */
  family: string;
}

const FAMILY_COMMENT = /^\/\/\s*-{3}\s*(.+?)\s*-{3}\s*$/;

/**
 * Every method of the provider interface with its family, in file order. A
 * method above the first family comment belongs to "Ungrouped". Throws when
 * the interface is missing or has no methods, since a check that read nothing
 * would pass for the wrong reason.
 */
export function readProviderMethods(root: string): ProviderMethod[] {
  const file = path.join(root, PROVIDER_FILE);
  if (!existsSync(file)) {
    throw new Error(`${PROVIDER_FILE} does not exist under ${root}.`);
  }
  const source = parse(file);
  const text = source.getFullText();
  const iface = source.statements.find(
    (s): s is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(s) && s.name.text === PROVIDER_INTERFACE,
  );
  if (!iface) {
    throw new Error(`${PROVIDER_FILE} declares no ${PROVIDER_INTERFACE}.`);
  }

  const methods: ProviderMethod[] = [];
  let family = 'Ungrouped';
  for (const member of iface.members) {
    for (const range of ts.getLeadingCommentRanges(text, member.pos) ?? []) {
      const match = FAMILY_COMMENT.exec(text.slice(range.pos, range.end));
      if (match?.[1]) family = match[1];
    }
    if (ts.isMethodSignature(member) && ts.isIdentifier(member.name)) {
      methods.push({ name: member.name.text, family });
    }
  }
  if (methods.length === 0) {
    throw new Error(`${PROVIDER_INTERFACE} declares no methods.`);
  }
  return methods;
}

/** Family names in the order the interface introduces them. */
export function familyOrder(methods: readonly ProviderMethod[]): string[] {
  return [...new Set(methods.map((m) => m.family))];
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

interface StepPattern {
  file: string;
  regexp: RegExp;
  /** The function registered for the pattern; null when it is not inline. */
  callback: ts.Node | null;
}

const KEYWORDS = new Set(['Given', 'When', 'Then']);

/** A function-like node's body, whatever form the declaration takes. */
function bodyOf(node: ts.Node): ts.Node | null {
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
 * The step files of a root, loaded once into a TypeScript program so the
 * checker can say what a call's receiver is and where a callee is declared.
 * Only files under `tests/bdd` are followed: a call into `src/` is the
 * provider being used, not specified.
 */
class StepProject {
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  private readonly providerType: ts.Type | null;
  private readonly testsDir: string;
  private readonly reachedByBody = new Map<ts.Node, Set<string>>();

  constructor(
    readonly root: string,
    private readonly methods: ReadonlySet<string>,
  ) {
    const stepFiles = walk(path.join(root, STEPS_DIR), (n) =>
      n.endsWith('.ts'),
    );
    const providerFile = path.join(root, PROVIDER_FILE);
    this.program = ts.createProgram(
      [...stepFiles, providerFile],
      COMPILER_OPTIONS,
    );
    this.checker = this.program.getTypeChecker();
    this.testsDir = toPosix(path.join(root, 'tests', 'bdd')) + '/';

    const iface = this.program
      .getSourceFile(providerFile)
      ?.statements.find(
        (s): s is ts.InterfaceDeclaration =>
          ts.isInterfaceDeclaration(s) && s.name.text === PROVIDER_INTERFACE,
      );
    this.providerType = iface
      ? this.checker.getTypeAtLocation(iface.name)
      : null;
  }

  /** The patterns every step file registers, compiled the way the runner does. */
  stepPatterns(): StepPattern[] {
    const patterns: StepPattern[] = [];
    for (const source of this.program.getSourceFiles()) {
      const file = path.normalize(source.fileName);
      if (!toPosix(file).startsWith(this.testsDir)) continue;
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
   * The provider methods a step's callback reaches: `<provider>.method(...)`
   * where the checker types the receiver as the provider (never `any`), in
   * the callback itself or in any `tests/bdd` function it calls, however the
   * call chain runs between modules or within one.
   */
  methodsReachedBy(callback: ts.Node): Set<string> {
    const body = bodyOf(callback);
    return body ? this.reachedIn(body) : new Set();
  }

  private reachedIn(body: ts.Node): Set<string> {
    const cached = this.reachedByBody.get(body);
    if (cached) return cached;
    const reached = new Set<string>();
    this.reachedByBody.set(body, reached); // Set first, so recursion terminates.

    const visit = (n: ts.Node): void => {
      if (ts.isCallExpression(n)) {
        const callee = n.expression;
        if (
          ts.isPropertyAccessExpression(callee) &&
          this.methods.has(callee.name.text) &&
          this.isProvider(this.checker.getTypeAtLocation(callee.expression))
        ) {
          reached.add(callee.name.text);
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

  private isProvider(type: ts.Type): boolean {
    if (!this.providerType) return false;
    if (type.isUnion()) return type.types.some((t) => this.isProvider(t));
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return false;
    return this.checker.isTypeAssignableTo(type, this.providerType);
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
      const file = toPosix(
        path.normalize(declaration.getSourceFile().fileName),
      );
      if (!file.startsWith(this.testsDir)) continue;
      const body = bodyOf(declaration);
      if (body) bodies.push(body);
    }
    return bodies;
  }
}

/** The patterns the step files register; see StepProject.stepPatterns. */
export function readStepPatterns(root: string): StepPattern[] {
  return new StepProject(root, new Set()).stepPatterns();
}

/** The single step a step text resolves to, or null (none or several). */
function stepFor(
  text: string,
  patterns: readonly StepPattern[],
): StepPattern | null {
  const matches = patterns.filter((p) => p.regexp.test(text));
  return matches.length === 1 ? matches[0]! : null;
}

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------

export interface MethodCoverage extends ProviderMethod {
  /** Rules whose text names the method, or with a scenario that reaches it. */
  rules: number;
  /** Scenarios whose bound steps reach the method. */
  scenarios: number;
}

export interface CoverageReport {
  methods: MethodCoverage[];
  featureCount: number;
  ruleCount: number;
  scenarioCount: number;
  /** Steps in the SDE features that resolve to no single step file. */
  unresolvedSteps: string[];
}

export function analyseCoverage(root: string): CoverageReport {
  const provider = readProviderMethods(root);
  const names = new Set(provider.map((m) => m.name));
  const project = new StepProject(root, names);
  const patterns = project.stepPatterns();
  const reachedByStep = new Map<StepPattern, Set<string>>();
  const reached = (step: StepPattern): Set<string> => {
    let set = reachedByStep.get(step);
    if (!set) {
      set = step.callback
        ? project.methodsReachedBy(step.callback)
        : new Set<string>();
      reachedByStep.set(step, set);
    }
    return set;
  };

  const rulesByMethod = new Map<string, number>();
  const scenariosByMethod = new Map<string, number>();
  const unresolvedSteps: string[] = [];
  let ruleCount = 0;
  let scenarioCount = 0;

  const features = walk(path.join(root, FEATURES_DIR), (n) =>
    n.endsWith('.feature'),
  );
  for (const feature of features) {
    const rel = toPosix(path.relative(root, feature));
    const outline = outlineFeature(readFileSync(feature, 'utf-8'));
    for (const rule of outline.rules) {
      ruleCount += 1;
      const inRule = new Set<string>();
      for (const name of names) {
        if (rule.title && new RegExp(`\\b${name}\\b`).test(rule.title)) {
          inRule.add(name);
        }
      }
      for (const scenario of rule.scenarios) {
        scenarioCount += 1;
        const inScenario = new Set<string>();
        for (const step of scenario.steps) {
          const bound = stepFor(step.stepText, patterns);
          if (!bound) {
            unresolvedSteps.push(`${rel}:${step.lineNumber} ${step.stepText}`);
            continue;
          }
          for (const m of reached(bound)) inScenario.add(m);
        }
        for (const m of inScenario) {
          scenariosByMethod.set(m, (scenariosByMethod.get(m) ?? 0) + 1);
          inRule.add(m);
        }
      }
      for (const m of inRule) {
        rulesByMethod.set(m, (rulesByMethod.get(m) ?? 0) + 1);
      }
    }
  }

  return {
    methods: provider.map((m) => ({
      ...m,
      rules: rulesByMethod.get(m.name) ?? 0,
      scenarios: scenariosByMethod.get(m.name) ?? 0,
    })),
    featureCount: features.length,
    ruleCount,
    scenarioCount,
    unresolvedSteps,
  };
}

/** Uncovered methods grouped by family, families in interface order. */
export function uncoveredByFamily(
  report: CoverageReport,
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const family of familyOrder(report.methods)) {
    const names = report.methods
      .filter((m) => m.family === family && m.rules === 0 && m.scenarios === 0)
      .map((m) => m.name);
    if (names.length > 0) grouped[family] = names;
  }
  return grouped;
}

export function renderReport(report: CoverageReport): string {
  const lines: string[] = [];
  const width = Math.max(...report.methods.map((m) => m.name.length));
  for (const family of familyOrder(report.methods)) {
    lines.push('', `${family}`, `${'-'.repeat(family.length)}`);
    lines.push(`${'method'.padEnd(width)}  rules  scenarios`);
    for (const m of report.methods.filter((x) => x.family === family)) {
      lines.push(
        `${m.name.padEnd(width)}  ${String(m.rules).padStart(5)}  ${String(m.scenarios).padStart(9)}`,
      );
    }
  }
  const covered = report.methods.filter(
    (m) => m.rules > 0 || m.scenarios > 0,
  ).length;
  lines.push(
    '',
    `${covered} of ${report.methods.length} provider methods are named by a Rule or reached by a bound step ` +
      `(${report.ruleCount} rules, ${report.scenarioCount} scenarios, ${report.featureCount} features).`,
  );
  const uncovered = uncoveredByFamily(report);
  const families = Object.keys(uncovered);
  if (families.length > 0) {
    lines.push('', 'Uncovered, by entity family:');
    for (const family of families) {
      lines.push(`  ${family}: ${uncovered[family]!.join(', ')}`);
    }
  }
  return lines.join('\n');
}

/** Reasons the check itself cannot be trusted, so it must not pass. */
export function integrityProblems(report: CoverageReport): string[] {
  const problems: string[] = [];
  if (report.featureCount === 0) {
    problems.push(`No feature files found under ${FEATURES_DIR}.`);
  }
  if (report.unresolvedSteps.length > 0) {
    problems.push(
      `${report.unresolvedSteps.length} steps resolve to no single step file, so their scenarios ` +
        `cannot vouch for any method:\n  ${report.unresolvedSteps.join('\n  ')}`,
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Baseline ratchet
// ---------------------------------------------------------------------------

/** Uncovered methods that are known and tolerated, by family. */
export type CoverageBaseline = Record<string, string[]>;

export function parseBaseline(raw: string): CoverageBaseline {
  const parsed = JSON.parse(raw) as { uncovered?: unknown };
  const section = parsed.uncovered ?? {};
  if (
    typeof section !== 'object' ||
    section === null ||
    Array.isArray(section)
  ) {
    throw new Error(
      "Baseline 'uncovered' must be an object of family → method names.",
    );
  }
  const baseline: CoverageBaseline = {};
  for (const [family, names] of Object.entries(section)) {
    if (!Array.isArray(names) || names.some((n) => typeof n !== 'string')) {
      throw new Error(
        `Baseline family '${family}' must be an array of method names.`,
      );
    }
    baseline[family] = names as string[];
  }
  return baseline;
}

export function serializeBaseline(report: CoverageReport): string {
  return `${JSON.stringify(
    {
      $comment:
        'IStaticDataProvider methods no Rule names and no bound step reaches, ' +
        'by entity family in the interface order. Shrink-only: CI fails on an ' +
        'uncovered method missing from this list, on an entry that is now ' +
        'covered or no longer a method, and on any entry not on master. ' +
        'Regenerate with npm run spec:coverage:sde -- --write-baseline.',
      uncovered: uncoveredByFamily(report),
    },
    null,
    2,
  )}\n`;
}

export interface BaseBaseline {
  ref: string | null;
  baseline: CoverageBaseline | null;
}

/** The baseline as the integration branch has it; see export-coverage-core. */
export function loadBaseBaseline(root: string, refs: string[]): BaseBaseline {
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
      raw = git(['show', `${ref}:./${BASELINE_FILE}`]);
    } catch {
      return { ref, baseline: null };
    }
    try {
      return { ref, baseline: parseBaseline(raw) };
    } catch {
      return { ref, baseline: {} };
    }
  }
  return { ref: null, baseline: null };
}

export interface RatchetResult {
  /** Uncovered methods the baseline does not list under their family: write a Rule. */
  unlisted: string[];
  /** Entries now covered, no longer a method, or under the wrong family: remove them. */
  stale: string[];
  /** Methods absent from the base ref's copy: the list grew. */
  added: string[];
  baseRefMissing: boolean;
}

/** `Family: method` keys, so a method under the wrong family does not pass. */
const familyKeys = (baseline: CoverageBaseline): Set<string> =>
  new Set(
    Object.entries(baseline).flatMap(([family, names]) =>
      names.map((n) => `${family}: ${n}`),
    ),
  );

const methodNames = (baseline: CoverageBaseline): Set<string> =>
  new Set(Object.values(baseline).flat());

/**
 * The working tree against its committed baseline, family by family, and,
 * when `base` is given, the baseline against the base branch's copy by method
 * name (a method may move family without counting as an addition).
 */
export function applyBaseline(
  report: CoverageReport,
  baseline: CoverageBaseline,
  base: BaseBaseline | null,
): RatchetResult {
  const listed = familyKeys(baseline);
  const uncovered = familyKeys(uncoveredByFamily(report));
  const unlisted = [...uncovered].filter((k) => !listed.has(k));
  const stale = [...listed].filter((k) => !uncovered.has(k));
  const added: string[] = [];
  if (base && (base.ref === null || base.baseline !== null)) {
    const before = methodNames(base.baseline ?? {});
    added.push(...[...methodNames(baseline)].filter((m) => !before.has(m)));
  }
  return {
    unlisted,
    stale,
    added,
    baseRefMissing: base !== null && base.ref === null,
  };
}

export function ratchetProblems(result: RatchetResult): string[] {
  const problems: string[] = [];
  if (result.unlisted.length > 0) {
    problems.push(
      `${result.unlisted.length} provider methods are named by no Rule and reached by no bound step, ` +
        `and are not in the baseline under their family: ${result.unlisted.join(', ')}. Write a Rule and scenario for each.`,
    );
  }
  if (result.stale.length > 0) {
    problems.push(
      `${result.stale.length} baseline entries are now covered, no longer a provider method, or under the wrong family: ` +
        `${result.stale.join(', ')}. Remove them from ${BASELINE_FILE} to lock the improvement in.`,
    );
  }
  if (result.added.length > 0) {
    problems.push(
      result.baseRefMissing
        ? `No base ref resolved, so every baseline entry counts as added (${result.added.length}). ` +
            'Set SDE_SPEC_COVERAGE_BASE_REF or fetch origin/master.'
        : `${result.added.length} baseline entries are not on the base branch: ${result.added.join(', ')}. ` +
            'The list only shrinks; write the Rule instead.',
    );
  }
  return problems;
}
