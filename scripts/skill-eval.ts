/**
 * Skill eval runner (R14): skills are versioned, evaluated and gated.
 *
 * The eval cases for a skill live in `.claude/skills/<skill>/eval/cases/` in
 * the native `claude plugin eval` format (case.yaml with regex, tool_used and
 * llm graders). `eval/eval.yaml` adds what that format has no field for: the
 * skill version, the gate thresholds, the cost budget, and which files each
 * case produces, so the runner can judge them.
 *
 * Modes:
 *
 *   (default)            Offline and deterministic. Judges each case's recorded
 *                        outputs (`<case>/recorded/`) — one `shall` per Rule,
 *                        scenarios nested under Rules, no spyOn(client…),
 *                        transport-seam mocking, step bindings — and runs the
 *                        spec audit on the produced feature files. No network.
 *   --case <name> --outputs <dir>
 *                        Same judges against any directory of produced files,
 *                        laid out as the manifest's output paths.
 *   --live               Runs `claude plugin eval` for real (needs
 *                        ANTHROPIC_API_KEY), then applies the manifest gate:
 *                        cost budget, per-case score, llm min_mean, and the
 *                        deterministic pass rate including this runner's own
 *                        judges on every run's workspace.
 *   --check-version <ref>
 *                        Fails if SKILL.md changed since <ref> without a bump
 *                        of skill.version in the manifest.
 *
 * Usage: npx ts-node scripts/skill-eval.ts [--skill ears-gherkin-dev]
 *          [--case <name>] [--outputs <dir>] [--live] [--json <path>]
 *          [--check-version <ref>]
 *
 * Exit 0 when every check passes, 1 on any failure or misconfiguration.
 */

import { execFileSync, spawnSync } from 'child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
  CaseOutputs,
  EvalManifest,
  EvalManifestCase,
  JudgeFinding,
  NativeCase,
  NativeEvalResult,
  checkVersionBump,
  evaluateRegexGrader,
  gateNativeResult,
  judgeCaseOutputs,
  validateManifest,
  validateNativeCase,
} from './skill-eval-judges';

const REPO_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

interface Args {
  skill: string;
  caseName: string | null;
  outputs: string | null;
  live: boolean;
  json: string | null;
  checkVersion: string | null;
}

function parseArgs(argv: string[]): Args {
  const value = (flag: string): string | null => {
    const i = argv.indexOf(flag);
    if (i === -1) return null;
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) {
      fail(`${flag} needs a value`);
    }
    return v;
  };
  return {
    skill: value('--skill') ?? 'ears-gherkin-dev',
    caseName: value('--case'),
    outputs: value('--outputs'),
    live: argv.includes('--live'),
    json: value('--json'),
    checkVersion: value('--check-version'),
  };
}

