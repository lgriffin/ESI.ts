/**
 * The `./schemas` entry: the hand-written Zod response schemas the legacy
 * domain clients validate with.
 *
 * Deprecated since 12.1.0 as a whole and removed in 13.0.0 with the legacy
 * clients, unless guides/LEGACY-REMOVAL.md records a decision to keep it for
 * the generated operations' runtime validation (G1). No declaration carries
 * a `@deprecated` tag: a tag on each of the 225 would flag every internal
 * endpoint map and type and every schema test rather than consumers' uses,
 * and aliasing the root `schemas` namespace to tag it would drop the schemas
 * from the API report, which is how a tightened schema is caught as a break.
 *
 * @packageDocumentation
 */
export { esiEnum } from './esiEnum';
export * from './common';
export * from './access-lists';
export * from './alliance';
export * from './assets';
export * from './calendar';
export * from './character';
export * from './clones';
export * from './contacts';
export * from './contracts';
export * from './cosmetics';
export * from './corporation';
export * from './corporation-projects';
export * from './dogma';
export * from './faction-warfare';
export * from './fittings';
export * from './fleet';
export * from './freelance-jobs';
export * from './incursions';
export * from './industry';
export * from './insurance';
export * from './killmails';
export * from './location';
export * from './loyalty';
export * from './mail';
export * from './market';
export * from './mercenary';
export * from './meta';
export * from './paragon-hub';
export * from './military-campaigns';
export * from './pi';
export * from './skills';
export * from './skyhooks';
export * from './sovereignty';
export * from './status';
export * from './universe';
export * from './wallet';
export * from './wars';

// Drift detection (scripts/spec/generate-schema-drift-report.ts) compares these
// hand-written schemas directly against the live ESI OpenAPI spec at runtime.
// No generated Zod schemas are needed.
