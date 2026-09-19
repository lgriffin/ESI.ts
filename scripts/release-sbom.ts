/**
 * npm run release:sbom -- --tarball lgriffin-esi.ts-10.1.1.tgz
 *
 * SEC-06. Writes the CycloneDX SBOM for a packed tarball next to it, as
 * `<tarball>.cdx.json` without the `.tgz`, and fails if the document does not
 * describe that package: see scripts/release-sbom-core.ts for what is checked
 * and why `npm sbom --omit dev` is not used directly.
 *
 * The tree is described from the tarball's own package.json, so the SBOM names
 * the bytes being published, and from the repository's package-lock.json, so
 * every version is the one CI installed and tested. Resolution runs with
 * `--offline` against an empty cache: if the lockfile could not pin the whole
 * runtime tree on its own, the release stops here rather than letting npm
 * choose versions nothing tested.
 *
 *   --tarball <file>   the tarball `npm pack` wrote (required)
 *   --out <file>       where to write the SBOM (default: next to the tarball)
 *   --lockfile <file>  the lockfile to pin versions with (default: ./package-lock.json)
 */
import { spawnSync } from 'child_process';
import {
  appendFileSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  Manifest,
  ReleaseSbomError,
  nameRootComponent,
  productionManifest,
  readTarEntry,
  sbomFileName,
  sbomProblems,
} from './release-sbom-core';

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new ReleaseSbomError(`--${name} needs a value.`);
  }
  return value;
}

function npm(args: string[], cwd: string): string {
  // `npm` on Windows is a shim that needs a shell.
  const result = spawnSync('npm', args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new ReleaseSbomError(
      `npm ${args.join(' ')} failed:\n${result.stdout}${result.stderr}`.trim(),
    );
  }
  return result.stdout;
}

/**
 * The SBOM npm writes for `manifest`'s runtime tree, pinned by `lockfile`.
 * Runs in a temporary directory holding only those two files, so nothing from
 * the repository's node_modules or dev tree can reach it.
 */
export function generateSbom(manifest: Manifest, lockfile: string): unknown {
  const work = mkdtempSync(path.join(tmpdir(), 'esi-sbom-'));
  try {
    const cache = path.join(work, '.npm-cache');
    mkdirSync(cache);
    writeFileSync(
      path.join(work, 'package.json'),
      JSON.stringify(productionManifest(manifest), null, 2),
    );
    copyFileSync(lockfile, path.join(work, 'package-lock.json'));
    const common = ['--cache', cache, '--no-audit', '--no-fund'];
    // Prunes the lockfile to the runtime tree without changing a version.
    npm(
      [
        'install',
        '--package-lock-only',
        '--ignore-scripts',
        '--offline',
        ...common,
      ],
      work,
    );
    const raw = npm(
      ['sbom', '--sbom-format', 'cyclonedx', '--package-lock-only', ...common],
      work,
    );
    return nameRootComponent(JSON.parse(raw), manifest);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function main(): void {
  const tarball = flag('tarball');
  if (!tarball) throw new ReleaseSbomError('--tarball is required.');
  const out =
    flag('out') ?? path.join(path.dirname(tarball), sbomFileName(tarball));
  const lockfile = flag('lockfile') ?? 'package-lock.json';

  const manifest = JSON.parse(
    readTarEntry(readFileSync(tarball), 'package/package.json').toString(
      'utf8',
    ),
  ) as Manifest;

  const sbom = generateSbom(manifest, lockfile);
  const problems = sbomProblems(sbom, manifest);
  if (problems.length > 0) {
    throw new ReleaseSbomError(
      `The SBOM for ${manifest.name}@${manifest.version} is not fit to publish:\n` +
        problems.map((p) => `  - ${p}`).join('\n'),
    );
  }

  writeFileSync(out, `${JSON.stringify(sbom, null, 2)}\n`);
  const components = (sbom as { components: unknown[] }).components.length;
  const summary = `SBOM: ${out} describes ${manifest.name}@${manifest.version} with ${components} components.`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `sbom=${path.basename(out)}\n`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    if (err instanceof ReleaseSbomError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}
