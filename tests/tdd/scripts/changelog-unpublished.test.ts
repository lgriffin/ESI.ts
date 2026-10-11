/**
 * CHARTER REL-04: a version that was bumped but never published keeps its
 * changelog entry, headed `(not published)` (guides/RELEASE.md, "Bumped but
 * not published"). The list below is the set checked against npm; a number
 * found unpublished later is added here when its heading is marked.
 */
import { readFileSync } from 'fs';
import * as path from 'path';

const changelog = readFileSync(
  path.resolve(__dirname, '../../../CHANGELOG.md'),
  'utf8',
);

/** Written to package.json, never on npm (#275). */
const UNPUBLISHED = [
  '9.1.1',
  '9.1.2',
  '9.1.3',
  '9.2.0',
  '9.5.0',
  '9.5.1',
  '9.5.2',
  '9.6.1',
  '9.6.2',
  '9.8.0',
  '9.8.1',
  '9.9.0',
];

/** Every `## [x.y.z]` heading in the changelog, keyed by version. */
const headings = new Map(
  [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\](.*)$/gm)].map((m) => [
    m[1]!,
    m[2]!,
  ]),
);

describe('REL-04: the changelog records bumped but unpublished versions as unpublished', () => {
  it('reads the version headings', () => {
    expect(headings.size).toBeGreaterThan(UNPUBLISHED.length);
  });

  it.each(UNPUBLISHED)(
    'keeps an entry for %s headed (not published)',
    (version) => {
      expect(headings.get(version)).toMatch(/\(not published\)\s*$/);
    },
  );

  it('marks no other version as unpublished', () => {
    const marked = [...headings]
      .filter(([, rest]) => rest.includes('(not published)'))
      .map(([version]) => version);
    expect(marked).toHaveLength(UNPUBLISHED.length);
    expect(marked).toEqual(expect.arrayContaining(UNPUBLISHED));
  });
});
