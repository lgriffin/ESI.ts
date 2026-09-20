import { readFileSync } from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {
  EntryPointScore,
  Mutant,
  MutationOperator,
  applyMutant,
  applyRatchet,
  classify,
  describeEdit,
  entryPointsOf,
  mutationsIn,
  renderSurvivors,
  sampleMutants,
  scoreByEntryPoint,
} from '../../../scripts/type-mutation-core';
import {
  rewriteImports,
  runTypeMutation,
} from '../../../scripts/type-mutation-run';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FIXTURE = path.join(__dirname, 'fixtures', 'pkg');

/** Every mutant of one operator in `source`, as the mutated source text. */
function mutate(source: string, operator: MutationOperator): string[] {
  const sf = ts.createSourceFile(
    'x.d.ts',
    source,
    ts.ScriptTarget.ES2022,
    true,
  );
  return mutationsIn(sf, sf)
    .filter((m) => m.operator === operator)
    .map((m) => applyMutant(source, m).trim());
}

describe('type mutation operators', () => {
  it('widens a return type to unknown', () => {
    expect(
      mutate('export declare function f(a: string): number;', 'return-unknown'),
    ).toEqual(['export declare function f(a: string): unknown;']);
  });

  it('drops a readonly modifier and a readonly array operator', () => {
    expect(
      mutate(
        'export interface A { readonly ids: readonly number[]; }',
        'drop-readonly',
      ),
    ).toEqual([
      'export interface A { ids: readonly number[]; }',
      'export interface A { readonly ids: number[]; }',
    ]);
  });

  it('makes an optional property or parameter required, never after another optional parameter', () => {
    expect(
      mutate(
        'export declare function f(a?: string, b?: number): void;\nexport interface A { b?: number; }',
        'optional-to-required',
      ),
    ).toEqual([
      'export declare function f(a: string, b?: number): void;\nexport interface A { b?: number; }',
      'export declare function f(a?: string, b?: number): void;\nexport interface A { b: number; }',
    ]);
  });

  it('makes a required property optional, and a parameter only when nothing required follows', () => {
    expect(
      mutate(
        'export declare function f(a: string, b: number, c?: boolean): void;\nexport interface A { b: number; }',
        'required-to-optional',
      ),
    ).toEqual([
      'export declare function f(a: string, b?: number, c?: boolean): void;\nexport interface A { b: number; }',
      'export declare function f(a: string, b: number, c?: boolean): void;\nexport interface A { b?: number; }',
    ]);
  });

  it('drops the first, last and nullish members of a union', () => {
    expect(
      mutate(
        'export type T = string | undefined | number | boolean;',
        'union-drop-member',
      ),
    ).toEqual([
      'export type T = undefined | number | boolean;',
      'export type T = string | number | boolean;',
      'export type T = string | undefined | number;',
    ]);
  });

  it('widens a literal union or a lone literal to its primitive', () => {
    expect(mutate("export type M = 'GET' | 'POST';", 'widen-literal')).toEqual([
      'export type M = string;',
    ]);
    expect(
      mutate('export interface R { ok: true; n: 3 }', 'widen-literal'),
    ).toEqual([
      'export interface R { ok: boolean; n: 3 }',
      'export interface R { ok: true; n: number }',
    ]);
  });

  it('widens only the first literal of each kind in a mixed union', () => {
    expect(
      mutate("export type M = 'a' | 'b' | 1 | 2 | undefined;", 'widen-literal'),
    ).toEqual([
      "export type M = string | 'b' | 1 | 2 | undefined;",
      "export type M = 'a' | 'b' | number | 2 | undefined;",
    ]);
  });

  it('removes one overload of a group, never a lone signature', () => {
    expect(
      mutate(
        'export declare function f(a: string): string;\nexport declare function f(a: number): number;\nexport declare function g(): void;',
        'remove-overload',
      ),
    ).toEqual([
      'export declare function f(a: number): number;\nexport declare function g(): void;',
      'export declare function f(a: string): string;\nexport declare function g(): void;',
    ]);
  });

  it('replaces a generic constraint with unknown', () => {
    expect(
      mutate(
        'export type Box<T extends string = string> = { v: T };',
        'constraint-unknown',
      ),
    ).toEqual(['export type Box<T extends unknown = string> = { v: T };']);
  });

  it('leaves private class members alone', () => {
    const source =
      'export declare class C { private readonly a; private b?; #c; readonly d: string; }';
    const sf = ts.createSourceFile(
      'x.d.ts',
      source,
      ts.ScriptTarget.ES2022,
      true,
    );
    expect(mutationsIn(sf, sf).map((m) => applyMutant(source, m))).toEqual([
      'export declare class C { private readonly a; private b?; #c; d: string; }',
      'export declare class C { private readonly a; private b?; #c; readonly d?: string; }',
    ]);
  });

  it('describes an edit by the lines it touches', () => {
    const text = 'a\n  b: number;\nc';
    const start = text.indexOf('b') + 1;
    expect(describeEdit(text, start, start, '?')).toEqual({
      before: 'b: number;',
      after: 'b?: number;',
    });
  });
});

