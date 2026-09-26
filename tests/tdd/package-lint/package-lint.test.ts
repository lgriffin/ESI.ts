/**
 * Negative fixtures for the packaging checks: `npm run lint:package`
 * (publint and attw on the packed tarball, scripts/package-lint-core.ts) and
 * `npm run size` (size-limit budgets per exports sub-path,
 * scripts/size-limit-checks.cjs).
 *
 * Each tool runs for real against a tiny package written to a temporary
 * directory: one with a broken `exports` map, which both linters must
 * reject, a clean control they must pass, and a size fixture whose budget is
 * set below what its entry and shared chunk weigh. If a tool upgrade or a
 * wiring change stops a check from firing, these tests fail.
 *
 * Each suite runs where its tool does. attw 0.18 needs Node 20 or later, so
 * its suite is skipped on Node 18. size-limit 13 needs Node 22.18 or later
 * (its `engines`), so its suite is skipped on Node 18 and 20; the unit-tests
 * job runs it on 22, and the Package Lint job runs `npm run size` on 22.
 */
import { spawnSync } from 'child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  attwFindings,
  evaluate,
  evaluationProblems,
  formatPackagePath,
  packPackage,
  parseBaseline,
  runAttw,
  runPublint,
  type Finding,
} from '../../../scripts/package-lint-core';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SIZE_LIMIT_BIN = path.join(
  REPO_ROOT,
  'node_modules',
  'size-limit',
  'bin.js',
);
const SIZE_HELPER = path.join(REPO_ROOT, 'scripts', 'size-limit-checks.cjs');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { sizeLimitChecks } = require(SIZE_HELPER) as {
  sizeLimitChecks: (
    manifest: Record<string, unknown>,
    budgets: Record<string, Record<string, string>>,
  ) => Array<{ name: string; path: string; limit: string; ignore: string[] }>;
};

const [nodeMajor = 0, nodeMinor = 0] = process.versions.node
  .split('.')
  .map(Number);
const describeWithTools = nodeMajor >= 20 ? describe : describe.skip;
const describeWithSizeLimit =
  nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 18)
    ? describe
    : describe.skip;

function writeTree(root: string, files: Record<string, string>): void {
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
}

const finding = (key: string): Finding => ({
  key,
  tool: 'attw',
  severity: 'error',
  message: key,
});

describe('package lint: baseline evaluation', () => {
  const findings = [
    finding('attw:FalseCJS . node16-esm'),
    {
      ...finding('publint:USE_SIDE_EFFECTS name'),
      severity: 'suggestion' as const,
    },
  ];

  it('fails on a blocking finding the baseline does not list', () => {
    const result = evaluate(
      findings,
      {},
      { ref: 'origin/master', baseline: {} },
    );
    expect(result.unexpected.map((f) => f.key)).toEqual([
      'attw:FalseCJS . node16-esm',
    ]);
    expect(evaluationProblems(result)).toHaveLength(1);
  });

  it('never blocks on a suggestion', () => {
    const result = evaluate(
      [findings[1]!],
      {},
      { ref: 'origin/master', baseline: {} },
    );
    expect(evaluationProblems(result)).toEqual([]);
  });

  it('passes a baselined finding that the base branch already lists', () => {
    const baseline = { 'attw:FalseCJS . node16-esm': 'esi-23g.29' };
    const result = evaluate(findings, baseline, {
      ref: 'origin/master',
      baseline,
    });
    expect(evaluationProblems(result)).toEqual([]);
    expect(result.known).toHaveLength(1);
  });

  it('fails on a baseline entry that no longer occurs', () => {
    const baseline = { 'attw:FalseCJS ./gone node16-esm': 'esi-23g.29' };
    const result = evaluate([], baseline, { ref: 'origin/master', baseline });
    expect(result.stale).toEqual(['attw:FalseCJS ./gone node16-esm']);
    expect(evaluationProblems(result).join()).toMatch(/no longer occur/);
  });

  it('fails when the baseline grows relative to the base branch', () => {
    const baseline = { 'attw:FalseCJS . node16-esm': 'esi-23g.29' };
    const result = evaluate(findings, baseline, {
      ref: 'origin/master',
      baseline: {},
    });
    expect(result.added).toEqual(['attw:FalseCJS . node16-esm']);
    expect(evaluationProblems(result).join()).toMatch(/only shrinks/);
  });

  it('fails closed when no base ref resolves', () => {
    const baseline = { 'attw:FalseCJS . node16-esm': 'esi-23g.29' };
    const result = evaluate(findings, baseline, { ref: null, baseline: null });
    expect(evaluationProblems(result).join()).toMatch(/No base ref resolved/);
  });

  it('allows entries when the base ref predates the baseline file', () => {
    const baseline = { 'attw:FalseCJS . node16-esm': 'esi-23g.29' };
    const result = evaluate(findings, baseline, {
      ref: 'origin/master',
      baseline: null,
    });
    expect(evaluationProblems(result)).toEqual([]);
  });

  it('rejects a baseline entry that names no bead', () => {
    expect(() =>
      parseBaseline('{"findings":{"attw:FalseCJS . node16-esm":"later"}}'),
    ).toThrow(/must name the bead/);
  });

  it('formats package.json paths so sub-path keys stay readable', () => {
    expect(formatPackagePath(['exports', './sde/memory', 'types'])).toBe(
      'exports["./sde/memory"].types',
    );
    expect(formatPackagePath(['repository', 'url'])).toBe('repository.url');
  });

  it('only counts attw problems under node16-cjs, node16-esm and bundler', () => {
    const result = attwFindings({
      analysis: {
        types: { kind: 'included' },
        problems: [{ kind: 'NoResolution' }, { kind: 'FalseCJS' }],
        entrypoints: {
          './sub': {
            resolutions: {
              node10: { visibleProblems: [0] },
              'node16-cjs': { visibleProblems: [] },
              'node16-esm': { visibleProblems: [1] },
              bundler: {},
            },
          },
        },
      },
    });
    expect(result.map((f) => f.key)).toEqual([
      'attw:FalseCJS ./sub node16-esm',
    ]);
  });
});

