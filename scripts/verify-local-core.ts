/**
 * What `npm run check:local` runs, and the promise that it is the whole list.
 *
 * `npm test` covers the unit and BDD suites. It does not cover the tiers added
 * around them — the fault catalogue, the recorded-payload replay, export
 * coverage, the documentation examples, the packaged tarball, the consumer
 * matrix, the size budgets. Those only ran in CI, so the first time a local
 * change met them was on a pull request.
 *
 * The risk in a list like this is that it quietly stops being the whole list:
 * CI grows a tier, nobody adds it here, and `check:local` keeps passing while
 * covering less. `tests/tdd/verify-local/verify-local.test.ts` therefore reads
 * every `npm run` in `.github/workflows/ci.yml` and fails unless each one is
 * either in `TIERS`, reachable from a composite in `COMPOSITES`, or listed in
 * `NOT_RUN_LOCALLY` with a reason. A new CI tier cannot be invisible here
 * without someone writing down why.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

/**
 * When a tier runs.
 *
 * - `quick`: no build, no network. The loop worth running before every commit.
 * - `built`: needs `dist/`, so the stage starts by building once.
 * - `slow`: minutes to hours. Opt in with `--all`.
 */
export type Stage = 'quick' | 'built' | 'slow';

export interface Tier {
  /** The npm script, without `npm run`. */
  script: string;
  /** What breaking it would mean, for the summary line. */
  covers: string;
  stage: Stage;
}

/**
 * The tiers, in the order they run: cheapest signal first, so a typo fails in
 * seconds rather than after the consumer matrix has packed a tarball.
 */
export const TIERS: Tier[] = [
  { script: 'typecheck', covers: 'types compile', stage: 'quick' },
  {
    script: 'spec:generate:check',
    covers: 'generated operations match the vendored spec',
    stage: 'quick',
  },
  {
    script: 'spec:coverage',
    covers: 'every spec operation is generated',
    stage: 'quick',
  },
  { script: 'lint', covers: 'src lint', stage: 'quick' },
  {
    script: 'lint:suite-health',
    covers: 'no skipped or assertion-free tests',
    stage: 'quick',
  },
  {
    script: 'lint:determinism',
    covers: 'time and randomness behind the clock',
    stage: 'quick',
  },
  {
    script: 'lint:bdd-seam',
    covers: 'BDD mocks only at the transport seam',
    stage: 'quick',
  },
  {
    script: 'lint:workflows',
    covers: 'zizmor over .github/, the audit ci.yml runs',
    stage: 'quick',
  },
  {
    script: 'spec:audit',
    covers: 'feature files are EARS-compliant',
    stage: 'quick',
  },
  {
    script: 'validate:spec-consistency',
    covers: 'Rule titles agree with their schemas',
    stage: 'quick',
  },
  {
    script: 'validate:auth-scopes',
    covers: 'endpoint auth matches the scope map',
    stage: 'quick',
  },
  { script: 'test', covers: 'unit and BDD suites', stage: 'quick' },
  {
    script: 'test:integration',
    covers: 'integration suite (live tiers skip)',
    stage: 'quick',
  },
  { script: 'faults', covers: 'transport fault catalogue', stage: 'quick' },
  {
    script: 'contract:replay',
    covers: 'recorded ESI payloads through the pipeline',
    stage: 'quick',
  },
  { script: 'fuzz', covers: 'property tests', stage: 'quick' },
  {
    script: 'test:export-coverage',
    covers: 'every public export referenced by a test',
    stage: 'quick',
  },

  { script: 'build', covers: 'the bundle and declarations', stage: 'built' },
  {
    script: 'test:types',
    covers: 'tsd cases on the public types',
    stage: 'built',
  },
  {
    script: 'test:docs-examples',
    covers: 'README and guide code blocks',
    stage: 'built',
  },
  {
    script: 'lint:package',
    covers: 'publint and attw on the tarball',
    stage: 'built',
  },
  { script: 'size', covers: 'per-sub-path size budgets', stage: 'built' },
  { script: 'test:consumer', covers: 'the consumer matrix', stage: 'built' },

  {
    script: 'test:type-mutation',
    covers: 'tsd cases kill type mutants',
    stage: 'slow',
  },
];

