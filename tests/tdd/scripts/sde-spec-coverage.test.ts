/**
 * Self-tests for the SDE specification coverage check
 * (scripts/sde/sde-spec-coverage.ts).
 *
 * The check claims a provider method is covered only when a Rule's text names
 * it or the step function a scenario binds calls it on the provider, directly
 * or through a support function. The fixture project under
 * fixtures/sde-spec-coverage/project exercises each way that claim could go
 * wrong: a name in a comment or a string, a support function nobody calls, a
 * call two support modules deep and one through a helper beside its caller, a
 * same-named method on another object or on `any`, a second step in the same
 * file, a Rule that names the method in prose. A second fixture has a step no
 * file defines, which the check must report as broken rather than as
 * uncovered.
 * The last cases run the check over this repository, so the committed
 * baseline and the interface cannot drift apart unnoticed.
 */
import { execFileSync } from 'child_process';
import {
  mkdirSync,
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  BASELINE_FILE,
  CoverageReport,
  analyseCoverage,
  applyBaseline,
  familyOrder,
  integrityProblems,
  loadBaseBaseline,
  parseBaseline,
  ratchetProblems,
  readProviderMethods,
  readStepPatterns,
  renderReport,
  serializeBaseline,
  uncoveredByFamily,
} from '../../../scripts/sde/sde-spec-coverage-core';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FIXTURES = path.join(__dirname, 'fixtures', 'sde-spec-coverage');
const PROJECT = path.join(FIXTURES, 'project');

function byName(report: CoverageReport, name: string) {
  const method = report.methods.find((m) => m.name === name);
  if (!method) throw new Error(`${name} is not in the report`);
  return method;
}

