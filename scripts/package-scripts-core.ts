/**
 * Do the npm scripts point at files that exist?
 *
 * `sde:seed` ran `ts-node scripts/seed-sde-test-db.ts` for as long as anyone
 * can remember; the script was never committed. `example:sde-cross-ref` named
 * an example that was never written either. Neither is caught by anything:
 * nothing imports them, so `knip` and the compiler never look, and the failure
 * only appears when someone runs the command and gets `MODULE_NOT_FOUND`.
 *
 * This is the cheap check that closes that gap, run from
 * `tests/tdd/scripts/package-scripts.test.ts` so it happens in `npm test`
 * rather than needing its own CI job.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

/** A file a script runs, as written in the script. */
export interface ScriptTarget {
  /** The npm script name, e.g. `sde:seed`. */
  script: string;
  /** The path as the script spells it, e.g. `scripts/sde-ingest.ts`. */
  path: string;
}

/**
 * Paths that must resolve to a file: anything under `scripts/`, `examples/` or
 * `tests/`, and the config files runners are pointed at.
 *
 * Deliberately narrow. A token this misses is a target that goes unchecked,
 * which is the status quo; a token it wrongly matches fails the suite on a
 * file that was never meant to exist, which is worse. Globs and paths carrying
 * shell syntax are left out for that reason.
 */
const DIRECTORY_TARGET =
  /^(?:scripts|examples|tests)\/[\w./-]+\.(?:ts|cjs|mjs|js|sh)$/;
const CONFIG_TARGET = /^[\w.-]+\.config\.(?:ts|cjs|mjs|js)$/;

function looksLikeAPath(token: string): boolean {
  if (token.includes('*') || token.includes('{') || token.includes('$')) {
    return false;
  }
  return DIRECTORY_TARGET.test(token) || CONFIG_TARGET.test(token);
}

/** Every file path one script command names. */
export function targetsIn(script: string, command: string): ScriptTarget[] {
  const found: ScriptTarget[] = [];
  const seen = new Set<string>();
  for (const raw of command.split(/\s+/)) {
    // `--config=jest.unit.config.cjs` as well as `--config jest.unit.config.cjs`
    const token = raw.includes('=') ? raw.slice(raw.indexOf('=') + 1) : raw;
    const path = token.replace(/^['"]|['"]$/g, '');
    if (!looksLikeAPath(path) || seen.has(path)) continue;
    seen.add(path);
    found.push({ script, path });
  }
  return found;
}

/** Every file path the whole `scripts` block names, in declaration order. */
export function allTargets(scripts: Record<string, string>): ScriptTarget[] {
  return Object.entries(scripts).flatMap(([script, command]) =>
    targetsIn(script, command),
  );
}

/**
 * The targets that do not exist.
 *
 * @param exists - resolves a repo-relative path to whether it is a file
 */
export function missingTargets(
  scripts: Record<string, string>,
  exists: (path: string) => boolean,
): ScriptTarget[] {
  return allTargets(scripts).filter((target) => !exists(target.path));
}

/** One line per missing target, naming the script that would fail. */
export function describeMissing(missing: ScriptTarget[]): string {
  return missing
    .map(
      (m) =>
        `  npm run ${m.script} → ${m.path} does not exist; restore the file or drop the script`,
    )
    .join('\n');
}
