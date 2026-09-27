/**
 * The EARS requirement report: one verdict per requirement, not per scenario.
 *
 * `bdd-report-core` joins a BDD run to the feature files scenario by
 * scenario. This rolls that ledger up to the `Rule:` blocks, which are the
 * EARS requirements, so the question it answers is "which requirements hold?"
 * rather than "which tests passed?":
 *
 *   - verified:   every scenario under the Rule ran and passed;
 *   - failing:    at least one scenario under the Rule ran and failed;
 *   - unverified: nothing failed, but at least one scenario did not run, so
 *                 the Rule is documentation rather than protection.
 *
 * It also classifies each requirement by its EARS pattern, lists the
 * exclusion register (every unwanted-behaviour Rule whose response is
 * negated, `shall not`: what the client deliberately does not do, CHARTER
 * TEST-11) and gives advisory feedback on the specification's shape. The
 * register and the feedback never change the exit code; the verdicts and the
 * spec audit do.
 *
 * Pure: it reads nothing from disk, so the unit suite can drive it with
 * hand-built ledgers. `scripts/quality/ears.ts` is the command around it.
 */
import type { ScenarioCase } from './bdd-report-core';

export type EarsPattern =
  | 'ubiquitous'
  | 'event-driven'
  | 'state-driven'
  | 'unwanted-behaviour'
  | 'optional-feature'
  | 'complex';

export type Verdict = 'verified' | 'failing' | 'unverified';

/** A feature's Rules as the BDD outline sees them, in file order. */
export interface OutlineSummary {
  /** Repository-relative, forward slashes. */
  file: string;
  feature: string;
  rules: Array<{
    title: string | null;
    line: number | null;
    scenarios: number;
  }>;
}

export interface Requirement {
  /** `<feature file stem>#R<n>`, n counting Rules from 1 in file order. */
  id: string;
  file: string;
  line: number;
  feature: string;
  text: string;
  pattern: EarsPattern;
  /**
   * An unwanted-behaviour Rule whose response is negated (`shall not`): the
   * client deliberately does not do this. Listed in the exclusion register.
   */
  exclusion: boolean;
  verdict: Verdict;
  scenarios: number;
  /** The scenarios under the Rule that the run saw, in file order. */
  scenarioNames: string[];
  passed: number;
  failed: number;
  notExecuted: number;
  /** The first failing or unexecuted scenario and why, for a verdict other than verified. */
  evidence: string;
}

export type AuditResult = 'passed' | 'failed' | 'skipped';

export interface EarsReport {
  audit: AuditResult;
  requirements: Requirement[];
  /** Features with no If/then requirement: no stated unwanted behaviour. */
  noUnwantedBehaviour: Array<{ file: string; feature: string }>;
  /** Requirements whose Rule has no scenario the outline can see. */
  orphanCases: number;
}

const CLAUSES: Array<[RegExp, EarsPattern]> = [
  [/^if\b/, 'unwanted-behaviour'],
  [/^while\b/, 'state-driven'],
  [/^when\b/, 'event-driven'],
  [/^where\b/, 'optional-feature'],
];

/**
 * The EARS template a requirement follows, from its leading keyword. A
 * requirement that opens one clause and adds another before `shall`
 * ("While offline, when a request fails, the client shall …") is complex.
 */
export function classifyEars(text: string): EarsPattern {
  const lower = text.trim().toLowerCase();
  const lead = CLAUSES.find(([pattern]) => pattern.test(lower));
  if (!lead) return 'ubiquitous';

  const shall = lower.indexOf('shall');
  const preamble = shall === -1 ? lower : lower.slice(0, shall);
  const extra = /,\s*(?:if|while|when|where)\b/.test(preamble);
  return extra ? 'complex' : lead[1];
}

/**
 * Whether a requirement is an exclusion: an unwanted-behaviour Rule whose
 * response is negated (`If <condition>, then the <system> shall not
 * <response>.`). A `shall not` after a comma in the response, or in a
 * ubiquitous or event-driven Rule, is a prohibition inside a positive
 * requirement, not a stated exclusion, so only the `If … then` form counts.
 */
export function isExclusion(text: string): boolean {
  if (classifyEars(text) !== 'unwanted-behaviour') return false;
  const lower = text.trim().toLowerCase();
  // The standalone word, as the spec audit finds it: "authenticated" holds a
  // "then" that is not the delimiter.
  const then = /\bthen\b/.exec(lower)?.index ?? -1;
  const response = then === -1 ? lower : lower.slice(then);
  return /\bshall\s+not\b/.test(response.split(',')[0] ?? response);
}

function stem(file: string): string {
  const base = file.split('/').pop() ?? file;
  return base.replace(/\.feature$/, '');
}

function firstLine(text: string): string {
  return (
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0 && l !== '● Test suite failed to run') ?? ''
  );
}

