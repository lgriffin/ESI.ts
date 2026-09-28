/**
 * What the SDE features (tests/bdd/features/sde) look up, and where the
 * answers come from. Step files open providers, build errors and walk record
 * chains through here; they construct nothing themselves.
 *
 * Every scenario reads the in-memory provider over the factory's hierarchical
 * data set, so the IDs below are that data set's: Tritanium in The Forge,
 * with the version record the factory stamps on it.
 */
import type { IStaticDataProvider } from '../../../src/sde/IStaticDataProvider';
import { MemorySdeProvider } from '../../../src/sde/MemorySdeProvider';
import { SdeTestDataFactory } from '../../../src/sde/SdeTestDataFactory';
import {
  SdeDatabaseError,
  SdeError,
  SdeValidationError,
  SdeVersionMismatchError,
  isSdeDatabaseError,
  isSdeError,
  isSdeValidationError,
  isSdeVersionMismatch,
} from '../../../src/sde/errors';
import { EveTypeSchema } from '../../../src/sde/schemas';
import type {
  Constellation,
  EveCategory,
  EveGroup,
  EveType,
  SolarSystem,
} from '../../../src/sde/types';
import type { World } from './world';

export const TRITANIUM = { typeId: 34, name: 'Tritanium', groupId: 18 };
export const MINERAL_GROUP_NAME = 'Mineral';
export const MATERIAL_CATEGORY_NAME = 'Material';
export const UNKNOWN_TYPE_ID = 999999;
export const THE_FORGE = 10000002;
export const KIMOTORO = 'Kimotoro';
export const JITA = { solarSystemId: 30000142, name: 'Jita' };

/** The version record the factory stamps on its hierarchical data set. */
export const HIERARCHICAL_VERSION = {
  version: '2024-01-15.1',
  buildDate: '2024-01-15T00:00:00Z',
  importedAt: '2024-01-16T12:00:00Z',
  checksum: 'abc123def456',
};

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/** Open the provider over the hierarchical data set and hand it to the scenario. */
export function openHierarchicalProvider(world: World): IStaticDataProvider {
  world.sde = new MemorySdeProvider(
    SdeTestDataFactory.createHierarchicalTestData(),
  );
  return world.sde;
}

/** Open a provider over no data at all, so only its defaults answer. */
export function openEmptyProvider(world: World): IStaticDataProvider {
  world.sde = new MemorySdeProvider();
  return world.sde;
}

/** The provider a Given step opened; a When step without one is a bug. */
export function sdeProvider(world: World): IStaticDataProvider {
  if (!world.sde) {
    throw new Error('No SDE provider is open; a Given step must open one.');
  }
  return world.sde;
}

// ---------------------------------------------------------------------------
// Record chains
// ---------------------------------------------------------------------------

export interface TypeChain {
  type: EveType | null;
  group: EveGroup | null;
  category: EveCategory | null;
}

/** Follow a type to its group and that group to its category. */
export function resolveTypeChain(
  provider: IStaticDataProvider,
  typeId: number,
): TypeChain {
  const type = provider.getType(typeId);
  const group = type ? provider.getGroup(type.groupId) : null;
  const category = group ? provider.getCategory(group.categoryId) : null;
  return { type, group, category };
}

export interface RegionDescent {
  constellations: Constellation[];
  /** The solar systems of the first constellation, or none. */
  systems: SolarSystem[];
}

/** Walk a region down to the systems of its first constellation. */
export function descendRegion(
  provider: IStaticDataProvider,
  regionId: number,
): RegionDescent {
  const region = provider.getRegion(regionId);
  const constellations = region
    ? provider.getConstellationsByRegion(region.regionId)
    : [];
  const first = constellations[0];
  const systems = first
    ? provider.getSolarSystemsByConstellation(first.constellationId)
    : [];
  return { constellations, systems };
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** A record that fails EveTypeSchema on both of its typed fields. */
export const INVALID_EVE_TYPE: Record<string, unknown> = {
  typeId: 'not-a-number',
  name: 123,
};

/**
 * Validate a record as an EveType, wrapping a schema failure the way the
 * ingestion layer does: the entity type and ID travel with the error.
 */
export function validateEveType(
  data: Record<string, unknown>,
  entityId: number,
): SdeValidationError | null {
  try {
    EveTypeSchema.parse(data);
    return null;
  } catch (err) {
    return new SdeValidationError('EveType', err, entityId);
  }
}

/** One instance of every SDE error class, plus a plain Error for contrast. */
export function sdeErrorInstances() {
  return {
    base: new SdeError('base'),
    database: new SdeDatabaseError('db fail'),
    validation: new SdeValidationError('Type', 'bad'),
    mismatch: new SdeVersionMismatchError('2', '1'),
    plain: new Error('plain'),
  };
}

export type SdeErrorInstances = ReturnType<typeof sdeErrorInstances>;

/** Each guard's verdict on each instance, keyed guard then instance. */
export function applySdeGuards(
  instances: SdeErrorInstances,
): Record<string, Record<keyof SdeErrorInstances, boolean>> {
  const guards = {
    isSdeError,
    isSdeDatabaseError,
    isSdeValidationError,
    isSdeVersionMismatch,
  };
  const verdicts: Record<string, Record<keyof SdeErrorInstances, boolean>> = {};
  for (const [name, guard] of Object.entries(guards)) {
    verdicts[name] = {
      base: guard(instances.base),
      database: guard(instances.database),
      validation: guard(instances.validation),
      mismatch: guard(instances.mismatch),
      plain: guard(instances.plain),
    };
  }
  return verdicts;
}

/** What every guard shall say: its own class and subclasses only. */
export const EXPECTED_GUARD_VERDICTS = {
  isSdeError: {
    base: true,
    database: true,
    validation: true,
    mismatch: true,
    plain: false,
  },
  isSdeDatabaseError: {
    base: false,
    database: true,
    validation: false,
    mismatch: false,
    plain: false,
  },
  isSdeValidationError: {
    base: false,
    database: false,
    validation: true,
    mismatch: false,
    plain: false,
  },
  isSdeVersionMismatch: {
    base: false,
    database: false,
    validation: false,
    mismatch: true,
    plain: false,
  },
};