function mutant(id: string, entryPoints: string[]): Mutant {
  return {
    id,
    file: 'dist/x.d.ts',
    line: 1,
    symbol: id,
    operator: 'return-unknown',
    start: 0,
    end: 0,
    replacement: '',
    before: '',
    after: '',
    entryPoints,
  };
}

describe('type mutation sampling', () => {
  const pool = [
    ...Array.from({ length: 30 }, (_, i) => mutant(`root-${i}`, ['.'])),
    ...Array.from({ length: 3 }, (_, i) =>
      mutant(`err-${i}`, ['.', './errors']),
    ),
  ];

  it('is deterministic for a seed and capped at max', () => {
    const a = sampleMutants(pool, ['.', './errors'], 10, 7).map((m) => m.id);
    const b = sampleMutants([...pool].reverse(), ['.', './errors'], 10, 7).map(
      (m) => m.id,
    );
    expect(a).toHaveLength(10);
    expect(a).toEqual(b);
    expect(
      sampleMutants(pool, ['.', './errors'], 10, 8).map((m) => m.id),
    ).not.toEqual(a);
  });

  it('gives a small entry point its share of the sample', () => {
    const ids = sampleMutants(pool, ['.', './errors'], 6, 1).map((m) => m.id);
    expect(ids.filter((id) => id.startsWith('err-'))).toHaveLength(3);
  });

  it('keeps the sample stable when a mutant is added', () => {
    const before = sampleMutants(pool, ['.'], 10, 3).map((m) => m.id);
    const after = sampleMutants(
      [...pool, mutant('new', ['.'])],
      ['.'],
      10,
      3,
    ).map((m) => m.id);
    const kept = before.filter((id) => after.includes(id));
    expect(kept.length).toBeGreaterThanOrEqual(9);
  });
});

