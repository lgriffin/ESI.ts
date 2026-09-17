export function referenced(): string {
  return 'called by tests/uses.ts';
}

export function importedButUnused(): string {
  return 'imported by tests/uses.ts but never used there';
}

export interface ReferencedShape {
  id: number;
}
