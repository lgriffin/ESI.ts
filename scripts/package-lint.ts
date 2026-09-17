/**
 * npm run lint:package [-- --skip-build] [-- --tarball <path>]
 *
 * Builds, packs the library with `npm pack`, and runs publint and Are The
 * Types Wrong against the tarball. Rules, the supported resolutions and the
 * baseline are described in `scripts/package-lint-core.ts`.
 *
 * --skip-build packs the existing `dist/`. --tarball lints a tarball that is
 * already packed and skips both the build and the pack.
 *
 * Exit code 0 when every blocking finding is baselined and the baseline has
 * no stale or added entries; 1 otherwise.
 */
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

import {
  REPO_ROOT,
  evaluate,
  evaluationProblems,
  isBlocking,
  loadBaseBaseline,
  loadBaseline,
  packPackage,
  runAttw,
  runPublint,
  type Finding,
} from './package-lint-core';

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} needs a value`);
  }
  return value;
}

function list(title: string, lines: string[]): void {
  if (lines.length === 0) return;
  console.log(`\n${title}`);
  for (const line of lines) console.log(`  ${line}`);
}

function describe(finding: Finding): string {
  return `${finding.key}\n    ${finding.message}`;
}

function main(): number {
  const args = process.argv.slice(2);
  const given = optionValue(args, '--tarball');
  const work = mkdtempSync(path.join(tmpdir(), 'esi-package-lint-'));
  try {
    let tarball: string;
    if (given) {
      tarball = path.resolve(given);
    } else {
      if (!args.includes('--skip-build')) {
        console.log('▶ Build');
        // One command line through the shell: npm is npm.cmd on Windows.
        const build = spawnSync('npm run build', {
          cwd: REPO_ROOT,
          shell: true,
          stdio: 'inherit',
        });
        if (build.status !== 0) return 1;
      }
      console.log('▶ Pack');
      tarball = packPackage(REPO_ROOT, work);
    }
    console.log(`  ${path.basename(tarball)}`);

    console.log('▶ publint');
    const publint = runPublint(tarball);
    console.log('▶ attw (node16-cjs, node16-esm, bundler)');
    const attw = runAttw(tarball);

    const findings = [...publint, ...attw];
    const base = loadBaseBaseline();
    const result = evaluate(findings, loadBaseline(), base);

    list(
      'Not in the baseline:',
      result.unexpected.map((f) => describe(f)),
    );
    list(
      'Baselined (tracked by a bead):',
      result.known.map((f) => f.key),
    );
    list('Stale baseline entries:', result.stale);
    list(
      `Baseline entries not on ${base.ref ?? 'any base ref'}:`,
      result.added,
    );
    list(
      'Suggestions (not blocking):',
      findings.filter((f) => !isBlocking(f)).map((f) => describe(f)),
    );

    const problems = evaluationProblems(result);
    if (problems.length > 0) {
      console.error(`\n✖ ${problems.join('\n✖ ')}`);
      return 1;
    }
    console.log(
      `\n✔ publint and attw: no findings outside the baseline (${result.known.length} baselined).`,
    );
    return 0;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
}
