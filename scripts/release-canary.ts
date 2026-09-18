/**
 * npm run release:canary -- --version 10.1.0
 *
 * Tier P. Installs a published version from the registry into an empty
 * directory and establishes that it works: see scripts/release-canary-core.ts
 * for what the four checks are and why each one is there.
 *
 * Nothing from this repository is on the consumer's disk. The point is to test
 * what npm serves, not what the working tree builds, so the probe directory is
 * created outside the project and holds only a package.json and the install.
 *
 *   --version <v>   the version to verify; also read from CANARY_VERSION or
 *                   GITHUB_REF_NAME (a vX.Y.Z tag)
 *   --skip-live     do not call ESI; for running the canary offline
 *   --wait <sec>    how long to wait for the registry to serve the version
 */
import { spawnSync } from 'child_process';
import { mkdtempSync, writeFileSync, appendFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  PACKAGE_NAME,
  DOCUMENTED_SUBPATHS,
  runRuntimeProbe,
} from './consumer-contract-core';
import {
  CheckResult,
  ReleaseCanaryError,
  canaryProblems,
  isVerified,
  renderCanaryReport,
  versionFrom,
} from './release-canary-core';

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new ReleaseCanaryError(`--${name} needs a value.`);
  }
  return value;
}

function run(
  command: string,
  args: string[],
  cwd: string,
): { ok: boolean; output: string } {
  // `npm` on Windows is a shim that needs a shell; an absolute path — the Node
  // binary — must not go through one, or a space in "C:\Program Files" splits
  // the command.
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32' && !path.isAbsolute(command),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) throw result.error;
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

/** First line of a command's output, for a table cell. */
function firstLine(output: string, fallback: string): string {
  return (
    output
      .split('\n')
      .find((l) => l.trim().length > 0)
      ?.trim() ?? fallback
  );
}

/**
 * Publishing and the registry serving it are not the same instant, and the
 * release event fires on the first. Polling is the difference between a canary
 * that verifies the release and one that reports a version that "does not
 * exist" every time.
 */
function waitForRegistry(version: string, waitSeconds: number): CheckResult {
  const deadline = Date.now() + waitSeconds * 1000;
  let last = '';
  for (;;) {
    const view = run(
      'npm',
      ['view', `${PACKAGE_NAME}@${version}`, 'dist.tarball'],
      process.cwd(),
    );
    if (view.ok && view.output.includes('http')) {
      return {
        check: 'registry',
        ok: true,
        detail: `serving ${firstLine(view.output, 'a tarball')}`,
      };
    }
    last = firstLine(view.output, 'no output');
    if (Date.now() >= deadline) {
      return {
        check: 'registry',
        ok: false,
        detail: `${PACKAGE_NAME}@${version} not served after ${waitSeconds}s: ${last}`,
      };
    }
    // Registry propagation is on the order of seconds to a minute.
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10_000);
  }
}

function main(): void {
  const version = versionFrom(
    flag('version') ??
      process.env.CANARY_VERSION ??
      process.env.GITHUB_REF_NAME ??
      '',
  );
  const waitSeconds = Number(flag('wait') ?? 300);
  const skipLive = process.argv.includes('--skip-live');

  console.log(`Canary: ${PACKAGE_NAME}@${version}`);

  const results: CheckResult[] = [];
  const registry = waitForRegistry(version, waitSeconds);
  results.push(registry);

  const consumer = mkdtempSync(path.join(tmpdir(), 'esi-canary-'));
  console.log(`Consumer directory: ${consumer}`);

  if (!registry.ok) {
    // Nothing downstream can mean anything without the package.
    for (const check of ['signatures', 'subpaths', 'live'] as const) {
      results.push({
        check,
        ok: false,
        skipped: true,
        detail: 'the registry did not serve the version',
      });
    }
  } else {
    writeFileSync(
      path.join(consumer, 'package.json'),
      `${JSON.stringify({ name: 'esi-canary', private: true, version: '0.0.0' }, null, 2)}\n`,
    );

    const install = run(
      'npm',
      ['install', `${PACKAGE_NAME}@${version}`, '--no-audit', '--no-fund'],
      consumer,
    );
    if (!install.ok) {
      results.push({
        check: 'signatures',
        ok: false,
        detail: `install failed: ${firstLine(install.output, 'no output')}`,
      });
      for (const check of ['subpaths', 'live'] as const) {
        results.push({
          check,
          ok: false,
          skipped: true,
          detail: 'the package did not install',
        });
      }
    } else {
      const signatures = run('npm', ['audit', 'signatures'], consumer);
      results.push({
        check: 'signatures',
        ok: signatures.ok,
        detail: firstLine(signatures.output, 'no output'),
      });

      const probe = runRuntimeProbe(
        consumer,
        PACKAGE_NAME,
        DOCUMENTED_SUBPATHS,
      );
      results.push({
        check: 'subpaths',
        ok: probe.ok,
        detail: firstLine(probe.output, 'no output'),
      });

      if (skipLive) {
        results.push({
          check: 'live',
          ok: false,
          skipped: true,
          detail: '--skip-live',
        });
      } else {
        const liveFile = path.join(consumer, 'live.mjs');
        writeFileSync(
          liveFile,
          `import { EsiClient } from '${PACKAGE_NAME}';\n` +
            `const status = await new EsiClient({}).status.getStatus();\n` +
            `if (typeof status?.players !== 'number') {\n` +
            `  console.error('status did not carry a player count: ' + JSON.stringify(status));\n` +
            `  process.exit(1);\n` +
            `}\n` +
            `console.log('live: ESI reported ' + status.players + ' players');\n`,
        );
        const live = run(process.execPath, [liveFile], consumer);
        results.push({
          check: 'live',
          ok: live.ok,
          detail: firstLine(live.output, 'no output'),
        });
      }
    }
  }

  const report = renderCanaryReport(PACKAGE_NAME, version, results);
  console.log(`\n${report}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `verified=${isVerified(results)}\nversion=${version}\n`,
    );
  }

  const problems = canaryProblems(results);
  if (problems.length > 0) {
    console.error(`\n${problems.join('\n')}`);
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  if (err instanceof ReleaseCanaryError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
}
