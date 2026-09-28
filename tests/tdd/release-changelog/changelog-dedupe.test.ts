/**
 * Self-tests for the release-notes clean-up (scripts/release/changelog-dedupe-core.ts, #377).
 *
 * A merge commit's body repeats its pull request's title, so release-please
 * lists the change twice. The clean-up drops the merge's line, but only when
 * a commit on the merged branch has the same subject and its own line is in
 * the notes, so a change is never removed outright.
 */
import {
  commitOf,
  dedupeNewestRelease,
  dropRepeatedEntries,
  isListedSubject,
  mergeTwins,
} from '../../../scripts/release/changelog-dedupe-core';

const sha = (c: string) => c.repeat(40);
const bullet = (text: string, c: string, extra = '') =>
  `* ${text} ([${c.repeat(7)}](https://github.com/lgriffin/ESI.ts/commit/${sha(c)}))${extra}`;
const merge = (body: string[], branch: Array<[string, string]>) => ({
  body,
  branch: branch.map(([c, subject]) => ({ sha: sha(c), subject })),
});
const twinOf = (m: string, a: string) => new Map([[sha(m), [[sha(a)]]]]);

describe('isListedSubject', () => {
  it.each([
    'feat: add a thing',
    'fix(core): mend it',
    'feat!: require Node 22',
    'chore(deps): bump x',
    'docs: say so',
    'test(faults): pin it',
    'refactor: move it',
    'perf: make it quick',
  ])('lists %s', (subject) => {
    expect(isListedSubject(subject)).toBe(true);
  });

  it.each([
    'ci: tune the workflow',
    'build: pack it',
    'style: format',
    "Merge remote-tracking branch 'origin/master' into x",
    'WIP',
    'feat:missing space',
  ])('does not list %s', (subject) => {
    expect(isListedSubject(subject)).toBe(false);
  });
});

describe('mergeTwins', () => {
  it('pairs a merge with the branch commit that has its title word for word', () => {
    const twins = mergeTwins(
      new Map([
        [
          sha('c'),
          merge(
            ['feat: the change'],
            [
              ['a', 'feat: the change'],
              ['b', 'ci: tidy'],
            ],
          ),
        ],
      ]),
    );
    expect(twins.get(sha('c'))).toEqual([[sha('a')]]);
  });

  it('has no entry for a title that summarises differently named commits', () => {
    const twins = mergeTwins(
      new Map([
        [
          sha('c'),
          merge(
            ['feat(logger): redact URLs and route every line'],
            [
              ['a', 'fix(logger): redact query pairs'],
              ['b', 'docs(logging): say so'],
            ],
          ),
        ],
      ]),
    );
    expect(twins.size).toBe(0);
  });

  it('has no entry when the body lists nothing', () => {
    const twins = mergeTwins(
      new Map([
        [sha('c'), merge(['# Conflicts:', '#\tCLAUDE.md'], [['a', 'feat: x']])],
        [sha('d'), merge(['ci: only ci'], [['b', 'ci: only ci']])],
      ]),
    );
    expect(twins.size).toBe(0);
  });

  it('has no entry when only one of several listed lines is repeated', () => {
    const twins = mergeTwins(
      new Map([
        [sha('c'), merge(['feat: one', 'fix: two'], [['a', 'feat: one']])],
      ]),
    );
    expect(twins.size).toBe(0);
  });
});

describe('commitOf', () => {
  it('reads the full SHA from the commit link', () => {
    expect(commitOf(bullet('x', 'd'))).toBe(sha('d'));
    expect(commitOf('* a breaking-change note with no link')).toBeUndefined();
  });
});

describe('dropRepeatedEntries', () => {
  const notes = [
    '### Added',
    '',
    bullet('**client:** add getters', 'c'),
    bullet(
      '**client:** add getters',
      'a',
      ', closes [#267](https://github.com/lgriffin/ESI.ts/issues/267)',
    ),
    '',
    '',
    '### Changed',
    '',
    bullet('**layout:** move configs', 'd'),
    '',
    '',
    '### Testing',
    '',
    bullet('**layout:** move configs', 'b'),
    '',
  ].join('\n');

  it('drops the merge line and keeps the commit that closes the issue', () => {
    const out = dropRepeatedEntries(notes, twinOf('c', 'a'));
    expect(out).not.toContain(sha('c'));
    expect(out).toContain(sha('a'));
    expect(out).toContain('closes [#267]');
  });

  it('keeps the merge line when its twin has no line in the notes', () => {
    // release-please does not always list a merged branch's commits; then
    // the merge's line is the only entry for the change.
    expect(dropRepeatedEntries(notes, twinOf('c', 'e'))).toBe(notes);
  });

  it('drops a heading left with no lines under it', () => {
    const out = dropRepeatedEntries(notes, twinOf('d', 'b'));
    expect(out).not.toContain('### Changed');
    expect(out).toContain('### Added');
    expect(out).toContain('### Testing');
  });

  it('keeps a heading whose list uses dashes, as the older releases do', () => {
    const older =
      '### Added\n\n- Something shipped by hand\n\n### Fixed\n\n- A fix\n';
    expect(dropRepeatedEntries(older, twinOf('c', 'a'))).toBe(older);
  });

  it('leaves the notes alone when nothing repeats', () => {
    expect(dropRepeatedEntries(notes, new Map())).toBe(notes);
  });

  it('never drops a breaking-change note, which links no commit', () => {
    const breaking =
      '### ⚠ BREAKING CHANGES\n\n* Node 18 is no longer supported.\n';
    expect(dropRepeatedEntries(breaking, twinOf('c', 'a'))).toBe(breaking);
  });
});

describe('dedupeNewestRelease', () => {
  it('rewrites the newest release and leaves older ones as they are', () => {
    const changelog = [
      '# Changelog',
      '',
      '## [11.0.0](x) (2026-09-27)',
      '',
      '### Added',
      '',
      bullet('the change', 'c'),
      bullet('the change', 'a'),
      '',
      '## [10.2.0](x) (2026-09-19)',
      '',
      '### Added',
      '',
      bullet('old change', 'c'),
      bullet('old change', 'a'),
      '',
    ].join('\n');
    const out = dedupeNewestRelease(changelog, twinOf('c', 'a'));
    const [newest, older] = out.split('## [10.2.0]');
    expect(newest).not.toContain(sha('c'));
    expect(newest).toContain(sha('a'));
    expect(older).toContain(sha('c'));
  });

  it('returns a changelog with no release unchanged', () => {
    expect(dedupeNewestRelease('# Changelog\n', twinOf('c', 'a'))).toBe(
      '# Changelog\n',
    );
  });
});
