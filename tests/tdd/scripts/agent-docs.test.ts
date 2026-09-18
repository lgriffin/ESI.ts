/**
 * Self-tests for the CLAUDE.md / AGENTS.md mirror check
 * (scripts/agent-docs-core.ts).
 *
 * The first case is the one that matters: the sections both agent files carry
 * must read the same. `Semantic Versioning (enforced)` is the reason — it says
 * when a change is major, that a break needs the user's approval, and how the
 * commit must be marked. Two copies of that rule, enforced in neither file, is
 * a rule that will eventually contradict itself, and an agent reading the
 * stale copy ships a break under `fix:`.
 *
 * The rest are the ways the check itself could stop working: a heading that
 * moved, a section that appears twice so "the" section is a guess, and an
 * extractor that quietly returns nothing.
 */
import { readFileSync } from 'fs';
import * as path from 'path';

import {
  MIRRORED_SECTIONS,
  mirrorProblems,
  sectionsOf,
} from '../../../scripts/agent-docs-core';

const ROOT = path.resolve(__dirname, '../../..');
const claude = readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');
const agents = readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');

describe('CLAUDE.md and AGENTS.md agree where they overlap', () => {
  it('reads both files', () => {
    // An empty read would make every case below vacuous.
    expect(claude.length).toBeGreaterThan(1000);
    expect(agents.length).toBeGreaterThan(1000);
  });

  it('finds the mirrored sections in CLAUDE.md', () => {
    const headings = [...sectionsOf(claude).keys()];
    for (const section of MIRRORED_SECTIONS) {
      expect(headings).toContain(section);
    }
  });

  it('states the same rules in both files', () => {
    expect(mirrorProblems(claude, agents)).toEqual([]);
  });

  it('still mirrors the semantic versioning rules specifically', () => {
    // Named on its own: this is the section the check exists for.
    expect(
      mirrorProblems(claude, agents, ['Semantic Versioning (enforced)']),
    ).toEqual([]);
  });

  it('leaves the bd-generated sections out, which do differ by design', () => {
    // `bd setup claude` and `bd setup codex` write these differently, so a
    // mirror over them would fail on the generator rather than on a rule.
    expect(MIRRORED_SECTIONS).not.toContain('Session Completion');
    expect(mirrorProblems(claude, agents, ['Session Completion'])).not.toEqual(
      [],
    );
  });
});

describe('mirrorProblems', () => {
  const both = '## A\n\nsame text\n\n## B\n\nother\n';

  it('passes two files that agree', () => {
    expect(mirrorProblems(both, both, ['A'])).toEqual([]);
  });

  it('reports a section whose text drifted', () => {
    const changed = '## A\n\ndifferent text\n\n## B\n\nother\n';
    expect(mirrorProblems(both, changed, ['A'])).toEqual([
      expect.stringContaining('"## A" differs between CLAUDE.md and AGENTS.md'),
    ]);
  });

  it('reports a section dropped from one file', () => {
    expect(mirrorProblems(both, '## B\n\nother\n', ['A'])).toEqual([
      expect.stringContaining('AGENTS.md has no "## A" section'),
    ]);
  });

  it('reports a section that appears twice, rather than picking one', () => {
    const twice = '## A\n\nsame text\n\n## A\n\nsame text\n';
    expect(mirrorProblems(both, twice, ['A'])).toEqual([
      expect.stringContaining('AGENTS.md has 2 "## A" sections'),
    ]);
  });

  it('ignores sections outside the mirrored list', () => {
    const differsAtB = '## A\n\nsame text\n\n## B\n\nchanged\n';
    expect(mirrorProblems(both, differsAtB, ['A'])).toEqual([]);
  });
});

describe('sectionsOf', () => {
  it('keeps a section body without its heading', () => {
    expect(
      sectionsOf('## A\n\nbody text\n\n## B\n\nsecond\n').get('A'),
    ).toEqual(['body text']);
  });

  it('keeps the last section body', () => {
    expect(sectionsOf('## A\n\nfirst\n\n## B\n\nlast\n').get('B')).toEqual([
      'last',
    ]);
  });

  it('keeps both bodies of a repeated heading', () => {
    expect(sectionsOf('## A\n\none\n\n## A\n\ntwo\n').get('A')).toEqual([
      'one',
      'two',
    ]);
  });

  it('does not treat a deeper heading as a section', () => {
    const md = '## A\n\nbody\n\n### Sub\n\nmore\n';
    expect([...sectionsOf(md).keys()]).toEqual(['A']);
    expect(sectionsOf(md).get('A')?.[0]).toContain('### Sub');
  });
});
