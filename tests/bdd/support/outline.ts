/**
 * The shape of a feature file as the BDD runner sees it: Feature, then Rule,
 * then one entry per scenario that runs, with outline examples expanded.
 *
 * The binder plans and names its tests from this, and `scripts/quality/bdd-report.ts`
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
  /** The tags written above the `Scenario:` line, as written: not lower-cased, none inherited. */
  tags: string[];
}

export interface OutlinedRule {
  /** Null for scenarios outside any Rule, which spec:audit rejects. */
  title: string | null;
  /** The `Rule:` line, or null with the title. */
  line: number | null;
  /** The tags written above the `Rule:` line; none for scenarios outside a Rule. */
  tags: string[];
  scenarios: OutlinedScenario[];
}

export interface FeatureOutline {
  title: string;
  /** The tags written above the `Feature:` line. */
  tags: string[];
  /** Rules in file order. A Rule with no scenarios is absent; spec:audit rejects it. */
  rules: OutlinedRule[];
}

/**
 * The tags on the lines above line `line` (1-based), as written. jest-cucumber
 * lower-cases tags and drops a Rule's, so they are read from the source:
 * Gherkin allows blank and comment lines between the tags and the keyword.
 */
function tagsAbove(lines: readonly string[], line: number): string[] {
  const tags: string[] = [];
  for (let i = line - 2; i >= 0; i--) {
    const text = (lines[i] ?? '').trim();
    if (text.length === 0 || text.startsWith('#')) continue;
    if (!text.startsWith('@')) break;
    const own = text
      .replace(/\s#.*$/, '')
      .split(/\s+/)
      .filter((t) => t.startsWith('@'));
    tags.unshift(...own);
  }
  return tags;
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
  const lines = source.split(/\r?\n/);
  const featureLine = lines.findIndex((l) => /^\s*Feature:/.test(l)) + 1;

  const scenarios = [
    ...parsed.scenarios.map((s) => ({ ...s, examples: [s] })),
    ...parsed.scenarioOutlines.map((o) => ({ ...o, examples: o.scenarios })),
  ].sort((a, b) => a.lineNumber - b.lineNumber);

  const outline: FeatureOutline = {
    title: parsed.title,
    tags: featureLine > 0 ? tagsAbove(lines, featureLine) : [],
    rules: [],
  };
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
        tags: owner ? tagsAbove(lines, owner.line) : [],
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
        tags: tagsAbove(lines, scenario.lineNumber),
      });
    }
  }

  return outline;
}
