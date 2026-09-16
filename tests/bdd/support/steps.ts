/**
 * The step-definition API.
 *
 * Step files register one global step each, in the shape `@cucumber/cucumber`
 * uses, so the files do not depend on the runner that executes them:
 *
 *   import { Given } from '../../support/steps';
 *
 *   Given('a valid region ID', function () {
 *     queueRegionOrderBook(this);
 *   });
 *
 * `this` is a fresh `World` per scenario. String patterns are Cucumber
 * Expressions restricted to the four parameter types below; anything this
 * module accepts means the same thing to cucumber-js, which is what keeps a
 * later runner move to a change of import. The Jest binding lives in
 * `binder.ts`; tests/bdd/README.md records why the runner is Jest.
 *
 * This module imports nothing Jest-specific, so it can be loaded outside a
 * test run.
 */
import type { World } from './world';

export type StepKeyword = 'Given' | 'When' | 'Then';

export type StepPattern = string | RegExp;

/**
 * A step body. Parameters arrive in pattern order, followed by the step's
 * DataTable or doc string when it has one.
 */
export type StepFunction = (this: World, ...args: any[]) => unknown;

export type HookFunction = (this: World) => unknown;

export interface StepDefinition {
  keyword: StepKeyword;
  pattern: StepPattern;
  /** Registration order; stable across loads of the same library. */
  index: number;
  /** The module that registered the step, when the loader recorded it. */
  file?: string;
  fn: StepFunction;
  /** Returns the step's arguments when `text` matches, otherwise null. */
  match(text: string): unknown[] | null;
}

export interface HookDefinition {
  fn: HookFunction;
}

interface Registry {
  steps: StepDefinition[];
  before: HookDefinition[];
  after: HookDefinition[];
  /** Set by the loader while it requires a step file. */
  currentFile?: string;
}

const registry: Registry = { steps: [], before: [], after: [] };

// ---------------------------------------------------------------------------
// Cucumber Expressions
// ---------------------------------------------------------------------------

interface ParameterType {
  regexp: string;
  /** Capture groups in `regexp`. */
  groups: number;
  transform(...groups: Array<string | undefined>): unknown;
}

/**
 * The parameter types a string pattern may use. Each mirrors the cucumber-js
 * built-in of the same name.
 */
export const PARAMETER_TYPES: Readonly<Record<string, ParameterType>> = {
  int: { regexp: '(-?\\d+)', groups: 1, transform: (s) => Number(s) },
  float: {
    regexp: '(-?\\d*\\.?\\d+)',
    groups: 1,
    transform: (s) => Number(s),
  },
  word: { regexp: '([^\\s]+)', groups: 1, transform: (s) => s },
  string: {
    regexp: '"([^"]*)"|\'([^\']*)\'',
    groups: 2,
    transform: (double, single) => double ?? single,
  },
};

/**
 * Characters with Cucumber Expression meaning this module does not implement:
 * `(` `)` mark optional text and `/` separates alternatives. Rejecting them
 * rather than matching them literally keeps a pattern's meaning identical
 * under both runners.
 */
const UNSUPPORTED = /[()/]/;

export interface CompiledExpression {
  regexp: RegExp;
  parameters: ParameterType[];
}

export function compileExpression(expression: string): CompiledExpression {
  if (UNSUPPORTED.test(expression)) {
    throw new Error(
      `Step pattern "${expression}" uses optional text or alternation, which ` +
        'only cucumber-js implements. Use a RegExp, or reword the step.',
    );
  }
  const parameters: ParameterType[] = [];
  let source = '^';
  let rest = expression;
  while (rest.length > 0) {
    const open = rest.indexOf('{');
    const literal = open === -1 ? rest : rest.slice(0, open);
    source += literal.replace(/[.*+?^$[\]\\|}]/g, '\\$&');
    if (open === -1) break;
    const close = rest.indexOf('}', open);
    if (close === -1) {
      throw new Error(`Step pattern "${expression}" has an unclosed "{".`);
    }
    const name = rest.slice(open + 1, close);
    const type = PARAMETER_TYPES[name];
    if (!type) {
      throw new Error(
        `Step pattern "${expression}" uses {${name}}; supported parameter ` +
          `types are ${Object.keys(PARAMETER_TYPES)
            .map((n) => `{${n}}`)
            .join(', ')}.`,
      );
    }
    parameters.push(type);
    source += `(?:${type.regexp})`;
    rest = rest.slice(close + 1);
  }
  return { regexp: new RegExp(`${source}$`), parameters };
}

function matcherFor(pattern: StepPattern): (text: string) => unknown[] | null {
  if (pattern instanceof RegExp) {
    return (text) => {
      const m = pattern.exec(text);
      return m ? m.slice(1) : null;
    };
  }
  const { regexp, parameters } = compileExpression(pattern);
  return (text) => {
    const m = regexp.exec(text);
    if (!m) return null;
    const args: unknown[] = [];
    let group = 1;
    for (const parameter of parameters) {
      args.push(
        parameter.transform(...m.slice(group, group + parameter.groups)),
      );
      group += parameter.groups;
    }
    return args;
  };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

function defineStep(
  keyword: StepKeyword,
  pattern: StepPattern,
  fn: StepFunction,
): void {
  registry.steps.push({
    keyword,
    pattern,
    index: registry.steps.length,
    file: registry.currentFile,
    fn,
    match: matcherFor(pattern),
  });
}

export function Given(pattern: StepPattern, fn: StepFunction): void {
  defineStep('Given', pattern, fn);
}

export function When(pattern: StepPattern, fn: StepFunction): void {
  defineStep('When', pattern, fn);
}

export function Then(pattern: StepPattern, fn: StepFunction): void {
  defineStep('Then', pattern, fn);
}

/** Runs before every scenario, in registration order. */
export function Before(fn: HookFunction): void {
  registry.before.push({ fn });
}

/** Runs after every scenario, pass or fail, in reverse registration order. */
export function After(fn: HookFunction): void {
  registry.after.push({ fn });
}

// ---------------------------------------------------------------------------
// Runner-facing access
// ---------------------------------------------------------------------------

export interface StepLibrary {
  steps: readonly StepDefinition[];
  before: readonly HookDefinition[];
  after: readonly HookDefinition[];
}

/** The steps and hooks registered so far. */
export function stepLibrary(): StepLibrary {
  return registry;
}

/** Attribute steps registered while `load` runs to `file`. */
export function registerFrom(file: string, load: () => void): void {
  const previous = registry.currentFile;
  registry.currentFile = file;
  try {
    load();
  } finally {
    registry.currentFile = previous;
  }
}

/** Empty the registry. For the binder's own tests. */
export function clearStepLibrary(): void {
  registry.steps.length = 0;
  registry.before.length = 0;
  registry.after.length = 0;
}

/**
 * A Gherkin data table, with the accessors of the cucumber-js class of the
 * same name that the specification uses.
 */
export class DataTable {
  constructor(private readonly cells: readonly string[][]) {}

  /** Every row, header included. */
  raw(): string[][] {
    return this.cells.map((row) => [...row]);
  }

  /** Every row after the header. */
  rows(): string[][] {
    return this.raw().slice(1);
  }

  /** One object per row after the header, keyed by the header cells. */
  hashes(): Array<Record<string, string>> {
    const [header = [], ...body] = this.cells;
    return body.map((row) =>
      Object.fromEntries(header.map((key, i) => [key, row[i] ?? ''])),
    );
  }
}
