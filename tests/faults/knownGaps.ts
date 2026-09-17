import { readFileSync } from 'fs';
import * as path from 'path';
import type { KnownGap } from './types';

export const KNOWN_GAPS_PATH = path.join(__dirname, 'known-gaps.json');

export function parseKnownGaps(raw: string): KnownGap[] {
  const parsed = JSON.parse(raw) as { gaps?: unknown };
  if (!Array.isArray(parsed.gaps)) {
    throw new Error('known-gaps.json has no "gaps" array');
  }
  return parsed.gaps as KnownGap[];
}

export const KNOWN_GAPS: readonly KnownGap[] = parseKnownGaps(
  readFileSync(KNOWN_GAPS_PATH, 'utf-8'),
);

export function knownGapFor(
  faultId: string,
  targetName: string,
): KnownGap | undefined {
  return KNOWN_GAPS.find(
    (g) => g.fault === faultId && g.targets.includes(targetName),
  );
}
