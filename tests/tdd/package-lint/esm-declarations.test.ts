/**
 * scripts/esm-declarations.cjs: the `.d.mts` declarations the `import`
 * condition of every `exports` entry names (esi-23g.29).
 *
 * The rewriting is checked on its own, and then end to end: a tiny package
 * with nested and directory imports is emitted into a temporary
 * `node_modules`, and TypeScript type-checks an ES module consumer of it
 * under node16 resolution. The negative control copies the same `.d.ts`
 * files to `.d.mts` without rewriting their specifiers, which is the usual
 * mistake, and the consumer must fail to compile.
 */
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import * as ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { emitEsmDeclarations, esmTypeEntries, toEsmDeclaration } = require(
  path.resolve(__dirname, '..', '..', '..', 'scripts', 'esm-declarations.cjs'),
) as {
  emitEsmDeclarations: (packageDir: string) => {
    entries: number;
    files: number;
    rewritten: number;
  };
  esmTypeEntries: (manifest: unknown, packageDir: string) => string[];
  toEsmDeclaration: (
    text: string,
    file: string,
  ) => { text: string; imports: string[]; unresolved: string[] };
};

function writeTree(root: string, files: Record<string, string>): void {
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
}

const MANIFEST = {
  name: 'fixture-pkg',
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

/** Declarations as tsc writes them: relative specifiers with no extension. */
const DECLARATIONS = {
  'dist/index.d.ts': [
    "export { Client } from './core/Client';",
    "export * from './errors';",
    "export * as models from './models';",
    '',
  ].join('\n'),
  'dist/errors.d.ts': 'export declare class AppError extends Error {}\n',
  'dist/core/Client.d.ts': [
    "import type { Ship } from '../models';",
    'export declare class Client {',
    "    ship(): Ship & { owner: import('.').Owner };",
    "    error(): import('../errors').AppError;",
    '}',
    '',
  ].join('\n'),
  'dist/core/index.d.ts': 'export interface Owner {\n    name: string;\n}\n',
  'dist/models/index.d.ts': "export * from './Ship';\n",
  'dist/models/Ship.d.ts': 'export interface Ship {\n    name: string;\n}\n',
  'dist/config/jest/setup.d.ts': "import '../../../types/global.d.ts';\n",
};

describe('esm declarations: rewriting one file', () => {
  let work: string;

  beforeAll(() => {
    work = mkdtempSync(path.join(tmpdir(), 'esi-esm-dts-unit-'));
    writeTree(work, DECLARATIONS);
  });

  afterAll(() => rmSync(work, { recursive: true, force: true }));

  it('points file, directory and dot specifiers at the .mjs spelling', () => {
    const file = path.join(work, 'dist', 'core', 'Client.d.ts');
    const result = toEsmDeclaration(readFileSync(file, 'utf8'), file);
    expect(result.unresolved).toEqual([]);
    expect(result.text).toContain("from '../models/index.mjs'");
    expect(result.text).toContain("import('./index.mjs').Owner");
    expect(result.text).toContain("import('../errors.mjs').AppError");
    expect(result.imports.map((f) => path.relative(work, f))).toEqual([
      path.join('dist', 'models', 'index.d.ts'),
      path.join('dist', 'core', 'index.d.ts'),
      path.join('dist', 'errors.d.ts'),
    ]);
  });

  it('maps a specifier that already names a .js file', () => {
    const file = path.join(work, 'dist', 'index.d.ts');
    const result = toEsmDeclaration("export * from './errors.js';\n", file);
    expect(result.text).toBe("export * from './errors.mjs';\n");
  });

  it('leaves bare specifiers alone', () => {
    const file = path.join(work, 'dist', 'index.d.ts');
    const text =
      "import { z } from 'zod';\nexport type T = import('zod/v4/core').$ZodType;\n";
    const result = toEsmDeclaration(text, file);
    expect(result.text).toBe(text);
    expect(result.imports).toEqual([]);
  });

  it('reports a relative specifier that names no declaration file', () => {
    const file = path.join(work, 'dist', 'index.d.ts');
    const result = toEsmDeclaration("export * from './missing';\n", file);
    expect(result.unresolved).toEqual(['./missing']);
  });

  it('reads the .d.mts entries from import conditions only', () => {
    expect(
      esmTypeEntries(MANIFEST, work).map((f) => path.relative(work, f)),
    ).toEqual([
      path.join('dist', 'index.d.mts'),
      path.join('dist', 'errors.d.mts'),
    ]);
  });
});

describe('esm declarations: emitting a package', () => {
  let work: string;

  beforeEach(() => {
    work = mkdtempSync(path.join(tmpdir(), 'esi-esm-dts-pkg-'));
  });

  afterEach(() => rmSync(work, { recursive: true, force: true }));

  it('copies only what the entries reach', () => {
    writeTree(work, {
      'package.json': JSON.stringify(MANIFEST),
      ...DECLARATIONS,
    });
    const result = emitEsmDeclarations(work);
    expect(result).toMatchObject({ entries: 2, files: 6 });
    // Unreachable, and its specifier would not resolve: skipped, not fatal.
    expect(() =>
      readFileSync(path.join(work, 'dist', 'config', 'jest', 'setup.d.mts')),
    ).toThrow();
  });

  it('fails when a reached declaration has an unresolvable specifier', () => {
    writeTree(work, {
      'package.json': JSON.stringify(MANIFEST),
      ...DECLARATIONS,
      'dist/errors.d.ts': "export * from './gone';\n",
    });
    expect(() => emitEsmDeclarations(work)).toThrow(
      /errors\.d\.ts: '\.\/gone' resolves to no declaration file/,
    );
  });

  it('fails when an entry has no .d.ts counterpart', () => {
    writeTree(work, { 'package.json': JSON.stringify(MANIFEST) });
    expect(() => emitEsmDeclarations(work)).toThrow(/has no index\.d\.ts/);
  });

  it('fails when no import condition names a .d.mts file', () => {
    writeTree(work, {
      'package.json': JSON.stringify({ name: 'x', exports: './index.js' }),
    });
    expect(() => emitEsmDeclarations(work)).toThrow(/names no \.d\.mts/);
  });
});

describe('esm declarations: a node16 ES module consumer type-checks', () => {
  let work: string;

  const CONSUMER = [
    "import { Client, AppError, models } from 'fixture-pkg';",
    "import { AppError as FromErrors } from 'fixture-pkg/errors';",
    "import * as root from 'fixture-pkg';",
    "type HasDefault<M> = 'default' extends keyof M ? true : false;",
    'export const esm: HasDefault<typeof root> = false;',
    'export const same: FromErrors = new AppError();',
    'export const name: string = new Client().ship().owner.name;',
    'export const ship: models.Ship = new Client().ship();',
    '',
  ].join('\n');

  /** Diagnostics for `consumer.mts` against the package in node_modules. */
  function typeCheck(): string[] {
    const consumer = path.join(work, 'consumer.mts');
    writeFileSync(consumer, CONSUMER);
    const program = ts.createProgram([consumer], {
      module: ts.ModuleKind.Node16,
      moduleResolution: ts.ModuleResolutionKind.Node16,
      target: ts.ScriptTarget.ES2022,
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      types: [],
    });
    return ts
      .getPreEmitDiagnostics(program)
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  }

  beforeEach(() => {
    work = mkdtempSync(path.join(tmpdir(), 'esi-esm-dts-tsc-'));
    const pkg = path.join(work, 'node_modules', 'fixture-pkg');
    writeTree(pkg, {
      'package.json': JSON.stringify(MANIFEST),
      ...DECLARATIONS,
    });
    writeFileSync(path.join(work, 'package.json'), '{"type":"module"}');
  });

  afterEach(() => rmSync(work, { recursive: true, force: true }));

  it('passes with the emitted declarations', () => {
    emitEsmDeclarations(path.join(work, 'node_modules', 'fixture-pkg'));
    expect(typeCheck()).toEqual([]);
  });

  it('fails when the .d.ts files are copied without rewriting specifiers', () => {
    const pkg = path.join(work, 'node_modules', 'fixture-pkg');
    for (const name of Object.keys(DECLARATIONS)) {
      const file = path.join(pkg, name);
      writeFileSync(
        file.replace(/\.d\.ts$/, '.d.mts'),
        readFileSync(file, 'utf8'),
      );
    }
    expect(typeCheck().join('\n')).toMatch(
      /Relative import paths need explicit file extensions|Cannot find module/,
    );
  });
});
