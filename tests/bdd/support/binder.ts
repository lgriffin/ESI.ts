/**
 * Runs feature files against the global step library under Jest.
 *
 * A spec entry is two lines:
 *
 *   import { bindFeature } from '../../support/binder';
 *   bindFeature(__filename);
 *
 * `tests/bdd/specs/core/0023-market.spec.ts` binds
 * `tests/bdd/features/core/0023-market.feature`. The feature becomes a
 * `describe` per Feature and per Rule, so Rule titles, which are the
 * requirements, appear in test output. Each Scenario becomes a `test` that
 * runs the Before hooks, its steps and the After hooks against a new World.
 *
 * Planning is separate from binding. `planFeature` resolves every step against
 * the library without running anything; the binder refuses to define a feature
 * whose plan has problems, and `specs/step-library.spec.ts` uses the same plans
 * to report unused steps. That is this suite's dry run.
 *
 * jest-cucumber is used for parsing only. Its parser flattens Rules into the
 * feature's scenario list, so each scenario's Rule is recovered from the line
 * numbers of the `Rule:` keywords in the source.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import * as path from 'path';
import { parseFeature } from 'jest-cucumber';
import {
  DataTable,
  StepDefinition,
  StepLibrary,
  registerFrom,
  stepLibrary,
} from './steps';
import { World } from './world';

const BDD_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(BDD_ROOT, '..', '..');
export const STEPS_ROOT = path.join(BDD_ROOT, 'steps');
export const SPECS_ROOT = path.join(BDD_ROOT, 'specs');
export const FEATURES_ROOT = path.join(BDD_ROOT, 'features');

type StepArgument = string | Array<Record<string, string>> | null;

export interface PlannedStep {
  keyword: string;
  text: string;
  line: number;
  argument: StepArgument;
  /** The single matching definition; undefined when there is none, or several. */
  definition: StepDefinition | undefined;
  /** Every definition whose pattern matches the step text. */
  candidates: StepDefinition[];
  args: unknown[];
}

export interface PlannedScenario {
  title: string;
  line: number;
  steps: PlannedStep[];
}

export interface PlannedRule {
  /** Null for scenarios outside any Rule, which spec:audit rejects. */
  title: string | null;
  scenarios: PlannedScenario[];
}

