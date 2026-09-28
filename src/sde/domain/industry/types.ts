/**
 * SDE domain: blueprints, planetary schematics and the industry reference tables.
 *
 * Types for the tables of this domain; the Zod schemas that validate them
 * are in ./schemas.ts (split out of the former src/sde/types.ts, Track S
 * Run 12).
 */

export interface BlueprintMaterial {
  typeId: number;
  quantity: number;
}

export interface BlueprintProduct {
  typeId: number;
  quantity: number;
  probability?: number;
}

export interface BlueprintActivity {
  time: number;
  materials?: BlueprintMaterial[];
  products?: BlueprintProduct[];
}

export interface BlueprintActivities {
  manufacturing?: BlueprintActivity;
  research_material?: BlueprintActivity;
  research_time?: BlueprintActivity;
  copying?: BlueprintActivity;
  invention?: BlueprintActivity;
}

/** eve_blueprints [5082 rows] */
export interface Blueprint {
  activities: BlueprintActivities;
  blueprintTypeId: number;
  maxProductionLimit: number;
}

/** eve_control_tower_resources [44 rows] */
export interface ControlTowerResource {
  typeId: number;
  resources: unknown;
}

/** eve_industry_activities [6 rows] */
export interface IndustryActivity {
  industryActivityId: number;
  description: string;
  name: string;
}

/** eve_industry_assembly_lines [146 rows] */
export interface IndustryAssemblyLine {
  assemblyLineId: number;
  activityId: number;
  baseMaterialMultiplier: number;
  baseTimeMultiplier: number;
  description: string;
  name: string;
  detailsPerGroup: unknown;
  baseCostMultiplier: number | null;
  detailsPerCategory: unknown;
}

/** eve_industry_installation_types [102 rows] */
export interface IndustryInstallationType {
  installationTypeId: number;
  assemblyLines: unknown;
}

/** eve_industry_modifier_sources [220 rows] */
export interface IndustryModifierSource {
  modifierSourceId: number;
  copying: unknown;
  invention: unknown;
  manufacturing: unknown;
  researchMaterial: unknown;
  researchTime: unknown;
  reaction: unknown;
}

/** eve_industry_target_filters [18 rows] */
export interface IndustryTargetFilter {
  targetFilterId: number;
  categoryIDs: unknown;
  name: string;
  groupIDs: unknown;
}

/** eve_planet_schematics [68 rows] */
export interface PlanetSchematic {
  planetSchematicId: number;
  cycleTime: number;
  name: string;
  pins: unknown;
  types: unknown;
}
