/**
 * Self-tests for the local tier runner (scripts/verify-local-core.ts,
 * npm run check:local).
 *
 * The runner's only real promise is that its list is the whole list. A list
 * that silently shrinks is worse than no list: it keeps passing while covering
 * less, and the tier it dropped is discovered on a pull request instead. Each
 * test here is a way the list could stop being whole — a renamed npm script, a
 * tier added to CI and not here, a stage filter that quietly excludes
 * something, a failure that does not reach the exit code.
 */
import { readFileSync } from 'fs';
import * as path from 'path';

import {
  NOT_RUN_LOCALLY,
  TIERS,
  Tier,
  TierResult,
  VerifyLocalError,
  duplicateScripts,
  exitCodeFor,
  renderSummary,
  TOOLS_NOT_RUN_LOCALLY,
  TOOLS_RUN_BY,
  scriptsInWorkflow,
  selectTiers,
  toolsInWorkflow,
  uncoveredCiTools,
  uncoveredCiScripts,
  unknownScripts,
} from '../../../scripts/verify-local-core';

const ROOT = path.resolve(__dirname, '../../..');

const packageScripts = JSON.parse(
  readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
).scripts as Record<string, string>;

const ciYaml = readFileSync(
  path.join(ROOT, '.github/workflows/ci.yml'),
  'utf8',
);

function tier(script: string, stage: Tier['stage'] = 'quick'): Tier {
  return { script, covers: script, stage };
}

function result(script: string, ok: boolean, ms = 1000): TierResult {
  return { script, covers: script, ok, ms };
}

describe('the tier list matches package.json', () => {
  it('names only scripts that exist', () => {
    expect(unknownScripts(TIERS, packageScripts)).toEqual([]);
  });

  it('reports a script that was renamed away', () => {
    expect(unknownScripts([tier('test:gone')], packageScripts)).toEqual([
      'test:gone',
    ]);
  });

  it('lists no tier twice', () => {
    expect(duplicateScripts(TIERS)).toEqual([]);
  });

  it('reports a tier listed twice', () => {
    expect(
      duplicateScripts([tier('test'), tier('lint'), tier('test')]),
    ).toEqual(['test']);
  });
});

describe('the tier list covers what CI runs', () => {
  const ciScripts = scriptsInWorkflow(ciYaml);

  it('reads the workflow it is meant to check', () => {
    // An empty parse would make the case below vacuous.
    expect(ciScripts.length).toBeGreaterThan(20);
    expect(ciScripts).toContain('faults');
  });

  it('runs or explains every script ci.yml invokes', () => {
    expect(uncoveredCiScripts(ciScripts, TIERS)).toEqual([]);
  });

  it('flags a CI script that is neither run nor explained', () => {
    expect(uncoveredCiScripts(['lint', 'test:invented'], TIERS)).toEqual([
      'test:invented',
    ]);
  });

  it('counts a composite only when every part is covered', () => {
    const composites = { bundle: ['lint', 'test:invented'] };
    expect(uncoveredCiScripts(['bundle'], TIERS, composites, {})).toEqual([
      'bundle',
    ]);
    expect(
      uncoveredCiScripts(['bundle'], TIERS, { bundle: ['lint', 'test'] }, {}),
    ).toEqual([]);
  });

  it('gives every deliberate omission a reason', () => {
    for (const [script, reason] of Object.entries(NOT_RUN_LOCALLY)) {
      expect(`${script}: ${reason}`.length).toBeGreaterThan(script.length + 20);
    }
  });

  it('does not excuse a script it actually runs', () => {
    const both = TIERS.map((t) => t.script).filter((s) => s in NOT_RUN_LOCALLY);
    expect(both).toEqual([]);
  });
});

