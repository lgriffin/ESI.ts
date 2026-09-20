/**
 * Self-tests for the API SemVer gate (scripts/api-semver-gate-core.ts).
 *
 * The fixtures are small api-extractor reports: a base, an additive change,
 * a removal, a signature change, and the base re-ordered. Each verdict the
 * gate can reach has a test here, and the git readers run against a
 * throwaway repository shaped like GitHub's pull request merge checkout.
 */
import { execFileSync } from 'child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  compatibleReason,
  diffReports,
  evaluateGate,
  isBreakingCommit,
  readCommitMessages,
  readReportAt,
  reportLines,
} from '../../../scripts/api-semver-gate-core';

const fixture = (name: string): string =>
  readFileSync(path.join(__dirname, 'fixtures', `${name}.api.md`), 'utf8')
    // A Windows checkout with core.autocrlf rewrites the fixtures; the gate
    // must not care either way.
    .replace(/\r\n/g, '\n');

describe('API SemVer gate', () => {
  describe('reportLines', () => {
    it('drops blanks, comments, warnings, imports and bracket-only lines', () => {
      const lines = reportLines(
        [
          '',
          "import { z } from 'zod';",
          '// @public (undocumented)',
          '// Warning: (ae-forgotten-export) The symbol "X" needs to be exported',
          'export interface Foo {',
          '    // (undocumented)',
          '    bar: string;   ',
          '}',
          '};',
        ].join('\r\n'),
      );
      expect(lines).toEqual(['export interface Foo {', '    bar: string;']);
    });
  });

  describe('diffReports', () => {
    it('finds no change between identical reports', () => {
      expect(diffReports(fixture('base'), fixture('base'))).toEqual({
        removed: [],
        added: [],
      });
    });

    it('ignores member order and CRLF line endings', () => {
      const reordered = fixture('reordered').replace(/\n/g, '\r\n');
      expect(diffReports(fixture('base'), reordered)).toEqual({
        removed: [],
        added: [],
      });
    });

    it('reports an addition as added lines only', () => {
      const diff = diffReports(fixture('base'), fixture('additive'));
      expect(diff.removed).toEqual([]);
      expect(diff.added.map((l) => l.trim())).toEqual([
        'fetchAllCharacterAccessLists(characterId: number, concurrency?: number): Promise<AccessList[]>;',
        'label?: string;',
        "export type LogLevel = 'debug' | 'warn';",
      ]);
    });

    it('reports a removed member as a removed line', () => {
      const diff = diffReports(fixture('base'), fixture('removal'));
      expect(diff.removed.map((l) => l.trim())).toEqual([
        'getCharacterAccessLists(characterId: number): Promise<AccessList[]>;',
      ]);
      expect(diff.added).toEqual([]);
    });

    it('reports a signature change as one line removed and one added', () => {
      const diff = diffReports(fixture('base'), fixture('signature-change'));
      expect(diff.removed.map((l) => l.trim())).toEqual([
        'getAccessList(characterId: number, accessListId: number): Promise<AccessList>;',
      ]);
      expect(diff.added.map((l) => l.trim())).toEqual([
        'getAccessList(characterId: string, accessListId: number): Promise<AccessList>;',
      ]);
    });

    it('counts duplicate lines, so losing one of two identical lines is a removal', () => {
      const twice =
        'export interface A {\n    id: number;\n}\nexport interface B {\n    id: number;\n}\n';
      const once =
        'export interface A {\n    id: number;\n}\nexport interface B {\n}\n';
      expect(diffReports(twice, once).removed.map((l) => l.trim())).toEqual([
        'id: number;',
      ]);
    });

    it('treats a missing base report as all additions', () => {
      const diff = diffReports('', fixture('base'));
      expect(diff.removed).toEqual([]);
      expect(diff.added.length).toBeGreaterThan(0);
    });
  });

  describe('commit markers', () => {
    it.each([
      ['feat!: drop getCharacterAccessLists', true],
      ['fix(auth)!: require a redirect URI', true],
      ['refactor!: rename ILogger', true],
      [
        'feat: rework logging\n\nBREAKING CHANGE: ILogger gains fatal and trace',
        true,
      ],
      ['feat: rework logging\n\nBREAKING-CHANGE: ILogger gains fatal', true],
      ['feat: add fetchAllCharacterAccessLists', false],
      ['fix: tidy\n\nThis is not a BREAKING CHANGE: in the body prose', false],
      ['feat: rework logging\n\nBREAKING CHANGE:', false],
      ['docs: mention feat!: in prose', false],
    ])('%j is breaking: %s', (message, expected) => {
      expect(isBreakingCommit(message)).toBe(expected);
    });

    it('reads the reason from an API-Compatible trailer', () => {
      expect(
        compatibleReason(
          'feat(logging): accept a context argument\n\nAPI-Compatible: the new parameter is optional',
        ),
      ).toBe('the new parameter is optional');
    });

    it('ignores an API-Compatible trailer with no reason', () => {
      expect(compatibleReason('feat: x\n\nAPI-Compatible:')).toBeNull();
      expect(compatibleReason('feat: x')).toBeNull();
    });
  });

  describe('evaluateGate', () => {
    const removal = diffReports(fixture('base'), fixture('removal'));

    it('passes an unchanged report whatever the commits say', () => {
      const result = evaluateGate(diffReports('a: 1;', 'a: 1;'), ['feat: x']);
      expect(result).toMatchObject({ ok: true, verdict: 'unchanged' });
    });

    it('passes an additive change without a breaking marker', () => {
      const result = evaluateGate(
        diffReports(fixture('base'), fixture('additive')),
        ['feat(access-lists): add fetchAllCharacterAccessLists'],
      );
      expect(result).toMatchObject({ ok: true, verdict: 'additive' });
    });

    it('fails a removal when no commit declares a breaking change', () => {
      const result = evaluateGate(removal, [
        'feat(access-lists): simplify the client',
        'test: cover it',
      ]);
      expect(result.ok).toBe(false);
      expect(result.verdict).toBe('breaking-undeclared');
      expect(result.message).toContain(
        'getCharacterAccessLists(characterId: number): Promise<AccessList[]>;',
      );
      expect(result.message).toContain('API-Compatible:');
    });

    it('fails a signature change when no commit declares a breaking change', () => {
      const result = evaluateGate(
        diffReports(fixture('base'), fixture('signature-change')),
        ['fix: accept string ids'],
      );
      expect(result).toMatchObject({
        ok: false,
        verdict: 'breaking-undeclared',
      });
    });

    it('fails a removal when there are no commits at all', () => {
      expect(evaluateGate(removal, []).ok).toBe(false);
    });

    it('passes a removal when any commit carries the ! marker', () => {
      const result = evaluateGate(removal, [
        'test: cover it',
        'feat(access-lists)!: remove getCharacterAccessLists',
      ]);
      expect(result).toMatchObject({ ok: true, verdict: 'breaking-declared' });
      expect(result.message).toContain(
        'feat(access-lists)!: remove getCharacterAccessLists',
      );
    });

    it('passes a removal when a commit has a BREAKING CHANGE footer', () => {
      const result = evaluateGate(removal, [
        'feat: rework\n\nBREAKING CHANGE: getCharacterAccessLists is gone',
      ]);
      expect(result).toMatchObject({ ok: true, verdict: 'breaking-declared' });
    });

    it('passes a removal declared compatible, and repeats the reason and the lines', () => {
      const result = evaluateGate(removal, [
        'fix: tidy\n\nAPI-Compatible: the method moved to a base class',
      ]);
      expect(result).toMatchObject({
        ok: true,
        verdict: 'compatible-declared',
      });
      expect(result.message).toContain('the method moved to a base class');
      expect(result.message).toContain('getCharacterAccessLists');
    });

    it('prefers the breaking verdict when both markers are present', () => {
      const result = evaluateGate(removal, [
        'fix: tidy\n\nAPI-Compatible: optional',
        'feat!: remove it',
      ]);
      expect(result.verdict).toBe('breaking-declared');
    });

    describe('squash merges', () => {
      const commits = [
        'test: cover it',
        'feat!: remove getCharacterAccessLists',
      ];

      it('fails a declared break of several commits when the PR title lacks the marker', () => {
        const result = evaluateGate(removal, commits, {
          prTitle: 'Tidy the access list client',
        });
        expect(result).toMatchObject({
          ok: false,
          verdict: 'breaking-title-undeclared',
        });
        expect(result.message).toContain('Tidy the access list client');
        expect(result.message).toContain(
          'feat!: remove getCharacterAccessLists',
        );
      });

      it('passes when the PR title carries the marker too', () => {
        expect(
          evaluateGate(removal, commits, {
            prTitle: 'feat(access-lists)!: remove getCharacterAccessLists',
          }),
        ).toMatchObject({ ok: true, verdict: 'breaking-declared' });
      });

      it('does not need the title for a single commit, whose message a squash keeps', () => {
        expect(
          evaluateGate(removal, [commits[1]], { prTitle: 'Remove a method' }),
        ).toMatchObject({ ok: true, verdict: 'breaking-declared' });
      });

      it('does not need the title for a change declared compatible', () => {
        expect(
          evaluateGate(
            removal,
            ['fix: tidy\n\nAPI-Compatible: optional parameter', 'test: cover'],
            { prTitle: 'Tidy' },
          ),
        ).toMatchObject({ ok: true, verdict: 'compatible-declared' });
      });

      it('skips the title check when there is no pull request', () => {
        expect(evaluateGate(removal, commits)).toMatchObject({
          ok: true,
          verdict: 'breaking-declared',
        });
      });

      it('still fails an undeclared break whatever the title says', () => {
        expect(
          evaluateGate(removal, ['feat: a', 'test: b'], {
            prTitle: 'feat!: a',
          }),
        ).toMatchObject({ ok: false, verdict: 'breaking-undeclared' });
      });
    });

    it('truncates a long list of removed lines', () => {
      const many = Array.from({ length: 25 }, (_, i) => `m${i}(): void;`);
      const result = evaluateGate({ removed: many, added: [] }, []);
      expect(result.message).toContain('m19(): void;');
      expect(result.message).not.toContain('m20(): void;');
      expect(result.message).toContain('and 5 more');
    });
  });

  describe('git readers', () => {
    let repo: string;
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
    const writeReport = (name: string) => {
      mkdirSync(path.join(repo, 'etc'), { recursive: true });
      writeFileSync(path.join(repo, 'etc', 'esi.ts.api.md'), fixture(name));
    };

    beforeAll(() => {
      repo = mkdtempSync(path.join(tmpdir(), 'api-semver-gate-'));
      git('init', '--quiet', '--initial-branch=master');
      git('config', 'user.email', 'gate@example.com');
      git('config', 'user.name', 'Gate Test');
      git('config', 'commit.gpgsign', 'false');
      git('config', 'core.autocrlf', 'false');

      writeReport('base');
      git('add', '.');
      git('commit', '--quiet', '--no-verify', '-m', 'chore: base');

      // A pull request branch with two commits.
      git('checkout', '--quiet', '-b', 'pr');
      writeReport('removal');
      git('commit', '--quiet', '--no-verify', '-am', 'feat!: remove a method');
      writeFileSync(path.join(repo, 'notes.txt'), 'x');
      git('add', '.');
      git(
        'commit',
        '--quiet',
        '--no-verify',
        '-m',
        'docs: explain\n\nAPI-Compatible: not really',
      );

      // The base branch moves on after the pull request was opened.
      git('checkout', '--quiet', 'master');
      writeFileSync(path.join(repo, 'other.txt'), 'y');
      git('add', '.');
      git(
        'commit',
        '--quiet',
        '--no-verify',
        '-m',
        'fix!: an unrelated break on master',
      );

      // GitHub's refs/pull/N/merge: base tip merged with the pull request head.
      git('checkout', '--quiet', '--detach', 'master');
      git('merge', '--quiet', '--no-ff', '--no-edit', 'pr');
    });

    afterAll(() => {
      rmSync(repo, { recursive: true, force: true });
    });

    it('diffs the report between the base tip and the merge commit', () => {
      const diff = diffReports(
        readReportAt('HEAD^1', repo),
        readReportAt('HEAD', repo),
      );
      expect(diff.removed.map((l) => l.trim())).toEqual([
        'getCharacterAccessLists(characterId: number): Promise<AccessList[]>;',
      ]);
    });

    it('reads only the commits the pull request adds, not the base branch', () => {
      const messages = readCommitMessages('HEAD^1', 'HEAD^2', repo);
      expect(messages).toEqual([
        'docs: explain\n\nAPI-Compatible: not really',
        'feat!: remove a method',
      ]);
    });

    it('returns an empty report for a revision without the file', () => {
      const first = git('rev-list', '--max-parents=0', 'HEAD');
      // Build the commit without checking it out: the other tests read
      // HEAD^1 and HEAD^2, so moving HEAD here would break any that run after.
      const emptyTree = execFileSync('git', ['mktree'], {
        cwd: repo,
        encoding: 'utf8',
        input: '',
      }).trim();
      const empty = git('commit-tree', emptyTree, '-m', 'chore: empty');
      expect(readReportAt(empty, repo)).toBe('');
      expect(readReportAt(first, repo)).not.toBe('');
    });

    it('fails with a readable message for a revision that does not exist', () => {
      expect(() => readReportAt('HEAD^9', repo)).toThrow(
        /Cannot resolve revision "HEAD\^9"/,
      );
    });
  });
});
