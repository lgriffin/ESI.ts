// The surface the export-coverage suite expects. Flagged as unreferenced:
// importedButUnused, mentionedOnlyInText, unreferenced, usedOnlyByAFixture,
// viaStarUnreferenced (.) and extraUnreferenced (./extra).
export { referenced, importedButUnused } from './referenced';
export type { ReferencedShape } from './referenced';
export * from './star';

export function unreferenced(): string {
  return 'no test names this';
}

export const mentionedOnlyInText = 'named only in a comment and a string';

export const usedOnlyByAFixture = 'named only under tests/fixtures';
