/**
 * Method-level specification coverage for the domain clients (TEST-10).
 *
 * `spec:coverage:sde` asks of every `IStaticDataProvider` method whether a
 * Rule specifies it; this check asks the same of every public method of the
 * domain clients in `src/clients/`: the classes that extend `BaseEsiClient`,
 * each with the public instance methods it declares itself. Private and
 * protected members, static methods, the constructor and the methods a client
 * inherits from `BaseEsiClient` are not its own contract; a method it
 * overrides is.
 *
 * A method counts as covered when a Rule's text names it or a bound step
 * calls it. A Rule names `MarketClient.getMarketHistory` either in that
 * qualified form or, when only one client declares the name, bare. A call
 * counts when the type checker resolves it to the method's declaration, so
 * `this.client.market.getMarketHistory(...)` in a step file credits
 * `MarketClient`, a same-named method on another client credits that client,
 * and a call on `any` credits none. The call may sit in the step function or
 * in any `tests/bdd` function it calls, however deep. A function nested in
 * a step counts only when it runs: called, passed to a call, an entry of a
 * dispatch table, or stored for a later step; one only declared does not.
 * A client is a class the checker resolves as extending `BaseEsiClient`, so
 * an aliased or namespaced import of the base counts.
 *
 * Steps are bound the way each runner binds them. A feature a legacy file in
 * `tests/bdd/step-definitions/` loads (`loadFeature` and `defineFeature`) is
 * bound by scenario title, case-insensitively as jest-cucumber matches it, and
 * everything that scenario's `test(...)` callback calls is its bound steps.
 * Every other feature binds each step to the one pattern in `tests/bdd/steps/`
 * that matches it. A step or scenario that binds to nothing makes the check
 * fail as broken, since it cannot vouch for any method.
 *
 * The uncovered list is grouped by client, clients by class name, methods in
 * declaration order, and `scripts/spec/client-spec-coverage-baseline.json`
 * holds it as a shrink-only ratchet: the report fails on an uncovered method
 * the baseline does not list under its client and on an entry that is now
 * covered or no longer a method; `--ci` also fails on an entry absent from the
 * base branch's copy. The machinery is shared with `spec:coverage:sde` in
 * `method-coverage-core.ts`.
 */
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { parseFeature } from 'jest-cucumber';

import { outlineFeature } from '../../tests/bdd/support/outline';
import {
  type BaseBaseline,
  type GroupedBaseline,
  type RatchetResult,
  type RatchetWords,
  StepProject,
  type StepPattern,
  applyGroupedBaseline,
  groupedRatchetProblems,
  loadGroupedBaseBaseline,
  parseGroupedBaseline,
  serializeGroupedBaseline,
  stepFor,
  toPosix,
  walk,
} from './method-coverage-core';

export const CLIENTS_DIR = 'src/clients';
export const BASE_CLIENT = 'BaseEsiClient';
export const FEATURES_DIR = 'tests/bdd/features';
export const STEPS_DIR = 'tests/bdd/steps';
export const LEGACY_DIR = 'tests/bdd/step-definitions';
export const BASELINE_FILE = 'scripts/spec/client-spec-coverage-baseline.json';

// ---------------------------------------------------------------------------
// The clients' methods
// ---------------------------------------------------------------------------

export interface ClientMethod {
  /** The class name, which is the group the baseline files the method under. */
  client: string;
  name: string;
}

const key = (client: string, name: string): string => `${client}.${name}`;

function isOwnPublicMethod(member: ts.ClassElement): boolean {
  if (!ts.isMethodDeclaration(member) || !ts.isIdentifier(member.name)) {
    return false;
  }
  const modifiers = ts.getModifiers(member) ?? [];
  return !modifiers.some(
    (m) =>
      m.kind === ts.SyntaxKind.PrivateKeyword ||
      m.kind === ts.SyntaxKind.ProtectedKeyword ||
      m.kind === ts.SyntaxKind.StaticKeyword,
  );
}

/**
 * Whether a class extends `BaseEsiClient` itself: the checker resolves the
 * `extends` expression, through an import alias (`BaseEsiClient as Base`) or
 * a namespace (`base.BaseEsiClient`), to the class of that name declared in
 * `src/clients/`, so a same-named class elsewhere does not count.
 */
