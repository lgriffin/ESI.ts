/**
 * The catalogue's own gate. A fault earns its place only if it cites a Rule
 * that exists and asserts an outcome specific enough to fail: an anchored
 * error message, an exact request count, a cache state, a tight time window
 * and every log entry. The self-test requires zero problems; the weak fixture
 * in fixtures/ proves this function rejects a fault that asserts too little.
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import type { Fault, KnownGap, Outcome, RuleRef, Target } from './types';

export const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ERROR_CLASSES = [
  'EsiError',
  'TimeoutError',
  'EsiValidationError',
  'CodedError',
];
const CACHE_STATES = ['empty', 'holds-result'];
/** The widest elapsed-time window a fault may assert. */
export const MAX_WINDOW_MS = 1000;

/** Problems with a Rule reference, or [] when it resolves. */
export function ruleProblems(rule: RuleRef | undefined): string[] {
  if (!rule) return ['cites no Rule or guide section'];
  if ('feature' in rule) {
    const file = path.join(REPO_ROOT, 'tests', 'bdd', 'features', rule.feature);
    if (!existsSync(file))
      return [`cites a feature file that does not exist: ${rule.feature}`];
    const titles = readFileSync(file, 'utf-8')
      .split(/\r?\n/)
      .map((line) => /^\s*Rule:\s*(.+?)\s*$/.exec(line)?.[1])
      .filter((t): t is string => t !== undefined);
    return titles.includes(rule.rule)
      ? []
      : [`cites a Rule that ${rule.feature} does not contain: "${rule.rule}"`];
  }
  const file = path.join(REPO_ROOT, 'guides', rule.guide);
  if (!existsSync(file))
    return [`cites a guide that does not exist: ${rule.guide}`];
  const headings = readFileSync(file, 'utf-8')
    .split(/\r?\n/)
    .map((line) => /^#{1,6}\s+(.+?)\s*$/.exec(line)?.[1])
    .filter((h): h is string => h !== undefined);
  return headings.includes(rule.section)
    ? []
    : [`cites a section guides/${rule.guide} does not have: "${rule.section}"`];
}

function regexProblems(label: string, value: unknown): string[] {
  if (!(value instanceof RegExp)) return [`${label} is not a RegExp`];
  const problems: string[] = [];
  if (!value.source.startsWith('^')) {
    problems.push(`${label} ${String(value)} is not anchored with ^`);
  }
  if (value.test(''))
    problems.push(`${label} ${String(value)} matches the empty string`);
  return problems;
}

const isCount = (n: unknown, min: number) =>
  typeof n === 'number' && Number.isInteger(n) && n >= min;

/** Problems with one fault's outcome for one target, or []. */
export function outcomeProblems(
  outcome: Outcome | undefined,
  target: Target,
): string[] {
  if (!outcome) return ['has no expected outcome'];
  const problems: string[] = [];
  const s = outcome.settlement as Record<string, unknown> | undefined;

  if (!s || (!('rejects' in s) && !('resolves' in s))) {
    problems.push('does not say whether the call resolves or rejects');
  } else if ('rejects' in s) {
    const e = s.rejects as Record<string, unknown> | undefined;
    if (!e || !ERROR_CLASSES.includes(e.class as string)) {
      problems.push(
        `names no error class (one of ${ERROR_CLASSES.join(', ')})`,
      );
    } else if (e.class === 'CodedError') {
      if (typeof e.code !== 'string' || !/^[A-Z_]+$/.test(e.code)) {
        problems.push('names no bracketed error code');
      }
    } else if (!isCount(e.statusCode, 0)) {
      problems.push('names no statusCode');
    }
    problems.push(...regexProblems('error message', e?.message));
  } else {
    if (s.resolves === undefined)
      problems.push('resolves with no asserted value');
    if (typeof s.stale !== 'boolean')
      problems.push('does not assert meta.stale');
  }

  if (!isCount(outcome.requests, 1)) {
    problems.push('does not assert the request count (retry count)');
  }
  if (!CACHE_STATES.includes(outcome.cache)) {
    problems.push(
      `does not assert the cache state (one of ${CACHE_STATES.join(', ')})`,
    );
  } else if (
    outcome.cache === 'holds-result' &&
    (target.method !== 'GET' || !target.etag)
  ) {
    problems.push(
      `asserts a cached entry for ${target.name}, which the cache never holds`,
    );
  }

  const w = outcome.elapsedMs;
  if (
    !w ||
    !Number.isFinite(w.min) ||
    !Number.isFinite(w.max) ||
    w.min < 0 ||
    w.max < w.min ||
    w.max - w.min > MAX_WINDOW_MS
  ) {
    problems.push(
      `does not assert elapsed time within a window of at most ${MAX_WINDOW_MS} ms`,
    );
  }

  if (!Array.isArray(outcome.logs)) {
    problems.push('does not assert the logs ([] for none)');
  } else {
    outcome.logs.forEach((log, i) => {
      if (log.level !== 'warn' && log.level !== 'error') {
        problems.push(`log ${i} has no level`);
      }
      problems.push(...regexProblems(`log ${i} message`, log.message));
      if (!isCount(log.count, 0)) problems.push(`log ${i} has no exact count`);
    });
  }
  return problems;
}

/** Stable text for an exchange, to spot two faults injecting the same thing. */
function exchangeKey(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v instanceof RegExp ? `/${v.source}/${v.flags}` : v,
  );
}

