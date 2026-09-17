/**
 * Negative fixtures for the consumer matrix (scripts/consumer-contract-core.ts,
 * run by `npm run test:consumer`).
 *
 * Each test writes a small dual CommonJS/ES module package into the
 * `node_modules` of a temporary consumer, then runs the contract's own checks
 * against it with this repository's TypeScript and esbuild: the type-check
 * cells, the runtime probe and the tree-shaking check. A correct package is
 * the control and passes every check. Each broken variant carries one
 * packaging defect a consumer would hit, and the check that owns that defect
 * must reject it. If a TypeScript or esbuild upgrade, or a change to the
 * contract, stops a check from firing, these tests fail.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  CELLS,
  DOCUMENTED_SUBPATHS,
  cellTsconfig,
  exportsProblems,
  probeSource,
  runRuntimeProbe,
  treeShakeCheck,
  typeCheckCell,
  writeProbes,
  type Cell,
  type EsbuildLike,
} from '../../../scripts/consumer-contract-core';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const TSC = path.join(REPO_ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const esbuild = require('esbuild') as EsbuildLike;

const NAME = 'fixture-dual';
const SUBPATHS = ['.', './errors'];
const MARKER = 'alliances/{alliance_id}';

type Files = Record<string, string>;

/** A correct dual package: the control. */
function goodPackage(): Files {
  const manifest = {
    name: NAME,
    version: '1.0.0',
    type: 'commonjs',
    exports: {
      '.': {
        import: { types: './dist/index.d.mts', default: './dist/index.mjs' },
        require: { types: './dist/index.d.ts', default: './dist/index.js' },
      },
      './errors': {
        import: { types: './dist/errors.d.mts', default: './dist/errors.mjs' },
        require: { types: './dist/errors.d.ts', default: './dist/errors.js' },
      },
      './package.json': './package.json',
    },
  };
  return {
    'package.json': JSON.stringify(manifest, null, 2),
    // Shared code both entries import, as tsup's chunks are.
    'dist/chunk.mjs':
      'export class AppError extends Error {}\nexport const isAppError = (e) => e instanceof AppError;\n',
    'dist/chunk.js':
      'class AppError extends Error {}\nexports.AppError = AppError;\nexports.isAppError = (e) => e instanceof AppError;\n',
    'dist/errors.mjs': "export { AppError, isAppError } from './chunk.mjs';\n",
    'dist/errors.js':
      "const c = require('./chunk.js');\nexports.AppError = c.AppError;\nexports.isAppError = c.isAppError;\n",
    // The heavy entry: an endpoint table only the client needs.
    'dist/index.mjs': `export { AppError, isAppError } from './chunk.mjs';\nconst paths = ['${MARKER}'];\nexport class Client { paths() { return paths; } }\n`,
    'dist/index.js': `const c = require('./chunk.js');\nexports.AppError = c.AppError;\nexports.isAppError = c.isAppError;\nconst paths = ['${MARKER}'];\nexports.Client = class Client { paths() { return paths; } };\n`,
    'dist/core/AppError.d.ts':
      'export declare class AppError extends Error {\n    private brand;\n}\nexport declare function isAppError(e: unknown): e is AppError;\n',
    'dist/core/AppError.d.mts':
      'export declare class AppError extends Error {\n    private brand;\n}\nexport declare function isAppError(e: unknown): e is AppError;\n',
    'dist/errors.d.ts':
      "export { AppError, isAppError } from './core/AppError';\n",
    'dist/errors.d.mts':
      "export { AppError, isAppError } from './core/AppError.mjs';\n",
    'dist/index.d.ts':
      "export * from './errors';\nexport declare class Client {\n    paths(): string[];\n}\n",
    'dist/index.d.mts':
      "export * from './errors.mjs';\nexport declare class Client {\n    paths(): string[];\n}\n",
  };
}

function withManifest(
  files: Files,
  edit: (manifest: { exports: Record<string, unknown> }) => void,
): Files {
  const manifest = JSON.parse(files['package.json']!) as {
    exports: Record<string, unknown>;
  };
  edit(manifest);
  return { ...files, 'package.json': JSON.stringify(manifest, null, 2) };
}

