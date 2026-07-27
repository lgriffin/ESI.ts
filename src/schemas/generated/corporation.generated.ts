 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const CorporationsCorporationIdAlliancehistoryGetSchema = z.looseObject({
  alliance_id: z.number().optional(),
  is_deleted: z.boolean().optional(),
  record_id: z.number(),
  start_date: z.string(),
});

export const CorporationsCorporationIdBlueprintsGetSchema = z.looseObject({
  item_id: z.number(),
  location_flag: z.enum(['AssetSafety', 'AutoFit', 'Bonus', 'Booster', 'BoosterBay', 'Capsule', 'CapsuleerDeliveries', 'Cargo', 'CorpDeliveries', 'CorpSAG1', 'CorpSAG2', 'CorpSAG3', 'CorpSAG4', 'CorpSAG5', 'CorpSAG6', 'CorpSAG7', 'CorporationGoalDeliveries', 'CrateLoot', 'Deliveries', 'DroneBay', 'DustBattle', 'DustDatabank', 'ExpeditionHold', 'FighterBay', 'FighterTube0', 'FighterTube1', 'FighterTube2', 'FighterTube3', 'FighterTube4', 'FleetHangar', 'FrigateEscapeBay', 'Hangar', 'HangarAll', 'HiSlot0', 'HiSlot1', 'HiSlot2', 'HiSlot3', 'HiSlot4', 'HiSlot5', 'HiSlot6', 'HiSlot7', 'HiddenModifiers', 'Implant', 'Impounded', 'InfrastructureHangar', 'JunkyardReprocessed', 'JunkyardTrashed', 'LoSlot0', 'LoSlot1', 'LoSlot2', 'LoSlot3', 'LoSlot4', 'LoSlot5', 'LoSlot6', 'LoSlot7', 'Locked', 'MedSlot0', 'MedSlot1', 'MedSlot2', 'MedSlot3', 'MedSlot4', 'MedSlot5', 'MedSlot6', 'MedSlot7', 'MobileDepotHold', 'MoonMaterialBay', 'OfficeFolder', 'Pilot', 'PlanetSurface', 'QuafeBay', 'QuantumCoreRoom', 'Reward', 'RigSlot0', 'RigSlot1', 'RigSlot2', 'RigSlot3', 'RigSlot4', 'RigSlot5', 'RigSlot6', 'RigSlot7', 'SecondaryStorage', 'ServiceSlot0', 'ServiceSlot1', 'ServiceSlot2', 'ServiceSlot3', 'ServiceSlot4', 'ServiceSlot5', 'ServiceSlot6', 'ServiceSlot7', 'ShipHangar', 'ShipOffline', 'Skill', 'SkillInTraining', 'SpecializedAmmoHold', 'SpecializedAsteroidHold', 'SpecializedCommandCenterHold', 'SpecializedFuelBay', 'SpecializedGasHold', 'SpecializedIceHold', 'SpecializedIndustrialShipHold', 'SpecializedLargeShipHold', 'SpecializedMaterialBay', 'SpecializedMediumShipHold', 'SpecializedMineralHold', 'SpecializedOreHold', 'SpecializedPlanetaryCommoditiesHold', 'SpecializedSalvageHold', 'SpecializedShipHold', 'SpecializedSmallShipHold', 'StructureActive', 'StructureFuel', 'StructureInactive', 'StructureOffline', 'SubSystemBay', 'SubSystemSlot0', 'SubSystemSlot1', 'SubSystemSlot2', 'SubSystemSlot3', 'SubSystemSlot4', 'SubSystemSlot5', 'SubSystemSlot6', 'SubSystemSlot7', 'Unlocked', 'Wallet', 'Wardrobe']),
  location_id: z.number(),
  material_efficiency: z.number(),
  quantity: z.number(),
  runs: z.number(),
  time_efficiency: z.number(),
  type_id: z.number(),
});

