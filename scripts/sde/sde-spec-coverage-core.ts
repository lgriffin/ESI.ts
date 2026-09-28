/**
 * Method-level specification coverage for the SDE provider.
 *
 * `spec:audit` proves every Rule has a scenario; nothing proves every provider
 * method has a Rule. This check asks the reverse question of
 * `IStaticDataProvider`: for each of its methods, how many `Rule:` blocks and
 * scenarios under `tests/bdd/features/sde/` reach it?
 *
 * A method counts as covered when a Rule's text names it, or when a step the
 * scenario binds calls it on the provider: `provider.getType(id)` in the step
 * file itself, or in a `tests/bdd/support/` function the step file calls.
 * Everything is read statically, with the TypeScript parser and the same step
 * resolution the runner uses, so the script runs without Jest.
 *
 * The uncovered list is grouped by the entity families the interface declares
 * with its `// --- Family ---` comments, in the interface's order, which is the
 * order of the API Reference in `src/sde/README.md`. That list is the input to
 * Track S Runs 5 and 6, and `scripts/sde/sde-spec-coverage-baseline.json`
 * holds it as a shrink-only ratchet (the `export-coverage-baseline.json`
 * pattern): CI fails on an uncovered method the baseline does not list, on a
 * baseline entry that is now covered or no longer a method, and on an entry
 * absent from the base branch's copy.
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import { outlineFeature } from '../../tests/bdd/support/outline';
import { compileExpression } from '../../tests/bdd/support/steps';

export const PROVIDER_FILE = 'src/sde/IStaticDataProvider.ts';
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
// Method references in test code
// ---------------------------------------------------------------------------

/**
 * Names of `<expr>.<method>(...)` calls in a node, filtered to the given set.
 */
function calledMethods(node: ts.Node, methods: ReadonlySet<string>): string[] {
  const found: string[] = [];
  const visit = (n: ts.Node): void => {
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      methods.has(n.expression.name.text)
    ) {
      found.push(n.expression.name.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

/** Names of `<identifier>(...)` calls in a node. */
function calledFunctions(node: ts.Node): Set<string> {
  const found = new Set<string>();
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
      found.add(n.expression.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

/** Relative imports of a file, resolved to absolute `.ts` paths that exist. */
function relativeImports(source: ts.SourceFile): string[] {
  const files: string[] = [];
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }
    const specifier = statement.moduleSpecifier.text;
    if (!specifier.startsWith('.')) continue;
    const base = path.resolve(path.dirname(source.fileName), specifier);
    for (const candidate of [`${base}.ts`, path.join(base, 'index.ts')]) {
      if (existsSync(candidate)) {
        files.push(candidate);
        break;
      }
    }
  }
  return files;
}

/**
 * The provider methods each top-level function of a module calls, by function
 * name, following the module's own relative imports one level at a time.
 */
class SupportIndex {
  private readonly cache = new Map<string, Map<string, Set<string>>>();

  constructor(private readonly methods: ReadonlySet<string>) {}

  functionsOf(file: string): Map<string, Set<string>> {
    const cached = this.cache.get(file);
    if (cached) return cached;
    const byFunction = new Map<string, Set<string>>();
    this.cache.set(file, byFunction); // Set first, so an import cycle terminates.

    const source = parse(file);
    const imported = relativeImports(source);
    for (const statement of source.statements) {
      const fn = topLevelFunction(statement);
      if (!fn) continue;
      const methods = new Set(calledMethods(fn.body, this.methods));
      for (const callee of calledFunctions(fn.body)) {
        for (const dependency of imported) {
          for (const m of this.functionsOf(dependency).get(callee) ?? []) {
            methods.add(m);
          }
        }
      }
      byFunction.set(fn.name, methods);
    }
    return byFunction;
  }
}

function topLevelFunction(
  statement: ts.Statement,
): { name: string; body: ts.Node } | null {
  if (ts.isFunctionDeclaration(statement) && statement.name && statement.body) {
    return { name: statement.name.text, body: statement.body };
  }
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        (ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer))
      ) {
        return { name: declaration.name.text, body: declaration.initializer };
      }
    }
  }
  return null;
}

