/**
 * npm run release:canary -- --version 10.1.0
 *
 * Tier P. Installs a published version from the registry into an empty
 * directory and establishes that it works, then verifies the GitHub release
 * assets it came with: see scripts/release-canary-core.ts for the five checks
 * and why each one is there.
 *
 * Nothing from this repository is on the consumer's disk, and nothing from the
 * shared npm cache either. The point is to test what the registry serves on
 * this run, so the probe directory is created outside the project, holds only
 * a package.json and the install, and every npm command runs against a cache
 * directory of its own. A cached copy of the package would otherwise satisfy
 * the install and the canary would verify bytes the registry never sent.
 *
 *   --version <v>   the version to verify; also read from CANARY_VERSION or
 *                   GITHUB_REF_NAME (a vX.Y.Z tag)
 *   --skip-live     do not call ESI; for running the canary offline
 *   --wait <sec>    how long to wait for the registry to serve the version
 */
import { spawnSync } from 'child_process';
import { mkdtempSync, writeFileSync, appendFileSync, readFileSync } from 'fs';
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
  assetIdentitySpec,
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
  env: NodeJS.ProcessEnv = process.env,
): { ok: boolean; output: string } {
  // `npm` on Windows is a shim that needs a shell; an absolute path — the Node
  // binary — must not go through one, or a space in "C:\Program Files" splits
  // the command.
  const result = spawnSync(command, args, {
    cwd,
    env,
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

/**
 * The `assets` check (esi-23g.67): the GitHub release assets that
 * `release.yml` signed and listed in `checksums.txt`.
 *
 * It does the four things a consumer would do with them, and the one thing
 * only this canary can — run them end-to-end against a published release:
 *
 *   1. download them with `gh release download`;
 *   2. `sha256sum --check --strict checksums.txt` — the bytes match what was
 *      recorded; --strict so a file missing from the checksum file is a
 *      failure rather than a silent pass;
 *   3. `cosign verify-blob --bundle <asset>.sigstore.json` for the tarball
 *      and the SBOM, anchored on the workflow identity for this tag — the
 *      bytes are what `release.yml` signed, by the OIDC identity it was
 *      allowed to mint;
 *   4. the SBOM names this version — a SBOM for a different release proves
 *      nothing about the bytes on this tag.
 *
 * It runs after the other four: if npm itself is serving a broken package,
 * that is the finding, and a missing release page on top of it only muddies
 * the issue that gets opened. And if the release is not there — the canary
 * was dispatched manually, or the assets were never uploaded — the check
 * reports that as its detail, which is the true state of the release.
 */
function verifyReleaseAssets(
  version: string,
  repository: string,
  dir: string,
): CheckResult {
  const { identity, issuer } = assetIdentitySpec(repository, version);
  const base = `lgriffin-esi.ts-${version}`;
  const assets = [`${base}.tgz`, `${base}.cdx.json`];
  const bundles = [`${base}.tgz.sigstore.json`, `${base}.cdx.json.sigstore.json`];

  // 1. Download. `--clobber` so a rerun over the same directory is clean.
  const download = run(
    'gh',
    [
      'release',
      'download',
      `v${version}`,
      '--repo',
      repository,
      '--pattern',
      '*.tgz',
      '--pattern',
      '*.cdx.json',
      '--pattern',
      '*.sigstore.json',
      '--pattern',
      'checksums.txt',
      '--clobber',
      '-D',
      dir,
    ],
    dir,
  );
  if (!download.ok) {
    return {
      check: 'assets',
      ok: false,
      detail: `cannot download the v${version} assets: ${firstLine(download.output, 'no output')}`,
    };
  }

  // 2. Checksums, over every file in the release that checksums.txt lists.
  const sums = run('sha256sum', ['--check', '--strict', 'checksums.txt'], dir);
  if (!sums.ok) {
    return {
      check: 'assets',
      ok: false,
      detail: `checksums do not verify: ${firstLine(sums.output, 'no output')}`,
    };
  }

  // 3. The cosign bundles for the tarball and the SBOM, anchored on the
  // workflow identity for this tag. `cosign` exits non-zero and says why.
  for (const asset of assets) {
    const bundle = `${asset}.sigstore.json`;
    if (!bundles.includes(bundle)) {
      // Unreachable: bundles is derived from assets. Guard anyway, because a
      // canary that verifies a bundle it was not told to verify is a canary
      // that passes by accident.
      return {
        check: 'assets',
        ok: false,
        detail: `${bundle}: no bundle expected for this asset`,
      };
    }
    const verify = run(
      'cosign',
      [
        'verify-blob',
        asset,
        '--bundle',
        bundle,
        '--certificate-identity',
        identity,
        '--certificate-oidc-issuer',
        issuer,
      ],
      dir,
    );
    if (!verify.ok) {
      return {
        check: 'assets',
        ok: false,
        detail: `cosign does not verify ${asset}: ${firstLine(verify.output, 'no output')}`,
      };
    }
  }

  // 4. The SBOM names the version the canary was given.
  const sbom = `${base}.cdx.json`;
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(path.join(dir, sbom), 'utf8'));
  } catch (err) {
    return {
      check: 'assets',
      ok: false,
      detail: `SBOM ${sbom} is not valid JSON: ${(err as Error).message}`,
    };
  }
  const componentVersion = (doc as Record<string, unknown> | undefined)
    ?.metadata as
    | { component?: { version?: unknown } }
    | undefined;
  const versionField = componentVersion?.component?.version;
  if (versionField !== version) {
    return {
      check: 'assets',
      ok: false,
      detail: `SBOM names ${JSON.stringify(versionField ?? 'no version')} for metadata.component.version, expected ${version}`,
    };
  }

  return {
    check: 'assets',
    ok: true,
    detail: `checksums verify; cosign verifies ${assets.join(' and ')} under ${identity}; SBOM names ${version}`,
  };
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
  // GITHUB_REPOSITORY is set by every GitHub Actions workflow; the canary
  // reads it rather than hardcoding the owner, so a fork's release page is
  // the one it verifies.
  const repository = process.env.GITHUB_REPOSITORY ?? 'lgriffin/ESI.ts';

  console.log(`Canary: ${PACKAGE_NAME}@${version}`);

  const results: CheckResult[] = [];
  const registry = waitForRegistry(version, waitSeconds);
  results.push(registry);

  // The assets check is independent of the npm side: it downloads from the
  // GitHub release, not the registry. But a broken npm package and a broken
  // release page on the same run would open one issue with two findings in
  // it, so the assets check runs after the other four and reports its own
  // detail if it fails.
  const assetsDir = mkdtempSync(path.join(tmpdir(), 'esi-canary-assets-'));

  const consumer = mkdtempSync(path.join(tmpdir(), 'esi-canary-'));
  // Its own npm cache, so nothing already on this machine can satisfy the
  // install. npm_config_cache is the environment form of `npm --cache`.
  const cacheDir = path.join(consumer, '.npm-cache');
  const npmEnv = { ...process.env, npm_config_cache: cacheDir };
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
    // The assets check still runs: the release page is a different surface
    // from the registry, and a release that is missing or broken is a
    // finding in its own right.
    results.push(verifyReleaseAssets(version, repository, assetsDir));
  } else {
    // The assets check is independent of npm: it downloads from the GitHub
    // release, not the registry. It runs here too — the happy path must not
    // report a false "assets: did not report" failure.
    results.push(verifyReleaseAssets(version, repository, assetsDir));
    writeFileSync(
      path.join(consumer, 'package.json'),
      `${JSON.stringify({ name: 'esi-canary', private: true, version: '0.0.0' }, null, 2)}\n`,
    );

    const install = run(
      'npm',
      [
        'install',
        `${PACKAGE_NAME}@${version}`,
        '--no-audit',
        '--no-fund',
        '--prefer-online',
      ],
      consumer,
      npmEnv,
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
      const signatures = run('npm', ['audit', 'signatures'], consumer, npmEnv);
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
