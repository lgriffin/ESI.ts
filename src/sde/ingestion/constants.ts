export const SDE_DOWNLOAD_URL =
  'https://developers.eveonline.com/static-data/eve-online-static-data-latest-yaml.zip';

export const SDE_LATEST_BUILD_URL =
  'https://developers.eveonline.com/static-data/tranquility/latest.jsonl';

export const SDE_BUILD_NUMBER_HEADER = 'x-sde-build-number';

export const SDE_METADATA_FILENAME = '_sde.yaml';

export interface SdeFileSpec {
  readonly yamlFile: string;
  readonly tableName: string;
  readonly idAttribute: string;
  readonly idType: 'number' | 'string';
  readonly injectId: boolean;
}

export const SDE_FILE_REGISTRY: readonly SdeFileSpec[] = [
  // --- Universe / Map ---
  {
    yamlFile: 'mapRegions.yaml',
    tableName: 'eve_regions',
    idAttribute: 'regionId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'mapConstellations.yaml',
    tableName: 'eve_constellations',
    idAttribute: 'constellationId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'mapSolarSystems.yaml',
    tableName: 'eve_solar_systems',
    idAttribute: 'systemId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'mapStargates.yaml',
    tableName: 'eve_stargates',
    idAttribute: 'stargateId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'mapStars.yaml',
    tableName: 'eve_stars',
    idAttribute: 'starId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'mapPlanets.yaml',
    tableName: 'eve_planets',
    idAttribute: 'planetId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'mapMoons.yaml',
    tableName: 'eve_moons',
    idAttribute: 'moonId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'mapAsteroidBelts.yaml',
    tableName: 'eve_asteroid_belts',
    idAttribute: 'asteroidBeltId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'mapSecondarySuns.yaml',
    tableName: 'eve_secondary_suns',
    idAttribute: 'secondarySunId',
    idType: 'number',
    injectId: true,
  },

  // --- Type System ---
  {
    yamlFile: 'types.yaml',
    tableName: 'eve_types',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'groups.yaml',
    tableName: 'eve_groups',
    idAttribute: 'groupId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'categories.yaml',
    tableName: 'eve_categories',
    idAttribute: 'categoryId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'metaGroups.yaml',
    tableName: 'eve_meta_groups',
    idAttribute: 'metaGroupId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'typeDogma.yaml',
    tableName: 'eve_type_dogma',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'typeBonus.yaml',
    tableName: 'eve_type_bonuses',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'typeElements.yaml',
    tableName: 'eve_type_elements',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'typeLists.yaml',
    tableName: 'eve_type_lists',
    idAttribute: 'typeListId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'typeMaterials.yaml',
    tableName: 'eve_type_materials',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'compressibleTypes.yaml',
    tableName: 'eve_compressible_types',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'contrabandTypes.yaml',
    tableName: 'eve_contraband_types',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },

  // --- Dogma ---
  {
    yamlFile: 'dogmaAttributes.yaml',
    tableName: 'eve_dogma_attributes',
    idAttribute: 'attributeId',
    idType: 'number',
    injectId: false,
  },
  {
    yamlFile: 'dogmaEffects.yaml',
    tableName: 'eve_dogma_effects',
    idAttribute: 'effectId',
    idType: 'number',
    injectId: false,
  },
  {
    yamlFile: 'dogmaAttributeCategories.yaml',
    tableName: 'eve_dogma_attribute_categories',
    idAttribute: 'attributeCategoryId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'dogmaUnits.yaml',
    tableName: 'eve_dogma_units',
    idAttribute: 'unitId',
    idType: 'number',
    injectId: true,
  },

  // --- Industry ---
  {
    yamlFile: 'blueprints.yaml',
    tableName: 'eve_blueprints',
    idAttribute: 'blueprintTypeId',
    idType: 'number',
    injectId: false,
  },
  {
    yamlFile: 'planetSchematics.yaml',
    tableName: 'eve_planet_schematics',
    idAttribute: 'planetSchematicId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'planetResources.yaml',
    tableName: 'eve_planet_resources',
    idAttribute: 'planetId',
    idType: 'number',
    injectId: true,
  },

  // --- Market ---
  {
    yamlFile: 'marketGroups.yaml',
    tableName: 'eve_market_groups',
    idAttribute: 'marketGroupId',
    idType: 'number',
    injectId: true,
  },

  // --- NPCs / Agents ---
  {
    yamlFile: 'agentTypes.yaml',
    tableName: 'eve_agent_types',
    idAttribute: 'agentTypeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'agentsInSpace.yaml',
    tableName: 'eve_agents_in_space',
    idAttribute: 'characterId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'npcCharacters.yaml',
    tableName: 'eve_npc_characters',
    idAttribute: 'characterId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'npcCorporations.yaml',
    tableName: 'eve_npc_corporations',
    idAttribute: 'corporationId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'npcCorporationDivisions.yaml',
    tableName: 'eve_npc_corporation_divisions',
    idAttribute: 'npcCorporationDivisionId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'npcStations.yaml',
    tableName: 'eve_npc_stations',
    idAttribute: 'stationId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'factions.yaml',
    tableName: 'eve_factions',
    idAttribute: 'factionId',
    idType: 'number',
    injectId: true,
  },

  // --- Character / Lore ---
  {
    yamlFile: 'races.yaml',
    tableName: 'eve_races',
    idAttribute: 'raceId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'bloodlines.yaml',
    tableName: 'eve_bloodlines',
    idAttribute: 'bloodlineId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'ancestries.yaml',
    tableName: 'eve_ancestries',
    idAttribute: 'ancestryId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'characterAttributes.yaml',
    tableName: 'eve_character_attributes',
    idAttribute: 'attributeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'characterTitles.yaml',
    tableName: 'eve_character_titles',
    idAttribute: 'characterTitleId',
    idType: 'string',
    injectId: false,
  },
  {
    yamlFile: 'cloneGrades.yaml',
    tableName: 'eve_clone_grades',
    idAttribute: 'cloneGradeId',
    idType: 'number',
    injectId: true,
  },

  // --- SKINs ---
  {
    yamlFile: 'skins.yaml',
    tableName: 'eve_skins',
    idAttribute: 'skinId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'skinLicenses.yaml',
    tableName: 'eve_skin_licenses',
    idAttribute: 'licenseTypeId',
    idType: 'number',
    injectId: false,
  },
  {
    yamlFile: 'skinMaterials.yaml',
    tableName: 'eve_skin_materials',
    idAttribute: 'skinMaterialId',
    idType: 'number',
    injectId: false,
  },

  // --- SKINR ---
  {
    yamlFile: 'skinrComponents.yaml',
    tableName: 'eve_skinr_components',
    idAttribute: 'skinrComponentId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'skinrComponentCategories.yaml',
    tableName: 'eve_skinr_component_categories',
    idAttribute: 'skinrComponentCategoryId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'skinrComponentRarities.yaml',
    tableName: 'eve_skinr_component_rarities',
    idAttribute: 'skinrComponentRarityId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'skinrComponentPointValues.yaml',
    tableName: 'eve_skinr_component_point_values',
    idAttribute: 'skinrComponentCategoryId',
    idType: 'number',
    injectId: false,
  },
  {
    yamlFile: 'skinrSlots.yaml',
    tableName: 'eve_skinr_slots',
    idAttribute: 'skinrSlotId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'skinrSlotCategories.yaml',
    tableName: 'eve_skinr_slot_categories',
    idAttribute: 'skinrSlotCategoryId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'skinrSlotConfigurations.yaml',
    tableName: 'eve_skinr_slot_configurations',
    idAttribute: 'skinrSlotConfigurationId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'skinrSlotNames.yaml',
    tableName: 'eve_skinr_slot_names',
    idAttribute: 'skinrSlotNameId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'skinrTierThresholds.yaml',
    tableName: 'eve_skinr_tier_thresholds',
    idAttribute: 'shipTreeGroupId',
    idType: 'number',
    injectId: false,
  },

  // --- Ship Tree ---
  {
    yamlFile: 'shipTreeElements.yaml',
    tableName: 'eve_ship_tree_elements',
    idAttribute: 'shipTreeElementId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'shipTreeFactions.yaml',
    tableName: 'eve_ship_tree_factions',
    idAttribute: 'factionId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'shipTreeGroups.yaml',
    tableName: 'eve_ship_tree_groups',
    idAttribute: 'shipTreeGroupId',
    idType: 'number',
    injectId: true,
  },

  // --- Graphics ---
  {
    yamlFile: 'graphics.yaml',
    tableName: 'eve_graphics',
    idAttribute: 'graphicId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'graphicMaterialSets.yaml',
    tableName: 'eve_graphic_material_sets',
    idAttribute: 'materialSetId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'icons.yaml',
    tableName: 'eve_icons',
    idAttribute: 'iconId',
    idType: 'number',
    injectId: true,
  },

  // --- Stations ---
  {
    yamlFile: 'stationOperations.yaml',
    tableName: 'eve_station_operations',
    idAttribute: 'stationOperationId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'stationServices.yaml',
    tableName: 'eve_station_services',
    idAttribute: 'stationServiceId',
    idType: 'number',
    injectId: true,
  },

  // --- Sovereignty ---
  {
    yamlFile: 'sovereigntyUpgrades.yaml',
    tableName: 'eve_sovereignty_upgrades',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },

  // --- Certificates / Masteries ---
  {
    yamlFile: 'certificates.yaml',
    tableName: 'eve_certificates',
    idAttribute: 'certificateId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'masteries.yaml',
    tableName: 'eve_masteries',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },

  // --- Misc ---
  {
    yamlFile: 'archetypes.yaml',
    tableName: 'eve_archetypes',
    idAttribute: 'archetypeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'controlTowerResources.yaml',
    tableName: 'eve_control_tower_resources',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'corporationActivities.yaml',
    tableName: 'eve_corporation_activities',
    idAttribute: 'corporationActivityId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'dbuffCollections.yaml',
    tableName: 'eve_dbuff_collections',
    idAttribute: 'dbuffCollectionId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'dungeons.yaml',
    tableName: 'eve_dungeons',
    idAttribute: 'dungeonId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'dynamicItemAttributes.yaml',
    tableName: 'eve_dynamic_item_attributes',
    idAttribute: 'dynamicItemAttributeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'epicArcs.yaml',
    tableName: 'eve_epic_arcs',
    idAttribute: 'epicArcId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'freelanceJobSchemas.yaml',
    tableName: 'eve_freelance_job_schemas',
    idAttribute: 'freelanceJobSchemaGroupId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'landmarks.yaml',
    tableName: 'eve_landmarks',
    idAttribute: 'landmarkId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'mercenaryTacticalOperations.yaml',
    tableName: 'eve_mercenary_tactical_operations',
    idAttribute: 'mercenaryTacticalOperationId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'militaryCampaigns.yaml',
    tableName: 'eve_military_campaigns',
    idAttribute: 'militaryCampaignId',
    idType: 'string',
    injectId: true,
  },
  {
    yamlFile: 'militaryCampaignObjectives.yaml',
    tableName: 'eve_military_campaign_objectives',
    idAttribute: 'militaryCampaignObjectiveId',
    idType: 'string',
    injectId: true,
  },
  {
    yamlFile: 'missions.yaml',
    tableName: 'eve_missions',
    idAttribute: 'missionId',
    idType: 'number',
    injectId: true,
  },

  // --- Translation ---
  {
    yamlFile: 'translationLanguages.yaml',
    tableName: 'eve_translation_languages',
    idAttribute: 'translationLanguageId',
    idType: 'string',
    injectId: true,
  },

  // --- Industry (extended) ---
  {
    yamlFile: 'industryActivities.yaml',
    tableName: 'eve_industry_activities',
    idAttribute: 'industryActivityId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'industryAssemblyLines.yaml',
    tableName: 'eve_industry_assembly_lines',
    idAttribute: 'assemblyLineId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'industryInstallationTypes.yaml',
    tableName: 'eve_industry_installation_types',
    idAttribute: 'installationTypeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'industryModifierSources.yaml',
    tableName: 'eve_industry_modifier_sources',
    idAttribute: 'modifierSourceId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'industryTargetFilters.yaml',
    tableName: 'eve_industry_target_filters',
    idAttribute: 'targetFilterId',
    idType: 'number',
    injectId: true,
  },

  // --- Fighters ---
  {
    yamlFile: 'fighterAbilities.yaml',
    tableName: 'eve_fighter_abilities',
    idAttribute: 'fighterAbilityId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'fighterAbilitiesByType.yaml',
    tableName: 'eve_fighter_abilities_by_type',
    idAttribute: 'typeId',
    idType: 'number',
    injectId: true,
  },

  // --- Corporation ---
  {
    yamlFile: 'corporationRoles.yaml',
    tableName: 'eve_corporation_roles',
    idAttribute: 'corporationRoleId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'corporationRoleGroups.yaml',
    tableName: 'eve_corporation_role_groups',
    idAttribute: 'corporationRoleGroupId',
    idType: 'number',
    injectId: true,
  },

  // --- Schools / Education ---
  {
    yamlFile: 'schools.yaml',
    tableName: 'eve_schools',
    idAttribute: 'schoolId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'schoolMap.yaml',
    tableName: 'eve_school_map',
    idAttribute: 'schoolMapId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'skillPlans.yaml',
    tableName: 'eve_skill_plans',
    idAttribute: 'skillPlanId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'expertSystems.yaml',
    tableName: 'eve_expert_systems',
    idAttribute: 'expertSystemId',
    idType: 'number',
    injectId: true,
  },

  // --- Notifications ---
  {
    yamlFile: 'notificationTypes.yaml',
    tableName: 'eve_notification_types',
    idAttribute: 'notificationTypeId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'accountingEntryTypes.yaml',
    tableName: 'eve_accounting_entry_types',
    idAttribute: 'accountingEntryTypeId',
    idType: 'number',
    injectId: true,
  },

  // --- Effects / Traps / Dbuffs ---
  {
    yamlFile: 'appliedProximityEffects.yaml',
    tableName: 'eve_applied_proximity_effects',
    idAttribute: 'appliedProximityEffectId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'proximityTrap.yaml',
    tableName: 'eve_proximity_traps',
    idAttribute: 'proximityTrapId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'systemDbuffEmitters.yaml',
    tableName: 'eve_system_dbuff_emitters',
    idAttribute: 'systemDbuffEmitterId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'systemWideEffects.yaml',
    tableName: 'eve_system_wide_effects',
    idAttribute: 'systemWideEffectId',
    idType: 'number',
    injectId: true,
  },
  {
    yamlFile: 'linkWithShip.yaml',
    tableName: 'eve_link_with_ship',
    idAttribute: 'linkWithShipId',
    idType: 'number',
    injectId: true,
  },

  // --- Station (extended) ---
  {
    yamlFile: 'stationStandingsRestrictions.yaml',
    tableName: 'eve_station_standings_restrictions',
    idAttribute: 'stationStandingsRestrictionId',
    idType: 'number',
    injectId: true,
  },

  // --- SKINR (extended) ---
  {
    yamlFile: 'skinrSlotsToMaterials.yaml',
    tableName: 'eve_skinr_slots_to_materials',
    idAttribute: 'skinrSlotToMaterialId',
    idType: 'number',
    injectId: true,
  },

  // --- Metenox ---
  {
    yamlFile: 'metenoxMoonDrill.yaml',
    tableName: 'eve_metenox_moon_drill',
    idAttribute: 'metenoxMoonDrillId',
    idType: 'number',
    injectId: true,
  },
] as const;