/** Scripts that are shorthand for others, so CI running them counts as coverage. */
export const COMPOSITES: Record<string, string[]> = {
  'test:all': ['test', 'bdd', 'test:integration', 'fuzz', 'test:types'],
};

/**
 * CI scripts `check:local` deliberately does not run, and why. Every entry is
 * a decision someone can argue with, which is the point of writing it down.
 */
/**
 * CI steps that run a tool directly rather than through an npm script, and
 * what runs each one locally.
 *
 * `scriptsInWorkflow` only sees `npm run`, so until this existed a gate could
 * be added to ci.yml as `npx something` and never be covered here — which is
 * how zizmor stayed CI-only. A tool listed here must name a tier that runs it.
 */
export const TOOLS_RUN_BY: Record<string, string> = {
  zizmor: 'lint:workflows',
};

/** Tools CI invokes directly that `check:local` deliberately does not run. */
export const TOOLS_NOT_RUN_LOCALLY: Record<string, string> = {
  npm: 'ci.yml pins npm itself for one step - `npx --yes npm@11.17.0 pack` - because npm 10 runs `prepare` on `npm pack` even with --ignore-scripts and rebuilds dist/, which would defeat that job. A workaround for the npm the runner bundles, not a gate; esi-23g.43 tracks it',
  knip: 'ci.yml runs it with --no-exit-code, so it gates nothing; a local tier mirroring a check that cannot fail would say more than it knows (esi-p56 tracks making it block)',
};

export const NOT_RUN_LOCALLY: Record<string, string> = {
  bdd: 'a subset of `test`, which runs the same Jest config unfiltered',
  'bdd:report': 'reporting only; `test` already executes every scenario',
  coverage:
    '`test` with coverage instrumentation, which only slows the loop down',
  'format:check':
    'a Windows checkout has CRLF line endings, so it fails on ~994 files that are not yours; run it on a specific path instead',
  'api-report': 'rewrites a committed generated file',
  'api-report:semver': 'needs the base branch to diff the report against',
  'audit:diff': 'queries the advisory database over the network',
  'bench:ab':
    'needs a second commit built on the same machine, and a quiet one',
  'bench:compare': 'reads a baseline the benchmark job produces',
  'contract:live': 'calls the live ESI API',
  docs: 'generates TypeDoc output and asserts nothing',
  'generate:types': 'downloads the live ESI OpenAPI document',
  'schema:drift': 'downloads the live ESI OpenAPI document',
  'schema:drift:ci': 'downloads the live ESI OpenAPI document',
  'mutation:fixture':
    'Stryker over the known-weak fixture; minutes, and nightly owns it',
  'mutation:pr': 'needs a base ref to scope the changed files',
  'mutation:pr:gate':
    'mutation:pr under a deadline, so it needs a base ref too; the policy it applies is unit-tested instead',
  'mutation:pr:shard':
    'names the nightly cache ci.yml restores, which a local run does not have; the choice is unit-tested instead',
};

export class VerifyLocalError extends Error {}

/** The tiers a run covers, given the flags. `--fast` is quick only; `--all` adds the slow ones. */
export function selectTiers(tiers: Tier[], argv: string[]): Tier[] {
  const fast = argv.includes('--fast');
  const all = argv.includes('--all');
  if (fast && all) {
    throw new VerifyLocalError(
      '--fast and --all ask for different runs; pick one.',
    );
  }
  return tiers.filter((tier) => {
    if (tier.stage === 'quick') return true;
    if (tier.stage === 'built') return !fast;
    return all;
  });
}

/** Tier names that are not npm scripts: a rename here would silently drop a tier. */
export function unknownScripts(
  tiers: Tier[],
  packageScripts: Record<string, string>,
): string[] {
  return tiers
    .map((t) => t.script)
    .filter((script) => !(script in packageScripts));
}

/** A script repeated in the list, which would run twice and read as two tiers. */
export function duplicateScripts(tiers: Tier[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const { script } of tiers) {
    if (seen.has(script)) repeated.add(script);
    seen.add(script);
  }
  return [...repeated].sort();
}

/** Every `npm run <script>` a workflow file invokes. */
export function scriptsInWorkflow(yaml: string): string[] {
  const found = new Set<string>();
  for (const match of yaml.matchAll(/npm run ([a-z0-9:_-]+)/g)) {
    const script = match[1];
    if (script !== undefined) found.add(script);
  }
  return [...found].sort();
}

