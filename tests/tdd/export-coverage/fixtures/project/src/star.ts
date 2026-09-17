export function viaStarReferenced(): string {
  return 'reached through export *, called by tests/uses.ts';
}

export function viaStarUnreferenced(): string {
  return 'reached through export *, never called';
}
