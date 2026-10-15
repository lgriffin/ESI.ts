/**
 * The EARS dashboard: one HTML page that shows every requirement in the
 * specification, the EARS pattern it follows, what runs it, and what the last
 * `npm run ears` said about it.
 *
 * The page is for a reader new to the specification. It answers "which
 * requirements exist, which hold, and how do I write the next one?" without
 * opening 77 feature files. It reads the same sources the gates read, so it
 * says what CI says:
 *
 *   - the feature files, through the BDD outline (`tests/bdd/support/outline`);
 *   - the spec audit's own requirement-language checks
 *     (`scripts/spec/spec-audit-checks.ts`), run on every Rule title;
 *   - the feature bindings the audit checks (`featureBindings`);
 *   - `reports/ears/ears-report.json`, when `npm run ears` has written one,
 *     for the PASS / FAIL / NOT RUN verdicts and the audit result.
 *
 * Pure: it reads nothing from disk, so the unit suite drives it with
 * hand-built features. `scripts/quality/ears-dashboard.ts` is the command
 * around it, and `ears-dashboard-page.ts` holds the page itself.
 */
import type { FeatureOutline } from '../../tests/bdd/support/outline';
import {
  PRONOUNS_BEFORE_SHALL,
  VAGUE_TERMS,
  WRONG_OBLIGATION_KEYWORDS,
  charterIds,
  checkEarsPatternStructure,
  checkMissingSystemName,
  countShall,
  findVagueTerms,
  findWrongObligationKeywords,
} from '../spec/spec-audit-checks';
import {
  AuditResult,
  EarsPattern,
  EarsReport,
  Verdict,
  classifyEars,
  isExclusion,
} from './ears-core';

/** A verdict, or `unknown` when no `npm run ears` report was given. */
export type DashboardVerdict = Verdict | 'unknown';

export type Change = 'added' | 'changed';

export interface DashboardScenario {
  title: string;
  line: number;
  tags: string[];
}

export interface DashboardRule {
  /** `<feature file stem>#R<n>`, the id `npm run ears` reports. */
  id: string;
  title: string;
  line: number;
  pattern: EarsPattern;
  exclusion: boolean;
  verdict: DashboardVerdict;
  /** Why the verdict is not `verified`, from the report. */
  evidence: string;
  /** Charter ids on the Rule itself; the feature's apply as well. */
  charter: string[];
  tags: string[];
  scenarios: DashboardScenario[];
  /** The Rule's lines as written, from its tags to its last scenario. */
  source: string;
  sourceStart: number;
  /** What the spec audit's requirement-language checks say about the title. */
  findings: string[];
  change?: Change;
}

export interface DashboardFeature {
  file: string;
  /** `core`, `integration`, `performance` or `sde`: the folder under features/. */
  area: string;
  name: string;
  tags: string[];
  charter: string[];
  description: string;
  /** The spec entry or legacy step file that runs the feature. */
  boundBy: string[];
  rules: DashboardRule[];
  /** No `If …, then … shall` requirement: failure paths unspecified. */
  noUnwantedBehaviour: boolean;
  /** Scenarios outside any Rule, which verify nothing. */
  orphanScenarios: number;
}

export interface RemovedRule {
  file: string;
  title: string;
}

export interface PatternGuide {
  use: string;
  template: string;
}

export interface DashboardData {
  generatedAt: string;
  repoUrl: string;
  /** The commit the page was built from, for file links. */
  ref: string;
  /** When the `npm run ears` report was written, or null without one. */
  reportFrom: string | null;
  audit: AuditResult | null;
  since: string | null;
  removed: RemovedRule[];
  patterns: EarsPattern[];
  patternGuide: Record<EarsPattern, PatternGuide>;
  /** Per pattern, the shortest clean requirement: index into features and rules. */
  examples: Partial<Record<EarsPattern, { feature: number; rule: number }>>;
  vagueTerms: Record<string, string[]>;
  wrongObligations: string[];
  pronouns: string[];
  features: DashboardFeature[];
}

/** One feature file as the command hands it in. */
export interface FeatureInput {
  /** Repository-relative, forward slashes. */
  file: string;
  source: string;
  outline: FeatureOutline;
  boundBy: string[];
}

export const PATTERNS: EarsPattern[] = [
  'event-driven',
  'unwanted-behaviour',
  'state-driven',
  'optional-feature',
  'ubiquitous',
  'complex',
];