/**
 * Every tool a workflow invokes directly through a runner such as `npx` or
 * `uvx`, normalised: `uvx zizmor@1.25.2` is `zizmor`.
 */
export function toolsInWorkflow(yaml: string): string[] {
  const found = new Set<string>();
  for (const match of yaml.matchAll(
    /\b(?:npx|uvx|pipx|bunx)(?:\s+(?:--?[\w-]+|run))*\s+((?:@[\w./-]+\/)?[\w.-]+)/g,
  )) {
    const raw = match[1];
    if (raw === undefined) continue;
    // Drop a version pin: `zizmor@1.25.2` and `zizmor` are one tool.
    const name = raw.replace(/@[\d.]+$/, '');
    if (name.startsWith('-')) continue;
    found.add(name);
  }
  return [...found].sort();
}

/** Tools CI invokes directly that this runner neither runs nor explains. */
export function uncoveredCiTools(
  tools: string[],
  tiers: Tier[],
  runBy: Record<string, string> = TOOLS_RUN_BY,
  notRun: Record<string, string> = TOOLS_NOT_RUN_LOCALLY,
): string[] {
  const run = new Set(tiers.map((t) => t.script));
  const problems: string[] = [];
  for (const tool of tools) {
    const tier = runBy[tool];
    if (tier !== undefined) {
      // A mapping to a tier nobody runs is worse than no mapping: it reads as
      // covered.
      if (!run.has(tier)) {
        problems.push(`${tool}: mapped to ${tier}, which is not a tier`);
      }
      continue;
    }
    if (!(tool in notRun)) problems.push(tool);
  }
  return problems.sort();
}

/**
 * CI scripts this runner neither runs nor explains.
 *
 * A composite counts when everything it expands to is covered, so CI running
 * `test:all` does not need its own entry.
 */
export function uncoveredCiScripts(
  ciScripts: string[],
  tiers: Tier[],
  composites: Record<string, string[]> = COMPOSITES,
  notRun: Record<string, string> = NOT_RUN_LOCALLY,
): string[] {
  const run = new Set(tiers.map((t) => t.script));
  const covered = (script: string, depth = 0): boolean => {
    if (run.has(script)) return true;
    if (script in notRun) return true;
    const parts = composites[script];
    if (parts === undefined || depth > 4) return false;
    return parts.every((part) => covered(part, depth + 1));
  };
  return ciScripts.filter((script) => !covered(script)).sort();
}

export interface TierResult {
  script: string;
  covers: string;
  ok: boolean;
  /** Wall-clock milliseconds. */
  ms: number;
  /** Set when the tier was not reached because the build failed. */
  skipped?: boolean;
}

function duration(ms: number): string {
  return ms >= 60_000
    ? `${Math.floor(ms / 60_000)}m${String(Math.round((ms % 60_000) / 1000)).padStart(2, '0')}s`
    : `${(ms / 1000).toFixed(1)}s`;
}

/** The closing table: what ran, what it covers, how long it took. */
export function renderSummary(results: TierResult[]): string {
  const width = Math.max(6, ...results.map((r) => r.script.length));
  const lines = results.map((r) => {
    const mark = r.skipped ? '-' : r.ok ? 'ok' : 'FAIL';
    const time = r.skipped ? '' : duration(r.ms);
    return `  ${mark.padEnd(4)} ${r.script.padEnd(width)}  ${time.padStart(6)}  ${r.covers}`;
  });
  const failed = results.filter((r) => !r.ok && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const total = results.reduce((sum, r) => sum + r.ms, 0);

  lines.push('');
  if (failed.length === 0 && skipped.length === 0) {
    lines.push(`${results.length} tiers passed in ${duration(total)}.`);
  } else {
    lines.push(
      `${results.length - failed.length - skipped.length} passed, ` +
        `${failed.length} failed${skipped.length > 0 ? `, ${skipped.length} not reached` : ''}, ` +
        `in ${duration(total)}.`,
    );
    for (const r of failed) lines.push(`  re-run: npm run ${r.script}`);
  }
  return lines.join('\n');
}

/** Non-zero when anything failed or was not reached, so CI and shells see it. */
export function exitCodeFor(results: TierResult[]): number {
  return results.some((r) => !r.ok || r.skipped) ? 1 : 0;
}