export const CorporationsCorporationIdContainersLogsGetSchema = z.looseObject({
  action: z.enum(['add', 'assemble', 'configure', 'enter_password', 'lock', 'move', 'repackage', 'set_name', 'set_password', 'unlock']),
  character_id: z.number(),
  container_id: z.number(),
  container_type_id: z.number(),
  location_flag: z.enum(['AssetSafety', 'AutoFit', 'Bonus', 'Booster', 'BoosterBay', 'Capsule', 'CapsuleerDeliveries', 'Cargo', 'CorpDeliveries', 'CorpSAG1', 'CorpSAG2', 'CorpSAG3', 'CorpSAG4', 'CorpSAG5', 'CorpSAG6', 'CorpSAG7', 'CorporationGoalDeliveries', 'CrateLoot', 'Deliveries', 'DroneBay', 'DustBattle', 'DustDatabank', 'ExpeditionHold', 'FighterBay', 'FighterTube0', 'FighterTube1', 'FighterTube2', 'FighterTube3', 'FighterTube4', 'FleetHangar', 'FrigateEscapeBay', 'Hangar', 'HangarAll', 'HiSlot0', 'HiSlot1', 'HiSlot2', 'HiSlot3', 'HiSlot4', 'HiSlot5', 'HiSlot6', 'HiSlot7', 'HiddenModifiers', 'Implant', 'Impounded', 'InfrastructureHangar', 'JunkyardReprocessed', 'JunkyardTrashed', 'LoSlot0', 'LoSlot1', 'LoSlot2', 'LoSlot3', 'LoSlot4', 'LoSlot5', 'LoSlot6', 'LoSlot7', 'Locked', 'MedSlot0', 'MedSlot1', 'MedSlot2', 'MedSlot3', 'MedSlot4', 'MedSlot5', 'MedSlot6', 'MedSlot7', 'MobileDepotHold', 'MoonMaterialBay', 'OfficeFolder', 'Pilot', 'PlanetSurface', 'QuafeBay', 'QuantumCoreRoom', 'Reward', 'RigSlot0', 'RigSlot1', 'RigSlot2', 'RigSlot3', 'RigSlot4', 'RigSlot5', 'RigSlot6', 'RigSlot7', 'SecondaryStorage', 'ServiceSlot0', 'ServiceSlot1', 'ServiceSlot2', 'ServiceSlot3', 'ServiceSlot4', 'ServiceSlot5', 'ServiceSlot6', 'ServiceSlot7', 'ShipHangar', 'ShipOffline', 'Skill', 'SkillInTraining', 'SpecializedAmmoHold', 'SpecializedAsteroidHold', 'SpecializedCommandCenterHold', 'SpecializedFuelBay', 'SpecializedGasHold', 'SpecializedIceHold', 'SpecializedIndustrialShipHold', 'SpecializedLargeShipHold', 'SpecializedMaterialBay', 'SpecializedMediumShipHold', 'SpecializedMineralHold', 'SpecializedOreHold', 'SpecializedPlanetaryCommoditiesHold', 'SpecializedSalvageHold', 'SpecializedShipHold', 'SpecializedSmallShipHold', 'StructureActive', 'StructureFuel', 'StructureInactive', 'StructureOffline', 'SubSystemBay', 'SubSystemSlot0', 'SubSystemSlot1', 'SubSystemSlot2', 'SubSystemSlot3', 'SubSystemSlot4', 'SubSystemSlot5', 'SubSystemSlot6', 'SubSystemSlot7', 'Unlocked', 'Wallet', 'Wardrobe']),
  location_id: z.number(),
  logged_at: z.string(),
  new_config_bitmask: z.number().optional(),
  old_config_bitmask: z.number().optional(),
  password_type: z.enum(['config', 'general']).optional(),
  quantity: z.number().optional(),
  type_id: z.number().optional(),
});

export const CorporationsCorporationIdDivisionsGetSchema = z.looseObject({
  hangar: z.array(z.looseObject({
    division: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
  wallet: z.array(z.looseObject({
    division: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
});

export const CorporationsCorporationIdFacilitiesGetSchema = z.looseObject({
  facility_id: z.number(),
  system_id: z.number(),
  type_id: z.number(),
});

export const CorporationsCorporationIdIconsGetSchema = z.looseObject({
  px128x128: z.string().optional(),
  px256x256: z.string().optional(),
  px64x64: z.string().optional(),
});

export const CorporationsCorporationIdMedalsGetSchema = z.looseObject({
  created_at: z.string(),
  creator_id: z.number(),
  description: z.string(),
  medal_id: z.number(),
  title: z.string(),
});

export const CorporationsCorporationIdMedalsIssuedGetSchema = z.looseObject({
  character_id: z.number(),
  issued_at: z.string(),
  issuer_id: z.number(),
  medal_id: z.number(),
  reason: z.string(),
  status: z.enum(['private', 'public']),
});

export const CorporationsCorporationIdMembersTitlesGetSchema = z.looseObject({
  character_id: z.number(),
  titles: z.array(z.number()),
});

export const CorporationsCorporationIdMembertrackingGetSchema = z.looseObject({
  base_id: z.number().optional(),
  character_id: z.number(),
  location_id: z.number().optional(),
  logoff_date: z.string().optional(),
  logon_date: z.string().optional(),
  ship_type_id: z.number().optional(),
  start_date: z.string().optional(),
});

export const CorporationsCorporationIdRolesGetSchema = z.looseObject({
  character_id: z.number(),
  grantable_roles: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  grantable_roles_at_base: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  grantable_roles_at_hq: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  grantable_roles_at_other: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  roles: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  roles_at_base: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  roles_at_hq: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  roles_at_other: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
});

export const CorporationsCorporationIdRolesHistoryGetSchema = z.looseObject({
  changed_at: z.string(),
  character_id: z.number(),
  issuer_id: z.number(),
  new_roles: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])),
  old_roles: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])),
  role_type: z.enum(['grantable_roles', 'grantable_roles_at_base', 'grantable_roles_at_hq', 'grantable_roles_at_other', 'roles', 'roles_at_base', 'roles_at_hq', 'roles_at_other']),
});