describe('the tier list covers the tools CI runs directly', () => {
  const tools = toolsInWorkflow(ciYaml);

  it('finds the tools, rather than quietly finding none', () => {
    // This is the case that would have caught the bug that shipped this
    // check: the extraction regex held a literal backspace where  was
    // meant, matched nothing, and every assertion below passed vacuously.
    expect(tools.length).toBeGreaterThan(0);
    expect(tools).toContain('zizmor');
    expect(tools).toContain('knip');
  });

  it('runs or explains every tool ci.yml invokes directly', () => {
    expect(uncoveredCiTools(tools, TIERS)).toEqual([]);
  });

  it('flags a tool that is neither run nor explained', () => {
    expect(uncoveredCiTools(['semgrep'], TIERS)).toEqual(['semgrep']);
  });

  it('rejects a mapping to a tier that does not exist', () => {
    // Worse than no mapping: it reads as covered.
    expect(
      uncoveredCiTools(['semgrep'], TIERS, { semgrep: 'lint:nope' }, {}),
    ).toEqual(['semgrep: mapped to lint:nope, which is not a tier']);
  });

  it('gives every deliberate omission a reason', () => {
    for (const [tool, reason] of Object.entries(TOOLS_NOT_RUN_LOCALLY)) {
      expect(reason.length).toBeGreaterThan(20);
      expect(TOOLS_RUN_BY[tool]).toBeUndefined();
    }
  });
});

describe('toolsInWorkflow', () => {
  it.each([
    ['run: npx knip --no-exit-code', ['knip']],
    ['run: uvx zizmor@1.25.2 --config .zizmor.yml', ['zizmor']],
    ['run: pipx run black .', ['black']],
    ['run: npx @redocly/cli lint', ['@redocly/cli']],
  ])('reads %p', (line, expected) => {
    expect(toolsInWorkflow(line)).toEqual(expected);
  });

  it('strips a version pin so one tool is one tool', () => {
    expect(toolsInWorkflow('uvx zizmor@1.25.2\nuvx zizmor@1.26.0')).toEqual([
      'zizmor',
    ]);
  });

  it('skips a flag that follows the runner', () => {
    expect(toolsInWorkflow('npx --yes knip')).toEqual(['knip']);
  });

  it('finds nothing in a workflow that runs no tool directly', () => {
    expect(toolsInWorkflow('run: npm run lint')).toEqual([]);
  });
});

describe('selectTiers', () => {
  const all = [tier('a'), tier('b', 'built'), tier('c', 'slow')];

  it('runs quick and built by default', () => {
    expect(selectTiers(all, []).map((t) => t.script)).toEqual(['a', 'b']);
  });

  it('runs only the quick stage with --fast', () => {
    expect(selectTiers(all, ['--fast']).map((t) => t.script)).toEqual(['a']);
  });

  it('adds the slow tiers with --all', () => {
    expect(selectTiers(all, ['--all']).map((t) => t.script)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('refuses --fast and --all together rather than picking one', () => {
    expect(() => selectTiers(all, ['--fast', '--all'])).toThrow(
      VerifyLocalError,
    );
  });

  it('reaches every tier across the two stages that have a flag', () => {
    const reachable = new Set([
      ...selectTiers(TIERS, ['--all']).map((t) => t.script),
    ]);
    expect(reachable.size).toBe(TIERS.length);
  });
});

describe('the summary and the exit code', () => {
  it('exits zero only when every tier passed', () => {
    expect(exitCodeFor([result('a', true), result('b', true)])).toBe(0);
    expect(exitCodeFor([result('a', true), result('b', false)])).toBe(1);
  });

  it('exits non-zero when a tier was never reached', () => {
    expect(exitCodeFor([{ ...result('a', false), skipped: true, ms: 0 }])).toBe(
      1,
    );
  });

  it('names the command to re-run a failure', () => {
    const summary = renderSummary([result('a', true), result('faults', false)]);
    expect(summary).toContain('FAIL');
    expect(summary).toContain('re-run: npm run faults');
  });

  it('says so plainly when everything passed', () => {
    expect(renderSummary([result('a', true)])).toContain('1 tiers passed');
  });

  it('separates what failed from what was not reached', () => {
    const summary = renderSummary([
      result('build', false),
      { ...result('size', false), skipped: true, ms: 0 },
    ]);
    expect(summary).toContain('1 failed, 1 not reached');
    expect(summary).not.toContain('re-run: npm run size');
  });
});
