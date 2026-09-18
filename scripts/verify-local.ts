/**
 * npm run check:local [-- --fast | --all]
 *
 * Runs the test tiers a pull request will run, in one command, on your
 * machine. `npm test` is the unit and BDD suites; this is everything else CI
 * gates on that does not need the network or a base branch — the fault
 * catalogue, the recorded-payload replay, export coverage, the documentation
 * examples, the packaged tarball, the consumer matrix, the size budgets.
 *
 *   --fast   the quick stage only: no build, seconds to a minute or two
 *   --all    adds the slow tiers (type mutation)
 *   default  quick plus the tiers that need dist/
 *
 * Every tier runs even after one fails, because the useful answer is the whole
 * list, not the first thing to break. The summary names the command to re-run.
 * See scripts/verify-local-core.ts for what is in the list and what is not.
 */
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import * as path from 'path';

import {
  TIERS,
  TierResult,
  VerifyLocalError,
  duplicateScripts,
  exitCodeFor,
  renderSummary,
  selectTiers,
  unknownScripts,
} from './verify-local-core';

const ROOT = path.resolve(__dirname, '..');

function run(script: string): { ok: boolean; ms: number } {
  const started = Date.now();
  const result = spawnSync('npm', ['run', script], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return { ok: result.status === 0, ms: Date.now() - started };
}

function main(): void {
  const argv = process.argv.slice(2);
  const tiers = selectTiers(TIERS, argv);

  // A tier naming a script that no longer exists would otherwise be a silent
  // no-op, which is the failure this whole runner is meant to prevent.
  const scripts = JSON.parse(
    readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
  ).scripts as Record<string, string>;
  const unknown = unknownScripts(tiers, scripts);
  if (unknown.length > 0) {
    throw new VerifyLocalError(
      `No npm script named ${unknown.join(', ')}; scripts/verify-local-core.ts is out of date.`,
    );
  }
  const repeated = duplicateScripts(tiers);
  if (repeated.length > 0) {
    throw new VerifyLocalError(
      `Listed twice in TIERS: ${repeated.join(', ')}.`,
    );
  }

  console.log(`Running ${tiers.length} tiers.\n`);

  const results: TierResult[] = [];
  let buildFailed = false;

  for (const tier of tiers) {
    // Everything in the built stage reads dist/, so a failed build makes their
    // failures meaningless. Report them as not reached rather than as failures.
    if (buildFailed && tier.stage === 'built') {
      results.push({
        script: tier.script,
        covers: tier.covers,
        ok: false,
        ms: 0,
        skipped: true,
      });
      continue;
    }

    console.log(`\n=== ${tier.script} — ${tier.covers}\n`);
    const { ok, ms } = run(tier.script);
    if (!ok && tier.script === 'build') buildFailed = true;
    results.push({ script: tier.script, covers: tier.covers, ok, ms });
  }

  console.log(`\n${'='.repeat(64)}\n`);
  console.log(renderSummary(results));
  process.exit(exitCodeFor(results));
}

try {
  main();
} catch (err) {
  if (err instanceof VerifyLocalError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
}