export const CorporationsCorporationIdShareholdersGetSchema = z.looseObject({
  share_count: z.number(),
  shareholder_id: z.number(),
  shareholder_type: z.enum(['character', 'corporation']),
});

export const CorporationsCorporationIdStandingsGetSchema = z.looseObject({
  from_id: z.number(),
  from_type: z.enum(['agent', 'npc_corp', 'faction']),
  standing: z.number(),
});

export const CorporationsCorporationIdStarbasesGetSchema = z.looseObject({
  moon_id: z.number().optional(),
  onlined_since: z.string().optional(),
  reinforced_until: z.string().optional(),
  starbase_id: z.number(),
  state: z.enum(['offline', 'online', 'onlining', 'reinforced', 'unanchoring']).optional(),
  system_id: z.number(),
  type_id: z.number(),
  unanchor_at: z.string().optional(),
});

export const CorporationsCorporationIdStarbasesStarbaseIdGetSchema = z.looseObject({
  allow_alliance_members: z.boolean(),
  allow_corporation_members: z.boolean(),
  anchor: z.enum(['alliance_member', 'config_starbase_equipment_role', 'corporation_member', 'starbase_fuel_technician_role']),
  attack_if_at_war: z.boolean(),
  attack_if_other_security_status_dropping: z.boolean(),
  attack_security_status_threshold: z.number().optional(),
  attack_standing_threshold: z.number().optional(),
  fuel_bay_take: z.enum(['alliance_member', 'config_starbase_equipment_role', 'corporation_member', 'starbase_fuel_technician_role']),
  fuel_bay_view: z.enum(['alliance_member', 'config_starbase_equipment_role', 'corporation_member', 'starbase_fuel_technician_role']),
  fuels: z.array(z.looseObject({
    quantity: z.number(),
    type_id: z.number(),
  })).optional(),
  offline: z.enum(['alliance_member', 'config_starbase_equipment_role', 'corporation_member', 'starbase_fuel_technician_role']),
  online: z.enum(['alliance_member', 'config_starbase_equipment_role', 'corporation_member', 'starbase_fuel_technician_role']),
  unanchor: z.enum(['alliance_member', 'config_starbase_equipment_role', 'corporation_member', 'starbase_fuel_technician_role']),
  use_alliance_standings: z.boolean(),
});

export const CorporationsCorporationIdStructuresGetSchema = z.looseObject({
  corporation_id: z.number(),
  fuel_expires: z.string().optional(),
  name: z.string().optional(),
  next_reinforce_apply: z.string().optional(),
  next_reinforce_hour: z.number().optional(),
  profile_id: z.number(),
  reinforce_hour: z.number().optional(),
  services: z.array(z.looseObject({
    name: z.string(),
    state: z.enum(['online', 'offline', 'cleanup']),
  })).optional(),
  state: z.enum(['anchor_vulnerable', 'anchoring', 'armor_reinforce', 'armor_vulnerable', 'deploy_vulnerable', 'fitting_invulnerable', 'hull_reinforce', 'hull_vulnerable', 'online_deprecated', 'onlining_vulnerable', 'shield_vulnerable', 'unanchored', 'unknown']),
  state_timer_end: z.string().optional(),
  state_timer_start: z.string().optional(),
  structure_id: z.number(),
  system_id: z.number(),
  type_id: z.number(),
  unanchors_at: z.string().optional(),
});

export const CorporationsCorporationIdTitlesGetSchema = z.looseObject({
  grantable_roles: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  grantable_roles_at_base: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  grantable_roles_at_hq: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  grantable_roles_at_other: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  name: z.string().optional(),
  roles: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  roles_at_base: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  roles_at_hq: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  roles_at_other: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  title_id: z.number().optional(),
});

export const CorporationsDetailSchema = z.looseObject({
  alliance_id: z.number().optional(),
  ceo_id: z.number(),
  creator_id: z.number(),
  date_founded: z.string().optional(),
  description: z.string().optional(),
  faction_id: z.number().optional(),
  home_station_id: z.number().optional(),
  member_count: z.number(),
  name: z.string(),
  shares: z.number().optional(),
  tax_rate: z.number(),
  ticker: z.string(),
  url: z.string().optional(),
  war_eligible: z.boolean().optional(),
});
