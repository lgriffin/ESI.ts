/**
 * Self-tests for the EARS dashboard (`npm run ears:dashboard`).
 *
 * Each case builds a small feature by hand, outlines it the way the BDD
 * runner does, and checks one thing the page shows: an id, a pattern, a
 * verdict, an audit finding, a change since a ref, or that feature text
 * cannot break out of the page's script.
 */
import type { EarsReport } from '../../../scripts/quality/ears-core';
import {
  FeatureInput,
  buildDashboard,
  buildFeatures,
  embedJson,
  markChanges,
  pickExamples,
  ruleFindings,
  ruleSource,
} from '../../../scripts/quality/ears-dashboard-core';
import { renderPage } from '../../../scripts/quality/ears-dashboard-page';
import { outlineFeature } from '../../bdd/support/outline';

const FILE = 'tests/bdd/features/core/0001-alpha.feature';

const WHEN = 'When a request succeeds, the client shall return the body.';
const IF =
  'If the server returns 404, then the circuit breaker shall not count the response.';

function feature(rules: string[], file = FILE): FeatureInput {
  const source = [
    '@TEST-10',
    'Feature: Alpha',
    '  The alpha client returns',
    '  what ESI sends.',
    '',
    ...rules.flatMap((title, i) => [
      '  # ── Section ──',
      '',
      ...(i === 1 ? ['  @DES-02'] : []),
      `  Rule: ${title}`,
      '    Why it matters.',
      '',
      `    Scenario: Case ${i + 1}`,
      '      Given a client',
      '      When it is called',
      '      Then it answers',
      '',
    ]),
  ].join('\n');
  return {
    file,
    source,
    outline: outlineFeature(source),
    boundBy: ['tests/bdd/specs/core/0001-alpha.spec.ts'],
  };
}

function report(
  verdicts: Array<['verified' | 'failing' | 'unverified', number]>,
): EarsReport {
  return {
    audit: 'passed',
    requirements: verdicts.map(([verdict, line], i) => ({
      id: `0001-alpha#R${i + 1}`,
      file: FILE,
      line,
      feature: 'Alpha',
      text: '',
      pattern: 'event-driven',
      exclusion: false,
      verdict,
      scenarios: 1,
      scenarioNames: [],
      passed: verdict === 'verified' ? 1 : 0,
      failed: verdict === 'failing' ? 1 : 0,
      notExecuted: verdict === 'unverified' ? 1 : 0,
      evidence: verdict === 'verified' ? '' : `${verdict} evidence`,
    })),
    noUnwantedBehaviour: [],
    orphanCases: 0,
  };
}

