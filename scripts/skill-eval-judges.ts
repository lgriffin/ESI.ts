/**
 * Deterministic judges and gate logic for skill evals (R14).
 *
 * A skill change is gated by running its eval cases and judging what the skill
 * produced. The judges here need no network and no model: they read the
 * feature and step files a case produced and check the conventions an LLM
 * cannot be trusted to self-report — one `shall` per Rule, every Scenario
 * under a Rule, no `spyOn(client…)`, responses queued at the transport seam,
 * and step bindings that name real scenarios.
 *
 * Everything in this file is pure (strings and plain objects in, findings
 * out) so it can be unit-tested under Jest. The CLI in `skill-eval.ts` owns
 * file I/O, the spec-audit child process and the `claude plugin eval` call.
 */

import { countShall } from './spec-audit-checks';

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

export interface JudgeFinding {
  judge: string;
  file: string;
  line: number | null;
  message: string;
}

// ---------------------------------------------------------------------------
// Feature-file judges
// ---------------------------------------------------------------------------

interface GherkinLine {
  keyword: 'Feature' | 'Rule' | 'Scenario' | 'Background';
  title: string;
  line: number;
}

const SCENARIO_KEYWORDS =
  /^\s*(Scenario Outline|Scenario Template|Scenario|Example):\s*(.*)$/;

/**
 * A line-level outline of a feature file: the keyword lines that decide
 * structure, skipping comments and doc strings. The spec audit parses the
 * real Gherkin AST; this is deliberately smaller so it can run under Jest,
 * where the ESM-only `@cucumber/gherkin` cannot be loaded.
 */
export function outlineFeature(text: string): GherkinLine[] {
  const outline: GherkinLine[] = [];
  let inDocString: string | null = null;

  text.split(/\r?\n/).forEach((raw, index) => {
    const trimmed = raw.trim();
    const line = index + 1;

    if (inDocString !== null) {
      if (trimmed.startsWith(inDocString)) inDocString = null;
      return;
    }
    if (trimmed.startsWith('"""') || trimmed.startsWith('```')) {
      inDocString = trimmed.slice(0, 3);
      return;
    }
    if (trimmed.startsWith('#')) return;

    const scenario = SCENARIO_KEYWORDS.exec(raw);
    if (scenario) {
      outline.push({
        keyword: 'Scenario',
        title: (scenario[2] ?? '').trim(),
        line,
      });
      return;
    }
    const other = /^\s*(Feature|Rule|Background):\s*(.*)$/.exec(raw);
    if (other) {
      outline.push({
        keyword: other[1] as GherkinLine['keyword'],
        title: (other[2] ?? '').trim(),
        line,
      });
    }
  });

  return outline;
}

/** Every Rule title states exactly one requirement, and there is at least one. */
export function judgeRuleShall(file: string, text: string): JudgeFinding[] {
  const judge = 'rule-one-shall';
  const rules = outlineFeature(text).filter((l) => l.keyword === 'Rule');
  if (rules.length === 0) {
    return [{ judge, file, line: null, message: 'No `Rule:` block found.' }];
  }
  return rules
    .map((rule) => ({ rule, shalls: countShall(rule.title) }))
    .filter(({ shalls }) => shalls !== 1)
    .map(({ rule, shalls }) => ({
      judge,
      file,
      line: rule.line,
      message: `Rule title has ${shalls} 'shall' (exactly 1 required): ${rule.title}`,
    }));
}

/** No Scenario sits at feature level, and no Rule is left without one. */
export function judgeScenariosNested(
  file: string,
  text: string,
): JudgeFinding[] {
  const judge = 'scenarios-under-rules';
  const findings: JudgeFinding[] = [];
  let currentRule: GherkinLine | null = null;
  let scenariosInRule = 0;

  const closeRule = (): void => {
    if (currentRule && scenariosInRule === 0) {
      findings.push({
        judge,
        file,
        line: currentRule.line,
        message: `Rule has no scenarios: ${currentRule.title}`,
      });
    }
  };

  for (const entry of outlineFeature(text)) {
    if (entry.keyword === 'Rule') {
      closeRule();
      currentRule = entry;
      scenariosInRule = 0;
    } else if (entry.keyword === 'Scenario') {
      if (currentRule === null) {
        findings.push({
          judge,
          file,
          line: entry.line,
          message: `Scenario outside any Rule: ${entry.title}`,
        });
      } else {
        scenariosInRule += 1;
      }
    }
  }
  closeRule();
  return findings;
}