function extendsBaseClient(
  node: ts.ClassDeclaration,
  checker: ts.TypeChecker,
  clientsDir: string,
): boolean {
  return (node.heritageClauses ?? []).some(
    (clause) =>
      clause.token === ts.SyntaxKind.ExtendsKeyword &&
      clause.types.some((t) => {
        let symbol = checker.getSymbolAtLocation(t.expression);
        if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
          symbol = checker.getAliasedSymbol(symbol);
        }
        return (symbol?.declarations ?? []).some(
          (d) =>
            ts.isClassDeclaration(d) &&
            d.name?.text === BASE_CLIENT &&
            isUnder(d.getSourceFile().fileName, clientsDir),
        );
      }),
  );
}

const isUnder = (fileName: string, dir: string): boolean =>
  toPosix(path.normalize(fileName)).startsWith(dir);

/**
 * Every public method each domain client declares, clients by class name,
 * methods in declaration order (an overloaded method once). Throws when the
 * directory is missing or declares no client, since a check that read nothing
 * would pass for the wrong reason.
 */
export function readClientMethods(
  root: string,
  project?: StepProject,
): ClientMethod[] {
  const dir = path.join(root, CLIENTS_DIR);
  if (!existsSync(dir)) {
    throw new Error(`${CLIENTS_DIR} does not exist under ${root}.`);
  }
  const { program, checker } = project ?? clientProject(root);
  const clientsDir = toPosix(dir) + '/';
  const byClient = new Map<string, string[]>();
  for (const file of walk(dir, (n) => n.endsWith('.ts'))) {
    const source = program.getSourceFile(file);
    if (!source) continue;
    for (const statement of source.statements) {
      if (
        !ts.isClassDeclaration(statement) ||
        !statement.name ||
        !extendsBaseClient(statement, checker, clientsDir)
      ) {
        continue;
      }
      const names: string[] = [];
      for (const member of statement.members) {
        if (!isOwnPublicMethod(member)) continue;
        const name = (member.name as ts.Identifier).text;
        if (!names.includes(name)) names.push(name);
      }
      byClient.set(statement.name.text, names);
    }
  }
  if (byClient.size === 0) {
    throw new Error(
      `${CLIENTS_DIR} declares no class extending ${BASE_CLIENT}.`,
    );
  }
  return [...byClient.keys()]
    .sort()
    .flatMap((client) =>
      byClient.get(client)!.map((name) => ({ client, name })),
    );
}

/** Client names in report order. */
export function clientOrder(methods: readonly { client: string }[]): string[] {
  return [...new Set(methods.map((m) => m.client))];
}

// ---------------------------------------------------------------------------
// Step files, read with the type checker
// ---------------------------------------------------------------------------

/** Converted and legacy step files and the clients, in one program. */
function clientProject(root: string): StepProject {
  return new StepProject(root, [
    ...walk(path.join(root, STEPS_DIR), (n) => n.endsWith('.ts')),
    ...walk(path.join(root, LEGACY_DIR), (n) => n.endsWith('.ts')),
    ...walk(path.join(root, CLIENTS_DIR), (n) => n.endsWith('.ts')),
  ]);
}

/** Credits a call the checker resolves to a client method's own declaration. */
function creditClients(
  project: StepProject,
  methods: ReadonlySet<string>,
): void {
  const clientsDir = toPosix(path.join(project.root, CLIENTS_DIR)) + '/';
  const { checker } = project;
  project.creditWith((callee) => {
    const credited = new Set<string>();
    for (const declaration of checker.getSymbolAtLocation(callee.name)
      ?.declarations ?? []) {
      if (
        !ts.isMethodDeclaration(declaration) ||
        !ts.isClassDeclaration(declaration.parent) ||
        !declaration.parent.name ||
        !isUnder(declaration.getSourceFile().fileName, clientsDir)
      ) {
        continue;
      }
      const k = key(declaration.parent.name.text, callee.name.text);
      if (methods.has(k)) credited.add(k);
    }
    return [...credited];
  });
}

