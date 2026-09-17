/**
 * npm run contract:shape-diff [-- --ref=HEAD] [-- --revert-unchanged] [-- --report=<file>]
 *
 * Compares the recorded fixtures in the working tree (after
 * `npm run contract:record`) with the committed ones at --ref, by shape:
 * status, which cache headers are sent, and the JSON type at every key path.
 * Values (prices, IDs, dates, ETags) are ignored. See recorded/shape.ts.
 *
 * --revert-unchanged restores every fixture whose shape did not change, so
 * only shape changes are left in the working tree for the nightly pull
 * request. --report writes a Markdown summary.
 *
 * Exit codes: 0 no shape changed; 1 at least one did; 2 the diff could not run.
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  listFixtureFiles,
  loadFixture,
  parseFixture,
} from './recorded/fixture';
import { FIXTURES_DIR, REPO_ROOT } from './recorded/policy';
import { diffShapes, fixtureShape } from './recorded/shape';

function option(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.slice(name.length + 3);
}

const git = (args: string[]) =>
  execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

function main(): number {
  const ref = option('ref') ?? 'HEAD';
  const revert = process.argv.includes('--revert-unchanged');
  const relDir = path
    .relative(REPO_ROOT, FIXTURES_DIR)
    .split(path.sep)
    .join('/');

  git(['rev-parse', '--verify', `${ref}^{commit}`]);
  const committed = git(['ls-tree', '--name-only', `${ref}:${relDir}`])
    .split('\n')
    .filter((f) => f.endsWith('.json'));

  const current = new Map(
    listFixtureFiles().map((file) => [path.basename(file), file]),
  );
  const sections: string[] = [];
  let changed = 0;

  for (const name of [...new Set([...committed, ...current.keys()])].sort()) {
    const rel = `${relDir}/${name}`;
    const file = current.get(name);
    if (!file) {
      sections.push(`### ${name}\n\n- fixture removed`);
      changed++;
      continue;
    }
    const after = loadFixture(file);
    if (!committed.includes(name)) {
      sections.push(`### ${after.endpoint}\n\n- new fixture`);
      changed++;
      continue;
    }
    const before = parseFixture(
      git(['show', `${ref}:${rel}`]),
      `${ref}:${rel}`,
    );
    const diffs = diffShapes(fixtureShape(before), fixtureShape(after));
    if (diffs.length === 0) {
      if (revert) git(['checkout', ref, '--', rel]);
      continue;
    }
    changed++;
    sections.push(
      [`### ${after.endpoint}`, '', ...diffs.map((d) => `- \`${d}\``)].join(
        '\n',
      ),
    );
  }

  const summary =
    changed === 0
      ? 'No recorded fixture changed shape.'
      : `${changed} recorded fixture(s) changed shape against ${ref}.`;
  console.log(summary);
  for (const s of sections) console.log(`\n${s}`);

  const report = option('report');
  if (report) {
    fs.writeFileSync(
      report,
      [`## Recorded payload shape diff`, '', summary, '', ...sections, ''].join(
        '\n',
      ),
    );
  }
  return changed > 0 ? 1 : 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
}