describeWithTools('package lint: publint and attw on packed fixtures', () => {
  let work: string;
  const broken: { publint: Finding[]; attw: Finding[] } = {
    publint: [],
    attw: [],
  };
  const clean: { publint: Finding[]; attw: Finding[] } = {
    publint: [],
    attw: [],
  };

  // A root entry with CJS and ESM builds, each with its own declarations.
  const root = {
    'index.js': 'exports.answer = 42;',
    'index.mjs': 'export const answer = 42;',
    'index.d.ts': 'export declare const answer: number;',
    'index.d.mts': 'export declare const answer: number;',
  };
  const manifest = (name: string, extraExports: Record<string, unknown>) =>
    JSON.stringify({
      name,
      version: '1.0.0',
      license: 'MIT',
      type: 'commonjs',
      main: './index.js',
      types: './index.d.ts',
      exports: {
        '.': {
          import: { types: './index.d.mts', default: './index.mjs' },
          require: { types: './index.d.ts', default: './index.js' },
        },
        ...extraExports,
      },
    });

  beforeAll(() => {
    work = mkdtempSync(path.join(tmpdir(), 'esi-package-lint-fixture-'));
    const tarballs = path.join(work, 'tarballs');
    mkdirSync(tarballs);

    // Broken: the ./sub entry's `types` names a file the package does not ship.
    const brokenDir = path.join(work, 'broken');
    writeTree(brokenDir, {
      ...root,
      'sub.js': 'exports.sub = 1;',
      'sub.mjs': 'export const sub = 1;',
      'package.json': manifest('broken-exports-fixture', {
        './sub': {
          types: './sub.d.ts',
          import: './sub.mjs',
          require: './sub.js',
        },
      }),
    });
    const brokenTarball = packPackage(brokenDir, tarballs);
    broken.publint = runPublint(brokenTarball);
    broken.attw = runAttw(brokenTarball);

    // Clean control: the same package without the broken entry.
    const cleanDir = path.join(work, 'clean');
    writeTree(cleanDir, {
      ...root,
      'package.json': manifest('clean-exports-fixture', {}),
    });
    const cleanTarball = packPackage(cleanDir, tarballs);
    clean.publint = runPublint(cleanTarball);
    clean.attw = runAttw(cleanTarball);
  }, 180_000);

  afterAll(() => {
    rmSync(work, { recursive: true, force: true });
  });

  const blockingKeys = (findings: Finding[]) =>
    findings.filter((f) => f.severity !== 'suggestion').map((f) => f.key);

  it('publint reports exports types pointing at a missing file', () => {
    expect(blockingKeys(broken.publint)).toContain(
      'publint:FILE_DOES_NOT_EXIST exports["./sub"].types',
    );
  });

  it('attw reports the missing types under every supported resolution', () => {
    expect(blockingKeys(broken.attw)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^attw:\w+ \.\/sub node16-cjs$/),
        expect.stringMatching(/^attw:\w+ \.\/sub node16-esm$/),
        expect.stringMatching(/^attw:\w+ \.\/sub bundler$/),
      ]),
    );
  });

  it('the broken package fails the check with an empty baseline', () => {
    const result = evaluate(
      [...broken.publint, ...broken.attw],
      {},
      { ref: 'origin/master', baseline: {} },
    );
    expect(evaluationProblems(result)).not.toEqual([]);
  });

  it('the clean control passes both tools', () => {
    expect(blockingKeys(clean.publint)).toEqual([]);
    expect(blockingKeys(clean.attw)).toEqual([]);
  });
});

