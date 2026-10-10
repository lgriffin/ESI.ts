/**
 * The security model audit: `guides/SECURITY-MODEL.md` (canonical prose),
 * `guides/security-model.yaml` (its index), the feature files, the triage
 * log and the source tree held together (CHARTER SEC-09 to SEC-12).
 *
 * - SEC-09: the properties, disclaimed properties, non-findings and
 *   dispositions in the prose and the index are the same sets, and each
 *   property carries the same severity in both.
 * - SEC-10: every claimed property names test files that exist and a Rule
 *   tagged `@sec-<id>` (or says why none can exist), every tagged Rule's
 *   scenarios passed in the BDD run, and a gap carries an issue and an
 *   unexpired date, with no more gaps than master has. No Rule claims a
 *   disclaimed property or an id the index does not hold.
 * - SEC-11: every network call and every response-header read under `src/`
 *   is in the index, and nothing in the index is stale.
 * - SEC-12: every non-finding and disposition cites a section the prose has,
 *   and every triage-log line uses a disposition from the closed set.
 *
 * Pure: the caller reads the files and passes their text, so the unit suite
 * drives every rule with a fixture (tests/tdd/scripts/fixtures/security-model/).
 */

// ---------------------------------------------------------------------------
// The index
// ---------------------------------------------------------------------------

export interface IndexProperty {
  id: string;
  claim: string;
  severity: string;
  tests?: string[];
  status?: string;
  issue?: number;
  expires?: string;
  /** `none` when no BDD Rule can state the property, with `rule_reason`. */
  rule?: string;
  rule_reason?: string;
}

export interface IndexSite {
  file: string;
  headers?: string[];
}

export interface SecurityIndex {
  properties: IndexProperty[];
  disclaimed: { id: string }[];
  non_findings: { id: string; section: string; disposition?: string }[];
  dispositions: { id: string; section: string }[];
  inputs: {
    id: string;
    sites: string[];
    protects: string[];
    /** Test files, or `fault:<id>` for a fault catalogue entry. */
    generators?: string[];
  }[];
  network_call_sites: IndexSite[];
  header_read_sites: IndexSite[];
}

// ---------------------------------------------------------------------------
// The prose
// ---------------------------------------------------------------------------

export interface ProseModel {
  /** Property id to severity, lower-cased, from the claimed-properties table. */
  properties: Map<string, string>;
  disclaimed: Set<string>;
  nonFindings: Set<string>;
  dispositions: Set<string>;
  /** GitHub anchors of every heading. */
  anchors: Set<string>;
}

