/**
 * Run the nightly examples against live ESI: `npm run examples:nightly`.
 *
 * Runs every example tagged `@nightly public` or `@nightly mixed` (see
 * scripts/docs/examples-core.ts), one at a time, from source with no access token
 * in the environment. A failure is retried once; an example that passes on the
 * retry is reported as flaky, not failed.
 *
 * `--authenticated` runs the `auth` and `mixed` examples instead, each with an
 * access token in ESI_ACCESS_TOKEN. The token comes from ESI_SSO_CLIENT_ID and
 * ESI_REFRESH_TOKEN (minted, and minted again near expiry; see
 * scripts/auth/sso-refresh.ts), or from ESI_ACCESS_TOKEN when no refresh token
 * is set. The refresh token and client ID never reach an example.
 *
 *   npm run examples:nightly                     # every nightly example
 *   npm run examples:nightly -- --only status.ts # one example
 *   npm run examples:nightly -- --json out.json  # also write the results
 *   npm run examples:nightly -- --tier sde       # only the SDE examples
 *   npm run examples:nightly -- --authenticated  # auth + mixed, with a token
 *
 * The `sde` examples run only when an export is on disk (`SDE_DATA_PATH`,
 * else ./sde-data, holding types.yaml): with `--tier sde` that is required,
 * otherwise they are left out and only the live tiers run.
 *
 * Before a live tier runs it waits, up to 30 minutes, for Tranquility to
 * answer `/status` and finish warming up (see `tranquilityReady`), and it
 * waits a minute before retrying a failure Tranquility being down explains.
 * A failure that is still an outage after the retry is reported as
 * `unavailable`, not failed.
 *
 * Writes a markdown summary to $GITHUB_STEP_SUMMARY when set. Exits 1 when an
 * example failed; an `unavailable` one only warns. The --json file is rewritten after every example, so a run
 * the workflow stops part-way still reports the examples that finished.
 */
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ExampleResult,
  type ExampleTier,
  failureReason,
  isOutage,
  runTiers,
  summarize,
  tail,
  tierOf,
  tranquilityReady,
  verdictOf,
} from './examples-core';
import { TokenSource } from '../auth/sso-refresh';

const ROOT = path.resolve(__dirname, '../..');
const EXAMPLES = path.join(ROOT, 'examples');
const STRICT = path.join(__dirname, 'examples-strict.cjs');
const TIMEOUT_MS = 120_000;
const ESI_BASE_URL = process.env.ESI_BASE_URL ?? 'https://esi.evetech.net';
const READY_WAIT_MS = 30 * 60_000;
const POLL_MS = 60_000;
const OUTAGE_RETRY_DELAY_MS = 60_000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Credentials an example could pick up. The anonymous run passes none; the
 * authenticated run passes only the access token it minted.
 */
const STRIPPED_ENV = [
  'ESI_ACCESS_TOKEN',
  'ESI_REFRESH_TOKEN',
  'ESI_CLIENT_ID',
  'ESI_CLIENT_SECRET',
  'ESI_SSO_CLIENT_ID',
  'ESI_SSO_CLIENT_SECRET',
];

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

/** Whether an SDE export is on disk for the `sde` tier to read. */
function hasSdeData(): boolean {
  const dir = path.resolve(ROOT, process.env.SDE_DATA_PATH ?? 'sde-data');
  return fs.existsSync(path.join(dir, 'types.yaml'));
}

function nightlyExamples(
  tiers: readonly ExampleTier[],
  only?: string,
): string[] {
  return fs
    .readdirSync(EXAMPLES)
    .filter((file) => file.endsWith('.ts'))
    .filter((file) => !only || file === only)
    .filter((file) => {
      const tier = tierOfFile(file);
      return tier !== null && tiers.includes(tier);
    })
    .sort();
}

function tierOfFile(file: string): ExampleTier | null {
  return tierOf(fs.readFileSync(path.join(EXAMPLES, file), 'utf8'));
}

function runOnce(
  file: string,
  accessToken: string | null,
): Promise<{ code: number | null; timedOut: boolean; output: string }> {
  const env: NodeJS.ProcessEnv = { ...process.env, ESI_LOG_LEVEL: 'error' };
  for (const name of STRIPPED_ENV) delete env[name];
  if (accessToken) env.ESI_ACCESS_TOKEN = accessToken;
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        '-r',
        STRICT,
        '-r',
        'ts-node/register/transpile-only',
        path.join(EXAMPLES, file),
      ],
      { cwd: ROOT, env },
    );
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, TIMEOUT_MS);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: timedOut ? null : code, timedOut, output });
    });
  });
}

