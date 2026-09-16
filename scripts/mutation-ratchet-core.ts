/**
 * Per-directory mutation-score ratchet for the BDD-only Stryker run.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

export type MutantStatus =
  | 'Killed'
  | 'Survived'
  | 'NoCoverage'
  | 'Timeout'
  | 'CompileError'
  | 'RuntimeError'
  | 'Ignored'
  | 'Pending';

export interface MutationReport {
  files: Record<string, { mutants: Array<{ status: MutantStatus }> }>;
}

export interface DirectoryScore {
  directory: string;
  detected: number;
  valid: number;
  /** Percentage, rounded down to one decimal place. */
  score: number;
}

/** Percentages keyed by directory, e.g. `"src/clients": 42.5`. */
export type Thresholds = Record<string, number>;

/**
 * The directory a file is scored under: `src/<area>` for most of the tree,
 * `src/core/<sub>` inside core, where the pipeline components differ enough
 * that a single number would hide a weak one.
 */
export function directoryOf(file: string): string {
  const parts = file.replace(/\\/g, '/').split('/');
  const srcIndex = parts.indexOf('src');
  const rel = srcIndex === -1 ? parts : parts.slice(srcIndex);
  if (rel[1] === 'core' && rel.length > 3) return rel.slice(0, 3).join('/');
  if (rel.length > 2) return rel.slice(0, 2).join('/');
  return rel.slice(0, -1).join('/') || rel[0];
}

/** Stryker's definition: detected / (detected + undetected); errors and ignored mutants do not count. */
export function scoreByDirectory(report: MutationReport): DirectoryScore[] {
  const totals = new Map<string, { detected: number; valid: number }>();
  for (const [file, { mutants }] of Object.entries(report.files)) {
    const dir = directoryOf(file);
    const entry = totals.get(dir) ?? { detected: 0, valid: 0 };
    for (const { status } of mutants) {
      if (status === 'Killed' || status === 'Timeout') {
        entry.detected += 1;
        entry.valid += 1;
      } else if (status === 'Survived' || status === 'NoCoverage') {
        entry.valid += 1;
      }
    }
    totals.set(dir, entry);
  }
  return [...totals.entries()]
    .filter(([, t]) => t.valid > 0)
    .map(([directory, t]) => ({
      directory,
      detected: t.detected,
      valid: t.valid,
      score: Math.floor((t.detected / t.valid) * 1000) / 10,
    }))
    .sort((a, b) => a.directory.localeCompare(b.directory));
}

export interface RatchetResult {
  failures: string[];
  /** Thresholds raised to today's scores; never lowered, never dropped. */
  raised: Thresholds;
}

export function applyRatchet(
  scores: DirectoryScore[],
  thresholds: Thresholds,
): RatchetResult {
  const failures: string[] = [];
  const raised: Thresholds = { ...thresholds };
  const seen = new Set(scores.map((s) => s.directory));

  for (const { directory, score } of scores) {
    const floor = thresholds[directory];
    if (floor !== undefined && score < floor) {
      failures.push(
        `${directory}: BDD mutation score ${score}% is below its ratchet of ${floor}%`,
      );
    }
    raised[directory] = Math.max(floor ?? 0, score);
  }
  for (const directory of Object.keys(thresholds)) {
    if (!seen.has(directory)) {
      failures.push(
        `${directory}: has a ratchet but no mutants were scored; was it excluded from the run?`,
      );
    }
  }
  return { failures, raised };
}

export function renderTable(
  scores: DirectoryScore[],
  thresholds: Thresholds,
): string {
  const rows = scores.map(({ directory, detected, valid, score }) => {
    const floor = thresholds[directory];
    const ratchet = floor === undefined ? 'none' : `${floor}%`;
    return `| \`${directory}\` | ${score}% | ${detected}/${valid} | ${ratchet} |`;
  });
  return [
    '| Directory | BDD mutation score | Detected / valid | Ratchet |',
    '| :-- | --: | --: | --: |',
    ...rows,
  ].join('\n');
}
