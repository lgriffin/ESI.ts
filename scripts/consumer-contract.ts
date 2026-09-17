/**
 * npm run test:consumer [-- --tarball <path>] [-- --typescript <version>]
 *                       [-- --skip-build] [-- --keep]
 *
 * The consumer contract test: what a downstream project sees after
 * `npm install @lgriffin/esi.ts`, which no in-repo test can see because they
 * all import from `src/`.
 *
 * 1. Build, then `npm pack` the library into a temporary directory, or take
 *    the tarball `--tarball` names (CI packs once and every cell installs the
 *    same bytes; the release pipeline passes the tarball it publishes).
 * 2. Copy `tests/consumer/` next to the tarball, outside the repository so
 *    module resolution cannot fall back to the repo's own `node_modules`.
 * 3. `npm install` the tarball, `typescript` at the `--typescript` version,
 *    a matching `@types/node`, and `esbuild`, but not the optional peers of
 *    `./sde` (js-yaml, adm-zip): `./sde` must load without them and name them
 *    when a feature needs one.
 * 4. Check that the packed `exports` map lists exactly the documented
 *    sub-paths, and that every one is imported by the CommonJS, ES module
 *    and bundler consumers.
 * 5. Type-check every cell of the matrix (scripts/consumer-contract-core.ts):
 *    ES module and CommonJS consumers under node16, nodenext and bundler
 *    resolution, `skipLibCheck: false`, each with a generated probe that
 *    imports every documented sub-path. Every cell runs and is reported; any
 *    failure fails the run.
 * 6. Load every sub-path through require and import on this Node, run the
 *    emitted CommonJS and ES module consumers (a real client against a
 *    stubbed fetch), and check dual-build parity.
 * 7. Bundle `./errors` with esbuild and check it does not pull in the
 *    clients.
 * 8. Install js-yaml and adm-zip, then load real SDE YAML and ZIP files
 *    through both the CommonJS and ES module builds of `./sde`.
 *
 * --typescript takes `repo` (the default: this repository's version),
 * `oldest` (OLDEST_TYPESCRIPT), an npm dist-tag such as `latest` or `next`,
 * or an exact version. --skip-build packs the existing `dist/`. --keep leaves
 * the temporary directory in place and prints its path.
 */
import { spawnSync } from 'child_process';
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  CELLS,
  DOCUMENTED_SUBPATHS,
  OLDEST_TYPESCRIPT,
  PACKAGE_NAME,
  exportsProblems,
  runRuntimeProbe,
  specifierFor,
  treeShakeCheck,
  typeCheckCell,
  writeProbes,
  type Cell,
  type CellResult,
  type EsbuildLike,
} from './consumer-contract-core';

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(ROOT, 'tests', 'consumer');

/** Files that must import every sub-path of the `exports` map. */
const CONSUMER_SOURCES = [
  'src/require.cts',
  'src/import.mts',
  'bundler/index.mts',
];

/** The hand-written consumer checked in each cell, besides the probe. */
const CELL_FILES: Record<string, string[]> = {
  'esm-node16': ['src/import.mts'],
  'cjs-node16': ['src/require.cts'],
  'esm-nodenext': ['src/import.mts'],
  'cjs-nodenext': ['src/require.cts'],
  'esm-bundler': ['bundler/index.mts'],
  'cjs-bundler': [],
};

/**
 * `import { isEsiError } from '@lgriffin/esi.ts/errors'` bundled by esbuild.
 * The marker is an endpoint path from the root entry's endpoint tables.
 * The ceiling is the size measured at esi-23g.16 (1497 B, esbuild 0.28.2)
 * plus 5%, rounded up to 100 B; raise it the way .size-limit.cjs budgets are
 * raised, with the reason in the pull request.
 */
const TREE_SHAKE = {
  light: { subpath: './errors', name: 'isEsiError' },
  heavy: { subpath: '.', name: 'EsiClient' },
  marker: 'alliances/{alliance_id}',
  maxBytes: 1600,
};

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
  // npm is npm.cmd on Windows, which only a shell can start. It gets one
  // command line rather than an args array (DEP0190).
  const shell = process.platform === 'win32' && command === 'npm';
  const options = {
    cwd,
    encoding: 'utf8' as const,
    stdio: ['ignore', 'pipe', 'pipe'] as ('ignore' | 'pipe')[],
    maxBuffer: 64 * 1024 * 1024,
  };
  const result = shell
    ? spawnSync(
        [command, ...args.map((a) => (/\s/.test(a) ? `"${a}"` : a))].join(' '),
        { ...options, shell: true },
      )
    : spawnSync(command, args, options);
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

