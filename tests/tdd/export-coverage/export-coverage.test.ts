/**
 * Self-tests for the export-coverage check (scripts/export-coverage.ts).
 *
 * The check claims that an export is referenced by a test only when a test
 * file holds an identifier the TypeScript checker resolves to it. The fixture
 * project under fixtures/project exercises each way that claim could go wrong
 * — a name only in a comment or string, an import with no use, a use inside
 * a fixtures directory, a name reached through `export *`, a renamed import
 * through the package name — so a check that stops seeing them fails here.
 */
import { execFileSync } from 'child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  ExportCoverageReport,
  analyseExportCoverage,
  applyBaseline,
  collectTestFiles,
  entryPointsFromPackage,
  loadBaseBaseline,
  parseBaseline,
  ratchetProblems,
  serializeBaseline,
} from '../../../scripts/export-coverage-core';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FIXTURE = path.join(__dirname, 'fixtures', 'project');

function relative(files: string[]): string[] {
  return files.map((file) =>
    path.relative(FIXTURE, file).split(path.sep).join('/'),
  );
}

function analyseFixture(): ExportCoverageReport {
  return analyseExportCoverage({
    root: FIXTURE,
    entries: entryPointsFromPackage(FIXTURE),
    testFiles: collectTestFiles(FIXTURE),
    packageName: 'export-coverage-fixture',
  });
}