describe('package lint: reading the attw report', () => {
  let work: string;

  // Stand-ins for the attw CLI. Each writes its report the way attw 0.18 does
  // with --format json and problems found: one stdout write, then
  // process.exit(1) without waiting for the write to drain.
  const standIn = (name: string, body: string): string => {
    const file = path.join(work, name);
    writeFileSync(file, body);
    return file;
  };

  beforeAll(() => {
    work = mkdtempSync(path.join(tmpdir(), 'esi-attw-report-'));
  });

  afterAll(() => {
    rmSync(work, { recursive: true, force: true });
  });

  it('reads the whole report when attw exits 1 straight after writing about 1 MB', () => {
    const entrypoints = 4000;
    const cli = standIn(
      'large-report.cjs',
      `
      const resolution = { visibleProblems: [0] };
      const entrypoints = {};
      for (let i = 0; i < ${entrypoints}; i++) {
        entrypoints['./entry-' + i] = {
          resolutions: { 'node16-cjs': resolution, 'node16-esm': resolution, bundler: resolution },
        };
      }
      const analysis = { types: { kind: 'included' }, problems: [{ kind: 'FalseCJS' }], entrypoints };
      process.stdout.write(JSON.stringify({ analysis }, undefined, 2));
      process.exit(1);
      `,
    );
    const findings = runAttw('unused.tgz', cli);
    expect(findings).toHaveLength(entrypoints * 3);
    expect(findings.at(-1)!.key).toBe(
      `attw:FalseCJS ./entry-${entrypoints - 1} bundler`,
    );
  });

  it('names the tarball and the report length when the report is not complete JSON', () => {
    const cli = standIn(
      'truncated-report.cjs',
      `process.stdout.write('{"analysis": {"types": "inclu'); process.exit(1);`,
    );
    expect(() => runAttw('fixture.tgz', cli)).toThrow(
      /attw on fixture\.tgz \(exit 1\) wrote 29 characters that are not a complete JSON report/,
    );
  });

  it('fails when attw itself fails rather than reporting problems', () => {
    const cli = standIn(
      'crash.cjs',
      `process.stderr.write('boom'); process.exit(3);`,
    );
    expect(() => runAttw('fixture.tgz', cli)).toThrow(
      /attw failed to run on fixture\.tgz \(exit 3\)\nboom/,
    );
  });
});

