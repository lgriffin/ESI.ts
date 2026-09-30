/**
 * What `npm run sde:drift` knows: how an extracted SDE export is compared
 * with what the module knows about it, with no I/O, so the unit suite can
 * drive it over a fixture directory.
 *
 * Two things can drift between CCP's export and this module:
 *
 *   files   the export carries a YAML file `SDE_FILE_REGISTRY` does not list
 *           (a new table nobody can query yet), or a registered file is gone;
 *   fields  a record carries a top-level key the table's Zod schema does not
 *           declare (a new field the types do not expose), or a key the
 *           schema requires is on no record at all (a field CCP removed).
 *
 * Records are compared after `transformRecordNative`, the same transform both
 * providers apply, so the keys line up with the schema's (`groupID` is
 * `groupId`, a localised name is a string, the ID is injected). The schemas
 * are `looseObject`s, so an extra key is never a parse failure; this check is
 * how the extra key gets noticed before a user asks for it.
 */
import type { z } from 'zod';

import {
  SDE_FILE_REGISTRY,
  type SdeFileSpec,
} from '../../src/sde/ingestion/constants';
import { transformRecordNative } from '../../src/sde/ingestion/transforms';
import * as schemas from '../../src/sde/domain/schemas';

export const REPORT_FILE = 'reports/sde-drift.json';
export const EXIT_DRIFT = 1;
export const EXIT_FAILURE = 2;