/**
 * The provider methods a step file reaches: the ones it calls itself, plus
 * the ones reached through the support functions it calls.
 */
function methodsReachedBy(
  stepFile: string,
  methods: ReadonlySet<string>,
  support: SupportIndex,
): Set<string> {
  const source = parse(stepFile);
  const reached = new Set(calledMethods(source, methods));
  const imported = relativeImports(source);
  for (const callee of calledFunctions(source)) {
    for (const dependency of imported) {
      for (const m of support.functionsOf(dependency).get(callee) ?? []) {
        reached.add(m);
      }
    }
  }
  return reached;
}

// ---------------------------------------------------------------------------
// Step resolution
// ---------------------------------------------------------------------------

interface StepPattern {
  file: string;
  regexp: RegExp;
}

const KEYWORDS = new Set(['Given', 'When', 'Then']);

/** The one pattern each step file registers, compiled the way the runner does. */
export function readStepPatterns(root: string): StepPattern[] {
  const patterns: StepPattern[] = [];
  for (const file of walk(path.join(root, STEPS_DIR), (n) =>
    n.endsWith('.ts'),
  )) {
    const source = parse(file);
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        KEYWORDS.has(node.expression.text)
      ) {
        const pattern = node.arguments[0];
        if (pattern && ts.isStringLiteralLike(pattern)) {
          patterns.push({
            file,
            regexp: compileExpression(pattern.text).regexp,
          });
        } else if (pattern && ts.isRegularExpressionLiteral(pattern)) {
          const text = pattern.text;
          const close = text.lastIndexOf('/');
          patterns.push({
            file,
            regexp: new RegExp(text.slice(1, close), text.slice(close + 1)),
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return patterns;
}

/** The single step file a step text resolves to, or null (none or several). */
function stepFileFor(
  text: string,
  patterns: readonly StepPattern[],
): string | null {
  const matches = patterns.filter((p) => p.regexp.test(text));
  return matches.length === 1 ? matches[0]!.file : null;
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
  const patterns = readStepPatterns(root);
  const support = new SupportIndex(names);
  const reachedByStepFile = new Map<string, Set<string>>();
  const reached = (file: string): Set<string> => {
    let set = reachedByStepFile.get(file);
    if (!set) {
      set = methodsReachedBy(file, names, support);
      reachedByStepFile.set(file, set);
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
          const file = stepFileFor(step.stepText, patterns);
          if (!file) {
            unresolvedSteps.push(`${rel}:${step.lineNumber} ${step.stepText}`);
            continue;
          }
          for (const m of reached(file)) inScenario.add(m);
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
  /** Uncovered methods the baseline does not list: write a Rule. */
  unlisted: string[];
  /** Baseline entries now covered or no longer a method: remove them. */
  stale: string[];
  /** Baseline entries absent from the base ref's copy: the list grew. */
  added: string[];
  baseRefMissing: boolean;
}

const flatten = (baseline: CoverageBaseline): Set<string> =>
  new Set(Object.values(baseline).flat());

export function applyBaseline(
  report: CoverageReport,
  baseline: CoverageBaseline,
  base: BaseBaseline,
): RatchetResult {
  const listed = flatten(baseline);
  const uncovered = flatten(uncoveredByFamily(report));
  const unlisted = [...uncovered].filter((m) => !listed.has(m));
  const stale = [...listed].filter((m) => !uncovered.has(m));
  const added: string[] = [];
  if (base.ref === null || base.baseline !== null) {
    const before = flatten(base.baseline ?? {});
    added.push(...[...listed].filter((m) => !before.has(m)));
  }
  return { unlisted, stale, added, baseRefMissing: base.ref === null };
}

export function ratchetProblems(result: RatchetResult): string[] {
  const problems: string[] = [];
  if (result.unlisted.length > 0) {
    problems.push(
      `${result.unlisted.length} provider methods are named by no Rule and reached by no bound step, ` +
        `and are not in the baseline: ${result.unlisted.join(', ')}. Write a Rule and scenario for each.`,
    );
  }
  if (result.stale.length > 0) {
    problems.push(
      `${result.stale.length} baseline entries are now covered or no longer a provider method: ` +
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