/**
 * Roll a scenario ledger up to requirements. `cases` is `Ledger.cases`, which
 * `buildLedger` emits per feature in outline order, Rule by Rule; the outline
 * says how many consecutive cases belong to each Rule.
 */
export function buildReport(
  outlines: readonly OutlineSummary[],
  cases: readonly ScenarioCase[],
  audit: AuditResult,
): EarsReport {
  const byFile = new Map<string, ScenarioCase[]>();
  for (const c of cases) byFile.set(c.file, [...(byFile.get(c.file) ?? []), c]);

  const report: EarsReport = {
    audit,
    requirements: [],
    noUnwantedBehaviour: [],
    orphanCases: 0,
  };

  for (const outline of outlines) {
    const pending = [...(byFile.get(outline.file) ?? [])];
    let n = 0;
    let unwanted = false;

    for (const rule of outline.rules) {
      const own = pending.splice(0, rule.scenarios);
      if (rule.title === null) {
        report.orphanCases += own.length;
        continue;
      }
      n += 1;
      const pattern = classifyEars(rule.title);
      if (pattern === 'unwanted-behaviour') unwanted = true;

      const passed = own.filter((c) => c.status === 'passed').length;
      const failed = own.filter((c) => c.status === 'failed');
      const notRun = own.filter((c) => c.status === 'not-executed');
      const short = rule.scenarios - own.length;

      let verdict: Verdict = 'verified';
      let evidence = '';
      if (failed.length > 0) {
        verdict = 'failing';
        const c = failed[0]!;
        evidence = `Scenario '${c.scenario}' (${c.file}:${c.line}) failed: ${firstLine(c.detail) || 'no message'}`;
      } else if (notRun.length > 0 || short > 0 || rule.scenarios === 0) {
        verdict = 'unverified';
        const c = notRun[0];
        evidence = c
          ? `Scenario '${c.scenario}' (${c.file}:${c.line}) did not run. ${c.detail}`
          : 'No scenario under this Rule appears in the run.';
      }

      report.requirements.push({
        id: `${stem(outline.file)}#R${n}`,
        file: outline.file,
        line: rule.line ?? 1,
        feature: outline.feature,
        text: rule.title,
        pattern,
        exclusion: isExclusion(rule.title),
        verdict,
        scenarios: rule.scenarios,
        scenarioNames: own.map((c) => c.scenario),
        passed,
        failed: failed.length,
        notExecuted: notRun.length + short,
        evidence,
      });
    }

    if (n > 0 && !unwanted) {
      report.noUnwantedBehaviour.push({
        file: outline.file,
        feature: outline.feature,
      });
    }
  }

  return report;
}

/** Whether the report should fail the command. */
export function reportFails(report: EarsReport): boolean {
  return (
    report.audit === 'failed' ||
    report.requirements.length === 0 ||
    report.requirements.some((r) => r.verdict !== 'verified')
  );
}

/** Why the report fails, naming the audit and the verdicts separately. */
export function failureReason(report: EarsReport): string {
  if (report.requirements.length === 0)
    return 'no EARS requirement was found to verify.';
  const reasons: string[] = [];
  if (report.audit === 'failed')
    reasons.push(
      'the spec audit failed, so the requirements are not all well-formed EARS',
    );
  const broken = report.requirements.filter(
    (r) => r.verdict !== 'verified',
  ).length;
  if (broken > 0) reasons.push(`${broken} requirement(s) are not verified`);
  return `${reasons.join('; ')}.`;
}

function count<T>(items: readonly T[], test: (item: T) => boolean): number {
  return items.filter(test).length;
}

const PATTERNS: EarsPattern[] = [
  'event-driven',
  'unwanted-behaviour',
  'state-driven',
  'optional-feature',
  'ubiquitous',
  'complex',
];

const MARK: Record<Verdict, string> = {
  verified: 'PASS',
  failing: 'FAIL',
  unverified: 'NOT RUN',
};