/**
 * Every problem with the catalogue, each prefixed with the fault (and target)
 * it concerns. Zero is the ratchet.
 */
export function catalogueProblems(
  faults: readonly Fault[],
  targets: readonly Target[],
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const exchanges = new Map<string, string>();

  for (const fault of faults) {
    const label = `fault "${fault.id}"`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fault.id ?? '')) {
      problems.push(`${label}: id is not kebab-case`);
    }
    if (ids.has(fault.id)) problems.push(`${label}: id is not unique`);
    ids.add(fault.id);
    if (!fault.title?.trim()) problems.push(`${label}: has no title`);
    problems.push(...ruleProblems(fault.rule).map((p) => `${label}: ${p}`));

    const applicable = targets.filter((t) => fault.appliesTo?.(t) ?? true);
    if (applicable.length === 0)
      problems.push(`${label}: applies to no target`);

    for (const target of applicable) {
      const where = `${label} on ${target.name}`;
      const ctx = { target, good: target.good() };
      let outcome: Outcome | undefined;
      let exchange: unknown;
      try {
        exchange = fault.exchange(ctx);
        outcome = fault.expected(ctx);
      } catch (err) {
        problems.push(`${where}: building the case threw ${String(err)}`);
        continue;
      }
      if (!Array.isArray(exchange) || exchange.length === 0) {
        problems.push(`${where}: serves no responses`);
      } else {
        const key = `${target.name} ${fault.prime ? 'primed' : 'cold'} ${exchangeKey(exchange)}`;
        const twin = exchanges.get(key);
        if (twin)
          problems.push(
            `${where}: injects the same exchange as fault "${twin}"`,
          );
        else exchanges.set(key, fault.id);
      }
      problems.push(
        ...outcomeProblems(outcome, target).map((p) => `${where}: ${p}`),
      );
    }
  }
  return problems;
}

/** Problems with known-gaps.json entries against the catalogue. */
export function knownGapProblems(
  gaps: readonly KnownGap[],
  faults: readonly Fault[],
  targets: readonly Target[],
): string[] {
  const problems: string[] = [];
  for (const gap of gaps) {
    const fault = faults.find((f) => f.id === gap.fault);
    if (!fault) {
      problems.push(`known gap "${gap.fault}" names no fault in the catalogue`);
      continue;
    }
    for (const name of gap.targets) {
      const target = targets.find((t) => t.name === name);
      if (!target || !(fault.appliesTo?.(target) ?? true)) {
        problems.push(
          `known gap "${gap.fault}" names ${name}, which the fault does not apply to`,
        );
      }
    }
    if (!/^esi-[a-z0-9.]+$/.test(gap.bead ?? '')) {
      problems.push(`known gap "${gap.fault}" names no bead`);
    }
    if (!gap.reason?.trim())
      problems.push(`known gap "${gap.fault}" gives no reason`);
  }
  return problems;
}

export interface BaseGaps {
  ref: string | null;
  /** null when the ref predates known-gaps.json. */
  gaps: KnownGap[] | null;
}

/**
 * known-gaps.json on the integration branch. FAULTS_BASE_REF first, then
 * origin/master and master. `ref: null` means none could be read, which the
 * ratchet treats as a failure.
 */
export function loadBaseGaps(parse: (raw: string) => KnownGap[]): BaseGaps {
  const refs = [process.env.FAULTS_BASE_REF, 'origin/master', 'master'].filter(
    (r): r is string => Boolean(r),
  );
  const git = (args: string[]) =>
    execFileSync('git', args, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  for (const ref of refs) {
    try {
      git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    } catch {
      continue;
    }
    let raw: string;
    try {
      raw = git(['show', `${ref}:tests/faults/known-gaps.json`]);
    } catch {
      return { ref, gaps: null };
    }
    return { ref, gaps: parse(raw) };
  }
  return { ref: null, gaps: null };
}

/** Entries in `current` the base does not have: each one is a new gap. */
export function addedGaps(
  current: readonly KnownGap[],
  base: BaseGaps,
): string[] {
  if (base.ref === null) {
    return [
      'cannot read the base copy of tests/faults/known-gaps.json: fetch origin/master or set FAULTS_BASE_REF (the ratchet fails closed)',
    ];
  }
  if (base.gaps === null) return []; // The list is being introduced.
  const known = new Set(
    base.gaps.flatMap((g) => g.targets.map((t) => `${g.fault} ${t}`)),
  );
  return current
    .flatMap((g) => g.targets.map((t) => `${g.fault} ${t}`))
    .filter((pair) => !known.has(pair))
    .map(
      (pair) =>
        `known gap "${pair}" is not in ${base.ref}'s list: the list only shrinks; fix the bug instead`,
    );
}