/** A `test(...)` a legacy file registers inside `defineFeature`. */
export interface LegacyScenario {
  /** Repository-relative `file:line` of the call. */
  at: string;
  /** Titles it binds; empty when the check cannot read the title. */
  titles: string[];
  /** The scenario function: inline, or the name of one. */
  callback: ts.Node | null;
}

/** The literal strings a title expression can take, or null. */
function titlesOf(
  expression: ts.Expression,
  checker: ts.TypeChecker,
): string[] | null {
  if (ts.isStringLiteralLike(expression)) return [expression.text];
  if (!ts.isIdentifier(expression)) return null;
  // for (const scenario of ['a', 'b']) test(scenario, ...)
  for (const declaration of checker.getSymbolAtLocation(expression)
    ?.declarations ?? []) {
    const list = declaration.parent;
    const loop = list?.parent;
    if (
      ts.isVariableDeclaration(declaration) &&
      loop &&
      ts.isForOfStatement(loop) &&
      ts.isArrayLiteralExpression(loop.expression) &&
      loop.expression.elements.every(ts.isStringLiteralLike)
    ) {
      return loop.expression.elements.map(
        (e) => (e as ts.StringLiteralLike).text,
      );
    }
  }
  return null;
}

/**
 * The scenarios each legacy file registers, by the repository-relative path
 * of the feature it loads.
 */
