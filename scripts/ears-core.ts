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
 * It also classifies each requirement by its EARS pattern and gives advisory
 * feedback on the specification's shape. The feedback never changes the exit
 * code; the verdicts and the spec audit do.
 *
 * Pure: it reads nothing from disk, so the unit suite can drive it with
 * hand-built ledgers. `scripts/ears.ts` is the command around it.
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
  verdict: Verdict;
  scenarios: number;
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
        verdict,
        scenarios: rule.scenarios,
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

  const lines = [
    '',
    'EARS requirements',
    '=================',
    `Spec audit (well-formed):  ${report.audit.toUpperCase()}`,
    `Requirements:              ${reqs.length} across ${features} features`,
    `  verified:                ${verified}`,
    `  failing:                 ${failing.length}`,
    `  not run:                 ${unverified.length}`,
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
      ? 'FAIL: not every EARS requirement is verified.'
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
      ? '**Result: FAIL.** Not every requirement is verified; the table below says which and why.'
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