export interface FeaturePlan {
  /** Repository-relative path of the feature file. */
  file: string;
  title: string;
  rules: PlannedRule[];
  /** Steps that match no definition, or more than one. */
  problems: string[];
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

function capitalise(keyword: string): string {
  return keyword.charAt(0).toUpperCase() + keyword.slice(1);
}

function relative(abs: string): string {
  return toPosix(path.relative(REPO_ROOT, abs));
}

function describePattern(definition: StepDefinition): string {
  const where = definition.file ? ` (${relative(definition.file)})` : '';
  return `${definition.keyword}(${String(definition.pattern)})${where}`;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Line number and title of every `Rule:` keyword, skipping doc strings. */
function ruleLines(source: string): Array<{ line: number; title: string }> {
  const rules: Array<{ line: number; title: string }> = [];
  let fence: string | null = null;
  source.split(/\r?\n/).forEach((text, i) => {
    const trimmed = text.trim();
    if (fence) {
      if (trimmed.startsWith(fence)) fence = null;
      return;
    }
    if (trimmed.startsWith('"""') || trimmed.startsWith('```')) {
      fence = trimmed.slice(0, 3);
      return;
    }
    const match = /^Rule:\s*(.*)$/.exec(trimmed);
    if (match) rules.push({ line: i + 1, title: match[1].trim() });
  });
  return rules;
}

/**
 * Resolve every step of a feature against the library, without running
 * anything.
 */
export function planFeature(
  file: string,
  source: string,
  library: StepLibrary,
): FeaturePlan {
  const parsed = parseFeature(source);
  const rules = ruleLines(source);
  const problems: string[] = [];

  const scenarios = [
    ...parsed.scenarios.map((s) => ({ ...s, examples: [s] })),
    ...parsed.scenarioOutlines.map((o) => ({ ...o, examples: o.scenarios })),
  ].sort((a, b) => a.lineNumber - b.lineNumber);

  const byRule = new Map<string | null, PlannedRule>();
  const plan: FeaturePlan = { file, title: parsed.title, rules: [], problems };

  for (const scenario of scenarios) {
    const owner = [...rules]
      .reverse()
      .find((r) => r.line < scenario.lineNumber);
    const ruleTitle = owner ? owner.title : null;
    let rule = byRule.get(ruleTitle);
    if (!rule) {
      rule = { title: ruleTitle, scenarios: [] };
      byRule.set(ruleTitle, rule);
      plan.rules.push(rule);
    }

    for (const example of scenario.examples) {
      const steps = example.steps.map((step): PlannedStep => {
        const matches = library.steps
          .map((definition) => ({
            definition,
            args: definition.match(step.stepText),
          }))
          .filter(
            (m): m is { definition: StepDefinition; args: unknown[] } =>
              m.args !== null,
          );
        const where = `${file}:${step.lineNumber} ${capitalise(step.keyword)}`;
        if (matches.length === 0) {
          problems.push(
            `${where} "${step.stepText}" matches no step definition`,
          );
        } else if (matches.length > 1) {
          problems.push(
            `${where} "${step.stepText}" matches ${matches.length} step definitions: ` +
              matches.map((m) => describePattern(m.definition)).join(', '),
          );
        }
        const only = matches.length === 1 ? matches[0] : undefined;
        return {
          keyword: capitalise(step.keyword),
          text: step.stepText,
          line: step.lineNumber,
          argument: step.stepArgument as StepArgument,
          definition: only?.definition,
          candidates: matches.map((m) => m.definition),
          args: only?.args ?? [],
        };
      });
      rule.scenarios.push({
        title: example.title,
        line: example.lineNumber,
        steps,
      });
    }
  }

  return plan;
}

/** Definitions no planned step resolves to. */
export function unusedSteps(
  plans: readonly FeaturePlan[],
  library: StepLibrary,
): StepDefinition[] {
  const used = new Set<number>();
  for (const plan of plans) {
    for (const rule of plan.rules) {
      for (const scenario of rule.scenarios) {
        for (const step of scenario.steps) {
          // An ambiguous step is reported as ambiguous, not its definitions as unused.
          for (const candidate of step.candidates) used.add(candidate.index);
        }
      }
    }
  }
  return library.steps.filter((definition) => !used.has(definition.index));
}

export function formatDefinition(definition: StepDefinition): string {
  return describePattern(definition);
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function filesUnder(root: string, suffix: string): string[] {
  if (!existsSync(root)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(root).sort()) {
    const abs = path.join(root, entry);
    if (statSync(abs).isDirectory()) {
      found.push(...filesUnder(abs, suffix));
    } else if (entry.endsWith(suffix)) {
      found.push(abs);
    }
  }
  return found;
}

/** Every step file, in a stable order. */
export function stepFiles(): string[] {
  return filesUnder(STEPS_ROOT, '.ts');
}

/** Every spec entry that binds a feature. */
export function specFiles(): string[] {
  return filesUnder(SPECS_ROOT, '.spec.ts').filter((file) =>
    /^\d{4}-/.test(path.basename(file)),
  );
}

/** The feature file a spec entry binds. */
export function featureForSpec(specFile: string): string {
  const rel = path.relative(SPECS_ROOT, specFile);
  return path.join(FEATURES_ROOT, rel.replace(/\.spec\.[jt]s$/, '.feature'));
}

/**
 * Load the hooks and every step file into the registry. Module caching makes
 * repeated calls in one test file free.
 */
export function loadStepLibrary(): StepLibrary {
  require('./hooks');
  for (const file of stepFiles()) {
    registerFrom(file, () => require(file));
  }
  return stepLibrary();
}

export function planSpec(specFile: string, library: StepLibrary): FeaturePlan {
  const featureFile = featureForSpec(specFile);
  if (!existsSync(featureFile)) {
    return {
      file: relative(featureFile),
      title: '',
      rules: [],
      problems: [
        `${relative(specFile)} binds ${relative(featureFile)}, which does not exist`,
      ],
    };
  }
  return planFeature(
    relative(featureFile),
    readFileSync(featureFile, 'utf-8'),
    library,
  );
}

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------

function tableFrom(rows: Array<Record<string, string>>): DataTable {
  const header = rows.length > 0 ? Object.keys(rows[0]) : [];
  return new DataTable([
    header,
    ...rows.map((row) => header.map((key) => row[key])),
  ]);
}

function annotate(error: unknown, context: string): unknown {
  if (error instanceof Error) {
    error.message = `${context}\n\n${error.message}`;
    return error;
  }
  return new Error(`${context}\n\n${String(error)}`);
}

/**
 * Run one scenario: Before hooks, steps, then After hooks in reverse. After
 * hooks run even when a step fails; the first failure is the one reported.
 */
export async function runScenario(
  scenario: PlannedScenario,
  library: StepLibrary,
): Promise<void> {
  const world = new World();
  let failure: unknown;

  try {
    for (const hook of library.before) {
      await hook.fn.call(world);
    }
    for (const step of scenario.steps) {
      if (!step.definition) {
        throw new Error(
          `Step "${step.text}" has no single matching definition`,
        );
      }
      const args = [...step.args];
      if (Array.isArray(step.argument)) args.push(tableFrom(step.argument));
      else if (typeof step.argument === 'string') args.push(step.argument);
      try {
        await step.definition.fn.apply(world, args);
      } catch (error) {
        throw annotate(
          error,
          `Failing step (line ${step.line}): ${step.keyword} ${step.text}`,
        );
      }
    }
  } catch (error) {
    failure = error;
  }

  for (const hook of [...library.after].reverse()) {
    try {
      await hook.fn.call(world);
    } catch (error) {
      failure ??= annotate(error, 'Failing After hook');
    }
  }

  if (failure !== undefined) throw failure;
}

/** Define the Jest suite for the feature a spec entry binds. */
export function bindFeature(specFile: string): void {
  const library = loadStepLibrary();
  const plan = planSpec(specFile, library);
  if (plan.problems.length > 0) {
    throw new Error(
      `${plan.file} cannot run until every step matches exactly one definition:\n  ` +
        plan.problems.join('\n  '),
    );
  }

  describe(`Feature: ${plan.title}`, () => {
    for (const rule of plan.rules) {
      const defineScenarios = () => {
        for (const scenario of rule.scenarios) {
          test(scenario.title, () => runScenario(scenario, library));
        }
      };
      if (rule.title === null) defineScenarios();
      else describe(`Rule: ${rule.title}`, defineScenarios);
    }
  });
}
