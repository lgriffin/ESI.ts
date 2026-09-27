/**
 * Self-tests for the charter audit (scripts/charter-audit-core.ts, PROC-06).
 *
 * The audit holds `guides/CHARTER.md` to the rules the spec audit applies to
 * a `Rule:` block, and fails an Enforced row that names no mechanism. The
 * first case runs it over the real charter, which is the check that matters;
 * the rest drive the parser and each rule with a fixture, so a rule that
 * stops firing fails here rather than passing the charter for the wrong
 * reason.
 */
import { execFileSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';

import {
  CharterBlock,
  Mechanisms,
  auditCharter,
  checkVerifiedBy,
  formatFindings,
  parseCharter,
} from '../../../scripts/charter-audit-core';

const ROOT = path.resolve(__dirname, '../../..');

function block(
  overrides: Partial<CharterBlock> & { text: string },
): CharterBlock {
  return {
    id: 'ARCH-01',
    pattern: 'Ubiquitous',
    status: 'Practised',
    line: 1,
    verifiedBy: '',
    ...overrides,
  };
}

const MECHANISMS: Mechanisms = {
  scripts: new Set(['lint', 'spec:audit']),
  jobs: new Set(['api-surface', 'API Surface Check']),
  workflows: new Set(['ci.yml']),
  files: ['scripts/spec-audit.ts', 'tests/tdd/core/security.test.ts'],
};

function messages(blocks: CharterBlock[], m: Mechanisms = MECHANISMS) {
  return auditCharter(blocks, m).map((f) => f.message);
}

const FIXTURE = `
## Part 2 · Architecture

#### ARCH-01 · Ubiquitous · Enforced

The library **shall** derive response types from the specification.

- **Why:** CCP changes ESI.
- **Verified by:** \`npm run spec:audit\` in CI.

#### ARCH-02 · Unwanted · Gap

If a request fails, then the client **shall** reject with an \`EsiError\`
carrying the status.

- **Why:** Callers branch on it.
- **Verified by:** To add.

---

## Part 3 · Design rules

Prose between the parts, with no requirement.

#### DES-01 · Event-driven · Practised

- **Why:** A block with no requirement paragraph.
`;

describe('the charter audit', () => {
  it('passes the real guides/CHARTER.md', () => {
    const markdown = readFileSync(
      path.join(ROOT, 'guides/CHARTER.md'),
      'utf-8',
    );
    const pkg = JSON.parse(
      readFileSync(path.join(ROOT, 'package.json'), 'utf-8'),
    ) as { scripts: Record<string, string> };
    const dir = path.join(ROOT, '.github/workflows');
    const workflows = new Set<string>();
    const jobs = new Set<string>();
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.yml'))) {
      workflows.add(file);
      const text = readFileSync(path.join(dir, file), 'utf-8');
      for (const m of text.matchAll(/^  ([A-Za-z0-9_-]+):\s*$/gm))
        jobs.add(m[1]!);
      for (const m of text.matchAll(/^    name:\s*(['"]?)(.+?)\1\s*$/gm))
        jobs.add(m[2]!);
    }
    const files = execFileSync('git', ['ls-files'], {
      cwd: ROOT,
      encoding: 'utf-8',
    })
      .split('\n')
      .filter((f) => f.length > 0);

    const blocks = parseCharter(markdown);
    // A parser that found nothing would make the audit pass vacuously.
    expect(blocks.length).toBeGreaterThan(50);
    expect(
      blocks.filter((b) => b.status === 'Enforced').length,
    ).toBeGreaterThan(20);

    const findings = auditCharter(blocks, {
      scripts: new Set(Object.keys(pkg.scripts)),
      jobs,
      workflows,
      files,
    });
    expect(formatFindings(findings, 'guides/CHARTER.md')).toEqual([]);
  });

  describe('parseCharter', () => {
    const blocks = parseCharter(FIXTURE);

    it('finds every #### block with its id, pattern, status and line', () => {
      expect(blocks.map((b) => [b.id, b.pattern, b.status, b.line])).toEqual([
        ['ARCH-01', 'Ubiquitous', 'Enforced', 4],
        ['ARCH-02', 'Unwanted', 'Gap', 11],
        ['DES-01', 'Event-driven', 'Practised', 25],
      ]);
    });

    it('takes the first paragraph as the requirement, joined across lines', () => {
      expect(blocks[0]?.text).toBe(
        'The library **shall** derive response types from the specification.',
      );
      expect(blocks[1]?.text).toBe(
        'If a request fails, then the client **shall** reject with an `EsiError` carrying the status.',
      );
    });

    it('reads the Verified by bullet without its label', () => {
      expect(blocks[0]?.verifiedBy).toBe('`npm run spec:audit` in CI.');
      expect(blocks[1]?.verifiedBy).toBe('To add.');
    });

    it('gives a block with only bullets an empty requirement', () => {
      expect(blocks[2]?.text).toBe('');
      expect(blocks[2]?.verifiedBy).toBe('');
    });
  });

  describe('auditCharter', () => {
    it('accepts a well-formed block', () => {
      expect(
        messages([
          block({
            status: 'Enforced',
            text: 'The client **shall** retry a 503 once.',
            verifiedBy: '`npm run lint`',
          }),
        ]),
      ).toEqual([]);
    });

    it('requires exactly one shall', () => {
      expect(
        messages([
          block({ text: 'The client **shall** retry and **shall** log.' }),
        ]),
      ).toEqual(["has 2 'shall'; a requirement states exactly one obligation"]);
      expect(messages([block({ text: 'The client retries.' })])).toEqual([
        "has 0 'shall'; a requirement states exactly one obligation",
      ]);
    });

    it('does not count a shall inside a code span or the cited word _shall_', () => {
      expect(
        messages([
          block({
            text: 'Each Rule **shall** state one requirement with one _shall_ in the form `the <system> shall <response>`.',
          }),
        ]),
      ).toEqual([]);
    });

    it('rejects a pronoun as the system and the wrong obligation keyword', () => {
      expect(
        messages([block({ text: 'When a call fails, it **shall** retry.' })]),
      ).toEqual([
        "Pronoun 'it' found before 'shall' — use an explicit system name.",
        "is declared Ubiquitous but its text reads as Event-driven (it opens with 'When')",
      ]);
      expect(
        messages([block({ text: 'The client **shall** retry and must log.' })]),
      ).toEqual(["uses 'must' where the obligation keyword is 'shall'"]);
    });

    it('rejects vague language', () => {
      expect(
        messages([block({ text: 'The client **shall** retry quickly.' })]),
      ).toEqual(["uses the vague adverb 'quickly', which cannot be verified"]);
    });

    it('applies the EARS structure rules to If and requires the header to match the text', () => {
      expect(
        messages([
          block({
            pattern: 'Unwanted',
            text: 'If a call fails the client **shall** retry.',
          }),
        ]),
      ).toEqual([
        "EARS 'If' pattern requires 'then' before 'shall' (template: If <condition>, then the <system> shall <response>).",
      ]);
      expect(
        messages([
          block({
            pattern: 'Unwanted',
            text: 'The client **shall** retry.',
          }),
        ]),
      ).toEqual([
        'is declared Unwanted but its text reads as Ubiquitous (no leading keyword)',
      ]);
    });

    it('rejects an unknown id, pattern or status, and a duplicate id', () => {
      expect(
        messages([
          block({
            id: 'ARCH-1',
            pattern: 'Always',
            status: 'Done',
            text: 'The client **shall** retry.',
          }),
        ]),
      ).toEqual([
        "id 'ARCH-1' is not PREFIX-NN",
        "pattern 'Always' is not one of Ubiquitous, Event-driven, State-driven, Optional, Unwanted",
        "status 'Done' is not one of Enforced, Practised, Partial, Gap",
      ]);
      expect(
        messages([
          block({ text: 'The client **shall** retry.' }),
          block({ text: 'The client **shall** log.', line: 9 }),
        ]),
      ).toEqual(["id 'ARCH-01' is used twice"]);
    });

    it('reports a block with no requirement paragraph once and stops there', () => {
      expect(messages([block({ status: 'Enforced', text: '' })])).toEqual([
        'has no requirement paragraph under the header',
      ]);
    });

    it('fails an Enforced block whose Verified by names nothing that exists', () => {
      const text = 'The client **shall** retry.';
      expect(
        messages([block({ status: 'Enforced', text, verifiedBy: '' })]),
      ).toEqual([
        'is Enforced but its "Verified by" has no "Verified by" line',
      ]);
      expect(
        messages([
          block({ status: 'Enforced', text, verifiedBy: 'Code review.' }),
        ]),
      ).toEqual([
        'is Enforced but its "Verified by" names no script, job or file (nothing in backticks)',
      ]);
      expect(
        messages([
          block({
            status: 'Enforced',
            text,
            verifiedBy: '`npm run nope` and `scripts/missing.ts`',
          }),
        ]),
      ).toEqual([
        'is Enforced but its "Verified by" names nothing that exists: `npm run nope`, `scripts/missing.ts`',
      ]);
      // Anything but Enforced may cite what does not exist yet.
      expect(
        messages([block({ status: 'Gap', text, verifiedBy: 'To add.' })]),
      ).toEqual([]);
    });
  });

  describe('checkVerifiedBy accepts each kind of mechanism', () => {
    it.each([
      ['an npm script', '`npm run spec:audit` on every PR'],
      ['a bare script name', 'the `lint` script'],
      ['a job id', 'the `api-surface` job in CI'],
      ['a quoted job display name', 'the "API Surface Check" job'],
      ['a workflow file', '`ci.yml`'],
      ['a tracked file', '`scripts/spec-audit.ts`'],
      ['a directory of tracked files', '`tests/tdd/core/`'],
      [
        'a bare file name found in the tree',
        '`security.test.ts` host allowlist',
      ],
      [
        'branch protection, which no file can hold',
        'GitHub branch protection.',
      ],
    ])('%s', (_kind, verifiedBy) => {
      expect(checkVerifiedBy(verifiedBy, MECHANISMS)).toBeNull();
    });

    it('does not accept a file that is not tracked or a script that is not defined', () => {
      expect(checkVerifiedBy('`scripts/other.ts`', MECHANISMS)).toMatch(
        /names nothing that exists/,
      );
      expect(checkVerifiedBy('`npm run other`', MECHANISMS)).toMatch(
        /names nothing that exists/,
      );
    });
  });
});
