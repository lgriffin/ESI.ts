/**
 * SDE providers: model-based properties of `MemorySdeProvider` and of
 * `SdeDataProvider` loaded from a directory.
 *
 * A generated data set (every foreign key valid but for a controlled few,
 * IDs unique per table) is loaded into a provider, and a random sequence of
 * lookups, foreign-key lists, whole-table reads, name searches and generic
 * table reads runs against it. A naive oracle over the same arrays predicts
 * every answer (tests/fuzz/support/sde.ts):
 *
 *   by ID          the one record whose ID field equals the argument, or null
 *   by foreign key every record whose key field equals the argument, in load
 *                  order; the first of them for `getStarBySystem`
 *   whole table    every record, in load order
 *   search         every record whose name contains the fragment, case
 *                  folded, in load order, cut at the limit (25 by default)
 *   root groups    the market groups whose parent is null
 *   generic        the same by table name; an unknown table answers null or []
 *
 * The memory provider serves the arrays it was given, so its load order is
 * theirs. The SQLite route reads YAML maps keyed by ID, which enumerate in
 * ascending key order, so its oracle is the same arrays sorted by ID. Its
 * foreign-key indexes are built on first use; the sequences repeat and
 * interleave foreign-key queries so the lazily built index answers alongside
 * the fresh scan. Both providers are specified by the Rules under
 * tests/bdd/features/sde; this file checks them over every data shape.
 *
 * Search limits below 1 and the ordering of whole-table answers are not
 * promised by any Rule yet, so the generator asks for limits of 1 or more
 * and the oracle states the order each provider has today.
 */
import * as fc from 'fast-check';
import * as fs from 'node:fs';

import type { Clock } from '../../src/core/ports/Clock';
import type { IStaticDataProvider } from '../../src/sde/IStaticDataProvider';
import { MemorySdeProvider } from '../../src/sde/MemorySdeProvider';
import { SdeDataProvider } from '../../src/sde/SdeDataProvider';
import { describeProperty } from './support/property';
import {
  ask,
  mutate,
  oracle,
  scenarioArb,
  sortedByIdSet,
  writeSdeDirectory,
  type ProviderDefect,
  type Query,
  type SdeDataSet,
} from './support/sde';

/** A provider over a data set, with what the oracle should read. */
interface Loaded {
  provider: IStaticDataProvider;
  /** The set in the order the provider holds it. */
  expected: SdeDataSet;
  dispose: () => void;
}

type Loader = (set: SdeDataSet) => Loaded;

const fixedClock: Clock = {
  now: () => Date.parse('2026-09-28T00:00:00.000Z'),
  sleep: () => Promise.resolve(),
};

const loadMemory: Loader = (set) => {
  const provider = new MemorySdeProvider(set.data);
  return { provider, expected: set, dispose: () => provider.close() };
};

const loadDirectory: Loader = (set) => {
  const dir = writeSdeDirectory(set);
  const provider = SdeDataProvider.fromDirectory(dir, { clock: fixedClock });
  return {
    provider,
    expected: sortedByIdSet(set),
    dispose: () => {
      provider.close();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
};

function withDefect(load: Loader, defect: ProviderDefect): Loader {
  return (set) => {
    const loaded = load(set);
    return { ...loaded, provider: mutate(loaded.provider, defect) };
  };
}

const DEFECTS: ProviderDefect[] = [
  'drops the last record of every list',
  'ignores the search limit',
  'looks up the ID after the one asked for',
  'answers every foreign-key query from the first one',
];

function mutantsOf(load: Loader): Record<string, () => Loader> {
  return Object.fromEntries(
    DEFECTS.map((defect) => [defect, () => withDefect(load, defect)]),
  );
}

function providerProperty(load: Loader) {
  return fc.property(scenarioArb, ({ set, queries }) => {
    const loaded = load(set);
    try {
      for (const query of queries as Query[]) {
        const actual = ask(loaded.provider, query);
        const expected = oracle(loaded.expected, query);
        expect(actual).toEqual(expected);
      }
    } finally {
      loaded.dispose();
    }
  });
}

describeProperty<Loader>({
  name: 'MemorySdeProvider answers every lookup as the naive oracle over its arrays',
  file: __filename,
  subject: () => loadMemory,
  mutants: mutantsOf(loadMemory),
  property: providerProperty,
});

describeProperty<Loader>({
  name: 'SdeDataProvider loaded from a directory answers every lookup as the naive oracle, lazily built foreign-key indexes included',
  file: __filename,
  subject: () => loadDirectory,
  mutants: mutantsOf(loadDirectory),
  property: providerProperty,
  timeoutMs: 60_000,
});