/** The schema that validates each registered file's transformed records. */
export const SCHEMA_BY_FILE: Readonly<Record<string, keyof typeof schemas>> = {
  'mapRegions.yaml': 'RegionSchema',
  'mapConstellations.yaml': 'ConstellationSchema',
  'mapSolarSystems.yaml': 'SolarSystemSchema',
  'mapStargates.yaml': 'StargateSchema',
  'mapStars.yaml': 'StarSchema',
  'mapPlanets.yaml': 'PlanetSchema',
  'mapMoons.yaml': 'MoonSchema',
  'mapAsteroidBelts.yaml': 'AsteroidBeltSchema',
  'mapSecondarySuns.yaml': 'SecondarySunSchema',
  'types.yaml': 'EveTypeSchema',
  'groups.yaml': 'EveGroupSchema',
  'categories.yaml': 'EveCategorySchema',
  'metaGroups.yaml': 'MetaGroupSchema',
  'typeDogma.yaml': 'TypeDogmaSchema',
  'typeBonus.yaml': 'TypeBonusSchema',
  'typeElements.yaml': 'TypeElementSchema',
  'typeLists.yaml': 'TypeListSchema',
  'typeMaterials.yaml': 'TypeMaterialSchema',
  'compressibleTypes.yaml': 'CompressibleTypeSchema',
  'contrabandTypes.yaml': 'ContrabandTypeSchema',
  'dogmaAttributes.yaml': 'DogmaAttributeSchema',
  'dogmaEffects.yaml': 'DogmaEffectSchema',
  'dogmaAttributeCategories.yaml': 'DogmaAttributeCategorySchema',
  'dogmaUnits.yaml': 'DogmaUnitSchema',
  'blueprints.yaml': 'BlueprintSchema',
  'planetSchematics.yaml': 'PlanetSchematicSchema',
  'planetResources.yaml': 'PlanetResourceSchema',
  'marketGroups.yaml': 'MarketGroupSchema',
  'agentTypes.yaml': 'AgentTypeSchema',
  'agentsInSpace.yaml': 'AgentInSpaceSchema',
  'npcCharacters.yaml': 'NpcCharacterSchema',
  'npcCorporations.yaml': 'NpcCorporationSchema',
  'npcCorporationDivisions.yaml': 'NpcCorporationDivisionSchema',
  'npcStations.yaml': 'NpcStationSchema',
  'factions.yaml': 'FactionSchema',
  'races.yaml': 'RaceSchema',
  'bloodlines.yaml': 'BloodlineSchema',
  'ancestries.yaml': 'AncestrySchema',
  'characterAttributes.yaml': 'CharacterAttributeSchema',
  'characterTitles.yaml': 'CharacterTitleSchema',
  'cloneGrades.yaml': 'CloneGradeSchema',
  'skins.yaml': 'SkinSchema',
  'skinLicenses.yaml': 'SkinLicenseSchema',
  'skinMaterials.yaml': 'SkinMaterialSchema',
  'skinrComponents.yaml': 'SkinrComponentSchema',
  'skinrComponentCategories.yaml': 'SkinrComponentCategorySchema',
  'skinrComponentRarities.yaml': 'SkinrComponentRaritySchema',
  'skinrComponentPointValues.yaml': 'SkinrComponentPointValueSchema',
  'skinrSlots.yaml': 'SkinrSlotSchema',
  'skinrSlotCategories.yaml': 'SkinrSlotCategorySchema',
  'skinrSlotConfigurations.yaml': 'SkinrSlotConfigurationSchema',
  'skinrSlotNames.yaml': 'SkinrSlotNameSchema',
  'skinrTierThresholds.yaml': 'SkinrTierThresholdSchema',
  'shipTreeElements.yaml': 'ShipTreeElementSchema',
  'shipTreeFactions.yaml': 'ShipTreeFactionSchema',
  'shipTreeGroups.yaml': 'ShipTreeGroupSchema',
  'graphics.yaml': 'GraphicSchema',
  'graphicMaterialSets.yaml': 'GraphicMaterialSetSchema',
  'icons.yaml': 'IconSchema',
  'stationOperations.yaml': 'StationOperationSchema',
  'stationServices.yaml': 'StationServiceSchema',
  'sovereigntyUpgrades.yaml': 'SovereigntyUpgradeSchema',
  'certificates.yaml': 'CertificateSchema',
  'masteries.yaml': 'MasterySchema',
  'archetypes.yaml': 'ArchetypeSchema',
  'controlTowerResources.yaml': 'ControlTowerResourceSchema',
  'corporationActivities.yaml': 'CorporationActivitySchema',
  'dbuffCollections.yaml': 'DbuffCollectionSchema',
  'dungeons.yaml': 'DungeonSchema',
  'dynamicItemAttributes.yaml': 'DynamicItemAttributeSchema',
  'epicArcs.yaml': 'EpicArcSchema',
  'freelanceJobSchemas.yaml': 'FreelanceJobSchemaSchema',
  'landmarks.yaml': 'LandmarkSchema',
  'mercenaryTacticalOperations.yaml': 'MercenaryTacticalOperationSchema',
  'militaryCampaigns.yaml': 'MilitaryCampaignSchema',
  'militaryCampaignObjectives.yaml': 'MilitaryCampaignObjectiveSchema',
  'missions.yaml': 'MissionSchema',
  'translationLanguages.yaml': 'TranslationLanguageSchema',
  'industryActivities.yaml': 'IndustryActivitySchema',
  'industryAssemblyLines.yaml': 'IndustryAssemblyLineSchema',
  'industryInstallationTypes.yaml': 'IndustryInstallationTypeSchema',
  'industryModifierSources.yaml': 'IndustryModifierSourceSchema',
  'industryTargetFilters.yaml': 'IndustryTargetFilterSchema',
  'fighterAbilities.yaml': 'FighterAbilitySchema',
  'fighterAbilitiesByType.yaml': 'FighterAbilityByTypeSchema',
  'corporationRoles.yaml': 'CorporationRoleSchema',
  'corporationRoleGroups.yaml': 'CorporationRoleGroupSchema',
  'schools.yaml': 'SchoolSchema',
  'schoolMap.yaml': 'SchoolMapSchema',
  'skillPlans.yaml': 'SkillPlanSchema',
  'expertSystems.yaml': 'ExpertSystemSchema',
  'notificationTypes.yaml': 'NotificationTypeSchema',
  'accountingEntryTypes.yaml': 'AccountingEntryTypeSchema',
  'appliedProximityEffects.yaml': 'AppliedProximityEffectSchema',
  'proximityTrap.yaml': 'ProximityTrapSchema',
  'systemDbuffEmitters.yaml': 'SystemDbuffEmitterSchema',
  'systemWideEffects.yaml': 'SystemWideEffectSchema',
  'linkWithShip.yaml': 'LinkWithShipSchema',
  'stationStandingsRestrictions.yaml': 'StationStandingsRestrictionSchema',
  'skinrSlotsToMaterials.yaml': 'SkinrSlotToMaterialSchema',
  'metenoxMoonDrill.yaml': 'MetenoxMoonDrillSchema',
};