function fail(message: string): never {
  console.error(`\nFAIL: ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

interface Suite {
  skillDir: string;
  evalDir: string;
  manifestPath: string;
  manifest: EvalManifest;
  nativeCases: Map<string, NativeCase>;
}

function loadSuite(skill: string): Suite {
  const skillDir = path.join(REPO_ROOT, '.claude', 'skills', skill);
  const manifestPath = path.join(skillDir, 'eval', 'eval.yaml');
  if (!existsSync(manifestPath)) {
    fail(`no eval manifest at ${path.relative(REPO_ROOT, manifestPath)}`);
  }
  const raw = yaml.load(readFileSync(manifestPath, 'utf-8'));
  const problems = validateManifest(raw);
  if (problems.length > 0) {
    fail(`invalid manifest:\n  ${problems.join('\n  ')}`);
  }
  const manifest = raw as EvalManifest;
  if (manifest.skill.name !== skill) {
    fail(`manifest skill.name '${manifest.skill.name}' is not '${skill}'`);
  }
  const evalDir = path.join(skillDir, manifest.native.eval_dir);

  const nativeCases = new Map<string, NativeCase>();
  const caseProblems = manifest.cases.flatMap((entry) => {
    const casePath = path.join(evalDir, entry.dir, 'case.yaml');
    if (!existsSync(casePath)) return [`case ${entry.name}: no ${casePath}`];
    const native = yaml.load(readFileSync(casePath, 'utf-8')) as NativeCase;
    nativeCases.set(entry.name, native);
    return validateNativeCase(entry, native, manifest.budget);
  });
  if (caseProblems.length > 0) {
    fail(`invalid eval cases:\n  ${caseProblems.join('\n  ')}`);
  }

  return { skillDir, evalDir, manifestPath, manifest, nativeCases };
}

/**
 * Replay the case's file-targeted native regex graders against a directory
 * of outputs. Used offline on the recorded outputs only: they are known-good,
 * so a grader that rejects them is a broken grader.
 */
function replayRegexGraders(
  root: string,
  native: NativeCase | undefined,
): JudgeFinding[] {
  const findings: JudgeFinding[] = [];
  for (const g of native?.graders ?? []) {
    if (g.type !== 'regex' || typeof g.target !== 'object' || !g.pattern) {
      continue;
    }
    const abs = path.join(root, g.target.path);
    if (!existsSync(abs)) {
      findings.push({
        judge: `grader:${g.name}`,
        file: g.target.path,
        line: null,
        message: 'grader targets a file the recorded outputs do not contain',
      });
      continue;
    }
    const { passed, detail } = evaluateRegexGrader(
      { ...g, type: 'regex', pattern: g.pattern },
      readFileSync(abs, 'utf-8'),
    );
    if (!passed) {
      findings.push({
        judge: `grader:${g.name}`,
        file: g.target.path,
        line: null,
        message: `native regex grader rejects the recorded output (${detail})`,
      });
    }
  }
  return findings;
}

function selectCases(suite: Suite, caseName: string | null) {
  if (caseName === null) return suite.manifest.cases;
  const match = suite.manifest.cases.filter((c) => c.name === caseName);
  if (match.length === 0) fail(`no case named '${caseName}' in the manifest`);
  return match;
}

function readOutputs(root: string, entry: EvalManifestCase): CaseOutputs {
  const read = (rel: string) => {
    const abs = path.join(root, rel);
    return {
      path: rel,
      text: existsSync(abs) ? readFileSync(abs, 'utf-8') : null,
    };
  };
  return {
    features: entry.outputs.features.map(read),
    steps: entry.outputs.steps.map(read),
  };
}

// ---------------------------------------------------------------------------
// Spec audit
// ---------------------------------------------------------------------------

/**
 * The real audit on produced feature files. It runs as a child process
 * because `@cucumber/gherkin` is ESM-only. An audit that cannot start is a
 * failure here, not a skip: a gate that silently stops judging passes
 * everything.
 */
function runSpecAudit(files: string[]): JudgeFinding[] {
  if (files.length === 0) return [];
  try {
    execFileSync(
      process.execPath,
      [
        '-r',
        'ts-node/register',
        'scripts/spec-audit.ts',
        '--ignore-exceptions',
        ...files,
      ],
      {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        env: {
          ...process.env,
          TS_NODE_TRANSPILE_ONLY: 'true',
          GITHUB_ACTIONS: 'false',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    return [];
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string };
    const output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    if (/ERR_REQUIRE_ESM|Must use import to load ES Module/.test(output)) {
      fail(
        'the spec audit cannot start on this Node (needs require(esm): ' +
          'Node 20.19+ or 22.12+).',
      );
    }
    const findings = output
      .split(/\r?\n/)
      .filter((l) => l.includes('[ERROR]'))
      .map((l) => ({
        judge: 'spec-audit',
        file: files.join(', '),
        line: null,
        message: l.trim(),
      }));
    return findings.length > 0
      ? findings
      : [
          {
            judge: 'spec-audit',
            file: files.join(', '),
            line: null,
            message: `spec audit failed:\n${output.trim()}`,
          },
        ];
  }
}

function judgeRoot(root: string, entry: EvalManifestCase): JudgeFinding[] {
  const outputs = readOutputs(root, entry);
  const findings = judgeCaseOutputs(outputs);
  const present = outputs.features
    .filter((f) => f.text !== null)
    .map((f) => path.join(root, f.path));
  return [...findings, ...runSpecAudit(present)];
}

function printFindings(label: string, findings: JudgeFinding[]): void {
  if (findings.length === 0) {
    console.log(`  PASS  ${label}`);
    return;
  }
  console.log(`  FAIL  ${label}`);
  for (const f of findings) {
    const at = f.line ? `:${f.line}` : '';
    console.log(`        [${f.judge}] ${f.file}${at} ${f.message}`);
  }
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

function runOffline(suite: Suite, args: Args): boolean {
  if (args.outputs !== null && args.caseName === null) {
    fail('--outputs judges one case; pass --case <name> as well');
  }
  const cases = selectCases(suite, args.caseName);
  console.log(
    `Skill eval (offline, deterministic): ${suite.manifest.skill.name}@${suite.manifest.skill.version}`,
  );

  const report: Record<string, JudgeFinding[]> = {};
  for (const entry of cases) {
    const root =
      args.outputs !== null
        ? path.resolve(args.outputs)
        : path.join(suite.evalDir, entry.dir, 'recorded');
    if (!existsSync(root)) fail(`case ${entry.name}: no outputs at ${root}`);
    report[entry.name] = [
      ...judgeRoot(root, entry),
      ...(args.outputs === null
        ? replayRegexGraders(root, suite.nativeCases.get(entry.name))
        : []),
    ];
    printFindings(entry.name, report[entry.name] ?? []);
  }

  const passed = Object.values(report).every((f) => f.length === 0);
  if (args.json) {
    writeFileSync(
      args.json,
      JSON.stringify({ mode: 'offline', passed, report }, null, 2),
    );
  }
  return passed;
}

function runLive(suite: Suite, args: Args): boolean {
  const { manifest } = suite;
  if (!process.env.ANTHROPIC_API_KEY) {
    fail(
      'ANTHROPIC_API_KEY is not set. The live skill eval runs model calls ' +
        'and must not be skipped silently. In CI, add the ANTHROPIC_API_KEY ' +
        'repository secret; locally, export the key before running --live.',
    );
  }
  const cases = selectCases(suite, args.caseName);
  const outDir = mkdtempSync(path.join(tmpdir(), 'skill-eval-'));
  const resultPath = path.join(outDir, 'result.json');
  const claude = process.env.CLAUDE_BIN ?? 'claude';

  const cliArgs = [
    'plugin',
    'eval',
    suite.skillDir,
    '--eval-dir',
    manifest.native.eval_dir,
    '--trust-plugin',
    '--no-publish',
    '--keep-temp',
    '--ablation',
    manifest.native.ablation,
    '--runs',
    String(manifest.native.runs),
    '--model',
    manifest.native.model,
    '--judge-model',
    manifest.native.judge_model,
    '--threshold',
    String(manifest.thresholds.case_score_min),
    '--max-cost-usd',
    String(manifest.budget.max_cost_usd),
    '--output-dir',
    outDir,
    '--json',
    resultPath,
    ...(manifest.native.allow_tools.length > 0
      ? ['--allow-tools', ...manifest.native.allow_tools]
      : []),
    ...(args.caseName ? ['--case', args.caseName] : []),
  ];

  console.log(
    `Skill eval (live): ${manifest.skill.name}@${manifest.skill.version} — ` +
      `${cases.length} case(s) × ${manifest.native.runs} run(s), ` +
      `budget $${manifest.budget.max_cost_usd}`,
  );
  const run = spawnSync(claude, cliArgs, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (run.error) fail(`could not start '${claude}': ${run.error.message}`);
  if (!existsSync(resultPath)) {
    fail(`claude plugin eval exited ${run.status} without writing a result`);
  }

  const result = JSON.parse(
    readFileSync(resultPath, 'utf-8'),
  ) as NativeEvalResult;
  const selected = new Set(cases.map((c) => c.name));
  const manifestView: EvalManifest = {
    ...manifest,
    cases: manifest.cases.filter((c) => selected.has(c.name)),
  };

  // Judge what every run actually wrote, then drop the kept workspace.
  const workspaceRuns: boolean[] = [];
  for (const c of result.cases) {
    const entry = manifestView.cases.find((m) => m.name === c.name);
    if (!entry) continue;
    c.arms.with.forEach((r, i) => {
      const label = `${c.name} run ${i + 1}`;
      if (!r.tracePath) {
        printFindings(label, [
          {
            judge: 'workspace',
            file: '-',
            line: null,
            message: 'run has no trace path',
          },
        ]);
        workspaceRuns.push(false);
        return;
      }
      const runRoot = path.resolve(path.dirname(r.tracePath), '..');
      const workspace = path.join(runRoot, 'home', 'cwd');
      if (!existsSync(workspace)) {
        printFindings(label, [
          {
            judge: 'workspace',
            file: workspace,
            line: null,
            message:
              'kept run workspace not found; the claude plugin eval layout ' +
              'may have changed — update skill-eval.ts',
          },
        ]);
        workspaceRuns.push(false);
        return;
      }
      const findings = judgeRoot(workspace, entry);
      printFindings(label, findings);
      workspaceRuns.push(findings.length === 0);
      if (path.basename(runRoot).startsWith('claude-eval-')) {
        rmSync(runRoot, { recursive: true, force: true });
      }
    });
  }

  const gate = gateNativeResult({
    result,
    manifest: manifestView,
    workspaceRuns,
  });
  console.log('\n--- Gate ---');
  console.log(
    `cost:                $${gate.metrics.costUsd.toFixed(2)} / $${manifest.budget.max_cost_usd}`,
  );
  console.log(
    `llm mean:            ${gate.metrics.llmMean?.toFixed(2) ?? 'n/a'} (min ${manifest.thresholds.llm.min_mean})`,
  );
  console.log(
    `deterministic rate:  ${gate.metrics.deterministicPassRate?.toFixed(2) ?? 'n/a'} (min ${manifest.thresholds.deterministic_pass_rate})`,
  );
  for (const [name, score] of Object.entries(gate.metrics.caseScores)) {
    console.log(
      `case ${name}: ${score.toFixed(2)} (min ${manifest.thresholds.case_score_min})`,
    );
  }
  for (const f of gate.failures) console.error(`  [GATE] ${f}`);
  if (run.status !== 0 && gate.passed) {
    console.error(`  [GATE] claude plugin eval exited ${run.status}`);
  }

  if (args.json) {
    writeFileSync(
      args.json,
      JSON.stringify({ mode: 'live', gate, result }, null, 2),
    );
  }
  return gate.passed && run.status === 0;
}

function runVersionCheck(suite: Suite, ref: string): boolean {
  const git = (gitArgs: string[]) =>
    execFileSync('git', gitArgs, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  try {
    git(['rev-parse', '--verify', `${ref}^{commit}`]);
  } catch {
    fail(`--check-version: ref '${ref}' does not resolve (fetch it first)`);
  }

  const rel = (p: string) =>
    path.relative(REPO_ROOT, p).split(path.sep).join('/');
  const skillFile = rel(path.join(suite.skillDir, 'SKILL.md'));
  let skillChanged = false;
  try {
    git(['diff', '--quiet', ref, '--', skillFile]);
  } catch {
    skillChanged = true;
  }

  let baseVersion: string | null = null;
  try {
    const base = yaml.load(
      git(['show', `${ref}:${rel(suite.manifestPath)}`]),
    ) as Partial<EvalManifest> | undefined;
    baseVersion = base?.skill?.version ?? null;
  } catch {
    baseVersion = null; // No manifest at the base: a new suite needs no bump.
  }

  const problems = checkVersionBump({
    skillChanged,
    baseVersion,
    headVersion: suite.manifest.skill.version,
  });
  console.log(
    `Version check against ${ref}: SKILL.md ${skillChanged ? 'changed' : 'unchanged'}, ` +
      `version ${baseVersion ?? '(none)'} -> ${suite.manifest.skill.version}`,
  );
  for (const p of problems) console.error(`  [VERSION] ${p}`);
  return problems.length === 0;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const suite = loadSuite(args.skill);

  let passed: boolean;
  if (args.checkVersion !== null) {
    passed = runVersionCheck(suite, args.checkVersion);
  } else if (args.live) {
    passed = runLive(suite, args);
  } else {
    passed = runOffline(suite, args);
  }

  if (!passed) fail('skill eval gate did not pass.');
  console.log('\nPASS: skill eval gate passed.');
}

main();