/** Runs the CLI; returns its exit code and combined output. */
function runCli(
  args: string[],
  env: Record<string, string> = {},
): { status: number; output: string } {
  try {
    const stdout = execFileSync(
      process.execPath,
      ['-r', 'ts-node/register', 'scripts/export-coverage.ts', ...args],
      {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        env: {
          ...process.env,
          TS_NODE_TRANSPILE_ONLY: 'true',
          GITHUB_ACTIONS: '',
          GITHUB_STEP_SUMMARY: '',
          EXPORT_COVERAGE_BASE_REF: '',
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

describe('export coverage', () => {
  const report = analyseFixture();
  const entry = (subpath: string) =>
    report.entries.find((e) => e.subpath === subpath)!;

  describe('the public surface', () => {
    it('reads one entry per exports key, skipping ./package.json', () => {
      expect(report.entries.map((e) => e.subpath)).toEqual(['.', './extra']);
    });

    it('follows named, type-only and export * re-exports', () => {
      expect(entry('.').exported).toEqual([
        'ReferencedShape',
        'importedButUnused',
        'mentionedOnlyInText',
        'referenced',
        'unreferenced',
        'usedOnlyByAFixture',
        'viaStarReferenced',
        'viaStarUnreferenced',
      ]);
    });

    it('matches the tsup entry list for this repository', () => {
      expect(
        entryPointsFromPackage(REPO_ROOT).map((e) => [
          e.subpath,
          path.relative(REPO_ROOT, e.source).split(path.sep).join('/'),
        ]),
      ).toEqual([
        ['.', 'src/index.ts'],
        ['./schemas', 'src/schemas/index.ts'],
        ['./errors', 'src/errors.ts'],
        ['./testing', 'src/testing/index.ts'],
        ['./sde', 'src/sde/index.ts'],
        ['./sde/memory', 'src/sde/memory.ts'],
      ]);
    });

    it('rejects an exports map that disagrees with tsup.config.ts', () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'export-coverage-'));
      try {
        writeFileSync(
          path.join(dir, 'package.json'),
          JSON.stringify({
            exports: { '.': { types: './dist/index.d.ts' } },
          }),
        );
        writeFileSync(
          path.join(dir, 'tsup.config.ts'),
          "export default { entry: ['src/index.ts', 'src/other.ts'] };",
        );
        mkdirSync(path.join(dir, 'src'));
        writeFileSync(path.join(dir, 'src', 'index.ts'), 'export {};');

        expect(() => entryPointsFromPackage(dir)).toThrow(
          /built but not exported \[src\/other\.ts\]/,
        );
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('test files', () => {
    it('reads .ts and .mts files and skips fixtures directories', () => {
      expect(relative(collectTestFiles(FIXTURE))).toEqual([
        'tests/consumer.mts',
        'tests/uses.ts',
      ]);
    });
  });

  describe('references', () => {
    it('flags exactly the exports no test identifier resolves to', () => {
      expect(entry('.').unreferenced).toEqual([
        'importedButUnused',
        'mentionedOnlyInText',
        'unreferenced',
        'usedOnlyByAFixture',
        'viaStarUnreferenced',
      ]);
      expect(entry('./extra').unreferenced).toEqual(['extraUnreferenced']);
    });

    it('does not count a name that appears only in a comment or a string', () => {
      expect(entry('.').unreferenced).toContain('mentionedOnlyInText');
    });

    it('does not count an import that is never used', () => {
      expect(entry('.').unreferenced).toContain('importedButUnused');
    });

    it('does not count a use inside a fixtures directory', () => {
      expect(entry('.').unreferenced).toContain('usedOnlyByAFixture');
    });

    it('counts a use of a name reached through export *', () => {
      expect(entry('.').unreferenced).not.toContain('viaStarReferenced');
      expect(entry('.').unreferenced).toContain('viaStarUnreferenced');
    });

    it('counts a type-only export used in a type position', () => {
      expect(entry('.').unreferenced).not.toContain('ReferencedShape');
    });

    it('counts a renamed import through the package name', () => {
      expect(entry('./extra').unreferenced).not.toContain(
        'extraReferencedByPackageName',
      );
    });

    it('counts a use of the declaration for every entry that exports it', () => {
      expect(entry('./extra').exported).toContain('referenced');
      expect(entry('./extra').unreferenced).not.toContain('referenced');
    });
  });

  describe('the CLI', () => {
    const fixtureArg = path.relative(REPO_ROOT, FIXTURE);

    it('prints unreferenced exports grouped by entry point and exits 0', () => {
      const { status, output } = runCli(['--root', fixtureArg]);

      expect(status).toBe(0);
      expect(output).toContain(
        '.: 3/8 exports referenced by a test, 5 unreferenced',
      );
      expect(output).toContain(
        './extra: 2/3 exports referenced by a test, 1 unreferenced',
      );
      expect(output).toContain('  - viaStarUnreferenced');
    });

    it('fails --ci on unreferenced exports missing from the baseline', () => {
      const { status, output } = runCli(['--root', fixtureArg, '--ci']);

      expect(status).toBe(1);
      expect(output).toContain(
        '6 public exports are referenced by no test and are not in the baseline',
      );
      expect(output).toContain('./extra extraUnreferenced');
    });

    it('fails --ci closed when the baseline has entries and no git base ref', () => {
      // A copy outside the repository: no ref resolves, so no entry can be
      // shown to be on the base branch.
      const dir = mkdtempSync(path.join(tmpdir(), 'export-coverage-'));
      try {
        cpSync(FIXTURE, dir, { recursive: true });
        mkdirSync(path.join(dir, 'scripts'));
        writeFileSync(
          path.join(dir, 'scripts', 'export-coverage-baseline.json'),
          serializeBaseline(report),
        );

        const { status, output } = runCli(['--root', dir, '--ci'], {
          GIT_CEILING_DIRECTORIES: path.dirname(dir),
        });

        expect(status).toBe(1);
        expect(output).not.toContain('not in the baseline');
        expect(output).toContain(
          'No base ref resolved, so the 6 baseline entries cannot be shown not to be new',
        );
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('baseline ratchet', () => {
    const baseline = { '.': ['unreferenced'] };
    const reportWith = (unreferenced: string[]): ExportCoverageReport => ({
      testFileCount: 1,
      entries: [
        { subpath: '.', exported: ['a', 'unreferenced'], unreferenced },
      ],
    });
    const onMaster = { ref: 'origin/master', baseline };

    it('passes when the baseline lists exactly what is unreferenced', () => {
      const result = applyBaseline(
        reportWith(['unreferenced']),
        baseline,
        onMaster,
      );

      expect(ratchetProblems(result)).toEqual([]);
    });

    it('rejects an unreferenced export the baseline does not list', () => {
      const result = applyBaseline(
        reportWith(['unreferenced', 'a']),
        baseline,
        onMaster,
      );

      expect(result.unlisted).toEqual(['. a']);
    });

    it('rejects a stale entry that is now referenced', () => {
      const result = applyBaseline(reportWith([]), baseline, onMaster);

      expect(result.stale).toEqual(['. unreferenced']);
      expect(ratchetProblems(result)).toHaveLength(1);
    });

    it('rejects an entry the base branch baseline does not have', () => {
      const result = applyBaseline(reportWith(['unreferenced']), baseline, {
        ref: 'origin/master',
        baseline: {},
      });

      expect(result.added).toEqual(['. unreferenced']);
      expect(result.baseRefMissing).toBe(false);
    });

    it('fails closed when no base ref resolves', () => {
      const result = applyBaseline(reportWith(['unreferenced']), baseline, {
        ref: null,
        baseline: null,
      });

      expect(result.added).toEqual(['. unreferenced']);
      expect(ratchetProblems(result).join('\n')).toContain(
        'No base ref resolved',
      );
    });

    it('allows the baseline file to be introduced on a ref that lacks it', () => {
      const result = applyBaseline(reportWith(['unreferenced']), baseline, {
        ref: 'origin/master',
        baseline: null,
      });

      expect(result.added).toEqual([]);
    });

    it('reports no base ref when none of the refs resolve', () => {
      expect(
        loadBaseBaseline(FIXTURE, ['refs/heads/export-coverage-no-such-ref']),
      ).toEqual({ ref: null, baseline: null });
    });

    it('reports a ref with no baseline file as the introduction state', () => {
      expect(loadBaseBaseline(FIXTURE, ['HEAD'])).toEqual({
        ref: 'HEAD',
        baseline: null,
      });
    });

    it('round-trips the baseline file', () => {
      const report = analyseFixture();

      expect(parseBaseline(serializeBaseline(report))).toEqual({
        '.': entry('.').unreferenced,
        './extra': ['extraUnreferenced'],
      });
    });

    it('rejects a malformed baseline', () => {
      expect(() =>
        parseBaseline(JSON.stringify({ unreferenced: { '.': 'a' } })),
      ).toThrow(/must be an array/);
    });
  });
});
