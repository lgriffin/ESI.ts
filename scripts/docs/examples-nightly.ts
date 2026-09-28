/**
 * Run the nightly examples against live ESI: `npm run examples:nightly`.
 *
 * Runs every example tagged `@nightly public` or `@nightly mixed` (see
 * scripts/docs/examples-core.ts), one at a time, from source with no access token
 * in the environment. A failure is retried once; an example that passes on the
 * retry is reported as flaky, not failed.
 *
 *   npm run examples:nightly                     # every nightly example
 *   npm run examples:nightly -- --only status.ts # one example
 *   npm run examples:nightly -- --json out.json  # also write the results
 *   npm run examples:nightly -- --tier sde       # only the SDE examples
 *
 * The `sde` examples run only when an export is on disk (`SDE_DATA_PATH`,
 * else ./sde-data, holding types.yaml): with `--tier sde` that is required,
 * otherwise they are left out and only the live tiers run.
 *
 * Writes a markdown summary to $GITHUB_STEP_SUMMARY when set. Exits 1 when an
 * example failed. The --json file is rewritten after every example, so a run
 * the workflow stops part-way still reports the examples that finished.
 */
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ExampleResult,
  type ExampleTier,
  failureReason,
  runTiers,
  summarize,
  tail,
  tierOf,
  verdictOf,
} from './examples-core';

const ROOT = path.resolve(__dirname, '../..');
const EXAMPLES = path.join(ROOT, 'examples');
const STRICT = path.join(__dirname, 'examples-strict.cjs');
const TIMEOUT_MS = 120_000;

/** Credentials an example could pick up; the nightly run is anonymous. */
const STRIPPED_ENV = [
  'ESI_ACCESS_TOKEN',
  'ESI_REFRESH_TOKEN',
  'ESI_CLIENT_ID',
  'ESI_CLIENT_SECRET',
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
      const tier = tierOf(fs.readFileSync(path.join(EXAMPLES, file), 'utf8'));
      return tier !== null && tiers.includes(tier);
    })
    .sort();
}

function runOnce(
  file: string,
): Promise<{ code: number | null; timedOut: boolean; output: string }> {
  const env: NodeJS.ProcessEnv = { ...process.env, ESI_LOG_LEVEL: 'error' };
  for (const name of STRIPPED_ENV) delete env[name];
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

async function run(file: string): Promise<ExampleResult> {
  const started = performance.now();
  let attempts = 0;
  let last: Awaited<ReturnType<typeof runOnce>>;
  do {
    attempts++;
    last = await runOnce(file);
  } while ((last.timedOut || last.code !== 0) && attempts < 2);
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
  const sdeData = hasSdeData();
  if (tierFlag === 'sde' && !sdeData) {
    console.error(
      'No SDE export on disk (SDE_DATA_PATH or ./sde-data with types.yaml); run npm run sde:ingest first.',
    );
    process.exit(1);
  }
  const files = nightlyExamples(
    runTiers(sdeData, tierFlag),
    argValue('--only'),
  );
  if (files.length === 0) {
    console.error('No nightly examples matched.');
    process.exit(1);
  }
  const jsonPath = argValue('--json');
  const results: ExampleResult[] = [];
  for (const file of files) {
    const result = await run(file);
    results.push(result);
    if (jsonPath) fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    const verdict = verdictOf(result);
    const detail = verdict === 'failed' ? ` (${failureReason(result)})` : '';
    console.log(`${verdict.padEnd(6)} ${file}${detail}`);
    if (verdict === 'failed') console.log(result.output.replace(/^/gm, '    '));
  }

  const summary = summarize(results);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) fs.appendFileSync(summaryPath, summary);

  const failed = results.filter((r) => verdictOf(r) === 'failed');
  console.log(
    `\n${results.length - failed.length} of ${results.length} examples passed.`,
  );
  if (failed.length > 0) process.exit(1);
}

void main();
