/**
 * The runnable examples in examples/, and which of them the nightly run
 * executes against live ESI (`npm run examples:nightly`).
 *
 * Every example carries an `@nightly <tier>` tag in its header comment:
 *
 * - `public`: calls only unauthenticated routes. Runs nightly and must pass.
 * - `mixed`: public calls first, then optional authenticated ones that it
 *   skips without `ESI_ACCESS_TOKEN`. Runs nightly without a token.
 * - `auth`: needs an access token. Type-checked, not run.
 * - `sde`: needs a local SDE export. Type-checked, not run.
 *
 * An example passes when it exits 0 within its time limit and writes nothing
 * through `console.error`. The second condition catches an example that
 * catches a failure, logs it and exits 0 anyway; scripts/examples-strict.cjs
 * turns such a run's exit code into STRICT_EXIT_CODE.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

export const TIERS = ['public', 'mixed', 'auth', 'sde'] as const;
export type ExampleTier = (typeof TIERS)[number];

/** The tiers the nightly run executes. */
export const RUN_TIERS: readonly ExampleTier[] = ['public', 'mixed'];

/** Exit code scripts/examples-strict.cjs gives a run that logged an error. */
export const STRICT_EXIT_CODE = 86;

/** The `@nightly` tier in an example's source, or null when it has none or an unknown one. */
export function tierOf(source: string): ExampleTier | null {
  const match = /^\s*\*\s*@nightly\s+(\S+)\s*$/m.exec(source);
  const tier = match?.[1];
  return tier && (TIERS as readonly string[]).includes(tier)
    ? (tier as ExampleTier)
    : null;
}

export interface ExampleResult {
  /** File name under examples/, e.g. `status.ts`. */
  file: string;
  /** Exit code of the last attempt, or null when it timed out. */
  exitCode: number | null;
  timedOut: boolean;
  /** How many attempts ran (a failure is retried once). */
  attempts: number;
  /** The tail of the last attempt's output, for the issue body. */
  output: string;
  durationMs: number;
}

export type Verdict = 'passed' | 'flaky' | 'failed';

export function verdictOf(result: ExampleResult): Verdict {
  const ok = !result.timedOut && result.exitCode === 0;
  if (!ok) return 'failed';
  return result.attempts > 1 ? 'flaky' : 'passed';
}

/** Why a failed run failed, in words for the issue title and summary. */
export function failureReason(result: ExampleResult): string {
  if (result.timedOut) return 'timed out';
  if (result.exitCode === STRICT_EXIT_CODE)
    return 'exited 0 but logged an error';
  return `exited with code ${result.exitCode}`;
}

/** The issue title the nightly workflow opens, comments on and closes for one example. */
export function issueTitle(file: string): string {
  return `Nightly example failing: examples/${file}`;
}

/** The last `maxLines` lines of `text`. */
export function tail(text: string, maxLines = 60): string {
  const lines = text.trimEnd().split('\n');
  return lines.slice(-maxLines).join('\n');
}

/** A markdown summary of a nightly run, for the job summary. */
export function summarize(results: readonly ExampleResult[]): string {
  const rows = results.map((r) => {
    const verdict = verdictOf(r);
    const detail =
      verdict === 'failed'
        ? failureReason(r)
        : verdict === 'flaky'
          ? 'passed on retry'
          : '';
    return `| \`${r.file}\` | ${verdict} | ${(r.durationMs / 1000).toFixed(1)}s | ${detail} |`;
  });
  const failed = results.filter((r) => verdictOf(r) === 'failed').length;
  return [
    '## Nightly examples',
    '',
    `${results.length - failed} of ${results.length} passed.`,
    '',
    '| Example | Result | Time | Detail |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

export interface EndpointRef {
  /** The endpoint's key in its `*Endpoints.ts` map. */
  name: string;
  /** The `EsiClient` getter an example reaches it through, such as `market`. */
  client: string;
  path: string;
  method: string;
  requiresAuth: boolean;
}

/** The key `callers` uses for an endpoint: its client, a dot, its name. */
export function endpointId(endpoint: Pick<EndpointRef, 'client' | 'name'>) {
  return `${endpoint.client}.${endpoint.name}`;
}

/**
 * Public endpoints that no nightly example calls. An endpoint counts as called
 * when an example calls `.<client>.<name>` for the endpoint key or any client
 * method that calls it, so two clients with the same key (`factions.getWars`,
 * `wars.getWars`) are counted apart. `callers` maps `endpointId` to methods.
 */
export function uncoveredPublicEndpoints(
  endpoints: readonly EndpointRef[],
  callers: ReadonlyMap<string, ReadonlySet<string>>,
  nightlySources: readonly string[],
): EndpointRef[] {
  const text = nightlySources.join('\n');
  return endpoints.filter((endpoint) => {
    if (endpoint.requiresAuth) return false;
    const names = [endpoint.name, ...(callers.get(endpointId(endpoint)) ?? [])];
    return !names.some((name) =>
      new RegExp(`\\.${endpoint.client}\\s*\\.\\s*${name}\\b`).test(text),
    );
  });
}

/**
 * Client methods and the endpoint keys each one calls, read from a client's
 * source: `this.api.<key>` or `streamEndpoint('<key>'`/`fetchAllEndpoint('<key>'`
 * inside a method body. `client` is the `EsiClient` getter that returns this
 * client. Returns `endpointId` to method names.
 */
export function callersFromClientSource(
  source: string,
  client: string,
  into: Map<string, Set<string>> = new Map(),
): Map<string, Set<string>> {
  const methodStart = /^ {2}(?:async\s+)?(?:\*\s*)?(\w+)\s*(?:<[^>]*>)?\(/gm;
  const starts: Array<[string, number]> = [];
  for (const match of source.matchAll(methodStart)) {
    starts.push([match[1]!, match.index]);
  }
  starts.forEach(([method, start], i) => {
    const body = source.slice(start, starts[i + 1]?.[1] ?? source.length);
    for (const call of body.matchAll(
      /\bapi\.(\w+)|(?:streamEndpoint|fetchAllEndpoint)(?:<[^>]*>)?\(\s*'(\w+)'/g,
    )) {
      const key = endpointId({ client, name: (call[1] ?? call[2])! });
      if (!into.has(key)) into.set(key, new Set());
      into.get(key)!.add(method);
    }
  });
  return into;
}
