/**
 * npm run soak -- [--requests 100000] [--out reports/soak]
 *                 [--inject-leak --expect-fail]
 *
 * Runs the heap soak (tests/benchmark/soak.ts) and fails on a leak, a cache
 * above its bound, or timers and listeners left behind. `npm run soak` runs
 * node with --expose-gc; without it there is no forced collection and the
 * run refuses to start.
 *
 * --circuit-breaker enables the opt-in circuit breaker. It is not in the
 * nightly yet: its per-endpoint records are never reclaimed for endpoints that
 * never failed, so a run over distinct endpoints grows by about 140 KiB per
 * 1000 endpoints and fails (see tests/benchmark/AGENTS.md).
 *
 * --inject-leak adds the leaky response interceptor. With --expect-fail the
 * exit code inverts: the run passes only if the analysis flags the leak,
 * which is how the nightly proves the soak can still fail.
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import {
  SOAK_DEFAULTS,
  leakyInterceptor,
  runSoak,
} from '../tests/benchmark/soak';
import { analyseSoak, renderSoakMarkdown } from './soak-core';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main(): Promise<void> {
  const gc = (globalThis as { gc?: () => void }).gc;
  if (!gc) {
    console.error('Run with node --expose-gc (npm run soak does).');
    process.exit(2);
  }
  const injectLeak = process.argv.includes('--inject-leak');
  const expectFail = process.argv.includes('--expect-fail');
  const out = arg('out') ?? path.join('reports', 'soak');
  const requests = Number(arg('requests') ?? SOAK_DEFAULTS.requests);

  const run = await runSoak({
    ...SOAK_DEFAULTS,
    requests,
    gc,
    responseInterceptors: injectLeak ? [leakyInterceptor()] : undefined,
    circuitBreaker: process.argv.includes('--circuit-breaker'),
  });
  const verdict = analyseSoak(run);
  const title = injectLeak ? ' (leak injected)' : '';
  const markdown = renderSoakMarkdown(run, verdict).replace(
    '## Heap soak',
    `## Heap soak${title}`,
  );

  console.log(markdown);
  mkdirSync(out, { recursive: true });
  const name = injectLeak ? 'soak-leak-injected' : 'soak';
  writeFileSync(
    path.join(out, `${name}.json`),
    `${JSON.stringify({ run, verdict }, null, 2)}\n`,
  );
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  }

  if (expectFail) {
    if (verdict.passed) {
      console.error(
        'The soak did not flag the injected leak, so it cannot detect a real one.',
      );
      process.exit(1);
    }
    console.log('The injected leak was flagged, as expected.');
    return;
  }
  if (!verdict.passed) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