function installedVersion(dependency: string, from = ROOT): string {
  const manifest = path.join(from, 'node_modules', dependency, 'package.json');
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

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} needs a value`);
  }
  return value;
}

/** The npm spec for `typescript` that `--typescript <choice>` names. */
function typescriptSpec(choice: string): string {
  if (choice === 'repo') return installedVersion('typescript');
  if (choice === 'oldest') return OLDEST_TYPESCRIPT;
  if (/^\d+\.\d+\.\d+/.test(choice)) return choice;
  // A dist-tag: resolve it now so the log names the version under test.
  return run('npm', ['view', `typescript@${choice}`, 'version'], ROOT).trim();
}

/**
 * `@types/node` for a TypeScript version. DefinitelyTyped tags the newest
 * release that supports each 5.x line as `ts5.<minor>`; from 6.0 on this
 * repository's own version is used.
 */
function typesNodeSpec(typescriptVersion: string): string {
  const [major, minor] = typescriptVersion.split('.').map(Number);
  return major === 5 ? `ts5.${minor}` : installedVersion('@types/node');
}

function checkEverySubpathIsImported(consumer: string): void {
  const missing: string[] = [];
  for (const source of CONSUMER_SOURCES) {
    const text = readFileSync(path.join(consumer, source), 'utf8');
    for (const subpath of DOCUMENTED_SUBPATHS) {
      const specifier = specifierFor(PACKAGE_NAME, subpath);
      if (!text.includes(`'${specifier}'`)) {
        missing.push(`${source} does not import '${specifier}'`);
      }
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `The documented sub-paths are not all exercised by the consumer:\n  ${missing.join('\n  ')}`,
    );
  }
  console.log(
    `  ${DOCUMENTED_SUBPATHS.length} sub-paths, all imported by each consumer`,
  );
}

function summarise(
  typescriptVersion: string,
  results: CellResult[],
  failures: string[],
): void {
  const rows = results.map(
    (r) =>
      `| ${r.cell.id} | ${r.cell.format} | ${r.cell.resolution} | ${r.ok ? 'pass' : '**fail**'} |`,
  );
  const lines = [
    `### Consumer contract: Node ${process.versions.node}, TypeScript ${typescriptVersion}`,
    '',
    '| Cell | Consumer | moduleResolution | Type-check |',
    '| ---- | -------- | ---------------- | ---------- |',
    ...rows,
    '',
    failures.length === 0
      ? 'Every check passed.'
      : `Failed: ${failures.join('; ')}`,
    '',
  ];
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) appendFileSync(summary, `${lines.join('\n')}\n`);
  console.log(`\n${lines.join('\n')}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const skipBuild = args.includes('--skip-build');
  const keep = args.includes('--keep');
  const givenTarball = optionValue(args, '--tarball');
  const typescriptChoice = optionValue(args, '--typescript') ?? 'repo';

  const work = mkdtempSync(path.join(tmpdir(), 'esi-consumer-'));
  let ok = false;
  try {
    let tarball: string;
    if (givenTarball) {
      tarball = path.resolve(givenTarball);
      if (!existsSync(tarball)) throw new Error(`No tarball at ${tarball}`);
    } else {
      if (!skipBuild) {
        step('Build');
        run('npm', ['run', 'build'], ROOT);
      }
      step('Pack');
      // --ignore-scripts: `prepare` would rebuild; the build above (or the
      // existing dist/ with --skip-build) is what gets packed.
      run(
        'npm',
        ['pack', '--ignore-scripts', '--pack-destination', work],
        ROOT,
      );
      const tarballs = readdirSync(work).filter((f) => f.endsWith('.tgz'));
      if (tarballs.length !== 1) {
        throw new Error(`Expected one tarball, found: ${tarballs.join(', ')}`);
      }
      tarball = path.join(work, tarballs[0]!);
    }
    console.log(`  ${tarball}`);

    const typescriptVersion = typescriptSpec(typescriptChoice);
    step(
      `Install into a fresh consumer (TypeScript ${typescriptVersion}, Node ${process.versions.node})`,
    );
    const consumer = path.join(work, 'consumer');
    cpSync(FIXTURE, consumer, { recursive: true });
    npmInstall(consumer, [
      tarball,
      `typescript@${typescriptVersion}`,
      `@types/node@${typesNodeSpec(typescriptVersion)}`,
      `esbuild@${installedVersion('esbuild')}`,
    ]);
    console.log(
      `  typescript ${installedVersion('typescript', consumer)}, @types/node ${installedVersion('@types/node', consumer)}, esbuild ${installedVersion('esbuild', consumer)}`,
    );

    const failures: string[] = [];

    // Everything up to the last step runs without js-yaml and adm-zip, the
    // optional peers of ./sde, so no entry point may need them to load.
    step('./sde without its optional peers (js-yaml, adm-zip)');
    process.stdout.write(
      indent(
        run('node', ['runtime/sde-optional-peers.mjs', 'absent'], consumer),
      ),
    );

    step('The exports map lists exactly the documented sub-paths');
    const packed = JSON.parse(
      readFileSync(
        path.join(consumer, 'node_modules', PACKAGE_NAME, 'package.json'),
        'utf8',
      ),
    ) as {
      exports?: unknown;
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const exportProblems = exportsProblems(packed, DOCUMENTED_SUBPATHS);
    if (exportProblems.length > 0) {
      console.log(indent(exportProblems.join('\n')));
      failures.push('exports map');
    }
    checkEverySubpathIsImported(consumer);

    step(`Type-check ${CELLS.length} cells (skipLibCheck: false)`);
    writeProbes(consumer, PACKAGE_NAME, DOCUMENTED_SUBPATHS);
    const results = CELLS.map((cell: Cell) => {
      const result = typeCheckCell(consumer, cell, {
        files: CELL_FILES[cell.id] ?? [],
      });
      console.log(`  ${result.ok ? '✔' : '✖'} ${cell.id}`);
      if (!result.ok) {
        console.log(indent(indent(result.output)));
        failures.push(`cell ${cell.id}`);
      }
      return result;
    });

    step('Every documented sub-path loads through require and import');
    const runtime = runRuntimeProbe(
      consumer,
      PACKAGE_NAME,
      DOCUMENTED_SUBPATHS,
    );
    console.log(indent(runtime.output));
    if (!runtime.ok) failures.push('runtime probe');

    // The cells own type errors; this emit only produces the JavaScript the
    // next two steps run, so a type error here does not stop it.
    step('Emit the CommonJS and ES module consumers (nodenext)');
    exec(
      'node',
      [
        path.join('node_modules', 'typescript', 'bin', 'tsc'),
        '-p',
        'tsconfig.json',
      ],
      consumer,
    );
    for (const out of ['out/require.cjs', 'out/import.mjs']) {
      if (!existsSync(path.join(consumer, out))) {
        throw new Error(`tsc did not emit ${out}`);
      }
    }

    step('Run the CommonJS consumer');
    process.stdout.write(indent(run('node', ['out/require.cjs'], consumer)));

    step('Run the ES module consumer');
    process.stdout.write(indent(run('node', ['out/import.mjs'], consumer)));

    step('Dual-build parity for every sub-path');
    process.stdout.write(indent(run('node', ['runtime/parity.mjs'], consumer)));

    step('esbuild tree-shakes ./errors');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const esbuild = require(
      require.resolve('esbuild', { paths: [consumer] }),
    ) as EsbuildLike;
    let shaken: ReturnType<typeof treeShakeCheck>;
    try {
      shaken = treeShakeCheck({
        consumerDir: consumer,
        esbuild,
        packageName: PACKAGE_NAME,
        ...TREE_SHAKE,
        external: [
          ...Object.keys(packed.dependencies ?? {}),
          ...Object.keys(packed.peerDependencies ?? {}),
        ],
      });
    } finally {
      await Promise.resolve(esbuild.stop?.());
    }
    console.log(
      `  ./errors ${shaken.lightBytes} B (ceiling ${TREE_SHAKE.maxBytes} B), . ${shaken.heavyBytes} B`,
    );
    if (!shaken.ok) {
      console.log(indent(shaken.problems.join('\n')));
      failures.push('tree shaking');
    }

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

    summarise(installedVersion('typescript', consumer), results, failures);
    if (failures.length > 0) {
      throw new Error(`Consumer contract failed: ${failures.join(', ')}`);
    }
    ok = true;
    console.log('\nConsumer contract passed.');
  } finally {
    if (keep || !ok) {
      console.log(`\nConsumer workspace kept at ${work}`);
    } else {
      try {
        rmSync(work, {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 200,
        });
      } catch (err) {
        // A file still locked on Windows must not fail a passing contract.
        console.log(
          `
Could not remove ${work}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}

main().catch((err: unknown) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