/** The metadata file every export carries; not a table. */
export const METADATA_FILE = '_sde.yaml';

interface ZodDef {
  type: string;
  shape?: Record<string, z.ZodType>;
  innerType?: z.ZodType;
}

function defOf(schema: z.ZodType): ZodDef {
  return (schema as unknown as { _zod: { def: ZodDef } })._zod.def;
}

export function schemaFor(yamlFile: string): z.ZodType | null {
  const name = SCHEMA_BY_FILE[yamlFile];
  if (!name) return null;
  const schema = (schemas as Record<string, unknown>)[name];
  return schema && typeof schema === 'object' && '_zod' in schema
    ? (schema as z.ZodType)
    : null;
}

/** Every top-level key the schema declares, and the ones it requires. */
export function schemaKeys(schema: z.ZodType): {
  declared: string[];
  required: string[];
} {
  const def = defOf(schema);
  if (def.type !== 'object' || !def.shape)
    return { declared: [], required: [] };
  const declared = Object.keys(def.shape);
  // A nullable key is one CCP sometimes leaves out, so only a key that is
  // neither optional nor nullable counts as gone when no record carries it.
  const required = Object.entries(def.shape)
    .filter(
      ([, value]) => !['optional', 'nullable'].includes(defOf(value).type),
    )
    .map(([key]) => key);
  return { declared, required };
}

/** One registered file read from the export: its records, raw as CCP wrote them. */
export interface ObservedFile {
  yamlFile: string;
  /** Record key (the entity ID) to the raw record. */
  records: ReadonlyArray<readonly [number | string, Record<string, unknown>]>;
}

export interface FieldDrift {
  yamlFile: string;
  tableName: string;
  records: number;
  /** Keys on at least one record that the schema does not declare. */
  newKeys: string[];
  /** Keys the schema requires that no record carries. */
  goneKeys: string[];
  /**
   * For each new key, how many records carry it and the first value seen
   * (JSON, cut at SAMPLE_LENGTH), so the type and schema can be written from
   * the report without downloading the export.
   */
  samples: Record<string, NewKeySample>;
}

export interface NewKeySample {
  records: number;
  value: string;
}

/** The longest sample value the report carries. */
export const SAMPLE_LENGTH = 200;

function sampleOf(value: unknown): string {
  const json = JSON.stringify(value) ?? String(value);
  return json.length > SAMPLE_LENGTH
    ? `${json.slice(0, SAMPLE_LENGTH)}...`
    : json;
}

export interface DriftReport {
  build: string;
  checkedAt: string;
  /** Registered files, and the YAML files the export carried. */
  registered: number;
  observed: number;
  /** YAML files in the export the registry does not list. */
  unknownFiles: string[];
  /** Registered files the export does not carry. */
  missingFiles: string[];
  /** Registered files with no schema to compare against. */
  unmappedFiles: string[];
  fields: FieldDrift[];
  hasDrift: boolean;
}

export interface DriftInput {
  build: string;
  checkedAt: string;
  /** Every `*.yaml` at the top of the extracted export. */
  files: readonly string[];
  /** Reads one registered file; called for each registered file the export carries. */
  read: (spec: SdeFileSpec) => ObservedFile;
}

export function fieldDrift(
  observed: ObservedFile,
  spec: SdeFileSpec,
  schema: z.ZodType,
): FieldDrift {
  const { declared, required } = schemaKeys(schema);
  const declaredSet = new Set(declared);
  const seen = new Set<string>();
  const samples: Record<string, NewKeySample> = {};
  for (const [id, raw] of observed.records) {
    const record = transformRecordNative(id, raw, spec);
    for (const [key, value] of Object.entries(record)) {
      seen.add(key);
      if (declaredSet.has(key)) continue;
      // eslint-disable-next-line security/detect-object-injection -- key comes from the record
      const sample = samples[key];
      if (sample) sample.records += 1;
      // eslint-disable-next-line security/detect-object-injection -- key comes from the record
      else samples[key] = { records: 1, value: sampleOf(value) };
    }
  }
  const newKeys = [...seen].filter((key) => !declaredSet.has(key)).sort();
  // A file whose registry entry does not inject the map key carries the ID
  // inside each record today; if CCP stopped writing it there the providers
  // would still key the table by the map key, so its absence is not gone.
  const goneKeys =
    observed.records.length === 0
      ? []
      : required
          .filter((key) => spec.injectId || key !== spec.idAttribute)
          .filter((key) => !seen.has(key))
          .sort();
  return {
    yamlFile: spec.yamlFile,
    tableName: spec.tableName,
    records: observed.records.length,
    newKeys,
    goneKeys,
    samples,
  };
}

