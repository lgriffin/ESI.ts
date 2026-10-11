/**
 * CHARTER PROC-01, PROC-02 and PROC-05 are about how agents work, which no
 * test can watch. What a test can hold is the instruction those habits come
 * from: both agent files point at Beads and at guides/BEADS.md, the guide
 * states the tracker and the conservative git policy once, and the agent
 * files carry pointers rather than copies.
 */
import { readFileSync } from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const read = (file: string): string =>
  readFileSync(path.join(ROOT, file), 'utf8');

const AGENT_FILES = ['CLAUDE.md', 'AGENTS.md'] as const;
const beadsGuide = read('guides/BEADS.md');

/** The Beads section of an agent file, from its heading to the next one. */
function beadsSection(text: string): string {
  const start = text.indexOf('## Beads Issue Tracker');
  if (start < 0) return '';
  const next = text.indexOf('\n## ', start + 1);
  return text.slice(start, next < 0 ? text.length : next);
}

describe('PROC-01: task tracking lives in Beads', () => {
  it.each(AGENT_FILES)(
    '%s names bd as the tracker, not markdown TODO lists',
    (file) => {
      const section = beadsSection(read(file));
      expect(section).toContain('Work is tracked in Beads (`bd`)');
      expect(section).toContain('not\nmarkdown TODO lists');
    },
  );

  it('guides/BEADS.md treats .beads/issues.jsonl as an exported snapshot', () => {
    expect(beadsGuide).toMatch(
      /snapshot is exported to \[`\.beads\/issues\.jsonl`\]/,
    );
  });
});

describe('PROC-02: under the conservative profile an agent does not commit, push or sync without being asked', () => {
  it('guides/BEADS.md states the conservative git policy as the default', () => {
    expect(beadsGuide).toMatch(
      /\*\*Git policy \(conservative, the default\):\*\* do not commit, push or run\s+`bd dolt push` unless explicitly asked/,
    );
  });

  it.each(AGENT_FILES)(
    '%s points at the agent git policy in guides/BEADS.md',
    (file) => {
      const section = beadsSection(read(file));
      expect(section).toContain('[guides/BEADS.md](guides/BEADS.md)');
      expect(section).toContain('the agent git\npolicy');
    },
  );
});

describe('PROC-05: agent instruction files carry pointers to guides, not copies', () => {
  // The Beads section was once a full quick reference, repeated three times
  // in AGENTS.md. It is now a pointer; these hold it there.
  const CEILING = 12;

  it.each(AGENT_FILES)(
    `%s has one Beads section of at most ${CEILING} lines`,
    (file) => {
      const text = read(file);
      expect(text.split('## Beads Issue Tracker').length - 1).toBe(1);
      expect(
        beadsSection(text).trimEnd().split('\n').length,
      ).toBeLessThanOrEqual(CEILING);
    },
  );

  it.each(AGENT_FILES)('%s copies no bd command reference', (file) => {
    const section = beadsSection(read(file));
    expect(section).not.toContain('```');
    expect(section).not.toMatch(/\bbd (ready|create|update|close)\b/);
  });
});
