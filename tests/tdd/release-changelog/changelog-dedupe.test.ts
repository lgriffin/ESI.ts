/**
 * Self-tests for the release-notes clean-up (scripts/release/changelog-dedupe-core.ts, #377).
 *
 * A merge commit's body repeats its pull request's title, so release-please
 * lists the change twice. The clean-up drops the merge's line, but only when
 * the branch it merged has a commit of its own in the notes, so a change is
 * never removed outright.
 */
import {
  commitOf,
  dedupeNewestRelease,
  dropRepeatedEntries,
  isListedSubject,
  repeatedMerges,
} from '../../../scripts/release/changelog-dedupe-core';

const sha = (c: string) => c.repeat(40);
const bullet = (text: string, c: string, extra = '') =>
  `* ${text} ([${c.repeat(7)}](https://github.com/lgriffin/ESI.ts/commit/${sha(c)}))${extra}`;

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

describe('repeatedMerges', () => {
  it('keeps a merge whose branch has nothing release-please lists', () => {
    const repeats = repeatedMerges(
      new Map([
        [sha('a'), ['feat: the change', 'ci: tidy']],
        [sha('b'), ['ci: only ci', 'WIP']],
        [sha('c'), []],
      ]),
    );
    expect([...repeats]).toEqual([sha('a')]);
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
    bullet('**client:** add getters', 'a'),
    bullet(
      '**client:** add getters',
      'b',
      ', closes [#267](https://github.com/lgriffin/ESI.ts/issues/267)',
    ),
    '',
    '',
    '### Changed',
    '',
    bullet('**layout:** move configs', 'c'),
    '',
    '',
    '### Testing',
    '',
    bullet('add a check', 'd'),
    '',
  ].join('\n');

  it('drops the merge line and keeps the commit that closes the issue', () => {
    const out = dropRepeatedEntries(notes, new Set([sha('a')]));
    expect(out).not.toContain(sha('a'));
    expect(out).toContain(sha('b'));
    expect(out).toContain('closes [#267]');
  });

  it('drops a heading left with no lines under it', () => {
    const out = dropRepeatedEntries(notes, new Set([sha('c')]));
    expect(out).not.toContain('### Changed');
    expect(out).toContain('### Added');
    expect(out).toContain('### Testing');
  });

  it('drops a trailing heading left empty', () => {
    const out = dropRepeatedEntries(notes, new Set([sha('d')]));
    expect(out).not.toContain('### Testing');
  });

  it('keeps a heading whose list uses dashes, as the older releases do', () => {
    const older =
      '### Added\n\n- Something shipped by hand\n\n### Fixed\n\n- A fix\n';
    expect(dropRepeatedEntries(older, new Set([sha('a')]))).toBe(older);
  });

  it('leaves the notes alone when nothing repeats', () => {
    expect(dropRepeatedEntries(notes, new Set())).toBe(notes);
  });

  it('never drops a breaking-change note, which links no commit', () => {
    const breaking =
      '### ⚠ BREAKING CHANGES\n\n* Node 18 is no longer supported.\n';
    expect(dropRepeatedEntries(breaking, new Set([sha('a')]))).toBe(breaking);
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
      bullet('the change', 'a'),
      bullet('the change', 'b'),
      '',
      '## [10.2.0](x) (2026-09-19)',
      '',
      '### Added',
      '',
      bullet('old change', 'a'),
      '',
    ].join('\n');
    const out = dedupeNewestRelease(changelog, new Set([sha('a')]));
    const [newest, older] = out.split('## [10.2.0]');
    expect(newest).not.toContain(sha('a'));
    expect(newest).toContain(sha('b'));
    expect(older).toContain(sha('a'));
  });

  it('returns a changelog with no release unchanged', () => {
    expect(dedupeNewestRelease('# Changelog\n', new Set([sha('a')]))).toBe(
      '# Changelog\n',
    );
  });
});