function readLegacyScenarios(
  project: StepProject,
): Map<string, LegacyScenario[]> {
  const { checker, root } = project;
  const legacyDir = toPosix(path.join(root, LEGACY_DIR)) + '/';
  const byFeature = new Map<string, LegacyScenario[]>();
  for (const source of project.program.getSourceFiles()) {
    if (!toPosix(path.normalize(source.fileName)).startsWith(legacyDir)) {
      continue;
    }
    const features = new Map<string, string>();
    const visit = (node: ts.Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer) &&
        ts.isIdentifier(node.initializer.expression) &&
        node.initializer.expression.text === 'loadFeature'
      ) {
        const [file] = node.initializer.arguments;
        if (file && ts.isStringLiteralLike(file)) {
          features.set(node.name.text, toPosix(path.normalize(file.text)));
        }
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'defineFeature'
      ) {
        const [feature, define] = node.arguments;
        const featureFile =
          feature && ts.isIdentifier(feature)
            ? features.get(feature.text)
            : undefined;
        const testParam =
          define &&
          (ts.isArrowFunction(define) || ts.isFunctionExpression(define)) &&
          define.parameters[0] &&
          ts.isIdentifier(define.parameters[0].name)
            ? define.parameters[0].name.text
            : undefined;
        if (featureFile && testParam && define) {
          const scenarios = byFeature.get(featureFile) ?? [];
          const findTests = (n: ts.Node): void => {
            if (
              ts.isCallExpression(n) &&
              ts.isIdentifier(n.expression) &&
              n.expression.text === testParam
            ) {
              const [title, callback] = n.arguments;
              const line =
                source.getLineAndCharacterOfPosition(n.getStart()).line + 1;
              scenarios.push({
                at: `${toPosix(path.relative(root, source.fileName))}:${line}`,
                titles: (title && titlesOf(title, checker)) ?? [],
                callback: callback ?? null,
              });
            }
            ts.forEachChild(n, findTests);
          };
          findTests(define);
          byFeature.set(featureFile, scenarios);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return byFeature;
}

/** The patterns the converted step files register. */
export function readStepPatterns(root: string): StepPattern[] {
  return clientProject(root).stepPatterns();
}

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------

export interface MethodCoverage extends ClientMethod {
  /** Rules whose text names the method, or with a scenario that reaches it. */
  rules: number;
  /** Scenarios whose bound steps reach the method. */
  scenarios: number;
}

export interface CoverageReport {
  methods: MethodCoverage[];
  featureCount: number;
  /** Features a legacy step-definition file binds. */
  legacyFeatureCount: number;
  ruleCount: number;
  scenarioCount: number;
  /** Steps of converted features that resolve to no single step file. */
  unresolvedSteps: string[];
  /** Scenarios of legacy features no `test(...)` of their file binds. */
  unboundScenarios: string[];
  /** Legacy `test(...)` calls whose title the check cannot read. */
  unreadableTests: string[];
}

/** Rule text patterns: the qualified name, and the bare one when unique. */
function rulePatterns(
  methods: readonly ClientMethod[],
): Array<{ key: string; pattern: RegExp }> {
  const declaredBy = new Map<string, number>();
  for (const m of methods) {
    declaredBy.set(m.name, (declaredBy.get(m.name) ?? 0) + 1);
  }
  return methods.map((m) => ({
    key: key(m.client, m.name),
    pattern:
      declaredBy.get(m.name) === 1
        ? new RegExp(`\\b(?:${m.client}\\.)?${m.name}\\b`)
        : new RegExp(`\\b${m.client}\\.${m.name}\\b`),
  }));
}

export function analyseCoverage(root: string): CoverageReport {
  const project = clientProject(root);
  const clientMethods = readClientMethods(root, project);
  const keys = new Set(clientMethods.map((m) => key(m.client, m.name)));
  creditClients(project, keys);
  const patterns = project.stepPatterns();
  const legacy = readLegacyScenarios(project);
  const byRuleText = rulePatterns(clientMethods);

  const reachedByNode = new Map<ts.Node, Set<string>>();
  const reached = (fn: ts.Node | null): Set<string> => {
    if (!fn) return new Set();
    let set = reachedByNode.get(fn);
    if (!set) {
      set = project.methodsReachedBy(fn);
      reachedByNode.set(fn, set);
    }
    return set;
  };

  const rulesByMethod = new Map<string, number>();
  const scenariosByMethod = new Map<string, number>();
  const unresolvedSteps: string[] = [];
  const unboundScenarios: string[] = [];
  const unreadableTests = [...legacy.values()]
    .flat()
    .filter((s) => s.titles.length === 0)
    .map((s) => s.at);
  let ruleCount = 0;
  let scenarioCount = 0;
  let legacyFeatureCount = 0;

  const features = walk(path.join(root, FEATURES_DIR), (n) =>
    n.endsWith('.feature'),
  );
  for (const feature of features) {
    const rel = toPosix(path.relative(root, feature));
    const source = readFileSync(feature, 'utf-8');
    const outline = outlineFeature(source);
    const tests = legacy.get(rel);
    // jest-cucumber binds an outline by its own title, not an example's.
    const titleAt = new Map<number, string>();
    if (tests) {
      legacyFeatureCount += 1;
      const parsed = parseFeature(source);
      for (const s of [...parsed.scenarios, ...parsed.scenarioOutlines]) {
        titleAt.set(s.lineNumber, s.title);
      }
    }
    for (const rule of outline.rules) {
      ruleCount += 1;
      const inRule = new Set<string>();
      for (const { key: k, pattern } of byRuleText) {
        if (rule.title && pattern.test(rule.title)) inRule.add(k);
      }
      for (const scenario of rule.scenarios) {
        scenarioCount += 1;
        const inScenario = new Set<string>();
        if (tests) {
          const title = (titleAt.get(scenario.line) ?? scenario.title)
            .trim()
            .toLowerCase();
          const bound = tests.filter((t) =>
            t.titles.some((x) => x.trim().toLowerCase() === title),
          );
          if (bound.length === 0) {
            unboundScenarios.push(`${rel}:${scenario.line} ${scenario.title}`);
          }
          for (const t of bound) {
            for (const m of reached(t.callback)) inScenario.add(m);
          }
        } else {
          for (const step of scenario.steps) {
            const bound = stepFor(step.stepText, patterns);
            if (!bound) {
              unresolvedSteps.push(
                `${rel}:${step.lineNumber} ${step.stepText}`,
              );
              continue;
            }
            for (const m of reached(bound.callback)) inScenario.add(m);
          }
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
    methods: clientMethods.map((m) => ({
      ...m,
      rules: rulesByMethod.get(key(m.client, m.name)) ?? 0,
      scenarios: scenariosByMethod.get(key(m.client, m.name)) ?? 0,
    })),
    featureCount: features.length,
    legacyFeatureCount,
    ruleCount,
    scenarioCount,
    unresolvedSteps,
    unboundScenarios: [...new Set(unboundScenarios)],
    unreadableTests,
  };
}

const isCovered = (m: MethodCoverage): boolean =>
  m.rules > 0 || m.scenarios > 0;

/** Uncovered methods grouped by client, clients in report order. */
export function uncoveredByClient(
  report: CoverageReport,
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const client of clientOrder(report.methods)) {
    const names = report.methods
      .filter((m) => m.client === client && !isCovered(m))
      .map((m) => m.name);
    if (names.length > 0) grouped[client] = names;
  }
  return grouped;
}

export function renderReport(report: CoverageReport): string {
  const clients = clientOrder(report.methods);
  const width = Math.max('client'.length, ...clients.map((c) => c.length));
  const lines: string[] = [
    '',
    `${'client'.padEnd(width)}  methods  covered  uncovered`,
  ];
  for (const client of clients) {
    const own = report.methods.filter((m) => m.client === client);
    const covered = own.filter(isCovered).length;
    lines.push(
      `${client.padEnd(width)}  ${String(own.length).padStart(7)}  ${String(covered).padStart(7)}  ${String(own.length - covered).padStart(9)}`,
    );
  }
  const covered = report.methods.filter(isCovered).length;
  lines.push(
    '',
    `${covered} of ${report.methods.length} client methods are named by a Rule or reached by a bound step ` +
      `(${report.ruleCount} rules, ${report.scenarioCount} scenarios, ${report.featureCount} features, ` +
      `${report.legacyFeatureCount} of them bound by legacy step definitions).`,
  );
  const uncovered = uncoveredByClient(report);
  const names = Object.keys(uncovered);
  if (names.length > 0) {
    lines.push('', 'Uncovered, by client:');
    for (const client of names) {
      lines.push(`  ${client}: ${uncovered[client]!.join(', ')}`);
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
  if (report.unboundScenarios.length > 0) {
    problems.push(
      `${report.unboundScenarios.length} scenarios of legacy features match no test() title in their ` +
        `step-definition file:\n  ${report.unboundScenarios.join('\n  ')}`,
    );
  }
  if (report.unreadableTests.length > 0) {
    problems.push(
      `${report.unreadableTests.length} legacy test() calls have a title the check cannot read ` +
        `(a string, or a for-of over an array of strings):\n  ${report.unreadableTests.join('\n  ')}`,
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Baseline ratchet
// ---------------------------------------------------------------------------

/** Uncovered methods that are known and tolerated, by client. */
export type CoverageBaseline = GroupedBaseline;

export const RATCHET_WORDS: RatchetWords = {
  methods: 'client methods',
  method: 'client method',
  group: 'client',
  baselineFile: BASELINE_FILE,
  baseRefEnv: 'CLIENT_SPEC_COVERAGE_BASE_REF',
  // Names repeat across clients (getContacts), so compare Client: method.
  addedBy: 'key',
};

export function parseBaseline(raw: string): CoverageBaseline {
  return parseGroupedBaseline(raw, 'client');
}

export function serializeBaseline(report: CoverageReport): string {
  return serializeGroupedBaseline(
    'Public domain-client methods no Rule names and no bound step calls, by ' +
      'client. Shrink-only: CI fails on an uncovered method missing from this ' +
      'list, on an entry that is now covered or no longer a method, and on any ' +
      'entry not on master. Regenerate with npm run spec:coverage:clients -- ' +
      '--write-baseline.',
    uncoveredByClient(report),
  );
}

/** The baseline as the integration branch has it; see export-coverage-core. */
export function loadBaseBaseline(root: string, refs: string[]): BaseBaseline {
  return loadGroupedBaseBaseline(root, refs, BASELINE_FILE, parseBaseline);
}

/**
 * The working tree against its committed baseline, client by client, and,
 * when `base` is given, the baseline against the base branch's copy.
 */
export function applyBaseline(
  report: CoverageReport,
  baseline: CoverageBaseline,
  base: BaseBaseline | null,
): RatchetResult {
  return applyGroupedBaseline(uncoveredByClient(report), baseline, base, 'key');
}

export function ratchetProblems(result: RatchetResult): string[] {
  return groupedRatchetProblems(result, RATCHET_WORDS);
}
