export { referenced } from './referenced';

export function extraReferencedByPackageName(): string {
  return 'imported as export-coverage-fixture/extra and renamed';
}

export function extraUnreferenced(): string {
  return 'never called';
}
