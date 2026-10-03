/**
 * npm run contract:shape-diff [-- --ref=HEAD] [-- --revert-unchanged] [-- --report=<file>]
 *
 * Compares the recorded fixtures in the working tree (after
 * `npm run contract:record`) with the committed ones at --ref, by shape:
 * status, which cache headers are sent, and the JSON type at every key path.
 * Values (prices, IDs, dates, ETags) are ignored. See recorded/shape.ts.
 * A field the vendored OpenAPI snapshot declares optional appearing or
 * disappearing is ignored too: it depends on which live record was sampled.
 * So are the keys of an `additionalProperties` map: entries are compared by
 * value shape, whatever they are called.
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
import { findSpecOperation, OpenApiSpec } from './helpers';
import { publicGetEndpoints } from './recorded/catalogue';
import { CONTRACT_DIR, FIXTURES_DIR, REPO_ROOT } from './recorded/policy';
import {
  diffShapes,
  fixtureShape,
  mapPaths,
  optionalPaths,
} from './recorded/shape';

const SNAPSHOT_PATH = path.join(
  CONTRACT_DIR,
  'snapshots',
  'esi-openapi.snapshot.json',
);

interface SpecPaths {
  optional: Set<string>;
  maps: Set<string>;
}

/** Optional fields and map paths per fixture endpoint, from the vendored spec. */
function specPathsByEndpoint(): Map<string, SpecPaths> {
  const spec = JSON.parse(
    fs.readFileSync(SNAPSHOT_PATH, 'utf-8'),
  ) as OpenApiSpec;
  const out = new Map<string, SpecPaths>();
  for (const { key, definition } of publicGetEndpoints()) {
    const op = findSpecOperation(spec, definition.path, 'GET');
    const schema =
      op?.responses?.['200']?.content?.['application/json']?.schema;
    out.set(key, {
      optional: optionalPaths(schema, spec.components?.schemas),
      maps: mapPaths(schema, spec.components?.schemas),
    });
  }
  return out;
}

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
  const specPaths = specPathsByEndpoint();
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
    const diffs = diffShapes(
      fixtureShape(before),
      fixtureShape(after),
      specPaths.get(after.endpoint)?.optional,
      specPaths.get(after.endpoint)?.maps,
    );
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