/** The deliberately broken packages, one packaging defect each. */
const BROKEN: Record<string, () => Files> = {
  // A documented sub-path dropped from the exports map.
  'sub-path missing from exports': () =>
    withManifest(goodPackage(), (m) => {
      delete m.exports['./errors'];
    }),
  // tsc's extensionless specifier copied into an ES module declaration.
  '.d.mts with an extensionless relative specifier': () => ({
    ...goodPackage(),
    'dist/errors.d.mts':
      "export { AppError, isAppError } from './core/AppError';\n",
  }),
  // esi-23g.29: the import condition's types are CommonJS declarations.
  'import condition typed by .d.ts in a commonjs package': () =>
    withManifest(goodPackage(), (m) => {
      for (const key of ['.', './errors']) {
        const entry = m.exports[key] as {
          import: { types: string };
          require: { types: string };
        };
        entry.import.types = entry.require.types;
      }
    }),
  // The mirror image: the require condition typed by ES module declarations.
  'require condition typed by .d.mts': () =>
    withManifest(goodPackage(), (m) => {
      for (const key of ['.', './errors']) {
        const entry = m.exports[key] as {
          import: { types: string };
          require: { types: string };
        };
        entry.require.types = entry.import.types;
      }
    }),
  // A light entry that re-exports through the heavy one.
  'light sub-path re-exported through the heavy entry': () => ({
    ...goodPackage(),
    'dist/index.mjs': `export { AppError, isAppError } from './chunk.mjs';\nconst paths = ['${MARKER}'];\nglobalThis.__registry = paths;\nexport class Client { paths() { return paths; } }\n`,
    'dist/errors.mjs': "export { AppError, isAppError } from './index.mjs';\n",
  }),
};

function install(files: Files): string {
  const consumer = mkdtempSync(path.join(tmpdir(), 'esi-consumer-fixture-'));
  writeFileSync(
    path.join(consumer, 'package.json'),
    '{"name":"consumer","private":true}',
  );
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(consumer, 'node_modules', NAME, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  writeProbes(consumer, NAME, SUBPATHS);
  return consumer;
}

const cell = (id: string): Cell => CELLS.find((c) => c.id === id)!;

function check(consumer: string, id: string) {
  return typeCheckCell(consumer, cell(id), { tsc: TSC, types: [] });
}

function treeShake(consumer: string) {
  return treeShakeCheck({
    consumerDir: consumer,
    esbuild,
    packageName: NAME,
    light: { subpath: './errors', name: 'isAppError' },
    heavy: { subpath: '.', name: 'Client' },
    marker: MARKER,
    maxBytes: 400,
    external: [],
  });
}

describe('consumer matrix: the cells', () => {
  it('covers ESM and CJS consumers under node16, nodenext and bundler', () => {
    expect(CELLS.map((c) => c.id)).toEqual([
      'esm-node16',
      'cjs-node16',
      'esm-nodenext',
      'cjs-nodenext',
      'esm-bundler',
      'cjs-bundler',
    ]);
  });

  it('checks the shipped declarations and emits nothing', () => {
    for (const c of CELLS) {
      const config = cellTsconfig(c) as {
        compilerOptions: Record<string, unknown>;
      };
      expect(config.compilerOptions).toMatchObject({
        moduleResolution: c.resolution,
        skipLibCheck: false,
        noEmit: true,
        strict: true,
      });
    }
    expect(
      (cellTsconfig(cell('cjs-bundler')) as { compilerOptions: object })
        .compilerOptions,
    ).toMatchObject({ module: 'preserve' });
  });

  it('asserts ES module format only in the ES module probe', () => {
    expect(probeSource('esm', NAME, SUBPATHS)).toContain(
      'noSynthesisedDefault',
    );
    expect(probeSource('cjs', NAME, SUBPATHS)).not.toContain(
      'noSynthesisedDefault',
    );
    expect(probeSource('cjs', NAME, SUBPATHS)).toContain(
      "import m1 = require('fixture-dual/errors');",
    );
  });

  it('documents exactly the sub-paths package.json exports', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require(path.join(REPO_ROOT, 'package.json')) as {
      exports: unknown;
    };
    expect(exportsProblems(manifest, DOCUMENTED_SUBPATHS)).toEqual([]);
  });
});

