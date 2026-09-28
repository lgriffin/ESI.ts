import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { setFlagsFromString } from 'v8';
import { runInNewContext } from 'vm';
import {
  DEFAULT_SDE_THRESHOLDS,
  analyseSdeSoak,
  renderSdeSoakMarkdown,
} from '../../../scripts/bench/soak-core';
import {
  DEFAULT_SDE_BENCH_TYPES,
  generateSdeDataset,
  sdeBenchLabel,
  sdeBenchTypeCount,
  sdeTasks,
  writeSdeDataset,
} from '../../../tests/benchmark/sde.bench';
import type {
  SdeSoakCycle,
  SdeSoakRun,
} from '../../../tests/benchmark/sde-soak';
import { runSdeSoak } from '../../../tests/benchmark/sde-soak';
import { SdeDataProvider } from '../../../src/sde/providers/yaml/SdeDataProvider';

const MiB = 1024 * 1024;

/** A run of `cycles` clean cycles, loaded heap 60 MiB above a 40 MiB baseline. */
function syntheticRun(
  cycles: Array<Partial<SdeSoakCycle>>,
  overrides: Partial<SdeSoakRun> = {},
): SdeSoakRun {
  return {
    options: { dir: 'sde-data', cycles: cycles.length, lookups: 1000 },
    build: 'test',
    heapBaseline: 40 * MiB,
    cycles: cycles.map((c) => ({
      loadMs: 700,
      heapAfterLoad: 100 * MiB,
      rssAfterLoad: 400 * MiB,
      peakHeap: 110 * MiB,
      lookupsMs: 100,
      heapAfterClose: 41 * MiB,
      types: 50_000,
      hits: 1000,
      ...c,
    })),
    unexpectedErrors: [],
    durationMs: 3000,
    ...overrides,
  };
}

describe('SDE benchmark data set', () => {
  it('is deterministic for a given size and spans groups and categories', () => {
    const a = generateSdeDataset(2000);
    const b = generateSdeDataset(2000);
    expect(a).toEqual(b);
    expect(a.types).toHaveLength(2000);
    expect(a.groups).toHaveLength(20);
    expect(a.categories).toHaveLength(25);
    expect(new Set(a.types.map((t) => t.typeId)).size).toBe(2000);
    expect(new Set(a.types.map((t) => t.name)).size).toBe(2000);
    for (const t of a.types) {
      expect(a.groups.some((g) => g.groupId === t.groupId)).toBe(true);
    }
    expect(generateSdeDataset(50).groups).toHaveLength(1);
    expect(() => generateSdeDataset(0)).toThrow('positive integer');
  });

  it('writes YAML the provider loads with every record transformed', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'sde-bench-test-'));
    try {
      const dataset = generateSdeDataset(300);
      writeSdeDataset(dir, dataset);
      expect(readFileSync(path.join(dir, 'types.yaml'), 'utf8')).toContain(
        'groupID:',
      );
      const provider = SdeDataProvider.fromDirectory(dir);
      try {
        expect(provider.getVersion().version).toBe('bench-300');
        const types = provider.getAllEntities('eve_types');
        expect(types).toHaveLength(300);
        const first = dataset.types[0]!;
        expect(provider.getType(first.typeId)).toMatchObject({
          typeId: first.typeId,
          groupId: first.groupId,
          name: first.name,
          mass: first.mass,
        });
        expect(provider.getAllCategories()).toHaveLength(25);
        expect(provider.getGroupsByCategory(1).length).toBeGreaterThan(0);
        expect(
          provider.getTypesByGroup(first.groupId).map((t) => t.typeId),
        ).toContain(first.typeId);
      } finally {
        provider.close();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reads the type count and the label from the environment', () => {
    const saved = { ...process.env };
    try {
      delete process.env.SDE_BENCH_TYPES;
      delete process.env.SDE_BENCH_DIR;
      expect(sdeBenchTypeCount()).toBe(DEFAULT_SDE_BENCH_TYPES);
      expect(sdeBenchLabel()).toBe('50k types');
      process.env.SDE_BENCH_TYPES = '2500';
      expect(sdeBenchLabel()).toBe('2500 types');
      process.env.SDE_BENCH_TYPES = 'many';
      expect(() => sdeBenchTypeCount()).toThrow('SDE_BENCH_TYPES');
      process.env.SDE_BENCH_DIR = 'sde-data';
      expect(sdeBenchLabel()).toBe('real export');
    } finally {
      process.env = saved;
    }
  });

  it('names six sde/ tasks with the label, the load one with fewer samples', () => {
    const saved = process.env.SDE_BENCH_DIR;
    delete process.env.SDE_BENCH_DIR;
    process.env.SDE_BENCH_TYPES = '5000';
    try {
      const names = sdeTasks.map((t) => t.name);
      expect(names).toHaveLength(6);
      for (const name of names) expect(name).toMatch(/^sde\/.*, 5k types$/);
      const load = sdeTasks.find((t) => t.name.startsWith('sde/fromDirectory'));
      expect(load?.minSamples).toBe(8);
    } finally {
      if (saved === undefined) delete process.env.SDE_BENCH_DIR;
      else process.env.SDE_BENCH_DIR = saved;
    }
  });
});

