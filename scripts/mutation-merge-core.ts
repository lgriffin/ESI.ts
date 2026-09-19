/**
 * Merging the BDD mutation shards back into one report.
 *
 * nightly-mutation.yml runs one Stryker job per shard in
 * mutation-bdd-shards.json, because one job over all of src/ does not finish.
 * The ratchet still has to see the whole picture: a per-directory floor is
 * only honest if the directory's every mutant is in the report it scores.
 * These functions put the shards back together and refuse to do it quietly
 * when a piece is missing or two pieces overlap.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

import type { MutationReport } from './mutation-ratchet-core';

/** One shard's report, named so failures can say which job produced it. */
export interface ShardReport {
  /** The shard name from mutation-bdd-shards.json. */
  name: string;
  report: MutationReport;
}

/** A shard definition as mutation-bdd-shards.json carries it. */
export interface ShardDefinition {
  name: string;
  include: string[];
  exclude?: string[];
}

export class MutationMergeError extends Error {}

function normalise(file: string): string {
  return file.replace(/\\/g, '/');
}

/**
 * The shards, in file order, with the directories each one claims.
 *
 * Parsed rather than trusted: a hand edit that drops `include`, repeats a
 * name or leaves the list empty would otherwise shrink the run silently.
 */
export function parseShards(raw: string, file: string): ShardDefinition[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new MutationMergeError(
      `${file} is not valid JSON: ${(err as Error).message}`,
    );
  }
  const shards = (parsed as { shards?: unknown }).shards;
  if (!Array.isArray(shards) || shards.length === 0) {
    throw new MutationMergeError(`${file} must list at least one shard.`);
  }

  const seen = new Set<string>();
  return shards.map((entry, index) => {
    const { name, include, exclude } = entry as Partial<ShardDefinition>;
    if (typeof name !== 'string' || name.length === 0) {
      throw new MutationMergeError(`${file} shard ${index} has no name.`);
    }
    if (seen.has(name)) {
      throw new MutationMergeError(`${file} names the shard ${name} twice.`);
    }
    seen.add(name);
    if (!Array.isArray(include) || include.length === 0) {
      throw new MutationMergeError(
        `${file} shard ${name} includes no directories.`,
      );
    }
    if (exclude !== undefined && !Array.isArray(exclude)) {
      throw new MutationMergeError(
        `${file} shard ${name} has an 'exclude' that is not a list.`,
      );
    }
    return {
      name,
      include: include.map(normalise),
      exclude: exclude?.map(normalise),
    };
  });
}

/** True when `file` sits in `directory` or below it. */
function within(file: string, directory: string): boolean {
  return file === directory || file.startsWith(`${directory}/`);
}

/** The shards that claim `file`: one, for a partition; the test asserts it. */
export function shardsClaiming(
  file: string,
  shards: ShardDefinition[],
): string[] {
  const candidate = normalise(file);
  return shards
    .filter(
      (shard) =>
        shard.include.some((dir) => within(candidate, dir)) &&
        !(shard.exclude ?? []).some((dir) => within(candidate, dir)),
    )
    .map((shard) => shard.name);
}

export interface MergeResult {
  report: MutationReport;
  /** Mutated files per shard, for the run summary. */
  fileCounts: Record<string, number>;
}

/**
 * One report from every shard's report.
 *
 * Fails rather than merges when:
 *
 * - a shard is missing, because the ratchet would then score a directory on
 *   the mutants that happened to survive the jobs that did run;
 * - a shard reported no files, which means its job mutated nothing;
 * - two shards report the same file, which means the shard list overlaps and
 *   a file's mutants would be counted twice.
 *
 * @param shards - every shard that had to run, in mutation-bdd-shards.json order
 * @param reports - what each job produced
 */