/**
 * Wait until Tranquility answers `/status` and has warmed up, or until
 * `READY_WAIT_MS` passes; the run goes ahead either way, and an outage that
 * outlasts the wait shows as `unavailable` results.
 */
async function waitForTranquility(): Promise<void> {
  const deadline = Date.now() + READY_WAIT_MS;
  let announced = false;
  for (;;) {
    let ready = false;
    try {
      const response = await fetch(`${ESI_BASE_URL}/status/`, {
        signal: AbortSignal.timeout(30_000),
      });
      const body: unknown = response.ok ? await response.json() : null;
      ready = tranquilityReady(response.status, body, new Date());
    } catch {
      ready = false;
    }
    if (ready) return;
    if (Date.now() + POLL_MS > deadline) {
      console.log(
        'Tranquility is still not ready; running anyway, so outages show as unavailable.',
      );
      return;
    }
    if (!announced) {
      console.log(
        'Tranquility is down or warming up (daily downtime 11:00 UTC); waiting for it.',
      );
      announced = true;
    }
    await sleep(POLL_MS);
  }
}

async function run(
  file: string,
  tokens: TokenSource | null,
): Promise<ExampleResult> {
  const started = performance.now();
  let attempts = 0;
  let last: Awaited<ReturnType<typeof runOnce>>;
  for (;;) {
    attempts++;
    // Per attempt, so a retry after a long wait still gets a fresh token.
    last = await runOnce(file, tokens ? await tokens.get() : null);
    if ((!last.timedOut && last.code === 0) || attempts >= 2) break;
    if (!last.timedOut && isOutage(last.output)) {
      await sleep(OUTAGE_RETRY_DELAY_MS);
    }
  }
  return {
    file,
    exitCode: last.code,
    timedOut: last.timedOut,
    attempts,
    output: tail(last.output),
    durationMs: performance.now() - started,
  };
}

async function main(): Promise<void> {
  const tierFlag = argValue('--tier');
  const authenticated = process.argv.includes('--authenticated');
  const sdeData = hasSdeData();
  if (!authenticated && tierFlag === 'sde' && !sdeData) {
    console.error(
      'No SDE export on disk (SDE_DATA_PATH or ./sde-data with types.yaml); run npm run sde:ingest first.',
    );
    process.exit(1);
  }
  const files = nightlyExamples(
    runTiers(sdeData, tierFlag, authenticated),
    argValue('--only'),
  );
  if (files.length === 0) {
    console.error('No nightly examples matched.');
    process.exit(1);
  }
  // Fails here, before any example runs, when the secrets are missing or the
  // refresh token is no longer valid.
  const tokens = authenticated ? TokenSource.fromEnv() : null;
  if (tokens) await tokens.get();
  if (files.some((file) => tierOfFile(file) !== 'sde')) {
    await waitForTranquility();
  }
  const jsonPath = argValue('--json');
  const results: ExampleResult[] = [];
  for (const file of files) {
    const result = await run(file, tokens);
    results.push(result);
    if (jsonPath) {
      const withVerdicts = results.map((r) => ({
        ...r,
        verdict: verdictOf(r),
      }));
      fs.writeFileSync(jsonPath, JSON.stringify(withVerdicts, null, 2));
    }
    const verdict = verdictOf(result);
    const failed = verdict === 'failed' || verdict === 'unavailable';
    const detail = failed ? ` (${failureReason(result)})` : '';
    console.log(`${verdict.padEnd(6)} ${file}${detail}`);
    if (failed) console.log(result.output.replace(/^/gm, '    '));
  }

  const summary = summarize(
    results,
    authenticated ? 'Nightly authenticated examples' : 'Nightly examples',
  );
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) fs.appendFileSync(summaryPath, summary);

  const failed = results.filter((r) => verdictOf(r) === 'failed');
  const unavailable = results.filter((r) => verdictOf(r) === 'unavailable');
  console.log(
    `\n${results.length - failed.length - unavailable.length} of ${results.length} examples passed.`,
  );
  if (unavailable.length > 0) {
    console.log(
      `::warning title=Nightly examples::${unavailable.length} example(s) could not run because Tranquility was unavailable`,
    );
  }
  if (failed.length > 0) process.exit(1);
}

void main();
