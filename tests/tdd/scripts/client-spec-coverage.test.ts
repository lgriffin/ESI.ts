/**
 * Self-tests for the domain-client specification coverage check
 * (scripts/spec/client-spec-coverage.ts).
 *
 * The check claims a client method is covered only when a Rule's text names
 * it or a bound step calls it on that client. The fixture project under
 * fixtures/client-spec-coverage/project exercises each way that claim could go
 * wrong: which members are a client's own public methods, a same-named method
 * on the other client, on a plain object or on `any`, a call two support
 * modules deep, a call through a mapped type such as `withMetadata()`
 * returns, a second step in the same file, a bare method name two clients
 * share, a legacy `defineFeature` file that binds scenarios by title
 * (case-insensitively, by an outline's own title, and in a for-of loop), and a
 * call in a hook rather than a step. A second fixture has a step no file
 * defines, a legacy scenario no test binds and a test title the check cannot
 * read, which must be reported as a broken check rather than as uncovered.
 * The last cases run the check over this repository, so the committed
 * baseline and the clients cannot drift apart unnoticed.
 */
import { execFileSync } from 'child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  BASELINE_FILE,
  CoverageReport,
  analyseCoverage,
  applyBaseline,
  clientOrder,
  integrityProblems,
  parseBaseline,
  ratchetProblems,
  readClientMethods,
  readStepPatterns,
  renderReport,
  serializeBaseline,
  uncoveredByClient,
} from '../../../scripts/spec/client-spec-coverage-core';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FIXTURES = path.join(__dirname, 'fixtures', 'client-spec-coverage');
const PROJECT = path.join(FIXTURES, 'project');

function method(report: CoverageReport, client: string, name: string) {
  const found = report.methods.find(
    (m) => m.client === client && m.name === name,
  );
  if (!found) throw new Error(`${client}.${name} is not in the report`);
  return found;
}

