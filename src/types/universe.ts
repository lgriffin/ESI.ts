import { z } from 'zod';
import {
  SolarSystemInfoSchema,
  ConstellationInfoSchema,
  RegionInfoSchema,
  AncestrySchema,
  BloodlineSchema,
  FactionSchema,
  RaceSchema,
  StationInfoSchema,
  TypeInfoSchema,
  AsteroidBeltInfoSchema,
  GraphicInfoSchema,
  ItemCategorySchema,
  ItemGroupSchema,
  MoonInfoSchema,
  PlanetInfoSchema,
  StarInfoSchema,
  StargateInfoSchema,
  StructureInfoSchema,
  SystemJumpSchema,
  SystemKillSchema,
  BulkIdResultSchema,
  NameAndCategorySchema,
  SchematicInfoSchema,
  SearchResultSchema,
} from '../schemas/universe';

export type SolarSystemInfo = z.infer<typeof SolarSystemInfoSchema>;
export type ConstellationInfo = z.infer<typeof ConstellationInfoSchema>;
export type RegionInfo = z.infer<typeof RegionInfoSchema>;
export type Ancestry = z.infer<typeof AncestrySchema>;
export type Bloodline = z.infer<typeof BloodlineSchema>;
export type Faction = z.infer<typeof FactionSchema>;
export type Race = z.infer<typeof RaceSchema>;
export type StationInfo = z.infer<typeof StationInfoSchema>;
export type TypeInfo = z.infer<typeof TypeInfoSchema>;
export type AsteroidBeltInfo = z.infer<typeof AsteroidBeltInfoSchema>;
export type GraphicInfo = z.infer<typeof GraphicInfoSchema>;
export type ItemCategory = z.infer<typeof ItemCategorySchema>;
export type ItemGroup = z.infer<typeof ItemGroupSchema>;
export type MoonInfo = z.infer<typeof MoonInfoSchema>;
export type PlanetInfo = z.infer<typeof PlanetInfoSchema>;
export type StarInfo = z.infer<typeof StarInfoSchema>;
export type StargateInfo = z.infer<typeof StargateInfoSchema>;
export type StructureInfo = z.infer<typeof StructureInfoSchema>;
export type SystemJump = z.infer<typeof SystemJumpSchema>;
export type SystemKill = z.infer<typeof SystemKillSchema>;
export type BulkIdResult = z.infer<typeof BulkIdResultSchema>;
export type NameAndCategory = z.infer<typeof NameAndCategorySchema>;
export type SchematicInfo = z.infer<typeof SchematicInfoSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