describe('size budgets: configuration', () => {
  const manifest = {
    dependencies: { zod: '^4.0.0' },
    peerDependencies: { 'js-yaml': '>=3' },
    exports: {
      '.': { types: './a.d.ts', import: './a.mjs', require: './a.js' },
      './sub': { types: './b.d.ts', import: './b.mjs', require: './b.js' },
      './package.json': './package.json',
    },
  };
  const both = { import: '1 kB', require: '1 kB' };

  it('builds an ESM and a CJS check per sub-path, with dependencies external', () => {
    const checks = sizeLimitChecks(manifest, { '.': both, './sub': both });
    expect(checks.map((c) => `${c.name} ${c.path}`)).toEqual([
      '. (ESM) a.mjs',
      '. (CJS) a.js',
      './sub (ESM) b.mjs',
      './sub (CJS) b.js',
    ]);
    expect(checks[0]!.ignore).toEqual(['zod', 'js-yaml']);
  });

  it('fails when a sub-path has no budget', () => {
    expect(() => sizeLimitChecks(manifest, { '.': both })).toThrow(
      /no ESM budget for "\.\/sub"/,
    );
  });

  it('fails when a sub-path is missing one build budget', () => {
    expect(() =>
      sizeLimitChecks(manifest, { '.': both, './sub': { import: '1 kB' } }),
    ).toThrow(/no CJS budget for "\.\/sub"/);
  });

  it('fails when a budget names a sub-path that is not exported', () => {
    expect(() =>
      sizeLimitChecks(manifest, { '.': both, './sub': both, './gone': both }),
    ).toThrow(/"\.\/gone", which is not in package.json "exports"/);
  });

  it('the repository config has a budget for every exports sub-path and build', () => {
    const pkg = JSON.parse(
      readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'),
    ) as {
      exports: Record<string, unknown>;
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const checks = require(
      path.join(REPO_ROOT, '.size-limit.cjs'),
    ) as unknown[];
    const subpaths = Object.keys(pkg.exports).filter(
      (k) => k !== './package.json',
    );
    expect(checks).toHaveLength(subpaths.length * 2);
  });
});

describeWithSizeLimit('size budgets: size-limit on a built fixture', () => {
  let work: string;

  // Deterministic filler, well above the 1 kB budget below once minified.
  const filler = JSON.stringify('size budget fixture text. '.repeat(80));

  beforeAll(() => {
    work = mkdtempSync(path.join(tmpdir(), 'esi-size-limit-fixture-'));
    writeTree(work, {
      'package.json': JSON.stringify({
        name: 'size-limit-fixture',
        version: '1.0.0',
        private: true,
        dependencies: { zod: '^4.0.0' },
        // size-limit loads the plugins the project's manifest lists.
        devDependencies: {
          '@size-limit/esbuild': '*',
          '@size-limit/file': '*',
        },
        exports: {
          '.': { import: './dist/index.mjs', require: './dist/index.js' },
        },
      }),
      // The entry is a few bytes; the weight is in the shared chunk, as with
      // tsup's `splitting: true`. zod is a dependency and must stay external.
      'dist/index.mjs':
        "export { filler } from './chunk.mjs';\nexport const tiny = 1;\n",
      'dist/chunk.mjs': `import { z } from 'zod';\nexport const filler = [z, ${filler}];\n`,
      'dist/index.js':
        "'use strict';\nconst chunk = require('./chunk.js');\nexports.filler = chunk.filler;\nexports.tiny = 1;\n",
      'dist/chunk.js': `'use strict';\nconst { z } = require('zod');\nexports.filler = [z, ${filler}];\n`,
      '.size-limit.cjs': [
        `const { sizeLimitChecks } = require(${JSON.stringify(SIZE_HELPER)});`,
        "module.exports = sizeLimitChecks(require('./package.json'), {",
        // ESM gets room; the CJS budget is deliberately below the chunk's size.
        "  '.': { import: '5 kB', require: '1 kB' },",
        '});',
      ].join('\n'),
    });
  });

  afterAll(() => {
    rmSync(work, { recursive: true, force: true });
  });

  it('fails the check whose budget is below the entry plus its chunk', () => {
    const run = spawnSync(process.execPath, [SIZE_LIMIT_BIN, '--json'], {
      cwd: work,
      encoding: 'utf8',
    });
    const results = JSON.parse(
      run.stdout.slice(run.stdout.indexOf('[')),
    ) as Array<{
      name: string;
      passed: boolean;
      size: number;
    }>;

    expect(run.status).toBe(1);
    const byName = Object.fromEntries(results.map((r) => [r.name, r]));
    expect(byName['. (CJS)']).toMatchObject({ passed: false });
    expect(byName['. (ESM)']).toMatchObject({ passed: true });
    // The chunk is counted: the entry alone is well under 1 kB.
    expect(byName['. (ESM)']!.size).toBeGreaterThan(1500);
    expect(byName['. (CJS)']!.size).toBeGreaterThan(1500);
    // zod stays external: bundling it would add tens of kilobytes.
    expect(byName['. (ESM)']!.size).toBeLessThan(5000);
  }, 60_000);
});
