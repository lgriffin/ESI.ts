 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const CharactersCharacterIdAssetsGetSchema = z.looseObject({
  is_blueprint_copy: z.boolean().optional(),
  is_singleton: z.boolean(),
  item_id: z.number(),
  location_flag: z.enum(['AssetSafety', 'AutoFit', 'BoosterBay', 'CapsuleerDeliveries', 'Cargo', 'CorporationGoalDeliveries', 'CorpseBay', 'Deliveries', 'DroneBay', 'ExpeditionHold', 'FighterBay', 'FighterTube0', 'FighterTube1', 'FighterTube2', 'FighterTube3', 'FighterTube4', 'FleetHangar', 'FrigateEscapeBay', 'Hangar', 'HangarAll', 'HiSlot0', 'HiSlot1', 'HiSlot2', 'HiSlot3', 'HiSlot4', 'HiSlot5', 'HiSlot6', 'HiSlot7', 'HiddenModifiers', 'Implant', 'InfrastructureHangar', 'LoSlot0', 'LoSlot1', 'LoSlot2', 'LoSlot3', 'LoSlot4', 'LoSlot5', 'LoSlot6', 'LoSlot7', 'Locked', 'MedSlot0', 'MedSlot1', 'MedSlot2', 'MedSlot3', 'MedSlot4', 'MedSlot5', 'MedSlot6', 'MedSlot7', 'MobileDepotHold', 'MoonMaterialBay', 'QuafeBay', 'RigSlot0', 'RigSlot1', 'RigSlot2', 'RigSlot3', 'RigSlot4', 'RigSlot5', 'RigSlot6', 'RigSlot7', 'ShipHangar', 'Skill', 'SpecializedAmmoHold', 'SpecializedAsteroidHold', 'SpecializedCommandCenterHold', 'SpecializedFuelBay', 'SpecializedGasHold', 'SpecializedIceHold', 'SpecializedIndustrialShipHold', 'SpecializedLargeShipHold', 'SpecializedMaterialBay', 'SpecializedMediumShipHold', 'SpecializedMineralHold', 'SpecializedOreHold', 'SpecializedPlanetaryCommoditiesHold', 'SpecializedSalvageHold', 'SpecializedShipHold', 'SpecializedSmallShipHold', 'StructureDeedBay', 'SubSystemBay', 'SubSystemSlot0', 'SubSystemSlot1', 'SubSystemSlot2', 'SubSystemSlot3', 'SubSystemSlot4', 'SubSystemSlot5', 'SubSystemSlot6', 'SubSystemSlot7', 'Unlocked', 'Wardrobe']),
  location_id: z.number(),
  location_type: z.enum(['station', 'solar_system', 'item', 'other']),
  quantity: z.number(),
  type_id: z.number(),
});

export const CharactersCharacterIdAssetsLocationsPostSchema = z.looseObject({
  item_id: z.number(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
});

export const CharactersCharacterIdAssetsNamesPostSchema = z.looseObject({
  item_id: z.number(),
  name: z.string(),
});

export const CorporationsCorporationIdAssetsGetSchema = z.looseObject({
  is_blueprint_copy: z.boolean().optional(),
  is_singleton: z.boolean(),
  item_id: z.number(),
  location_flag: z.enum(['AssetSafety', 'AutoFit', 'Bonus', 'Booster', 'BoosterBay', 'Capsule', 'CapsuleerDeliveries', 'Cargo', 'CorpDeliveries', 'CorpSAG1', 'CorpSAG2', 'CorpSAG3', 'CorpSAG4', 'CorpSAG5', 'CorpSAG6', 'CorpSAG7', 'CorporationGoalDeliveries', 'CrateLoot', 'Deliveries', 'DroneBay', 'DustBattle', 'DustDatabank', 'ExpeditionHold', 'FighterBay', 'FighterTube0', 'FighterTube1', 'FighterTube2', 'FighterTube3', 'FighterTube4', 'FleetHangar', 'FrigateEscapeBay', 'Hangar', 'HangarAll', 'HiSlot0', 'HiSlot1', 'HiSlot2', 'HiSlot3', 'HiSlot4', 'HiSlot5', 'HiSlot6', 'HiSlot7', 'HiddenModifiers', 'Implant', 'Impounded', 'InfrastructureHangar', 'JunkyardReprocessed', 'JunkyardTrashed', 'LoSlot0', 'LoSlot1', 'LoSlot2', 'LoSlot3', 'LoSlot4', 'LoSlot5', 'LoSlot6', 'LoSlot7', 'Locked', 'MedSlot0', 'MedSlot1', 'MedSlot2', 'MedSlot3', 'MedSlot4', 'MedSlot5', 'MedSlot6', 'MedSlot7', 'MobileDepotHold', 'MoonMaterialBay', 'OfficeFolder', 'Pilot', 'PlanetSurface', 'QuafeBay', 'QuantumCoreRoom', 'Reward', 'RigSlot0', 'RigSlot1', 'RigSlot2', 'RigSlot3', 'RigSlot4', 'RigSlot5', 'RigSlot6', 'RigSlot7', 'SecondaryStorage', 'ServiceSlot0', 'ServiceSlot1', 'ServiceSlot2', 'ServiceSlot3', 'ServiceSlot4', 'ServiceSlot5', 'ServiceSlot6', 'ServiceSlot7', 'ShipHangar', 'ShipOffline', 'Skill', 'SkillInTraining', 'SpecializedAmmoHold', 'SpecializedAsteroidHold', 'SpecializedCommandCenterHold', 'SpecializedFuelBay', 'SpecializedGasHold', 'SpecializedIceHold', 'SpecializedIndustrialShipHold', 'SpecializedLargeShipHold', 'SpecializedMaterialBay', 'SpecializedMediumShipHold', 'SpecializedMineralHold', 'SpecializedOreHold', 'SpecializedPlanetaryCommoditiesHold', 'SpecializedSalvageHold', 'SpecializedShipHold', 'SpecializedSmallShipHold', 'StructureActive', 'StructureFuel', 'StructureInactive', 'StructureOffline', 'SubSystemBay', 'SubSystemSlot0', 'SubSystemSlot1', 'SubSystemSlot2', 'SubSystemSlot3', 'SubSystemSlot4', 'SubSystemSlot5', 'SubSystemSlot6', 'SubSystemSlot7', 'Unlocked', 'Wallet', 'Wardrobe']),
  location_id: z.number(),
  location_type: z.enum(['station', 'solar_system', 'item', 'other']),
  quantity: z.number(),
  type_id: z.number(),
});

export const CorporationsCorporationIdAssetsLocationsPostSchema = z.looseObject({
  item_id: z.number(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
});

export const CorporationsCorporationIdAssetsNamesPostSchema = z.looseObject({
  item_id: z.number(),
  name: z.string(),
});