export function mergeShardReports(
  shards: ShardDefinition[],
  reports: ShardReport[],
): MergeResult {
  const byName = new Map(reports.map((entry) => [entry.name, entry.report]));

  const missing = shards
    .filter((shard) => !byName.has(shard.name))
    .map((shard) => shard.name);
  if (missing.length > 0) {
    throw new MutationMergeError(
      `No report for ${missing.length === 1 ? 'shard' : 'shards'} ${missing.join(', ')}: ` +
        'the merged score would be read from an incomplete run. Re-run the failed shard.',
    );
  }

  const unknown = reports
    .filter((entry) => !shards.some((shard) => shard.name === entry.name))
    .map((entry) => entry.name);
  if (unknown.length > 0) {
    throw new MutationMergeError(
      `Report for unknown ${unknown.length === 1 ? 'shard' : 'shards'} ${unknown.join(', ')}: ` +
        'mutation-bdd-shards.json does not define it, so nothing says what it covers.',
    );
  }

  const files: MutationReport['files'] = {};
  const owner = new Map<string, string>();
  const fileCounts: Record<string, number> = {};

  for (const shard of shards) {
    const report = byName.get(shard.name) as MutationReport;
    const entries = Object.entries(report.files ?? {});
    if (entries.length === 0) {
      throw new MutationMergeError(
        `Shard ${shard.name} reported no mutated files. Its directories are ` +
          `${shard.include.join(', ')}; either the job failed before Stryker ran or the shard is empty.`,
      );
    }
    fileCounts[shard.name] = entries.length;

    for (const [file, value] of entries) {
      const key = normalise(file);
      const already = owner.get(key);
      if (already !== undefined) {
        throw new MutationMergeError(
          `${key} is mutated by both ${already} and ${shard.name}: the shards ` +
            'overlap, so its mutants would be counted twice.',
        );
      }
      owner.set(key, shard.name);
      files[key] = value;
    }
  }

  // Everything else on the report (schemaVersion, thresholds, framework) is
  // the same for every shard, so the first one's copy describes the merge.
  // `shards` is non-empty: parseShards rejects an empty list, and the missing
  // check above has already proved every shard has a report.
  const first = byName.get(shards[0]?.name ?? '') ?? { files: {} };
  return {
    report: { ...first, files },
    fileCounts,
  };
}

/** Which nightly shard's incremental report a pull request run can build on. */
export interface BaselineShardChoice {
  /** The shard to restore, or null to run cold. */
  shard: string | null;
  /** One line for the job log and summary. */
  reason: string;
}

/**
 * The one shard whose incremental report covers every file a pull request
 * run mutates, or null when no single shard does (esi-23g.55).
 *
 * The nightly saves one incremental report per shard. A shard's report is a
 * complete baseline for its own directories and knows nothing about anyone
 * else's, so it is only honest to restore when one shard claims every file:
 * a run that restored it for a change spanning two shards would report a
 * baseline it only half has, and the gate reads a timeout with a baseline as
 * broken rather than slow. Spanning shards therefore runs cold, as before.
 *
 * @param files - every file the run may mutate: the pull request plan's files
 *   in the touched directories, before any baseline narrows them
 */
export function baselineShardFor(
  files: readonly string[],
  shards: ShardDefinition[],
): BaselineShardChoice {
  if (files.length === 0) {
    return { shard: null, reason: 'nothing to mutate, so no baseline needed.' };
  }
  const claimed = new Set<string>();
  for (const file of files) {
    const owners = shardsClaiming(file, shards);
    if (owners.length !== 1) {
      return {
        shard: null,
        reason: `${normalise(file)} belongs to ${owners.length === 0 ? 'no shard' : `shards ${owners.join(', ')}`}; running cold.`,
      };
    }
    claimed.add(owners[0] as string);
  }
  if (claimed.size > 1) {
    return {
      shard: null,
      reason: `the change spans shards ${[...claimed].sort().join(', ')}, and one shard's baseline cannot vouch for another's files; running cold.`,
    };
  }
  const [shard] = [...claimed] as [string];
  return { shard, reason: `every file to mutate is in shard ${shard}.` };
}