/** GitHub's heading anchor: lower case, punctuation dropped, spaces to dashes. */
export function anchorOf(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/** The Markdown section under `heading` (a `##` or `###`), up to the next heading of that level or above. */
function section(markdown: string, heading: string): string {
  const lines = markdown.split('\n');
  const start = lines.findIndex(
    (l) => /^#{2,3} /.test(l) && l.replace(/^#+ /, '') === heading,
  );
  if (start === -1) return '';
  const level = (/^#+/.exec(lines[start]!) ?? [''])[0].length;
  const end = lines.findIndex(
    (l, i) =>
      i > start && /^#+ /.test(l) && (/^#+/.exec(l) ?? [''])[0].length <= level,
  );
  return lines.slice(start + 1, end === -1 ? lines.length : end).join('\n');
}

export function parseProse(markdown: string): ProseModel {
  const properties = new Map<string, string>();
  for (const line of section(markdown, 'Security properties claimed').split(
    '\n',
  )) {
    const row = cells(line);
    if (/^P\d+$/.test(row[0] ?? '') && row.length >= 4) {
      properties.set(row[0]!, (row[3] ?? '').toLowerCase());
    }
  }

  const ids = (text: string, letter: string): Set<string> =>
    new Set(
      [...text.matchAll(new RegExp(`^- \\*\\*(${letter}\\d+) ·`, 'gm'))].map(
        (m) => m[1]!,
      ),
    );

  const dispositions = new Set<string>();
  for (const line of section(markdown, 'Triage').split('\n')) {
    const match = /^`([^`]+)`$/.exec(cells(line)[0] ?? '');
    if (match) dispositions.add(match[1]!);
  }

  const anchors = new Set<string>();
  for (const m of markdown.matchAll(/^#{1,6} (.+)$/gm))
    anchors.add(anchorOf(m[1]!));

  return {
    properties,
    disclaimed: ids(section(markdown, 'Properties not provided'), 'D'),
    nonFindings: ids(section(markdown, 'Known non-findings'), 'N'),
    dispositions,
    anchors,
  };
}

// ---------------------------------------------------------------------------
// Tagged Rules
// ---------------------------------------------------------------------------

export interface TaggedRule {
  file: string;
  line: number;
  title: string;
  tags: string[];
}

/** Every `Rule:` carrying `@sec-…` tags on the lines directly above it. */
export function taggedRules(file: string, source: string): TaggedRule[] {
  const lines = source.split('\n');
  const found: TaggedRule[] = [];
  lines.forEach((line, i) => {
    const rule = /^\s*Rule:\s*(.+?)\s*$/.exec(line);
    if (!rule) return;
    const tags: string[] = [];
    for (let j = i - 1; j >= 0 && /^\s*@/.test(lines[j]!); j--) {
      for (const tag of lines[j]!.trim().split(/\s+/)) {
        const sec = /^@sec-(.+)$/.exec(tag);
        if (sec) tags.push(sec[1]!);
      }
    }
    if (tags.length > 0)
      found.push({ file, line: i + 1, title: rule[1]!, tags });
  });
  return found;
}

// ---------------------------------------------------------------------------
// Network calls and response-header reads in src/
// ---------------------------------------------------------------------------

export interface DiscoveredSites {
  network: Set<string>;
  /** File to the header names it reads by literal; `*` for a dynamic read. */
  headers: Map<string, Set<string>>;
}

/** Source with comments blanked, so a `fetch()` in a comment is not a call. */
export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

const NETWORK_CALL =
  /(?:^|[^.\w])fetch\s*\(|\bfetchFn\s*\(|\bgetFetch\(\)\s*\(/;
const HEADER_LITERAL =
  /\b(?:headers|raw)\s*(?:\.get\(\s*|\[\s*)(['"])([a-z][a-z0-9-]*)\1\s*[)\]](?!\s*=(?!=))/g;
const HEADER_DYNAMIC = /\bheaders\.get\(\s*(?!['"])[\w.]+\s*\)/;

/** The network calls and header reads in one source file. */
export function scanSource(
  file: string,
  source: string,
  into: DiscoveredSites,
): void {
  const code = stripComments(source);
  if (NETWORK_CALL.test(code)) into.network.add(file);
  const names = new Set<string>();
  for (const m of code.matchAll(HEADER_LITERAL)) names.add(m[2]!);
  if (HEADER_DYNAMIC.test(code)) names.add('*');
  if (names.size > 0) into.headers.set(file, names);
}

// ---------------------------------------------------------------------------
// The audit
// ---------------------------------------------------------------------------

export type SecurityCheck = 'SEC-09' | 'SEC-10' | 'SEC-11' | 'SEC-12';

export interface SecurityFinding {
  check: SecurityCheck;
  message: string;
}

export interface AuditInput {
  prose: string;
  index: SecurityIndex;
  /** master's index, when it exists, for the gap ratchet. */
  baseIndex?: SecurityIndex;
  features: { file: string; source: string }[];
  triageLog: string;
  sites: DiscoveredSites;
  exists: (file: string) => boolean;
  /** The ids of the fault catalogue's entries (tests/faults/catalogue.ts). */
  faultIds: Set<string>;
  /** YYYY-MM-DD. */
  today: string;
  /**
   * Rule title to whether every scenario under it passed in the BDD run.
   * Absent when the audit runs without results, which skips that check.
   */
  ruleResults?: Map<string, boolean>;
}

const SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);

function difference<T>(a: Iterable<T>, b: Set<T>): T[] {
  return [...a].filter((x) => !b.has(x));
}

function checkProseIndex(
  input: AuditInput,
  prose: ProseModel,
): SecurityFinding[] {
  const out: SecurityFinding[] = [];
  const f = (message: string) => out.push({ check: 'SEC-09', message });
  const { index } = input;

  const indexProps = new Map(index.properties.map((p) => [p.id, p]));
  for (const id of difference(
    prose.properties.keys(),
    new Set(indexProps.keys()),
  ))
    f(`${id} is in the prose properties table but not in the index.`);
  for (const id of difference(
    indexProps.keys(),
    new Set(prose.properties.keys()),
  ))
    f(`${id} is in the index but not in the prose properties table.`);
  for (const [id, severity] of prose.properties) {
    const p = indexProps.get(id);
    if (p && p.severity.toLowerCase() !== severity)
      f(`${id} is ${severity} in the prose and ${p.severity} in the index.`);
    if (p && !SEVERITIES.has(p.severity.toLowerCase()))
      f(
        `${id} has severity "${p.severity}", not one of ${[...SEVERITIES].join(', ')}.`,
      );
  }

  const pairs: [string, Set<string>, string[]][] = [
    [
      'disclaimed property',
      prose.disclaimed,
      index.disclaimed.map((d) => d.id),
    ],
    ['non-finding', prose.nonFindings, index.non_findings.map((n) => n.id)],
    ['disposition', prose.dispositions, index.dispositions.map((d) => d.id)],
  ];
  for (const [kind, inProse, inIndex] of pairs) {
    const indexed = new Set(inIndex);
    for (const id of difference(inProse, indexed))
      f(`The ${kind} ${id} is in the prose but not in the index.`);
    for (const id of difference(indexed, inProse))
      f(`The ${kind} ${id} is in the index but not in the prose.`);
  }
  return out;
}

function gapCount(index: SecurityIndex | undefined): number {
  return (index?.properties ?? []).filter((p) => p.status === 'gap').length;
}

type Report = (message: string) => void;

function checkTags(input: AuditInput, rules: TaggedRule[], f: Report): void {
  const propertyIds = new Set(input.index.properties.map((p) => p.id));
  const disclaimedIds = new Set(input.index.disclaimed.map((d) => d.id));
  for (const rule of rules) {
    for (const tag of rule.tags) {
      const where = `${rule.file}:${rule.line}`;
      if (disclaimedIds.has(tag))
        f(
          `${where} tags @sec-${tag}, a disclaimed property; a Rule cannot claim what the model says is not provided.`,
        );
      else if (!propertyIds.has(tag))
        f(`${where} tags @sec-${tag}, which the index does not hold.`);
    }
  }
}

function checkTests(input: AuditInput, p: IndexProperty, f: Report): void {
  for (const test of p.tests ?? []) {
    if (!input.exists(test)) f(`${p.id} names ${test}, which does not exist.`);
  }
  if (p.status !== undefined && p.status !== 'gap')
    f(`${p.id} has status "${p.status}"; the only status is gap.`);
  if (p.status !== 'gap' && (p.tests ?? []).length === 0)
    f(`${p.id} is claimed with no test file.`);
}

function checkRules(
  input: AuditInput,
  p: IndexProperty,
  tagged: TaggedRule[],
  f: Report,
): void {
  const isGap = p.status === 'gap';
  if (p.rule === 'none') {
    if (!p.rule_reason) f(`${p.id} says rule: none without a rule_reason.`);
    if (tagged[0])
      f(
        `${p.id} says rule: none but ${tagged[0].file}:${tagged[0].line} is tagged @sec-${p.id}.`,
      );
  } else if (tagged.length === 0 && !isGap) {
    f(
      `${p.id} has no Rule tagged @sec-${p.id}; tag the Rule that states it, or set rule: none with a rule_reason.`,
    );
  }
  if (!input.ruleResults) return;
  for (const r of tagged) {
    const passed = input.ruleResults.get(r.title);
    if (passed === undefined)
      f(`${r.file}:${r.line} (@sec-${p.id}) did not run in the BDD results.`);
    else if (!passed && !isGap)
      f(`${r.file}:${r.line} (@sec-${p.id}) has a scenario that did not pass.`);
  }
}

function checkGap(input: AuditInput, p: IndexProperty, f: Report): void {
  if (p.status !== 'gap') return;
  if (typeof p.issue !== 'number') f(`${p.id} is a gap with no issue number.`);
  const expires = p.expires === undefined ? '' : String(p.expires);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expires))
    f(`${p.id} is a gap with no expiry date (YYYY-MM-DD).`);
  else if (expires < input.today)
    f(`${p.id}'s gap expired on ${expires}; fix it or record a new decision.`);
}

function checkCoverage(input: AuditInput): SecurityFinding[] {
  const out: SecurityFinding[] = [];
  const f: Report = (message) => out.push({ check: 'SEC-10', message });
  const { index } = input;
  const rules = input.features.flatMap((x) => taggedRules(x.file, x.source));

  checkTags(input, rules, f);
  for (const p of index.properties) {
    checkTests(input, p, f);
    checkRules(
      input,
      p,
      rules.filter((r) => r.tags.includes(p.id)),
      f,
    );
    checkGap(input, p, f);
  }

  if (input.baseIndex && gapCount(index) > gapCount(input.baseIndex))
    f(
      `The index has ${gapCount(index)} gaps and master has ${gapCount(input.baseIndex)}; the count of gaps may only shrink.`,
    );
  return out;
}

function checkCallSites(input: AuditInput, f: Report): void {
  const network = new Set(input.index.network_call_sites.map((s) => s.file));
  for (const file of difference(input.sites.network, network))
    f(
      `${file} makes a network call the index does not list under network_call_sites.`,
    );
  for (const file of difference(network, input.sites.network))
    f(`network_call_sites lists ${file}, which makes no network call.`);
}

function checkHeaderSites(input: AuditInput, f: Report): void {
  const headers = new Map(
    input.index.header_read_sites.map((s) => [
      s.file,
      new Set(s.headers ?? []),
    ]),
  );
  for (const [file, names] of input.sites.headers) {
    const listed = headers.get(file);
    if (!listed) {
      f(
        `${file} reads response headers (${[...names].join(', ')}) and is not in header_read_sites.`,
      );
      continue;
    }
    for (const name of difference(names, listed)) {
      if (name !== '*')
        f(
          `${file} reads the ${name} header, which header_read_sites does not list for it.`,
        );
    }
  }
  for (const file of difference(
    headers.keys(),
    new Set(input.sites.headers.keys()),
  ))
    f(`header_read_sites lists ${file}, which reads no response header.`);
}

function checkInputs(input: AuditInput, f: Report): void {
  for (const input_ of input.index.inputs) {
    for (const site of input_.sites) {
      if (!input.exists(site))
        f(`The input ${input_.id} names ${site}, which does not exist.`);
    }
    const generators = input_.generators ?? [];
    if (generators.length === 0)
      f(
        `The input ${input_.id} has no generator: name a fuzz or unit test file, or a fault:<id> from tests/faults/catalogue.ts, that feeds it hostile values.`,
      );
    for (const generator of generators) {
      const fault = /^fault:(.+)$/.exec(generator);
      const found = fault
        ? input.faultIds.has(fault[1]!)
        : input.exists(generator);
      if (!found)
        f(
          `The input ${input_.id} names the generator ${generator}, which does not exist.`,
        );
    }
  }
}

function checkSites(input: AuditInput): SecurityFinding[] {
  const out: SecurityFinding[] = [];
  const f: Report = (message) => out.push({ check: 'SEC-11', message });
  checkCallSites(input, f);
  checkHeaderSites(input, f);
  checkInputs(input, f);
  return out;
}

function checkTriage(input: AuditInput, prose: ProseModel): SecurityFinding[] {
  const out: SecurityFinding[] = [];
  const f = (message: string) => out.push({ check: 'SEC-12', message });
  const { index } = input;
  const closed = new Set(index.dispositions.map((d) => d.id));

  for (const n of index.non_findings) {
    if (!prose.anchors.has(n.section))
      f(
        `The non-finding ${n.id} cites the section #${n.section}, which the prose does not have.`,
      );
    if (n.disposition !== undefined && !closed.has(n.disposition))
      f(
        `The non-finding ${n.id} has disposition ${n.disposition}, outside the closed set.`,
      );
  }
  for (const d of index.dispositions) {
    if (!prose.anchors.has(d.section))
      f(
        `The disposition ${d.id} cites the section #${d.section}, which the prose does not have.`,
      );
  }

  input.triageLog.split('\n').forEach((line, i) => {
    const row = cells(line);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row[0] ?? '')) return;
    const disposition = (row[3] ?? '').replace(/`/g, '');
    if (!closed.has(disposition))
      f(
        `Triage log line ${i + 1} has disposition "${disposition}", outside the closed set.`,
      );
    for (const m of (row[4] ?? '').matchAll(/SECURITY-MODEL\.md#([\w-]+)/g)) {
      if (!prose.anchors.has(m[1]!))
        f(
          `Triage log line ${i + 1} cites #${m[1]!}, which the prose does not have.`,
        );
    }
  });
  return out;
}

export function auditSecurityModel(input: AuditInput): SecurityFinding[] {
  const prose = parseProse(input.prose);
  return [
    ...checkProseIndex(input, prose),
    ...checkCoverage(input),
    ...checkSites(input),
    ...checkTriage(input, prose),
  ];
}

export function formatFindings(findings: readonly SecurityFinding[]): string {
  return findings.map((x) => `  ${x.check}  ${x.message}`).join('\n');
}
