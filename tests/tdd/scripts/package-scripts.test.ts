/**
 * Self-tests for the npm script target check (scripts/package-scripts-core.ts).
 *
 * `sde:seed` ran `ts-node scripts/seed-sde-test-db.ts` and
 * `example:sde-cross-ref` ran `ts-node examples/sde-cross-reference.ts`. Neither
 * file was ever committed — `git log` on both returns nothing — so both
 * commands had never worked. Nothing noticed: no module imports them, so the
 * compiler and `knip` never look, and the only signal is a `MODULE_NOT_FOUND`
 * for whoever runs the command.
 *
 * The case that matters is the first one below, over the real `package.json`.
 * The rest guard the extractor, because a check that stops finding paths is a
 * check that passes for the wrong reason — the exact failure this repository
 * keeps finding in its own tiers.
 */
import { existsSync } from 'fs';
import * as path from 'path';

import {
  allTargets,
  describeMissing,
  missingTargets,
  targetsIn,
} from '../../../scripts/package-scripts-core';

const ROOT = path.resolve(__dirname, '../../..');

const scripts = require(path.join(ROOT, 'package.json')).scripts as Record<
  string,
  string
>;

const onDisk = (p: string): boolean => existsSync(path.join(ROOT, p));

describe('every npm script points at a file that exists', () => {
  it('finds targets to check at all', () => {
    // An extractor that matched nothing would make the next case vacuous.
    expect(allTargets(scripts).length).toBeGreaterThan(50);
  });

  it('names no missing file', () => {
    const missing = missingTargets(scripts, onDisk);
    expect(describeMissing(missing)).toBe('');
  });
});

describe('targetsIn', () => {
  it('finds a ts-node script', () => {
    expect(targetsIn('a', 'ts-node scripts/spec-audit.ts')).toEqual([
      { script: 'a', path: 'scripts/spec-audit.ts' },
    ]);
  });

  it('finds an example and a shell script', () => {
    expect(
      targetsIn('a', 'ts-node examples/status.ts').map((t) => t.path),
    ).toEqual(['examples/status.ts']);
    expect(
      targetsIn('a', 'bash scripts/run-schemathesis.sh').map((t) => t.path),
    ).toEqual(['scripts/run-schemathesis.sh']);
  });

  it('finds a runner config, spelled either way', () => {
    expect(
      targetsIn('a', 'jest --config jest.unit.config.cjs').map((t) => t.path),
    ).toEqual(['jest.unit.config.cjs']);
    expect(
      targetsIn('a', 'jest --config=jest.unit.config.cjs').map((t) => t.path),
    ).toEqual(['jest.unit.config.cjs']);
  });

  it('finds every target in a chained command', () => {
    expect(
      targetsIn('a', 'ts-node scripts/a.ts && node scripts/b.cjs').map(
        (t) => t.path,
      ),
    ).toEqual(['scripts/a.ts', 'scripts/b.cjs']);
  });

  it('reports a repeated path once', () => {
    expect(targetsIn('a', 'node scripts/a.ts scripts/a.ts')).toHaveLength(1);
  });

  it('ignores a glob, which names no single file', () => {
    expect(targetsIn('a', "tsd --files 'tests/typetests/*.test-d.ts'")).toEqual(
      [],
    );
  });

  it('ignores a path built from a shell variable', () => {
    expect(targetsIn('a', 'ts-node scripts/$NAME.ts')).toEqual([]);
  });

  it('ignores a package name that is not a path', () => {
    expect(targetsIn('a', 'eslint src')).toEqual([]);
    expect(targetsIn('a', 'stryker run')).toEqual([]);
  });
});

describe('missingTargets', () => {
  it('reports the script whose file is gone, and no others', () => {
    const missing = missingTargets(
      {
        good: 'ts-node scripts/here.ts',
        'sde:seed': 'ts-node scripts/seed-sde-test-db.ts',
      },
      (p) => p === 'scripts/here.ts',
    );
    expect(missing).toEqual([
      { script: 'sde:seed', path: 'scripts/seed-sde-test-db.ts' },
    ]);
  });

  it('says which command would fail and what to do', () => {
    const message = describeMissing([
      { script: 'sde:seed', path: 'scripts/seed-sde-test-db.ts' },
    ]);
    expect(message).toContain('npm run sde:seed');
    expect(message).toContain('scripts/seed-sde-test-db.ts does not exist');
    expect(message).toContain('restore the file or drop the script');
  });
});
