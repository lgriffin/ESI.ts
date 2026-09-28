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
 *
 * The call graph, the step patterns, the baseline and the command line are
 * shared with `spec:coverage:clients` through `scripts/spec/method-coverage-core.ts`.
 */
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import { outlineFeature } from '../../tests/bdd/support/outline';
import {
  type BaseBaseline,
  EXIT_INTEGRITY,
  EXIT_RATCHET,
  type GroupedBaseline,
  type RatchetResult,
  type RatchetWords,
  StepProject,
  type StepPattern,
  applyGroupedBaseline,
  groupedRatchetProblems,
  loadGroupedBaseBaseline,
  parseGroupedBaseline,
  parseSource,
  serializeGroupedBaseline,
  stepFor,
  toPosix,
  walk,
} from '../spec/method-coverage-core';

export { EXIT_INTEGRITY, EXIT_RATCHET };
export type { BaseBaseline, RatchetResult };

export const PROVIDER_FILE = 'src/sde/ports/IStaticDataProvider.ts';
export const PROVIDER_INTERFACE = 'IStaticDataProvider';
export const FEATURES_DIR = 'tests/bdd/features/sde';
export const STEPS_DIR = 'tests/bdd/steps';
export const SUPPORT_DIR = 'tests/bdd/support';
export const BASELINE_FILE = 'scripts/sde/sde-spec-coverage-baseline.json';

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
  const source = parseSource(file);
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

/**
 * The step files and the provider interface in one program, crediting
 * `<provider>.method(...)` where the checker types the receiver as the
 * provider (never `any`).
 */
function providerProject(
  root: string,
  methods: ReadonlySet<string>,
): StepProject {
  const providerFile = path.join(root, PROVIDER_FILE);
  const project = new StepProject(root, [
    ...walk(path.join(root, STEPS_DIR), (n) => n.endsWith('.ts')),
    providerFile,
  ]);
  const { checker } = project;
  const iface = project.program
    .getSourceFile(providerFile)
    ?.statements.find(
      (s): s is ts.InterfaceDeclaration =>
        ts.isInterfaceDeclaration(s) && s.name.text === PROVIDER_INTERFACE,
    );
  const providerType = iface ? checker.getTypeAtLocation(iface.name) : null;
  const isProvider = (type: ts.Type): boolean => {
    if (!providerType) return false;
    if (type.isUnion()) return type.types.some((t) => isProvider(t));
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return false;
    return checker.isTypeAssignableTo(type, providerType);
  };
  project.creditWith((callee) =>
    methods.has(callee.name.text) &&
    isProvider(checker.getTypeAtLocation(callee.expression))
      ? [callee.name.text]
      : [],
  );
  return project;
}

/** The patterns the step files register; see StepProject.stepPatterns. */
export function readStepPatterns(root: string): StepPattern[] {
  return providerProject(root, new Set()).stepPatterns();
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
  const project = providerProject(root, names);
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
export type CoverageBaseline = GroupedBaseline;

export const RATCHET_WORDS: RatchetWords = {
  methods: 'provider methods',
  method: 'provider method',
  group: 'family',
  baselineFile: BASELINE_FILE,
  baseRefEnv: 'SDE_SPEC_COVERAGE_BASE_REF',
  addedBy: 'name',
};

export function parseBaseline(raw: string): CoverageBaseline {
  return parseGroupedBaseline(raw, 'family');
}

export function serializeBaseline(report: CoverageReport): string {
  return serializeGroupedBaseline(
    'IStaticDataProvider methods no Rule names and no bound step reaches, ' +
      'by entity family in the interface order. Shrink-only: CI fails on an ' +
      'uncovered method missing from this list, on an entry that is now ' +
      'covered or no longer a method, and on any entry not on master. ' +
      'Regenerate with npm run spec:coverage:sde -- --write-baseline.',
    uncoveredByFamily(report),
  );
}

/** The baseline as the integration branch has it; see export-coverage-core. */
export function loadBaseBaseline(root: string, refs: string[]): BaseBaseline {
  return loadGroupedBaseBaseline(root, refs, BASELINE_FILE, parseBaseline);
}

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
  return applyGroupedBaseline(
    uncoveredByFamily(report),
    baseline,
    base,
    'name',
  );
}

export function ratchetProblems(result: RatchetResult): string[] {
  return groupedRatchetProblems(result, RATCHET_WORDS);
}
