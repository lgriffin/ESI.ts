/**
 * The order both providers keep a table in: ascending by ID, numbers before
 * strings, so a whole-table or foreign-key answer reads the same whichever
 * order the export listed the records in and whichever provider serves it.
 */
export type EntityId = number | string;

export function compareIds(a: EntityId, b: EntityId): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'number') return -1;
  if (typeof b === 'number') return 1;
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

/** A copy of `items` sorted by the ID `idOf` reads from each. */
export function sortedById<T>(
  items: readonly T[],
  idOf: (item: T) => EntityId,
): T[] {
  return [...items].sort((x, y) => compareIds(idOf(x), idOf(y)));
}