describe('consumer matrix: the control package passes', () => {
  let consumer: string;

  beforeAll(() => {
    consumer = install(goodPackage());
  });

  afterAll(() => rmSync(consumer, { recursive: true, force: true }));

  it.each(CELLS.map((c) => c.id))('type-checks in cell %s', (id) => {
    const result = check(consumer, id);
    expect(result.output).toBe('');
    expect(result.ok).toBe(true);
  });

  it('loads every sub-path through require and import', () => {
    const result = runRuntimeProbe(consumer, NAME, SUBPATHS);
    expect(result).toMatchObject({ ok: true });
  });

  it('tree-shakes the light sub-path', () => {
    const result = treeShake(consumer);
    expect(result.problems).toEqual([]);
    expect(result.lightBytes).toBeLessThan(result.heavyBytes);
  });
});

describe('consumer matrix: broken packages are rejected', () => {
  const consumers: string[] = [];
  const installBroken = (name: string) => {
    const consumer = install(BROKEN[name]!());
    consumers.push(consumer);
    return consumer;
  };

  afterAll(() => {
    for (const consumer of consumers) {
      rmSync(consumer, { recursive: true, force: true });
    }
  });

  it('a sub-path missing from exports: the exports check, every cell and the runtime probe', () => {
    const files = BROKEN['sub-path missing from exports']!();
    expect(
      exportsProblems(JSON.parse(files['package.json']!), SUBPATHS),
    ).toEqual(['documented sub-path ./errors is missing from exports']);

    const consumer = installBroken('sub-path missing from exports');
    for (const c of CELLS) {
      const result = check(consumer, c.id);
      expect({ cell: c.id, ok: result.ok }).toEqual({ cell: c.id, ok: false });
      expect(result.output).toMatch(/fixture-dual\/errors/);
    }
    const runtime = runRuntimeProbe(consumer, NAME, SUBPATHS);
    expect(runtime.ok).toBe(false);
    expect(runtime.output).toMatch(/ERR_PACKAGE_PATH_NOT_EXPORTED/);
  });

  it('a .d.mts with an extensionless relative specifier: the node16 and nodenext ESM cells', () => {
    const consumer = installBroken(
      '.d.mts with an extensionless relative specifier',
    );
    for (const id of ['esm-node16', 'esm-nodenext']) {
      const result = check(consumer, id);
      expect(result.ok).toBe(false);
      expect(result.output).toMatch(/errors\.d\.mts/);
    }
    expect(check(consumer, 'cjs-node16').ok).toBe(true);
  });

  it('the esi-23g.29 shape: every ESM cell', () => {
    const consumer = installBroken(
      'import condition typed by .d.ts in a commonjs package',
    );
    // TypeScript reads a .d.ts in a "type": "commonjs" package as CommonJS
    // under bundler resolution too, so the synthesised default shows there.
    for (const id of ['esm-node16', 'esm-nodenext', 'esm-bundler']) {
      const result = check(consumer, id);
      expect({ cell: id, ok: result.ok }).toEqual({ cell: id, ok: false });
      expect(result.output).toMatch(
        /Type 'false' is not assignable to type 'true'/,
      );
    }
    expect(check(consumer, 'cjs-node16').ok).toBe(true);
  });

  it('the require condition typed by .d.mts: the node16 CJS cell', () => {
    const consumer = installBroken('require condition typed by .d.mts');
    const result = check(consumer, 'cjs-node16');
    expect(result.ok).toBe(false);
    expect(result.output).toMatch(/ECMAScript module|ES module|TS1479/);
  });

  it('a light sub-path re-exported through the heavy entry: the tree-shaking check', () => {
    const consumer = installBroken(
      'light sub-path re-exported through the heavy entry',
    );
    const result = treeShake(consumer);
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toMatch(
      /contains "alliances\/\{alliance_id\}"/,
    );
    expect(result.problems.join('\n')).toMatch(
      /includes node_modules\/fixture-dual\/dist\/index\.mjs/,
    );
  });
});
