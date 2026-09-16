/**
 * npm run test:consumer [-- --skip-build] [-- --keep]
 *
 * The consumer contract test: what a downstream project sees after
 * `npm install @lgriffin/esi.ts`, which no in-repo test can see because they
 * all import from `src/`.
 *
 * 1. Build, then `npm pack` the library into a temporary directory.
 * 2. Copy `tests/consumer/` next to the tarball, outside the repository so
 *    module resolution cannot fall back to the repo's own `node_modules`.
 * 3. `npm install` the tarball plus `typescript` and `@types/node` at the
 *    versions this repository uses, but not the optional peers of `./sde`
 *    (js-yaml, adm-zip): `./sde` must load without them and name them when a
 *    feature needs one. Steps 4 to 6 also run without them.
 * 4. Check that every sub-path in the packed `exports` map is imported by the
 *    CommonJS, ES module and bundler consumers.
 * 5. Type-check (`skipLibCheck: false`, so the shipped declarations are
 *    checked too) under `nodenext` and under `bundler` resolution.
 * 6. Run the emitted CommonJS and ES module consumers with node, then the
 *    dual-build parity check over every sub-path.
 * 7. Install js-yaml and adm-zip, then load real SDE YAML and ZIP files
 *    through both the CommonJS and ES module builds of `./sde`.
 *
 * Defects the contract has found are recorded as known issues against their
 * beads. Each one logs while it reproduces and fails the run once it stops,
 * so a fix cannot leave its workaround behind.
 *
 * --skip-build packs the existing `dist/`. --keep leaves the temporary
 * directory in place and prints its path.
 */
import { spawnSync } from 'child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(ROOT, 'tests', 'consumer');
const PACKAGE_NAME = '@lgriffin/esi.ts';

/** Files that must import every sub-path of the `exports` map. */
const CONSUMER_SOURCES = [
  'src/require.cts',
  'src/import.mts',
  'bundler/index.mts',
];

function step(title: string): void {
  console.log(`\n▶ ${title}`);
}

function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n');
}

function exec(
  command: string,
  args: string[],
  cwd: string,
): { status: number | null; output: string } {
  // npm is npm.cmd on Windows, which only a shell can start.
  const shell = process.platform === 'win32' && command === 'npm';
  const quoted = shell ? args.map((a) => (/\s/.test(a) ? `"${a}"` : a)) : args;
  const result = spawnSync(command, quoted, {
    cwd,
    shell,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    status: result.status,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

function run(command: string, args: string[], cwd: string): string {
  const { status, output } = exec(command, args, cwd);
  if (status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed in ${cwd} (exit ${status})\n${output}`,
    );
  }
  return output;
}

function installedVersion(dependency: string): string {
  const manifest = path.join(ROOT, 'node_modules', dependency, 'package.json');
  return (JSON.parse(readFileSync(manifest, 'utf8')) as { version: string })
    .version;
}

function npmInstall(consumer: string, packages: string[]): void {
  run(
    'npm',
    ['install', '--no-audit', '--no-fund', '--no-package-lock', ...packages],
    consumer,
  );
}

function specifierFor(subpath: string): string {
  return subpath === '.' ? PACKAGE_NAME : `${PACKAGE_NAME}/${subpath.slice(2)}`;
}

function checkEverySubpathIsImported(consumer: string): void {
  const manifestPath = path.join(
    consumer,
    'node_modules',
    ...PACKAGE_NAME.split('/'),
    'package.json',
  );
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    exports: Record<string, unknown>;
  };
  const subpaths = Object.keys(manifest.exports).filter(
    (key) => key !== './package.json',
  );

  const missing: string[] = [];
  for (const source of CONSUMER_SOURCES) {
    const text = readFileSync(path.join(consumer, source), 'utf8');
    for (const subpath of subpaths) {
      const specifier = specifierFor(subpath);
      if (!text.includes(`'${specifier}'`)) {
        missing.push(`${source} does not import '${specifier}'`);
      }
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `The packed exports map has sub-paths the consumer does not exercise:\n  ${missing.join('\n  ')}`,
    );
  }
  console.log(`  ${subpaths.length} sub-paths, all imported by each consumer`);
}

function main(): void {
  const args = process.argv.slice(2);
  const skipBuild = args.includes('--skip-build');
  const keep = args.includes('--keep');

  const work = mkdtempSync(path.join(tmpdir(), 'esi-consumer-'));
  let ok = false;
  try {
    if (!skipBuild) {
      step('Build');
      run('npm', ['run', 'build'], ROOT);
    }

    step('Pack');
    // --ignore-scripts: `prepare` would rebuild; the build above (or the
    // existing dist/ with --skip-build) is what gets packed.
    run('npm', ['pack', '--ignore-scripts', '--pack-destination', work], ROOT);
    const tarballs = readdirSync(work).filter((f) => f.endsWith('.tgz'));
    if (tarballs.length !== 1) {
      throw new Error(`Expected one tarball, found: ${tarballs.join(', ')}`);
    }
    console.log(`  ${tarballs[0]}`);

    step('Install into a fresh consumer');
    const consumer = path.join(work, 'consumer');
    cpSync(FIXTURE, consumer, { recursive: true });
    npmInstall(consumer, [
      path.join(work, tarballs[0]!),
      `typescript@${installedVersion('typescript')}`,
      `@types/node@${installedVersion('@types/node')}`,
    ]);

    // Everything up to the last step runs without js-yaml and adm-zip, the
    // optional peers of ./sde, so no entry point may need them to load.
    step('./sde without its optional peers (js-yaml, adm-zip)');
    process.stdout.write(
      indent(
        run('node', ['runtime/sde-optional-peers.mjs', 'absent'], consumer),
      ),
    );

    step('Every exported sub-path is exercised');
    checkEverySubpathIsImported(consumer);

    const tsc = path.join('node_modules', 'typescript', 'bin', 'tsc');
    step('Type-check and emit (nodenext: CommonJS and ES module consumers)');
    run('node', [tsc, '-p', 'tsconfig.json'], consumer);

    step('Type-check (bundler resolution)');
    run('node', [tsc, '-p', 'tsconfig.bundler.json'], consumer);

    step('Run the CommonJS consumer');
    process.stdout.write(indent(run('node', ['out/require.cjs'], consumer)));

    step('Run the ES module consumer');
    process.stdout.write(indent(run('node', ['out/import.mjs'], consumer)));

    step('Dual-build parity for every sub-path');
    process.stdout.write(indent(run('node', ['runtime/parity.mjs'], consumer)));

    step('./sde with its optional peers installed');
    npmInstall(consumer, [
      `js-yaml@${installedVersion('js-yaml')}`,
      `adm-zip@${installedVersion('adm-zip')}`,
    ]);
    process.stdout.write(
      indent(
        run('node', ['runtime/sde-optional-peers.mjs', 'present'], consumer),
      ),
    );

    ok = true;
    console.log('\nConsumer contract passed.');
  } finally {
    if (keep || !ok) {
      console.log(`\nConsumer workspace kept at ${work}`);
    } else {
      rmSync(work, { recursive: true, force: true });
    }
  }
}

try {
  main();
} catch (err) {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