export function analyseDrift(
  input: DriftInput,
  registry: readonly SdeFileSpec[] = SDE_FILE_REGISTRY,
): DriftReport {
  const registered = new Set(registry.map((spec) => spec.yamlFile));
  const present = new Set(input.files.filter((file) => file.endsWith('.yaml')));
  const unknownFiles = [...present]
    .filter((file) => file !== METADATA_FILE && !registered.has(file))
    .sort();
  const missingFiles = [...registered]
    .filter((file) => !present.has(file))
    .sort();
  const unmappedFiles: string[] = [];
  const fields: FieldDrift[] = [];
  for (const spec of registry) {
    if (!present.has(spec.yamlFile)) continue;
    const schema = schemaFor(spec.yamlFile);
    if (!schema) {
      unmappedFiles.push(spec.yamlFile);
      continue;
    }
    const drift = fieldDrift(input.read(spec), spec, schema);
    if (drift.newKeys.length > 0 || drift.goneKeys.length > 0) {
      fields.push(drift);
    }
  }
  return {
    build: input.build,
    checkedAt: input.checkedAt,
    registered: registered.size,
    observed: present.size,
    unknownFiles,
    missingFiles,
    unmappedFiles: unmappedFiles.sort(),
    fields,
    hasDrift:
      unknownFiles.length > 0 ||
      missingFiles.length > 0 ||
      unmappedFiles.length > 0 ||
      fields.length > 0,
  };
}

/** The step summary and console report: one line per finding. */
export function renderReport(report: DriftReport): string {
  const lines: string[] = [];
  lines.push(`## SDE export drift, build ${report.build}`);
  lines.push('');
  lines.push(
    `- Registry: ${report.registered} files; export: ${report.observed} YAML files`,
  );
  lines.push(`- Drift: ${report.hasDrift ? 'yes' : 'none'}`);
  if (report.unknownFiles.length > 0) {
    lines.push('');
    lines.push('### Files the registry does not list');
    lines.push('');
    for (const file of report.unknownFiles) lines.push(`- \`${file}\``);
  }
  if (report.missingFiles.length > 0) {
    lines.push('');
    lines.push('### Registered files the export does not carry');
    lines.push('');
    for (const file of report.missingFiles) lines.push(`- \`${file}\``);
  }
  if (report.unmappedFiles.length > 0) {
    lines.push('');
    lines.push('### Registered files with no schema to compare');
    lines.push('');
    for (const file of report.unmappedFiles) lines.push(`- \`${file}\``);
  }
  if (report.fields.length > 0) {
    lines.push('');
    lines.push('### Fields');
    lines.push('');
    lines.push('| File | Table | Records | New keys | Gone keys |');
    lines.push('| :-- | :-- | --: | :-- | :-- |');
    for (const f of report.fields) {
      const cell = (keys: string[]) =>
        keys.length === 0 ? '' : keys.map((k) => `\`${k}\``).join(', ');
      lines.push(
        `| \`${f.yamlFile}\` | \`${f.tableName}\` | ${f.records} | ${cell(f.newKeys)} | ${cell(f.goneKeys)} |`,
      );
    }
    const withSamples = report.fields.filter((f) => f.newKeys.length > 0);
    if (withSamples.length > 0) {
      lines.push('');
      lines.push('### New key samples');
      lines.push('');
      lines.push('| File | Key | Records | First value |');
      lines.push('| :-- | :-- | --: | :-- |');
      for (const f of withSamples) {
        for (const key of f.newKeys) {
          // eslint-disable-next-line security/detect-object-injection -- key comes from newKeys
          const sample = f.samples[key];
          if (!sample) continue;
          const value = sample.value.replace(/\|/g, '\\|').replace(/`/g, "'");
          lines.push(
            `| \`${f.yamlFile}\` | \`${key}\` | ${sample.records} | \`${value}\` |`,
          );
        }
      }
    }
  }
  lines.push('');
  return lines.join('\n');
}