/** Runs the CLI; returns its exit code and combined output. */
function runCli(args: string[]): { status: number; output: string } {
  try {
    const stdout = execFileSync(
      process.execPath,
      [
        '-r',
        'ts-node/register',
        'scripts/spec/client-spec-coverage.ts',
        ...args,
      ],
      {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        env: {
          ...process.env,
          TS_NODE_TRANSPILE_ONLY: 'true',
          GITHUB_ACTIONS: '',
          GITHUB_STEP_SUMMARY: '',
          CLIENT_SPEC_COVERAGE_BASE_REF: '',
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

describe('client-spec-coverage: the clients', () => {
  it("reads each client's own public instance methods, clients by name, methods in order", () => {
    // Not: the constructor, an accessor, a static, private or protected
    // method, a method inherited from BaseEsiClient, or a class that does
    // not extend it (ClientRegistry). An override is the client's own; an
    // overloaded method is listed once.
    expect(readClientMethods(PROJECT)).toEqual([
      { client: 'AlphaClient', name: 'getDirect' },
      { client: 'AlphaClient', name: 'getChained' },
      { client: 'AlphaClient', name: 'getMetered' },
      { client: 'AlphaClient', name: 'getShared' },
      { client: 'AlphaClient', name: 'getNamedBare' },
      { client: 'AlphaClient', name: 'getAmbiguous' },
      { client: 'AlphaClient', name: 'overridden' },
      { client: 'BetaClient', name: 'getShared' },
      { client: 'BetaClient', name: 'getAmbiguous' },
      { client: 'BetaClient', name: 'getQualified' },
      { client: 'BetaClient', name: 'getLegacy' },
      { client: 'BetaClient', name: 'getLooped' },
      { client: 'BetaClient', name: 'getOnlyInHook' },
    ]);
    expect(clientOrder(readClientMethods(PROJECT))).toEqual([
      'AlphaClient',
      'BetaClient',
    ]);
  });

  it('refuses a root without the clients, so nothing passes vacuously', () => {
    expect(() => readClientMethods(path.join(FIXTURES, 'nowhere'))).toThrow(
      /does not exist/,
    );
  });
});

describe('client-spec-coverage: what counts as coverage', () => {
  const report = analyseCoverage(PROJECT);

  it('is not broken: every step and legacy scenario of the fixture binds', () => {
    expect(integrityProblems(report)).toEqual([]);
    expect(report.featureCount).toBe(2);
    expect(report.legacyFeatureCount).toBe(1);
    expect(report.ruleCount).toBe(4);
    expect(report.scenarioCount).toBe(8);
  });

  it('credits the client the checker resolves the call to, not a same-named method elsewhere', () => {
    expect(method(report, 'AlphaClient', 'getDirect')).toMatchObject({
      rules: 1,
      scenarios: 1,
    });
    expect(method(report, 'AlphaClient', 'getShared')).toMatchObject({
      rules: 1,
      scenarios: 1,
    });
    // Only a support function no step calls reaches BetaClient.getShared.
    expect(method(report, 'BetaClient', 'getShared')).toMatchObject({
      rules: 0,
      scenarios: 0,
    });
  });

  it('follows a step into support modules, to an overloaded method', () => {
    expect(method(report, 'AlphaClient', 'getChained')).toMatchObject({
      rules: 1,
      scenarios: 1,
    });
  });

  it('follows a call through a mapped type over the client, as withMetadata() returns', () => {
    expect(method(report, 'AlphaClient', 'getMetered')).toMatchObject({
      rules: 1,
      scenarios: 1,
    });
  });

  it('credits only the step function that matched, not the rest of its file', () => {
    expect(method(report, 'AlphaClient', 'overridden')).toMatchObject({
      rules: 0,
      scenarios: 0,
    });
  });

  it('counts a Rule that names a method bare when one client declares it, or qualified', () => {
    expect(method(report, 'AlphaClient', 'getNamedBare')).toMatchObject({
      rules: 1,
      scenarios: 0,
    });
    expect(method(report, 'BetaClient', 'getQualified')).toMatchObject({
      rules: 1,
      scenarios: 0,
    });
  });

  it('credits neither client for a bare name both declare, nor calls on other objects or any', () => {
    expect(method(report, 'AlphaClient', 'getAmbiguous')).toMatchObject({
      rules: 0,
      scenarios: 0,
    });
    expect(method(report, 'BetaClient', 'getAmbiguous')).toMatchObject({
      rules: 0,
      scenarios: 0,
    });
  });

  it('binds legacy scenarios by title, case-insensitively, by outline title and in a loop', () => {
    expect(method(report, 'BetaClient', 'getLegacy')).toMatchObject({
      rules: 1,
      scenarios: 1,
    });
    expect(method(report, 'BetaClient', 'getLooped')).toMatchObject({
      rules: 1,
      scenarios: 2,
    });
  });

  it('does not count a call in a hook, which is not a step', () => {
    expect(method(report, 'BetaClient', 'getOnlyInHook')).toMatchObject({
      rules: 0,
      scenarios: 0,
    });
  });

  it('groups the uncovered methods by client, dropping clients with none', () => {
    expect(uncoveredByClient(report)).toEqual({
      AlphaClient: ['getAmbiguous', 'overridden'],
      BetaClient: ['getShared', 'getAmbiguous', 'getOnlyInHook'],
    });
  });

  it('renders a line per client and the uncovered list', () => {
    const rendered = renderReport(report);
    expect(rendered).toMatch(/AlphaClient\s+7\s+5\s+2/);
    expect(rendered).toContain(
      '8 of 13 client methods are named by a Rule or reached by a bound step',
    );
    expect(rendered).toContain('AlphaClient: getAmbiguous, overridden');
  });

  it('reads the converted step patterns as Cucumber Expressions', () => {
    const walked = readStepPatterns(PROJECT).find((p) =>
      p.file.endsWith('the-chain-is-walked.ts'),
    );
    expect(walked?.regexp.test('the chain is walked 2 times')).toBe(true);
    expect(walked?.regexp.test('the chain is walked x times')).toBe(false);
  });

  it('reports what it cannot bind as a broken check, not as uncovered', () => {
    const broken = analyseCoverage(path.join(FIXTURES, 'unresolved'));
    expect(broken.unresolvedSteps).toEqual([
      'tests/bdd/features/core/0001-converted.feature:5 something no step file defines happens',
    ]);
    expect(broken.unboundScenarios).toEqual([
      'tests/bdd/features/core/0002-legacy.feature:6 a scenario no test binds',
    ]);
    expect(broken.unreadableTests).toEqual([
      'tests/bdd/step-definitions/core/legacy.steps.ts:11',
    ]);
    expect(integrityProblems(broken)).toHaveLength(3);
  });
});

describe('client-spec-coverage: the baseline ratchet', () => {
  const report = analyseCoverage(PROJECT);
  const measured = parseBaseline(serializeBaseline(report));

  it('serialises the uncovered list and round-trips it', () => {
    expect(measured).toEqual(uncoveredByClient(report));
    expect(serializeBaseline(report)).toContain(
      'spec:coverage:clients -- --write-baseline',
    );
    expect(() => parseBaseline('{"uncovered": {"AlphaClient": [1]}}')).toThrow(
      /Baseline client 'AlphaClient' must be an array/,
    );
  });

  it('passes when the baseline lists exactly the uncovered methods and the base agrees', () => {
    expect(
      ratchetProblems(
        applyBaseline(report, measured, {
          ref: 'origin/master',
          baseline: measured,
        }),
      ),
    ).toEqual([]);
  });

  it('compares with the base by client and method, since names repeat across clients', () => {
    // BetaClient.getAmbiguous is new even though AlphaClient.getAmbiguous
    // is on the base branch.
    const result = applyBaseline(report, measured, {
      ref: 'origin/master',
      baseline: {
        AlphaClient: ['getAmbiguous', 'overridden'],
        BetaClient: ['getShared', 'getOnlyInHook'],
      },
    });
    expect(result.added).toEqual(['BetaClient: getAmbiguous']);
    expect(ratchetProblems(result).join('\n')).toMatch(/only shrinks/);
  });

  it('fails on an unlisted uncovered method and on a stale entry, naming the client', () => {
    const result = applyBaseline(
      report,
      {
        AlphaClient: ['getAmbiguous', 'overridden', 'getDirect'],
        BetaClient: ['getShared', 'getAmbiguous'],
      },
      null,
    );
    expect(result.unlisted).toEqual(['BetaClient: getOnlyInHook']);
    expect(result.stale).toEqual(['AlphaClient: getDirect']);
    const problems = ratchetProblems(result).join('\n');
    expect(problems).toMatch(/client methods .* under their client/);
    expect(problems).toMatch(/no longer a client method/);
  });

  it('fails closed when no base ref resolves, naming its variable', () => {
    const result = applyBaseline(report, measured, {
      ref: null,
      baseline: null,
    });
    expect(ratchetProblems(result).join('\n')).toMatch(
      /CLIENT_SPEC_COVERAGE_BASE_REF/,
    );
  });
});

describe('client-spec-coverage: the command line', () => {
  let scratch: string;

  beforeEach(() => {
    scratch = mkdtempSync(path.join(tmpdir(), 'client-spec-coverage-'));
    cpSync(PROJECT, scratch, { recursive: true });
  });

  afterEach(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  it('reports and exits 0 without --ci when there is no baseline yet', () => {
    const { status, output } = runCli(['--root', scratch]);
    expect(status).toBe(0);
    expect(output).toContain('8 of 13 client methods');
  });

  it('checks a committed baseline against the working tree, and --ci needs a base ref', () => {
    expect(runCli(['--write-baseline', '--root', scratch]).status).toBe(0);
    expect(runCli(['--root', scratch]).output).toContain(
      'Client specification coverage matches the baseline.',
    );
    expect(runCli(['--ci', '--root', scratch]).output).toMatch(
      /No base ref resolved/,
    );
    writeFileSync(
      path.join(scratch, BASELINE_FILE),
      JSON.stringify({ uncovered: { AlphaClient: ['overridden'] } }),
    );
    const grown = runCli(['--root', scratch]);
    expect(grown.status).toBe(1);
    expect(grown.output).toMatch(/AlphaClient: getAmbiguous.*Write a Rule/);
  });

  it('exits 2 when a step or scenario binds to nothing', () => {
    const { status, output } = runCli([
      '--root',
      path.join(FIXTURES, 'unresolved'),
    ]);
    expect(status).toBe(2);
    expect(output).toMatch(/match no test\(\) title/);
  });
});

describe('client-spec-coverage: this repository', () => {
  const report = analyseCoverage(REPO_ROOT);

  it('reads every domain client and binds every step and legacy scenario', () => {
    expect(clientOrder(report.methods).length).toBeGreaterThanOrEqual(39);
    expect(integrityProblems(report)).toEqual([]);
    expect(report.legacyFeatureCount).toBeGreaterThan(0);
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