export function scenarioNames(text: string): string[] {
  return outlineFeature(text)
    .filter((l) => l.keyword === 'Scenario')
    .map((l) => l.title);
}

// ---------------------------------------------------------------------------
// Step-file judges
// ---------------------------------------------------------------------------

const CLIENT_SPY = /\bspyOn\s*\(\s*(?:this\.)?client\b/g;

/** R3: the method under test is never mocked. */
export function judgeNoClientSpy(file: string, text: string): JudgeFinding[] {
  const findings: JudgeFinding[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    if (CLIENT_SPY.test(raw)) {
      findings.push({
        judge: 'no-client-spy',
        file,
        line: index + 1,
        message: `spyOn(client…) mocks the method under test: ${raw.trim()}`,
      });
    }
    CLIENT_SPY.lastIndex = 0;
  });
  return findings;
}

const TRANSPORT_SEAM =
  /\bqueueResponse\s*\(|\bfetchMock\.mockResponse(?:Once)?\s*\(/;

/** R3: responses reach the client through the transport seam. */
export function judgeTransportSeam(file: string, text: string): JudgeFinding[] {
  if (TRANSPORT_SEAM.test(text)) return [];
  return [
    {
      judge: 'transport-seam',
      file,
      line: null,
      message:
        'No response is queued at the transport seam (queueResponse or ' +
        'fetchMock.mockResponse*), so no HTTP path is exercised.',
    },
  ];
}

/**
 * Collect `test('…', …)` titles. Handles single, double and template quotes
 * with no interpolation, which is the only form jest-cucumber binds.
 */
export function stepTestNames(text: string): string[] {
  const names: string[] = [];
  const pattern = /\btest\s*\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    names.push((match[2] ?? '').replace(/\\(['"`\\])/g, '$1'));
  }
  return names;
}

/** R7: every step `test()` title binds to a Scenario of the produced feature. */
export function judgeStepBindings(
  stepsFile: string,
  stepsText: string,
  featureTexts: string[],
): JudgeFinding[] {
  const known = new Set(featureTexts.flatMap(scenarioNames));
  const tests = stepTestNames(stepsText);
  const findings: JudgeFinding[] = [];
  if (tests.length === 0) {
    findings.push({
      judge: 'step-bindings',
      file: stepsFile,
      line: null,
      message: 'No test(…) bindings found in the step file.',
    });
  }
  for (const name of tests) {
    if (!known.has(name)) {
      findings.push({
        judge: 'step-bindings',
        file: stepsFile,
        line: null,
        message: `test('${name}') matches no Scenario in the produced feature files.`,
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Case-level judging
// ---------------------------------------------------------------------------

export interface ProducedFile {
  /** Path as declared in the manifest, relative to the case output root. */
  path: string;
  /** File content, or null when the case did not produce it. */
  text: string | null;
}

export interface CaseOutputs {
  features: ProducedFile[];
  steps: ProducedFile[];
}

/** Every deterministic judge that needs no child process. */
export function judgeCaseOutputs(outputs: CaseOutputs): JudgeFinding[] {
  const findings: JudgeFinding[] = [];
  const missing = (f: ProducedFile): JudgeFinding => ({
    judge: 'outputs-present',
    file: f.path,
    line: null,
    message: 'Expected output file was not produced.',
  });

  const featureTexts: string[] = [];
  for (const f of outputs.features) {
    if (f.text === null) {
      findings.push(missing(f));
      continue;
    }
    featureTexts.push(f.text);
    findings.push(...judgeRuleShall(f.path, f.text));
    findings.push(...judgeScenariosNested(f.path, f.text));
  }
  for (const s of outputs.steps) {
    if (s.text === null) {
      findings.push(missing(s));
      continue;
    }
    findings.push(...judgeNoClientSpy(s.path, s.text));
    findings.push(...judgeTransportSeam(s.path, s.text));
    findings.push(...judgeStepBindings(s.path, s.text, featureTexts));
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Native regex graders, replayed offline
// ---------------------------------------------------------------------------

export interface NativeRegexGrader {
  name: string;
  type: 'regex';
  pattern: string;
  flags?: string;
  match?: string;
  target?: string | { source: string; path: string };
}

/**
 * Evaluate a native `regex` grader the way `claude plugin eval` does
 * (contains | not_contains | count:N). Replaying the file-targeted graders
 * against the recorded outputs keeps them honest: a grader that rejects the
 * known-good output would fail every live run and waste the budget.
 */
export function evaluateRegexGrader(
  grader: NativeRegexGrader,
  text: string,
): { passed: boolean; detail: string } {
  const matches = text.match(
    new RegExp(grader.pattern, `${(grader.flags ?? '').replace('g', '')}g`),
  );
  const count = matches?.length ?? 0;
  const mode = grader.match ?? 'contains';
  if (mode === 'contains') {
    return { passed: count > 0, detail: `${count} match(es), expected ≥1` };
  }
  if (mode === 'not_contains') {
    return { passed: count === 0, detail: `${count} match(es), expected 0` };
  }
  const expected = /^count:(\d+)$/.exec(mode);
  if (!expected) {
    return { passed: false, detail: `unknown match mode '${mode}'` };
  }
  return {
    passed: count === Number(expected[1]),
    detail: `${count} match(es), expected ${expected[1]}`,
  };
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export interface EvalManifestCase {
  name: string;
  dir: string;
  outputs: { features: string[]; steps: string[] };
}

export interface EvalManifest {
  schema_version: number;
  skill: { name: string; version: string };
  native: {
    eval_dir: string;
    model: string;
    judge_model: string;
    runs: number;
    ablation: 'none' | 'with-without';
    allow_tools: string[];
  };
  thresholds: {
    case_score_min: number;
    deterministic_pass_rate: number;
    llm: { min_mean: number };
  };
  budget: {
    max_cost_usd: number;
    max_turns_per_run: number;
    max_timeout_seconds: number;
  };
  cases: EvalManifestCase[];
}

const isRatio = (n: unknown): n is number =>
  typeof n === 'number' && n >= 0 && n <= 1;
const isPositive = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0;

/** Structural validation; returns human-readable problems (empty = valid). */
export function validateManifest(raw: unknown): string[] {
  const problems: string[] = [];
  const m = raw as Partial<EvalManifest> | null;
  if (!m || typeof m !== 'object') return ['manifest is not an object'];

  if (m.schema_version !== 1) problems.push('schema_version must be 1');
  if (!m.skill?.name) problems.push('skill.name is required');
  if (!/^\d+\.\d+\.\d+$/.test(m.skill?.version ?? '')) {
    problems.push('skill.version must be semver (x.y.z)');
  }
  if (!m.native?.eval_dir) problems.push('native.eval_dir is required');
  if (!m.native?.model) problems.push('native.model is required');
  if (!m.native?.judge_model) problems.push('native.judge_model is required');
  if (!Number.isInteger(m.native?.runs) || (m.native?.runs ?? 0) < 1) {
    problems.push('native.runs must be a positive integer');
  }
  if (!['none', 'with-without'].includes(m.native?.ablation ?? '')) {
    problems.push('native.ablation must be none or with-without');
  }
  if (!isRatio(m.thresholds?.case_score_min)) {
    problems.push('thresholds.case_score_min must be in [0, 1]');
  }
  if (!isRatio(m.thresholds?.deterministic_pass_rate)) {
    problems.push('thresholds.deterministic_pass_rate must be in [0, 1]');
  }
  if (!isRatio(m.thresholds?.llm?.min_mean)) {
    problems.push('thresholds.llm.min_mean must be in [0, 1]');
  }
  if (!isPositive(m.budget?.max_cost_usd)) {
    problems.push('budget.max_cost_usd must be a positive number');
  }
  if (!isPositive(m.budget?.max_turns_per_run)) {
    problems.push('budget.max_turns_per_run must be a positive number');
  }
  if (!isPositive(m.budget?.max_timeout_seconds)) {
    problems.push('budget.max_timeout_seconds must be a positive number');
  }
  if (!Array.isArray(m.cases) || m.cases.length === 0) {
    problems.push('cases must list at least one case');
  } else {
    m.cases.forEach((c, i) => {
      if (!c?.name) problems.push(`cases[${i}].name is required`);
      if (!c?.dir) problems.push(`cases[${i}].dir is required`);
      if (!c?.outputs?.features?.length) {
        problems.push(`cases[${i}].outputs.features must list a file`);
      }
      if (!Array.isArray(c?.outputs?.steps)) {
        problems.push(`cases[${i}].outputs.steps must be a list`);
      }
    });
  }
  return problems;
}

/** The subset of a native `case.yaml` the gate reads. */
export interface NativeCase {
  name: string;
  execution?: { max_turns?: number; timeout_seconds?: number };
  graders?: Array<
    { name: string; type: string } & Partial<Omit<NativeRegexGrader, 'type'>>
  >;
}

/**
 * A case must keep inside the run budget and carry both grader tiers, or the
 * gate would pass it on deterministic checks alone (or on vibes alone).
 */
export function validateNativeCase(
  entry: EvalManifestCase,
  native: NativeCase,
  budget: EvalManifest['budget'],
): string[] {
  const problems: string[] = [];
  const where = `case ${entry.name}`;
  if (native.name !== entry.name) {
    problems.push(
      `${where}: case.yaml name '${native.name}' does not match the manifest`,
    );
  }
  const turns = native.execution?.max_turns ?? 10;
  if (turns > budget.max_turns_per_run) {
    problems.push(
      `${where}: max_turns ${turns} exceeds budget.max_turns_per_run ${budget.max_turns_per_run}`,
    );
  }
  const timeout = native.execution?.timeout_seconds ?? 300;
  if (timeout > budget.max_timeout_seconds) {
    problems.push(
      `${where}: timeout_seconds ${timeout} exceeds budget.max_timeout_seconds ${budget.max_timeout_seconds}`,
    );
  }
  const types = new Set((native.graders ?? []).map((g) => g.type));
  if (!types.has('llm')) problems.push(`${where}: no llm grader`);
  if (!['regex', 'tool_used', 'file_exists'].some((t) => types.has(t))) {
    problems.push(`${where}: no deterministic grader`);
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Native result gate
// ---------------------------------------------------------------------------

/** The subset of `claude plugin eval --json` output the gate reads. */
export interface NativeEvalResult {
  costUsd: number;
  partial: boolean;
  partialReason?: string;
  cases: Array<{
    name: string;
    graders: Array<{ name: string; type: string }>;
    arms: {
      with: Array<{
        error: unknown;
        tracePath?: string;
        graders: Array<{ name: string; passed: boolean; scored?: boolean }>;
      }>;
    };
    aggregates: { score: number };
  }>;
}

export interface GateInput {
  result: NativeEvalResult;
  manifest: EvalManifest;
  /** Runner-side deterministic judge outcomes: one boolean per judged run. */
  workspaceRuns: boolean[];
}

export interface GateReport {
  passed: boolean;
  failures: string[];
  metrics: {
    costUsd: number;
    llmMean: number | null;
    deterministicPassRate: number | null;
    caseScores: Record<string, number>;
  };
}

const mean = (xs: number[]): number | null =>
  xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;

const LLM_TYPES = new Set(['llm', 'baseline']);

/**
 * Apply the manifest thresholds and budget to a native eval result.
 *
 * - budget: a partial run (the native `--max-cost-usd` ceiling tripped, or
 *   auth failed) fails, and so does total cost above the manifest budget.
 * - case score: every case's weighted grader mean must reach case_score_min.
 * - llm min_mean: the mean pass rate of every scored llm/baseline grader
 *   verdict across all cases and runs must reach llm.min_mean.
 * - deterministic: native regex/tool/file grader verdicts plus the runner's
 *   own judges on each run's workspace must pass at deterministic_pass_rate.
 */
export function gateNativeResult(input: GateInput): GateReport {
  const { result, manifest, workspaceRuns } = input;
  const failures: string[] = [];
  const caseScores: Record<string, number> = {};
  const llmVerdicts: number[] = [];
  const deterministicVerdicts: number[] = workspaceRuns.map((ok) =>
    ok ? 1 : 0,
  );

  if (result.partial) {
    failures.push(
      `native run was partial (${result.partialReason ?? 'unknown reason'}); ` +
        'a run stopped by the cost ceiling or an auth failure cannot pass',
    );
  }
  if (result.costUsd > manifest.budget.max_cost_usd) {
    failures.push(
      `cost $${result.costUsd.toFixed(2)} exceeds budget $${manifest.budget.max_cost_usd.toFixed(2)}`,
    );
  }

  const expected = new Set(manifest.cases.map((c) => c.name));
  for (const name of expected) {
    if (!result.cases.some((c) => c.name === name)) {
      failures.push(`case ${name} produced no result`);
    }
  }

  for (const c of result.cases) {
    caseScores[c.name] = c.aggregates.score;
    if (c.aggregates.score < manifest.thresholds.case_score_min) {
      failures.push(
        `case ${c.name} scored ${c.aggregates.score.toFixed(2)} < ${manifest.thresholds.case_score_min}`,
      );
    }
    const typeOf = new Map(c.graders.map((g) => [g.name, g.type]));
    for (const run of c.arms.with) {
      if (run.error) {
        failures.push(`case ${c.name}: a run errored: ${String(run.error)}`);
      }
      for (const verdict of run.graders) {
        if (verdict.scored === false) continue;
        const bucket = LLM_TYPES.has(typeOf.get(verdict.name) ?? '')
          ? llmVerdicts
          : deterministicVerdicts;
        bucket.push(verdict.passed ? 1 : 0);
      }
    }
  }

  const llmMean = mean(llmVerdicts);
  if (llmMean === null) {
    failures.push('no llm grader verdicts were recorded');
  } else if (llmMean < manifest.thresholds.llm.min_mean) {
    failures.push(
      `llm grader mean ${llmMean.toFixed(2)} < min_mean ${manifest.thresholds.llm.min_mean}`,
    );
  }

  const deterministicPassRate = mean(deterministicVerdicts);
  if (deterministicPassRate === null) {
    failures.push('no deterministic verdicts were recorded');
  } else if (
    deterministicPassRate < manifest.thresholds.deterministic_pass_rate
  ) {
    failures.push(
      `deterministic pass rate ${deterministicPassRate.toFixed(2)} < ${manifest.thresholds.deterministic_pass_rate}`,
    );
  }

  return {
    passed: failures.length === 0,
    failures,
    metrics: {
      costUsd: result.costUsd,
      llmMean,
      deterministicPassRate,
      caseScores,
    },
  };
}

// ---------------------------------------------------------------------------
// Versioning
// ---------------------------------------------------------------------------

/**
 * R14 "versioned": a change to the skill's instructions must bump the
 * manifest's skill.version, so an eval result is always attributable to a
 * named version. A missing base version (a new suite) needs no bump.
 */
export function checkVersionBump(args: {
  skillChanged: boolean;
  baseVersion: string | null;
  headVersion: string;
}): string[] {
  if (!args.skillChanged || args.baseVersion === null) return [];
  if (args.baseVersion === args.headVersion) {
    return [
      `SKILL.md changed but skill.version is still ${args.headVersion}; ` +
        'bump it in the eval manifest.',
    ];
  }
  return [];
}
