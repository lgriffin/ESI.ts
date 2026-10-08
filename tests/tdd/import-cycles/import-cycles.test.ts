/**
 * Self-tests for the import cycle check (npm run lint:cycles): which imports
 * count as runtime edges, how specifiers resolve, and that every cycle is
 * found once with a readable loop.
 */
import * as path from 'path';

import {
  ImportGraph,
  buildGraph,
  cyclePath,
  findCycles,
  resolveSpecifier,
  runtimeSpecifiers,
} from '../../../scripts/quality/import-cycles-core';

describe('runtimeSpecifiers', () => {
  it.each([
    ["import { A } from './a';", ['./a']],
    ["import A from './a';", ['./a']],
    ["import * as A from './a';", ['./a']],
    ["import './a';", ['./a']],
    ["export { A } from './a';", ['./a']],
    ["export * from './a';", ['./a']],
    ["const a = require('./a');", ['./a']],
    ["const a = import('./a');", ['./a']],
    ["import { type A, B } from './a';", ['./a']],
  ])('counts %p', (code, expected) => {
    expect(runtimeSpecifiers('x.ts', code)).toEqual(expected);
  });

  it.each([
    "import type { A } from './a';",
    "import { type A, type B } from './a';",
    "export type { A } from './a';",
    "export { type A } from './a';",
    "import { z } from 'zod';",
  ])('skips %p', (code) => {
    expect(runtimeSpecifiers('x.ts', code)).toEqual([]);
  });
});

describe('resolveSpecifier', () => {
  const root = path.resolve('/repo');
  const files = new Set(
    ['src/a.ts', 'src/dir/index.ts'].map((f) => path.join(root, f)),
  );
  const exists = (p: string) => files.has(p);

  it('resolves a file, a directory index, and nothing else', () => {
    expect(resolveSpecifier(root, 'src/b.ts', './a', exists)).toBe('src/a.ts');
    expect(resolveSpecifier(root, 'src/b.ts', './dir', exists)).toBe(
      'src/dir/index.ts',
    );
    expect(resolveSpecifier(root, 'src/b.ts', './missing', exists)).toBeNull();
  });
});

describe('findCycles', () => {
  const graph = (edges: Record<string, string[]>): ImportGraph =>
    new Map(Object.entries(edges));

  it('finds nothing in a DAG', () => {
    expect(findCycles(graph({ a: ['b', 'c'], b: ['c'], c: [] }))).toEqual([]);
  });

  it('finds each cycle once, as a sorted component', () => {
    const g = graph({
      a: ['b'],
      b: ['c'],
      c: ['a'],
      d: ['e'],
      e: ['d'],
      f: ['a'],
    });
    expect(findCycles(g)).toEqual([
      ['a', 'b', 'c'],
      ['d', 'e'],
    ]);
  });

  it('reports one concrete loop through a component', () => {
    const g = graph({ a: ['b'], b: ['c'], c: ['a'] });
    expect(cyclePath(g, ['a', 'b', 'c'])).toEqual(['a', 'b', 'c', 'a']);
  });
});

describe('buildGraph', () => {
  it('ignores type-only edges, so an interface that imports its implementation as a type is no cycle', () => {
    const sources: Record<string, string> = {
      'src/IThing.ts':
        "import type { Thing } from './Thing';\nexport interface IThing { t: Thing }",
      'src/Thing.ts':
        "import { IThing } from './IThing';\nexport class Thing {}",
    };
    const root = path.resolve('/repo');
    const g = buildGraph(
      root,
      Object.keys(sources),
      (f) => sources[f]!,
      (p) => Object.keys(sources).some((f) => path.join(root, f) === p),
    );
    expect(findCycles(g)).toEqual([]);
    expect(g.get('src/Thing.ts')).toEqual(['src/IThing.ts']);
  });
});