describe('EARS dashboard', () => {
  it('lists every Rule with the id, pattern and scenarios npm run ears reports', () => {
    const [f] = buildFeatures([feature([WHEN, IF])], null);

    expect(f!.area).toBe('core');
    expect(f!.name).toBe('Alpha');
    expect(f!.description).toBe('The alpha client returns what ESI sends.');
    expect(f!.charter).toEqual(['TEST-10', 'DES-02']);
    expect(f!.boundBy).toEqual(['tests/bdd/specs/core/0001-alpha.spec.ts']);
    expect(f!.rules.map((r) => [r.id, r.pattern, r.exclusion])).toEqual([
      ['0001-alpha#R1', 'event-driven', false],
      ['0001-alpha#R2', 'unwanted-behaviour', true],
    ]);
    expect(f!.rules[1]!.charter).toEqual(['DES-02']);
    expect(f!.rules[0]!.scenarios.map((s) => s.title)).toEqual(['Case 1']);
    expect(f!.noUnwantedBehaviour).toBe(false);
  });

  it('shows no verdict without a report and the report verdict with one', () => {
    const input = feature([WHEN, IF]);
    const lines = buildFeatures([input], null)[0]!.rules.map((r) => r.line);

    expect(
      buildFeatures([input], null)[0]!.rules.map((r) => r.verdict),
    ).toEqual(['unknown', 'unknown']);

    const [f] = buildFeatures(
      [input],
      report([
        ['verified', lines[0]!],
        ['failing', lines[1]!],
      ]),
    );
    expect(f!.rules.map((r) => r.verdict)).toEqual(['verified', 'failing']);
    expect(f!.rules[1]!.evidence).toBe('failing evidence');
  });

  it('marks a Rule the report does not hold as not run', () => {
    const [f] = buildFeatures([feature([WHEN])], report([]));
    expect(f!.rules[0]!.verdict).toBe('unverified');
  });

  it('takes a Rule from its tags to its last scenario, without the divider after it', () => {
    const input = feature([WHEN, IF]);
    const line = input.outline.rules[1]!.line!;
    const { text, start } = ruleSource(input.source, line);

    expect(start).toBe(line - 1);
    expect(text.split('\n')[0]).toBe('  @DES-02');
    expect(text).toContain(`Rule: ${IF}`);
    expect(text.trimEnd().endsWith('Then it answers')).toBe(true);

    const first = ruleSource(input.source, input.outline.rules[0]!.line!).text;
    expect(first).not.toContain('Section');
    expect(first.trimEnd().endsWith('Then it answers')).toBe(true);
  });

  it('reports what the spec audit checks would find in a Rule', () => {
    expect(ruleFindings(WHEN, 'Why it matters.')).toEqual([]);
    expect(
      ruleFindings('When a request succeeds, the client should return it.', ''),
    ).toEqual(
      expect.arrayContaining([
        "The title has no 'shall'.",
        "Obligation word(s) other than 'shall': should.",
      ]),
    );
    expect(ruleFindings(WHEN, 'The cache shall also be cleared.')[0]).toMatch(
      /requirement hidden in prose/,
    );
    expect(
      ruleFindings('When a request succeeds, it shall return quickly.', ''),
    ).toEqual(
      expect.arrayContaining([
        "Vague language: 'quickly' (vague adverb).",
        expect.stringMatching(/Pronoun 'it'/),
      ]),
    );
  });

  it('marks Rules added or changed since a ref and lists the ones removed', () => {
    const features = buildFeatures([feature([WHEN, IF])], null);
    const was = features[0]!.rules[1]!.source;
    const removed = markChanges(features, [
      {
        file: FILE,
        rules: [
          { title: IF, source: was.replace('Case 2', 'Old case') },
          { title: 'The client shall log.', source: '' },
        ],
      },
    ]);

    expect(features[0]!.rules.map((r) => r.change)).toEqual([
      'added',
      'changed',
    ]);
    expect(removed).toEqual([{ file: FILE, title: 'The client shall log.' }]);
  });

  it('leaves a Rule unmarked when only trailing whitespace changed', () => {
    const features = buildFeatures([feature([WHEN])], null);
    const source = features[0]!.rules[0]!.source.replace(/\n/g, '  \n');
    markChanges(features, [{ file: FILE, rules: [{ title: WHEN, source }] }]);
    expect(features[0]!.rules[0]!.change).toBeUndefined();
  });

  it('takes the shortest clean, verified Rule of each pattern as its example', () => {
    const short = 'When asked, the client shall answer.';
    const bad = 'When asked, the client should answer.';
    const input = feature([WHEN, short, bad, IF]);
    const lines = input.outline.rules.map((r) => r.line!);
    const features = buildFeatures(
      [input],
      report([
        ['verified', lines[0]!],
        ['verified', lines[1]!],
        ['verified', lines[2]!],
        ['unverified', lines[3]!],
      ]),
    );

    const examples = pickExamples(features);
    expect(examples['event-driven']).toEqual({ feature: 0, rule: 1 });
    expect(examples['unwanted-behaviour']).toBeUndefined();
  });

  it('embeds feature text that says </script> without closing the page script', () => {
    const input = feature([
      'When a body holds </script><b>x</b>, the client shall return it.',
    ]);
    const data = buildDashboard({
      features: [input],
      report: null,
      reportFrom: null,
      repoUrl: 'https://example.invalid/repo',
      ref: 'abc',
      generatedAt: '2026-10-15T00:00:00.000Z',
    });
    const page = renderPage(data);

    expect(page.match(/<\/script>/g)).toHaveLength(2);
    expect(embedJson('a b')).toBe('"a\\u2028b"');
    const json =
      /<script type="application\/json" id="data">(.*)<\/script>/.exec(
        page,
      )![1]!;
    const back = JSON.parse(json) as typeof data;
    expect(back.features[0]!.rules[0]!.title).toContain('</script><b>x</b>');
  });
});
