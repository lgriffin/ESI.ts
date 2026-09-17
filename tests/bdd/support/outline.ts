/**
 * The shape of a feature file as the BDD runner sees it: Feature, then Rule,
 * then one entry per scenario that runs, with outline examples expanded.
 *
 * The binder plans and names its tests from this, and `scripts/bdd-report.ts`
 * reads the same outline to decide which scenarios a BDD run executed and to
 * label each JUnit test case with its Rule. Keeping one outline is what makes
 * those names agree: a scenario title here is the Jest test title, including
 * the `<placeholder>` substitution jest-cucumber applies to outline examples.
 *
 * jest-cucumber's parser flattens Rules into the feature's scenario list, so
 * each scenario's Rule is recovered from the line numbers of the `Rule:`
 * keywords in the source.
 *
 * Imports nothing but the parser, so a ts-node script can load it without
 * pulling in the client or the step library.
 */
import { parseFeature } from 'jest-cucumber';

type ParsedFeature = ReturnType<typeof parseFeature>;
export type ParsedStep = ParsedFeature['scenarios'][number]['steps'][number];

export interface OutlinedScenario {
  /** The Jest test title: an outline example's title has its values filled in. */
  title: string;
  /** The `Scenario:` line; every example of an outline shares its outline's line. */
  line: number;
  steps: ParsedStep[];
}

export interface OutlinedRule {
  /** Null for scenarios outside any Rule, which spec:audit rejects. */
  title: string | null;
  /** The `Rule:` line, or null with the title. */
  line: number | null;
  scenarios: OutlinedScenario[];
}

export interface FeatureOutline {
  title: string;
  /** Rules in file order. A Rule with no scenarios is absent; spec:audit rejects it. */
  rules: OutlinedRule[];
}

/** Line number and title of every `Rule:` keyword, skipping doc strings. */
function ruleLines(source: string): Array<{ line: number; title: string }> {
  const rules: Array<{ line: number; title: string }> = [];
  let fence: string | null = null;
  source.split(/\r?\n/).forEach((text, i) => {
    const trimmed = text.trim();
    if (fence) {
      if (trimmed.startsWith(fence)) fence = null;
      return;
    }
    if (trimmed.startsWith('"""') || trimmed.startsWith('```')) {
      fence = trimmed.slice(0, 3);
      return;
    }
    const match = /^Rule:\s*(.*)$/.exec(trimmed);
    if (match) rules.push({ line: i + 1, title: (match[1] ?? '').trim() });
  });
  return rules;
}

export function outlineFeature(source: string): FeatureOutline {
  const parsed = parseFeature(source);
  const rules = ruleLines(source);

  const scenarios = [
    ...parsed.scenarios.map((s) => ({ ...s, examples: [s] })),
    ...parsed.scenarioOutlines.map((o) => ({ ...o, examples: o.scenarios })),
  ].sort((a, b) => a.lineNumber - b.lineNumber);

  const outline: FeatureOutline = { title: parsed.title, rules: [] };
  const byRule = new Map<number | null, OutlinedRule>();

  for (const scenario of scenarios) {
    const owner = [...rules]
      .reverse()
      .find((r) => r.line < scenario.lineNumber);
    const ruleLine = owner ? owner.line : null;
    let rule = byRule.get(ruleLine);
    if (!rule) {
      rule = {
        title: owner ? owner.title : null,
        line: ruleLine,
        scenarios: [],
      };
      byRule.set(ruleLine, rule);
      outline.rules.push(rule);
    }
    for (const example of scenario.examples) {
      rule.scenarios.push({
        title: example.title,
        line: scenario.lineNumber,
        steps: example.steps,
      });
    }
  }

  return outline;
}