export const PATTERN_GUIDE: Record<EarsPattern, PatternGuide> = {
  'event-driven': {
    use: 'A discrete thing happens: a request is made, a response arrives, a method is called. Most requirements of a client wrapper are this.',
    template: 'When <trigger>, the <system> shall <response>.',
  },
  'unwanted-behaviour': {
    use: 'Something goes wrong: a non-2xx status, a timeout, a malformed payload, a missing field. Check this first. With "shall not" it states an exclusion, something the client deliberately does not do.',
    template: 'If <condition>, then the <system> shall <response>.',
  },
  'state-driven': {
    use: 'A condition that lasts: "how long does it last?" has a sensible answer, such as while the circuit breaker is open.',
    template: 'While <state>, the <system> shall <response>.',
  },
  'optional-feature': {
    use: 'Behaviour that applies only when a client option is set, such as enableETagCache or validateResponse.',
    template: 'Where <feature is enabled>, the <system> shall <response>.',
  },
  ubiquitous: {
    use: 'Always true, with no trigger. Use sparingly: an unconditional requirement is usually one whose condition was left implicit.',
    template: 'The <system> shall <response>.',
  },
  complex: {
    use: 'Two clauses before "shall", such as a state and a trigger. Classified by the report; prefer splitting into simpler Rules where the meaning allows.',
    template: 'While <state>, when <trigger>, the <system> shall <response>.',
  },
};

function stem(file: string): string {
  return (file.split('/').pop() ?? file).replace(/\.feature$/, '');
}

function area(file: string): string {
  const parts = file.split('/');
  const at = parts.indexOf('features');
  return at >= 0 && parts.length > at + 2 ? parts[at + 1]! : '(root)';
}

/** Line numbers (1-based) of every `Rule:` keyword, skipping doc strings. */
function ruleKeywordLines(lines: readonly string[]): number[] {
  const found: number[] = [];
  let fence: string | null = null;
  lines.forEach((text, i) => {
    const t = text.trim();
    if (fence) {
      if (t.startsWith(fence)) fence = null;
      return;
    }
    if (t.startsWith('"""') || t.startsWith('```')) {
      fence = t.slice(0, 3);
      return;
    }
    if (/^Rule:/.test(t)) found.push(i + 1);
  });
  return found;
}

/** The first line of an element: its own line, or the tag lines just above it. */
function startWithTags(lines: readonly string[], line: number): number {
  let start = line;
  while (start > 1 && (lines[start - 2] ?? '').trim().startsWith('@')) {
    start -= 1;
  }
  return start;
}

/**
 * The Rule's block: from its tags to the line before the next Rule's tags,
 * without the trailing blank and comment lines (section dividers) between.
 */
export function ruleSource(
  source: string,
  line: number,
): { text: string; start: number } {
  const lines = source.split(/\r?\n/);
  const starts = ruleKeywordLines(lines);
  const next = starts.find((l) => l > line);
  const start = startWithTags(lines, line);
  let end = next ? startWithTags(lines, next) - 1 : lines.length;
  while (end > line) {
    const t = (lines[end - 1] ?? '').trim();
    if (t.length === 0 || t.startsWith('#')) end -= 1;
    else break;
  }
  return { text: lines.slice(start - 1, end).join('\n'), start };
}

/** The prose between a keyword line and the first child element. */
function descriptionAfter(lines: readonly string[], line: number): string {
  const out: string[] = [];
  for (let i = line; i < lines.length; i++) {
    const t = (lines[i] ?? '').trim();
    if (
      /^(Rule|Scenario|Scenario Outline|Scenario Template|Example|Background):/.test(
        t,
      ) ||
      t.startsWith('@') ||
      t.startsWith('#')
    ) {
      break;
    }
    out.push(t);
  }
  return out.join('\n').trim();
}

/** Prose for reading: lines joined into paragraphs, blank lines kept as breaks. */
function reflow(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.split('\n').join(' '))
    .join('\n\n');
}

/**
 * What the spec audit's requirement-language checks say about one Rule: the
 * same functions `spec-audit.ts` calls, so a finding here is a finding there.
 */
export function ruleFindings(title: string, description: string): string[] {
  const findings: string[] = [];
  const shall = countShall(title);
  if (shall === 0) findings.push("The title has no 'shall'.");
  else if (shall > 1)
    findings.push(
      `The title has ${shall} 'shall's; a requirement has exactly one.`,
    );
  const wrong = findWrongObligationKeywords(title);
  if (wrong.length > 0)
    findings.push(
      `Obligation word(s) other than 'shall': ${wrong.join(', ')}.`,
    );
  for (const [term, category] of findVagueTerms(title)) {
    findings.push(`Vague language: '${term}' (${category}).`);
  }
  findings.push(...checkEarsPatternStructure(title));
  findings.push(...checkMissingSystemName(title));
  const hidden = description
    .split('\n')
    .filter((l) => l.trim().length > 0 && countShall(l) > 0).length;
  if (hidden > 0)
    findings.push(
      `The rationale holds ${hidden} line(s) with 'shall': a requirement hidden in prose.`,
    );
  return findings;
}