describe('type mutation classification and ratchet', () => {
  const isDecl = (f: string): boolean => f.includes('/dist/');

  it('classifies tsd results', () => {
    expect(classify([], isDecl)).toBe('Survived');
    expect(
      classify([{ fileName: '/w/tests/a.test-d.ts', message: 'x' }], isDecl),
    ).toBe('Killed');
    expect(
      classify(
        [
          { fileName: '/w/tests/a.test-d.ts', message: 'x' },
          { fileName: '/w/dist/a.d.ts', message: 'y' },
        ],
        isDecl,
      ),
    ).toBe('Invalid');
  });

  it('scores killed / (killed + survived) per entry point, ignoring invalid mutants', () => {
    const results = [
      { ...mutant('a', ['.', './errors']), status: 'Killed' as const },
      { ...mutant('b', ['.']), status: 'Survived' as const },
      { ...mutant('c', ['.']), status: 'Survived' as const },
      { ...mutant('d', ['./errors']), status: 'Invalid' as const },
    ];
    expect(scoreByEntryPoint(results, ['.', './errors'])).toEqual([
      { entryPoint: '.', killed: 1, survived: 2, invalid: 0, score: 33.3 },
      {
        entryPoint: './errors',
        killed: 1,
        survived: 0,
        invalid: 1,
        score: 100,
      },
    ]);
  });

  const score = (
    entryPoint: string,
    killed: number,
    survived: number,
  ): EntryPointScore => ({
    entryPoint,
    killed,
    survived,
    invalid: 0,
    score: Math.floor((killed / (killed + survived)) * 1000) / 10,
  });

  it('passes at or above every floor and raises floors without lowering them', () => {
    const { failures, raised } = applyRatchet({
      scores: [score('.', 1, 1), score('./errors', 4, 1)],
      thresholds: { '.': 50, './errors': 70 },
      baseline: { '.': 50 },
      baseRef: 'origin/master',
    });
    expect(failures).toEqual([]);
    expect(raised).toEqual({ '.': 50, './errors': 80 });
  });

  it('fails an entry point scoring below its floor', () => {
    const { failures } = applyRatchet({
      scores: [score('.', 1, 3)],
      thresholds: { '.': 30 },
      baseline: { '.': 30 },
      baseRef: 'origin/master',
    });
    expect(failures).toEqual([
      '.: type mutation score 25% is below its ratchet of 30%',
    ]);
  });

  it('fails a floor lowered or removed relative to the base ref', () => {
    const { failures } = applyRatchet({
      scores: [score('.', 1, 1)],
      thresholds: { '.': 40 },
      baseline: { '.': 45, './errors': 10 },
      baseRef: 'origin/master',
    });
    expect(failures).toEqual([
      '.: ratchet lowered from 45% on origin/master to 40%; thresholds may only rise.',
      './errors: its ratchet (10%) on origin/master was removed; thresholds may only rise.',
    ]);
  });

  it('fails a stale floor for an entry point that scored nothing', () => {
    const { failures } = applyRatchet({
      scores: [score('.', 1, 1)],
      thresholds: { '.': 10, './gone': 10 },
      baseline: null,
      baseRef: 'origin/master',
    });
    expect(failures).toEqual([
      './gone: has a ratchet but no valid mutants were scored; is it still an exports entry?',
    ]);
  });

  it('fails closed when no base ref resolves', () => {
    const { failures } = applyRatchet({
      scores: [score('.', 1, 1)],
      thresholds: { '.': 10 },
      baseline: undefined,
      baseRef: null,
    });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/No base ref resolved/);
  });

  it('points src imports in the type tests at the declaration dir', () => {
    const source = [
      "import { a } from '../../src';",
      'import type { b } from "../../src/core/x";',
      "import { c } from '../../srcs';",
      "import { d } from 'tsd';",
    ].join('\n');
    expect(rewriteImports(source, 'src', 'dist')).toBe(
      [
        "import { a } from '../../dist';",
        'import type { b } from "../../dist/core/x";',
        "import { c } from '../../srcs';",
        "import { d } from 'tsd';",
      ].join('\n'),
    );
  });

  it('keeps a survivor row at five cells when its type text has backslashes and pipes', () => {
    const results = [
      {
        ...mutant('m', ['.']),
        // The type text 'a\|b' | `c`: a backslash directly before a pipe.
        before: "'a\\|b' | `c`",
        after: 'unknown',
        status: 'Survived' as const,
      },
    ];
    const row = renderSurvivors(results).split('\n')[2]!;
    // GFM's table scanner: a backslash escapes the next character, and only
    // an unescaped pipe separates cells.
    const cells = row
      .slice(1, -1)
      .match(/(?:\\.|[^|\\])+/g)!
      .map((c) => c.trim());
    expect(cells).toHaveLength(5);
    expect(cells[3]).toBe("`'a\\\\\\|b' \\| 'c'`");
    expect(cells[4]).toBe('`unknown`');
  });
});

