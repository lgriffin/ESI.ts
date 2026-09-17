/**
 * Shrink-only lists: tests/contract/fixtures/unrecordable.json and
 * known-mismatches.json. Each maps an endpoint key to the reason it is
 * listed. Entries may be removed, never added: an entry that is not on the
 * base branch fails. When no base ref can be read the check fails closed.
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { REPO_ROOT } from './policy';

export type ReasonList = Record<string, string>;

export function parseReasonList(raw: string, source: string): ReasonList {
  const parsed = JSON.parse(raw) as unknown;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${source} must be an object of endpoint -> reason`);
  }
  for (const [key, reason] of Object.entries(parsed)) {
    if (typeof reason !== 'string' || reason.trim() === '') {
      throw new Error(`${source}: ${key} needs a non-empty reason`);
    }
  }
  return parsed as ReasonList;
}

export function readReasonList(file: string): ReasonList {
  if (!fs.existsSync(file)) return {};
  return parseReasonList(fs.readFileSync(file, 'utf-8'), file);
}

export interface BaseList {
  /** The ref read, or null when none resolved. */
  ref: string | null;
  /** The list on that ref; null when the ref predates the file. */
  list: ReasonList | null;
}

/**
 * The list as it stands on the integration branch: CONTRACT_BASE_REF, then
 * origin/master, then master. CI fetches origin/master because a pull request
 * checkout is shallow.
 */
export function readBaseList(file: string): BaseList {
  const rel = path.relative(REPO_ROOT, file).split(path.sep).join('/');
  const refs = [
    process.env.CONTRACT_BASE_REF,
    'origin/master',
    'master',
  ].filter((r): r is string => Boolean(r));
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
      raw = git(['show', `${ref}:${rel}`]);
    } catch {
      return { ref, list: null };
    }
    try {
      return { ref, list: parseReasonList(raw, `${ref}:${rel}`) };
    } catch {
      return { ref, list: {} }; // An unreadable base vouches for nothing.
    }
  }
  return { ref: null, list: null };
}

/** Problems with `current` against the base list; empty when it only shrank. */
export function shrinkOnlyProblems(
  name: string,
  current: ReasonList,
  base: BaseList,
): string[] {
  if (base.ref === null) {
    return [
      `${name}: no base ref could be read, so growth cannot be ruled out. ` +
        'Fetch master (git fetch origin master) or set CONTRACT_BASE_REF.',
    ];
  }
  if (base.list === null) return []; // The file is new on this branch.
  const baseList = base.list;
  return Object.keys(current)
    .filter((key) => !(key in baseList))
    .map(
      (key) =>
        `${name}: '${key}' is not on ${base.ref}. This list only shrinks; ` +
        'record a fixture or fix the schema instead of adding an entry.',
    );
}