/** Build every feature's view, joining the outline to the report's verdicts. */
export function buildFeatures(
  inputs: readonly FeatureInput[],
  report: EarsReport | null,
): DashboardFeature[] {
  const verdicts = new Map(
    (report?.requirements ?? []).map((r) => [`${r.file}:${r.line}`, r]),
  );

  return [...inputs]
    .sort((a, b) => a.file.localeCompare(b.file))
    .map((input) => {
      const lines = input.source.split(/\r?\n/);
      const featureLine =
        lines.findIndex((l) => /^\s*Feature:/.test(l)) + 1 || 1;
      let n = 0;
      let orphanScenarios = 0;
      const rules: DashboardRule[] = [];

      for (const rule of input.outline.rules) {
        if (rule.title === null || rule.line === null) {
          orphanScenarios += rule.scenarios.length;
          continue;
        }
        n += 1;
        const { text, start } = ruleSource(input.source, rule.line);
        const known = verdicts.get(`${input.file}:${rule.line}`);
        rules.push({
          id: `${stem(input.file)}#R${n}`,
          title: rule.title,
          line: rule.line,
          pattern: classifyEars(rule.title),
          exclusion: isExclusion(rule.title),
          verdict: report ? (known?.verdict ?? 'unverified') : 'unknown',
          evidence: report
            ? (known?.evidence ?? 'The report holds no verdict for this Rule.')
            : '',
          charter: charterIds(rule.tags),
          tags: rule.tags,
          scenarios: rule.scenarios.map((s) => ({
            title: s.title,
            line: s.line,
            tags: s.tags,
          })),
          source: text,
          sourceStart: start,
          findings: ruleFindings(
            rule.title,
            descriptionAfter(lines, rule.line),
          ),
        });
      }

      return {
        file: input.file,
        area: area(input.file),
        name: input.outline.title,
        tags: input.outline.tags,
        charter: charterIds([
          ...input.outline.tags,
          ...rules.flatMap((r) => r.tags),
        ]),
        description: reflow(descriptionAfter(lines, featureLine)),
        boundBy: input.boundBy,
        rules,
        noUnwantedBehaviour:
          rules.length > 0 &&
          !rules.some((r) => r.pattern === 'unwanted-behaviour'),
        orphanScenarios,
      };
    });
}

/** A feature's Rules as they stood at an earlier ref: title to source. */
export interface RulesAt {
  file: string;
  rules: Array<{ title: string; source: string }>;
}

function normalise(source: string): string {
  return source
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Mark each Rule added or changed since `before`, and list the ones removed.
 * Rules are matched by file and title, since an `#R<n>` id moves whenever a
 * Rule above it is added or removed: a reworded title therefore reads as one
 * Rule removed and one added, which is what it is to a reader of the spec.
 */
export function markChanges(
  features: DashboardFeature[],
  before: readonly RulesAt[],
): RemovedRule[] {
  const then = new Map<string, string>();
  for (const f of before) {
    for (const r of f.rules) then.set(`${f.file}\n${r.title}`, r.source);
  }
  const now = new Set<string>();
  for (const f of features) {
    for (const r of f.rules) {
      const key = `${f.file}\n${r.title}`;
      now.add(key);
      const old = then.get(key);
      if (old === undefined) r.change = 'added';
      else if (normalise(old) !== normalise(r.source)) r.change = 'changed';
    }
  }
  const removed: RemovedRule[] = [];
  for (const f of before) {
    for (const r of f.rules) {
      if (!now.has(`${f.file}\n${r.title}`))
        removed.push({ file: f.file, title: r.title });
    }
  }
  return removed;
}

/**
 * Per pattern, the shortest requirement with no audit finding and no failing
 * verdict: a real example from the specification to copy the shape of.
 */
export function pickExamples(
  features: readonly DashboardFeature[],
): DashboardData['examples'] {
  const best: DashboardData['examples'] = {};
  const length = (at: { feature: number; rule: number }) =>
    features[at.feature]!.rules[at.rule]!.title.length;
  features.forEach((f, fi) =>
    f.rules.forEach((r, ri) => {
      if (r.findings.length > 0 || r.verdict === 'failing') return;
      if (r.verdict === 'unverified') return;
      const current = best[r.pattern];
      if (!current || r.title.length < length(current)) {
        best[r.pattern] = { feature: fi, rule: ri };
      }
    }),
  );
  return best;
}

export interface DashboardInput {
  features: readonly FeatureInput[];
  report: EarsReport | null;
  reportFrom: string | null;
  repoUrl: string;
  ref: string;
  generatedAt: string;
  since?: { ref: string; rules: readonly RulesAt[] };
}

export function buildDashboard(input: DashboardInput): DashboardData {
  const features = buildFeatures(input.features, input.report);
  const removed = input.since ? markChanges(features, input.since.rules) : [];
  return {
    generatedAt: input.generatedAt,
    repoUrl: input.repoUrl,
    ref: input.ref,
    reportFrom: input.report ? input.reportFrom : null,
    audit: input.report?.audit ?? null,
    since: input.since?.ref ?? null,
    removed,
    patterns: PATTERNS,
    patternGuide: PATTERN_GUIDE,
    examples: pickExamples(features),
    vagueTerms: Object.fromEntries(
      Object.entries(VAGUE_TERMS).map(([k, v]) => [k, [...v]]),
    ),
    wrongObligations: [...WRONG_OBLIGATION_KEYWORDS],
    pronouns: [...PRONOUNS_BEFORE_SHALL],
    features,
  };
}

/**
 * The data as a script-safe literal. JSON alone is not enough inside a
 * `<script>` element: a feature that says `</script>` would end it, and the
 * line separators U+2028/U+2029 end a JavaScript string in older engines.
 */
export function embedJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