describe('type mutation against a fixture package', () => {
  it('kills the mutant a tsd test pins and lets the unpinned one survive', async () => {
    const run = await runTypeMutation({
      packageRoot: FIXTURE,
      declarationDir: 'types',
      testFiles: ['test-d/index.test-d.ts'],
      copyTsconfig: true,
      workDir: path.join(
        REPO_ROOT,
        'reports',
        `type-mutation-fixture-${process.pid}`,
      ),
      maxMutants: 100,
      seed: 1,
      workers: 1,
    });

    const summary = run.results
      .map((r) => ({
        symbol: r.symbol,
        operator: r.operator,
        status: r.status,
      }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
    expect(summary).toEqual([
      {
        symbol: 'Widget.id',
        operator: 'required-to-optional',
        status: 'Killed',
      },
      {
        symbol: 'Widget.label',
        operator: 'required-to-optional',
        status: 'Survived',
      },
    ]);
    expect(scoreByEntryPoint(run.results, ['.'])).toEqual([
      { entryPoint: '.', killed: 1, survived: 1, invalid: 0, score: 50 },
    ]);
  }, 120_000);
});

/**
 * The entry points are what makes a per-sub-path ratchet mean anything. When
 * the package moved its `types` under the `import` and `require` conditions
 * (#336), nothing here resolved any more: the run fell back to the package
 * root, scored `.` alone on all 6,019 candidates, dropped its score from 10.5%
 * to 3% and reported the five sub-path ratchets as unscored. These cases are
 * the shapes that would do it again.
 */
describe('entryPointsOf', () => {
  const root = '/pkg';

  it('resolves every entry of the real package.json', () => {
    const pkg = JSON.parse(
      readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'),
    );
    expect(entryPointsOf(pkg, REPO_ROOT).map((e) => e.name)).toEqual([
      '.',
      './schemas',
      './errors',
      './testing',
      './sde',
      './sde/memory',
    ]);
  });

  it('reads a top-level types condition', () => {
    const pkg = { exports: { '.': { types: './dist/index.d.ts' } } };
    expect(entryPointsOf(pkg, root)[0]?.typesFile).toBe(
      path.resolve(root, './dist/index.d.ts'),
    );
  });

  it('reads types from the require condition', () => {
    const pkg = {
      exports: { '.': { require: { types: './dist/index.d.ts' } } },
    };
    expect(entryPointsOf(pkg, root)).toHaveLength(1);
  });

  it('prefers the require declaration over the .d.mts twin', () => {
    const pkg = {
      exports: {
        '.': {
          import: { types: './dist/index.d.mts' },
          require: { types: './dist/index.d.ts' },
        },
      },
    };
    expect(entryPointsOf(pkg, root)[0]?.typesFile).toBe(
      path.resolve(root, './dist/index.d.ts'),
    );
  });

  it('falls back to the import condition when it is the only one', () => {
    const pkg = {
      exports: { '.': { import: { types: './dist/index.d.mts' } } },
    };
    expect(entryPointsOf(pkg, root)[0]?.typesFile).toBe(
      path.resolve(root, './dist/index.d.mts'),
    );
  });

  it('skips an entry that is a plain string, such as ./package.json', () => {
    const pkg = {
      exports: {
        '.': { require: { types: './dist/index.d.ts' } },
        './package.json': './package.json',
      },
    };
    expect(entryPointsOf(pkg, root).map((e) => e.name)).toEqual(['.']);
  });

  it('throws rather than scoring the root alone when no entry resolves', () => {
    const pkg = {
      types: './dist/index.d.ts',
      exports: {
        '.': { import: { default: './dist/index.mjs' } },
        './errors': { require: { default: './dist/errors.js' } },
      },
    };
    expect(() => entryPointsOf(pkg, root)).toThrow(/None of the 2/);
  });

  it('still falls back to types when there is no exports map at all', () => {
    const pkg = { types: './dist/index.d.ts' };
    expect(entryPointsOf(pkg, root).map((e) => e.name)).toEqual(['.']);
  });
});