/** Text safe inside a Markdown table cell. */
function cell(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

/** The console summary: totals, then every requirement that is not verified. */
export function toConsole(report: EarsReport): string {
  const reqs = report.requirements;
  const verified = count(reqs, (r) => r.verdict === 'verified');
  const failing = reqs.filter((r) => r.verdict === 'failing');
  const unverified = reqs.filter((r) => r.verdict === 'unverified');
  const features = new Set(reqs.map((r) => r.file)).size;
  const exclusions = count(reqs, (r) => r.exclusion);

  const lines = [
    '',
    'EARS requirements',
    '=================',
    `Spec audit (well-formed):  ${report.audit.toUpperCase()}`,
    `Requirements:              ${reqs.length} across ${features} features`,
    `  verified:                ${verified}`,
    `  failing:                 ${failing.length}`,
    `  not run:                 ${unverified.length}`,
    `Exclusions (shall not):    ${exclusions}`,
    '',
  ];

  for (const r of [...failing, ...unverified]) {
    lines.push(
      `[${MARK[r.verdict]}] ${r.id}  ${r.file}:${r.line}`,
      `    ${r.text}`,
      `    ${r.evidence}`,
      '',
    );
  }

  lines.push(
    reportFails(report)
      ? `FAIL: ${failureReason(report)}`
      : `PASS: all ${reqs.length} EARS requirements are verified.`,
  );
  return lines.join('\n');
}

/** The full Markdown report: verdicts, feedback, then every requirement by feature. */
export function toMarkdown(report: EarsReport, generatedAt: string): string {
  const reqs = report.requirements;
  const verdicts = (v: Verdict) => count(reqs, (r) => r.verdict === v);
  const single = count(reqs, (r) => r.scenarios === 1);

  const lines = [
    '# EARS requirement report',
    '',
    `Generated ${generatedAt} by \`npm run ears\`.`,
    '',
    '| Spec audit | Requirements | Verified | Failing | Not run |',
    '| ---------- | -----------: | -------: | ------: | ------: |',
    `| ${report.audit} | ${reqs.length} | ${verdicts('verified')} | ${verdicts('failing')} | ${verdicts('unverified')} |`,
    '',
    reportFails(report)
      ? `**Result: FAIL.** ${failureReason(report)}`
      : report.audit === 'skipped'
        ? '**Result: PASS.** Every scenario under every requirement ran and passed. The spec audit was skipped, so well-formedness was not checked.'
        : '**Result: PASS.** Every requirement is well-formed and every scenario under it ran and passed.',
    '',
  ];

  const broken = reqs.filter((r) => r.verdict !== 'verified');
  if (broken.length > 0) {
    lines.push(
      '## Requirements not verified',
      '',
      '| Id | Result | Requirement | Why |',
      '| -- | ------ | ----------- | --- |',
    );
    for (const r of broken) {
      lines.push(
        `| \`${r.id}\` | ${MARK[r.verdict]} | ${cell(r.text)} | ${cell(r.evidence)} |`,
      );
    }
    lines.push('');
  }

  lines.push(
    '## Exclusion register',
    '',
    'What the client deliberately does not do: every unwanted-behaviour requirement whose response is negated (`If …, then the <system> shall not …`), with the scenarios that prove the absence. An exclusion that lives only in prose is not listed here and protects nothing (CHARTER TEST-11).',
    '',
  );
  const exclusions = reqs.filter((r) => r.exclusion);
  if (exclusions.length === 0) {
    lines.push('No requirement in this run states an exclusion.', '');
  } else {
    lines.push(
      '| Id | Result | Exclusion | Scenarios |',
      '| -- | ------ | --------- | --------- |',
    );
    for (const r of exclusions) {
      const names =
        r.scenarioNames.length > 0
          ? r.scenarioNames.map((n) => cell(n)).join('; ')
          : 'none seen in the run';
      lines.push(
        `| \`${r.id}\` | ${MARK[r.verdict]} | ${cell(r.text)} | ${names} |`,
      );
    }
    lines.push('');
  }

  lines.push(
    '## Feedback on the specification',
    '',
    'Advisory: none of this fails the run.',
    '',
    '| EARS pattern | Requirements |',
    '| ------------ | -----------: |',
  );
  for (const p of PATTERNS) {
    lines.push(`| ${p} | ${count(reqs, (r) => r.pattern === p)} |`);
  }
  lines.push(
    '',
    `- ${single} of ${reqs.length} requirements rest on a single scenario.`,
  );
  if (report.orphanCases > 0) {
    lines.push(
      `- ${report.orphanCases} scenario(s) sit outside any Rule and verify no requirement.`,
    );
  }
  if (report.noUnwantedBehaviour.length > 0) {
    lines.push(
      `- ${report.noUnwantedBehaviour.length} feature(s) state no unwanted behaviour (no \`If …, then … shall\` requirement), so their failure paths are unspecified:`,
      '',
    );
    for (const f of report.noUnwantedBehaviour) {
      lines.push(`  - ${f.feature} (\`${f.file}\`)`);
    }
  }
  lines.push('');

  lines.push('## Every requirement', '');
  let feature = '';
  for (const r of reqs) {
    if (r.file !== feature) {
      feature = r.file;
      const own = reqs.filter((x) => x.file === feature);
      lines.push(
        '',
        `### ${r.feature}`,
        '',
        `\`${r.file}\` · ${count(own, (x) => x.verdict === 'verified')}/${own.length} verified`,
        '',
        '| Id | Result | Pattern | Scenarios | Requirement |',
        '| -- | ------ | ------- | --------: | ----------- |',
      );
    }
    lines.push(
      `| \`${r.id}\` | ${MARK[r.verdict]} | ${r.pattern} | ${r.passed}/${r.scenarios} | ${cell(r.text)} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}