/** Runs the CLI; returns its exit code and combined output. */
function runCli(
  args: string[],
  env: Record<string, string> = {},
): { status: number; output: string } {
  try {
    const stdout = execFileSync(
      process.execPath,
      ['-r', 'ts-node/register', 'scripts/sde/sde-spec-coverage.ts', ...args],
      {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        env: {
          ...process.env,
          TS_NODE_TRANSPILE_ONLY: 'true',
          GITHUB_ACTIONS: '',
          GITHUB_STEP_SUMMARY: '',
          SDE_SPEC_COVERAGE_BASE_REF: '',
          ...env,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    return { status: 0, output: stdout };
  } catch (error) {
    const failure = error as {
      status?: number;
      stdout?: string;
      stderr?: string;
    };
    return {
      status: failure.status ?? -1,
      output: `${failure.stdout ?? ''}${failure.stderr ?? ''}`,
    };
  }
}

describe('sde-spec-coverage: the provider interface', () => {
  it('reads every method with the family comment above it, in file order', () => {
    expect(readProviderMethods(PROJECT)).toEqual([
      { name: 'getType', family: 'Types' },
      { name: 'getGroup', family: 'Types' },
      { name: 'getCategory', family: 'Types' },
      { name: 'getAllCategories', family: 'Types' },
      { name: 'getVersion', family: 'Lifecycle' },
      { name: 'close', family: 'Lifecycle' },
    ]);
    expect(familyOrder(readProviderMethods(PROJECT))).toEqual([
      'Types',
      'Lifecycle',
    ]);
  });

  it('refuses a root without the interface, so nothing passes vacuously', () => {
    expect(() => readProviderMethods(path.join(FIXTURES, 'nowhere'))).toThrow(
      /does not exist/,
    );
  });
});

describe('sde-spec-coverage: what counts as coverage', () => {
  const report = analyseCoverage(PROJECT);

  it('is not broken: every step of the fixture resolves to one file', () => {
    expect(report.unresolvedSteps).toEqual([]);
    expect(integrityProblems(report)).toEqual([]);
    expect(report.featureCount).toBe(1);
    expect(report.ruleCount).toBe(2);
    expect(report.scenarioCount).toBe(3);
  });

  it('counts a method a step file calls on the provider itself', () => {
    // Called in "direct call", and through walkChain in "through support".
    expect(byName(report, 'getType')).toMatchObject({ rules: 1, scenarios: 2 });
  });

  it('follows a step into a support function, and that into another module', () => {
    // walkChain -> groupOf (support/chain.ts) -> provider.getGroup.
    expect(byName(report, 'getGroup')).toMatchObject({
      rules: 1,
      scenarios: 1,
    });
  });

  it('follows a support function into a helper declared beside it', () => {
    // walkChain -> categoryOf (same module, not exported) -> provider.getCategory.
    expect(byName(report, 'getCategory')).toMatchObject({
      rules: 1,
      scenarios: 1,
    });
  });

  it('ignores a same-named method on another object, or on a value typed any', () => {
    // "an unrelated object is closed" calls other.close(), other.getVersion()
    // and (any).close(); none is the provider.
    expect(byName(report, 'close')).toMatchObject({ rules: 0, scenarios: 0 });
  });

  it('credits only the step function that matched, not the rest of its file', () => {
    // two-in-one-file.ts also registers "the version is read", which calls
    // this.sde.getVersion(); no scenario uses that step.
    expect(byName(report, 'getVersion')).toMatchObject({
      rules: 0,
      scenarios: 0,
    });
  });

  it('counts a Rule whose text names the method, with no scenario reaching it', () => {
    expect(byName(report, 'getAllCategories')).toMatchObject({
      rules: 1,
      scenarios: 0,
    });
  });

  it('ignores a support function no step calls, and names in comments or strings', () => {
    // versionOf calls getVersion but nothing calls versionOf; a step names
    // getAllCategories in a comment and a string, which is not a call.
    expect(byName(report, 'getVersion')).toMatchObject({
      rules: 0,
      scenarios: 0,
    });
    expect(byName(report, 'close')).toMatchObject({ rules: 0, scenarios: 0 });
  });

  it('groups the uncovered methods by family, in interface order, dropping empty families', () => {
    expect(uncoveredByFamily(report)).toEqual({
      Lifecycle: ['getVersion', 'close'],
    });
  });

  it('renders a table per family and the uncovered list', () => {
    const rendered = renderReport(report);
    expect(rendered).toContain('Types\n-----');
    expect(rendered).toMatch(/getType\s+1\s+2/);
    expect(rendered).toContain(
      '4 of 6 provider methods are named by a Rule or reached by a bound step',
    );
    expect(rendered).toContain('Lifecycle: getVersion, close');
  });

  it('reads string patterns as Cucumber Expressions and regular expressions as they are', () => {
    const patterns = readStepPatterns(PROJECT);
    expect(patterns).toHaveLength(8);
    const lookup = patterns.find((p) =>
      p.file.endsWith('the-type-int-is-looked-up.ts'),
    );
    expect(lookup?.regexp.test('the type 34 is looked up')).toBe(true);
    expect(lookup?.regexp.test('the type x is looked up')).toBe(false);
  });

  it('reports a step no single file defines as a broken check, not as uncovered', () => {
    const broken = analyseCoverage(path.join(FIXTURES, 'unresolved'));
    expect(broken.unresolvedSteps).toEqual([
      'tests/bdd/features/sde/0001-beta.feature:5 something no step file defines happens',
    ]);
    expect(integrityProblems(broken).join('\n')).toMatch(
      /resolve to no single step file/,
    );
  });
});

describe('sde-spec-coverage: the baseline ratchet', () => {
  const report = analyseCoverage(PROJECT);
  const measured = parseBaseline(serializeBaseline(report));
  const sameOnBase = { ref: 'origin/master', baseline: measured };

  it('serialises the uncovered list and round-trips it', () => {
    expect(measured).toEqual({ Lifecycle: ['getVersion', 'close'] });
    expect(serializeBaseline(report)).toContain(
      'spec:coverage:sde -- --write-baseline',
    );
  });

  it('rejects a malformed baseline', () => {
    expect(() => parseBaseline('{"uncovered": []}')).toThrow(/object/);
    expect(() => parseBaseline('{"uncovered": {"Types": [1]}}')).toThrow(
      /array of method names/,
    );
  });

  it('passes when the baseline lists exactly the uncovered methods and the base agrees', () => {
    expect(
      ratchetProblems(applyBaseline(report, measured, sameOnBase)),
    ).toEqual([]);
  });

  it('fails on an uncovered method the baseline does not list', () => {
    const result = applyBaseline(
      report,
      { Lifecycle: ['close'] },
      {
        ref: 'origin/master',
        baseline: { Lifecycle: ['close'] },
      },
    );
    expect(result.unlisted).toEqual(['Lifecycle: getVersion']);
    expect(ratchetProblems(result).join('\n')).toMatch(
      /Lifecycle: getVersion.*Write a Rule/,
    );
  });

  it('fails on an entry under the wrong family, so the planning list stays true', () => {
    const misplaced = { Types: ['getVersion'], Lifecycle: ['close'] };
    const result = applyBaseline(report, misplaced, {
      ref: 'origin/master',
      baseline: misplaced,
    });
    expect(result.unlisted).toEqual(['Lifecycle: getVersion']);
    expect(result.stale).toEqual(['Types: getVersion']);
    expect(result.added).toEqual([]);
    expect(ratchetProblems(result).join('\n')).toMatch(/wrong family/);
  });

  it('checks the working tree alone when no base is given, for local runs', () => {
    const result = applyBaseline(report, measured, null);
    expect(result).toEqual({
      unlisted: [],
      stale: [],
      added: [],
      baseRefMissing: false,
    });
  });

  it('fails on a stale entry: a method now covered, or gone from the interface', () => {
    const result = applyBaseline(
      report,
      { Lifecycle: ['getVersion', 'close'], Types: ['getType', 'getRemoved'] },
      {
        ref: 'origin/master',
        baseline: {
          Lifecycle: ['getVersion', 'close'],
          Types: ['getType', 'getRemoved'],
        },
      },
    );
    expect(result.stale).toEqual(['Types: getType', 'Types: getRemoved']);
    expect(ratchetProblems(result).join('\n')).toMatch(
      /lock the improvement in/,
    );
  });

  it('fails on an entry the base branch does not carry: the list only shrinks', () => {
    const result = applyBaseline(report, measured, {
      ref: 'origin/master',
      baseline: { Lifecycle: ['close'] },
    });
    expect(result.added).toEqual(['getVersion']);
    expect(ratchetProblems(result).join('\n')).toMatch(/only shrinks/);
  });

  it('fails closed when no base ref resolves', () => {
    const result = applyBaseline(report, measured, {
      ref: null,
      baseline: null,
    });
    expect(result.baseRefMissing).toBe(true);
    expect(ratchetProblems(result).join('\n')).toMatch(
      /SDE_SPEC_COVERAGE_BASE_REF/,
    );
  });

  it('accepts every entry when the base ref has no baseline file yet', () => {
    const result = applyBaseline(report, measured, {
      ref: 'origin/master',
      baseline: null,
    });
    expect(ratchetProblems(result)).toEqual([]);
  });
});

describe('sde-spec-coverage: the command line', () => {
  let scratch: string;

  beforeEach(() => {
    scratch = mkdtempSync(path.join(tmpdir(), 'sde-spec-coverage-'));
    cpSync(PROJECT, scratch, { recursive: true });
  });

  afterEach(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  it('reports and exits 0 without --ci when there is no baseline yet', () => {
    const { status, output } = runCli(['--root', scratch]);
    expect(status).toBe(0);
    expect(output).toContain('4 of 6 provider methods');
  });

  it('exits 1 under --ci when the uncovered methods are not baselined', () => {
    const { status, output } = runCli(['--ci', '--root', scratch]);
    expect(status).toBe(1);
    expect(output).toMatch(
      /Lifecycle: getVersion, Lifecycle: close.*Write a Rule/,
    );
  });

  it('checks a committed baseline against the working tree without git, so check:local can run it', () => {
    expect(runCli(['--write-baseline', '--root', scratch]).status).toBe(0);
    expect(runCli(['--root', scratch]).output).toContain(
      'matches the baseline',
    );
    writeFileSync(
      path.join(scratch, BASELINE_FILE),
      JSON.stringify({ uncovered: { Lifecycle: ['close'] } }),
    );
    const stale = runCli(['--root', scratch]);
    expect(stale.status).toBe(1);
    expect(stale.output).toMatch(/Lifecycle: getVersion.*Write a Rule/);
  });

  it('exits 2 when a step resolves to no file', () => {
    const { status, output } = runCli([
      '--root',
      path.join(FIXTURES, 'unresolved'),
    ]);
    expect(status).toBe(2);
    expect(output).toMatch(/resolve to no single step file/);
  });

  it('--write-baseline records the uncovered methods; --ci then needs a base ref that carries them', () => {
    expect(runCli(['--write-baseline', '--root', scratch]).status).toBe(0);
    const noGit = runCli(['--ci', '--root', scratch]);
    expect(noGit.status).toBe(1);
    expect(noGit.output).toMatch(/No base ref resolved/);

    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: scratch, stdio: 'ignore' });
    git('init', '-q', '-b', 'master');
    git('-c', 'user.email=t@e.st', '-c', 'user.name=t', 'add', '-A');
    git(
      '-c',
      'user.email=t@e.st',
      '-c',
      'user.name=t',
      'commit',
      '-q',
      '-m',
      'seed',
    );
    const onBase = runCli(['--ci', '--root', scratch]);
    expect(onBase.status).toBe(0);
    expect(onBase.output).toContain('matches the baseline');

    // A hand-added entry is rejected against that commit.
    writeFileSync(
      path.join(scratch, BASELINE_FILE),
      JSON.stringify({
        uncovered: { Lifecycle: ['getVersion', 'close'], Types: ['getType'] },
      }),
    );
    const grown = runCli(['--ci', '--root', scratch]);
    expect(grown.status).toBe(1);
    expect(grown.output).toMatch(/now covered, no longer a provider method/);
  });

  it('loadBaseBaseline distinguishes no ref, a ref without the file, and a ref with it', () => {
    expect(loadBaseBaseline(scratch, ['nope'])).toEqual({
      ref: null,
      baseline: null,
    });
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: scratch, stdio: 'ignore' });
    git('init', '-q', '-b', 'master');
    git(
      '-c',
      'user.email=t@e.st',
      '-c',
      'user.name=t',
      'commit',
      '-q',
      '--allow-empty',
      '-m',
      'empty',
    );
    expect(loadBaseBaseline(scratch, ['master'])).toEqual({
      ref: 'master',
      baseline: null,
    });
    mkdirSync(path.dirname(path.join(scratch, BASELINE_FILE)), {
      recursive: true,
    });
    writeFileSync(
      path.join(scratch, BASELINE_FILE),
      serializeBaseline(analyseCoverage(PROJECT)),
    );
    git('-c', 'user.email=t@e.st', '-c', 'user.name=t', 'add', '-A');
    git(
      '-c',
      'user.email=t@e.st',
      '-c',
      'user.name=t',
      'commit',
      '-q',
      '-m',
      'baseline',
    );
    expect(loadBaseBaseline(scratch, ['master'])).toEqual({
      ref: 'master',
      baseline: { Lifecycle: ['getVersion', 'close'] },
    });
  });
});

describe('sde-spec-coverage: this repository', () => {
  const report = analyseCoverage(REPO_ROOT);

  it('reads the real interface and resolves every SDE step', () => {
    expect(report.methods.length).toBeGreaterThan(90);
    expect(integrityProblems(report)).toEqual([]);
    expect(report.featureCount).toBeGreaterThanOrEqual(7);
  });

  it('matches the committed baseline exactly', () => {
    const committed = parseBaseline(
      readFileSync(path.join(REPO_ROOT, BASELINE_FILE), 'utf-8'),
    );
    const result = applyBaseline(report, committed, {
      ref: 'committed',
      baseline: committed,
    });
    expect(result.unlisted).toEqual([]);
    expect(result.stale).toEqual([]);
  });
});