describe('SDE soak analysis', () => {
  it('passes when every close returns the heap to the baseline', () => {
    const verdict = analyseSdeSoak(syntheticRun([{}, {}, {}]));
    expect(verdict.findings).toEqual([]);
    expect(verdict.passed).toBe(true);
    expect(verdict.toleranceBytes).toBe(
      DEFAULT_SDE_THRESHOLDS.maxRetainedBytes,
    );
    expect(verdict.maxRetainedBytes).toBe(1 * MiB);
    expect(renderSdeSoakMarkdown(syntheticRun([{}, {}]), verdict)).toContain(
      'returned to its baseline',
    );
  });

  it('holds the run to the larger of the fixed allowance and the fraction', () => {
    const big = syntheticRun([
      { heapAfterLoad: 400 * MiB, heapAfterClose: 55 * MiB },
      { heapAfterLoad: 400 * MiB, heapAfterClose: 55 * MiB },
    ]);
    const verdict = analyseSdeSoak(big);
    expect(verdict.toleranceBytes).toBe(20 * MiB);
    expect(verdict.passed).toBe(true);
  });

  it('fails a cycle whose heap stays above the baseline after close', () => {
    const run = syntheticRun([{}, { heapAfterClose: 60 * MiB }, {}]);
    const verdict = analyseSdeSoak(run);
    expect(verdict.passed).toBe(false);
    expect(verdict.findings).toEqual([
      'Cycle 2: the heap stayed 20.00 MiB above the baseline after close (allowed 8.00 MiB).',
    ]);
    expect(renderSdeSoakMarkdown(run, verdict)).toContain('**Failed.**');
  });

  it('fails a loaded heap that grows from the first cycle to the last', () => {
    const verdict = analyseSdeSoak(
      syntheticRun([
        {},
        { heapAfterLoad: 105 * MiB },
        { heapAfterLoad: 112 * MiB },
      ]),
    );
    expect(verdict.findings).toEqual([
      'The loaded heap grew 12.00 MiB from the first cycle to the last (allowed 8.00 MiB).',
    ]);
  });

  it('fails closed on one cycle, an empty export and failed lookups', () => {
    const verdict = analyseSdeSoak(
      syntheticRun([{ types: 0 }], { unexpectedErrors: ['SdeError: boom'] }),
    );
    expect(verdict.passed).toBe(false);
    expect(verdict.findings).toEqual([
      'Only 1 cycle(s); the reload check needs at least 2.',
      'Cycle 1: the export loaded no types.',
      'Lookups failed: SdeError: boom',
    ]);
  });
});

describe('SDE soak driver', () => {
  // Jest does not start workers with --expose-gc; V8 exposes it on request.
  setFlagsFromString('--expose-gc');
  const gc = runInNewContext('gc') as () => void;

  it('loads, looks up, closes and repeats on a generated export', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'sde-soak-test-'));
    try {
      writeSdeDataset(dir, generateSdeDataset(2000));
      const run = await runSdeSoak({ dir, cycles: 2, lookups: 3000, gc });
      expect(run.build).toBe('bench-2000');
      expect(run.cycles).toHaveLength(2);
      for (const cycle of run.cycles) {
        expect(cycle.types).toBe(2000);
        expect(cycle.hits).toBe(3000);
        expect(cycle.heapAfterLoad).toBeGreaterThan(0);
        expect(cycle.peakHeap).toBeGreaterThanOrEqual(cycle.heapAfterLoad);
        expect(cycle.rssAfterLoad).toBeGreaterThan(cycle.heapAfterLoad);
      }
      expect(run.unexpectedErrors).toEqual([]);
      expect(analyseSdeSoak(run).passed).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
