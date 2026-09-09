# SDE API Contracts

Complete method reference for the `IStaticDataProvider` interface, organized by domain. All methods are synchronous.

## Types, Groups, Categories

| Method | Returns | Description |
|--------|---------|-------------|
| `getType(typeId)` | `EveType \| null` | Look up an item type by ID |
| `getTypesByGroup(groupId)` | `EveType[]` | All types in a group |
| `getGroup(groupId)` | `EveGroup \| null` | Look up an item group by ID |
| `getGroupsByCategory(categoryId)` | `EveGroup[]` | All groups in a category |
| `getCategory(categoryId)` | `EveCategory \| null` | Look up a category by ID |
| `getAllCategories()` | `EveCategory[]` | All categories |

## Geography

| Method | Returns | Description |
|--------|---------|-------------|
| `getRegion(regionId)` | `Region \| null` | Look up a region by ID |
| `getAllRegions()` | `Region[]` | All regions |
| `getConstellation(constellationId)` | `Constellation \| null` | Look up a constellation by ID |
| `getConstellationsByRegion(regionId)` | `Constellation[]` | Constellations in a region |
| `getSolarSystem(systemId)` | `SolarSystem \| null` | Look up a solar system by ID |
| `getSolarSystemsByConstellation(constellationId)` | `SolarSystem[]` | Systems in a constellation |
| `getStargate(stargateId)` | `Stargate \| null` | Look up a stargate by ID |
| `getStargatesBySystem(systemId)` | `Stargate[]` | Stargates in a system |

## Universe (Celestials)

| Method | Returns | Description |
|--------|---------|-------------|
| `getStar(starId)` | `Star \| null` | Look up a star by ID |
| `getStarBySystem(systemId)` | `Star \| null` | Star in a given system |
| `getPlanet(planetId)` | `Planet \| null` | Look up a planet by ID |
| `getPlanetsBySystem(systemId)` | `Planet[]` | Planets in a system |
| `getMoon(moonId)` | `Moon \| null` | Look up a moon by ID |
| `getMoonsBySystem(systemId)` | `Moon[]` | Moons in a system |
| `getAsteroidBelt(asteroidBeltId)` | `AsteroidBelt \| null` | Look up an asteroid belt by ID |
| `getAsteroidBeltsBySystem(systemId)` | `AsteroidBelt[]` | Asteroid belts in a system |

## Search

| Method | Returns | Description |
|--------|---------|-------------|
| `searchTypesByName(query, limit?)` | `EveType[]` | Case-insensitive substring search on type names |
| `searchSolarSystemsByName(query, limit?)` | `SolarSystem[]` | Case-insensitive substring search on system names |
| `searchMarketGroupsByName(query, limit?)` | `MarketGroup[]` | Search market groups by name |
| `searchDogmaAttributesByName(query, limit?)` | `DogmaAttribute[]` | Search dogma attributes by name |
| `searchDogmaEffectsByName(query, limit?)` | `DogmaEffect[]` | Search dogma effects by name |
| `searchNpcCharactersByName(query, limit?)` | `NpcCharacter[]` | Search NPC characters by name |

## Character / Lore

| Method | Returns | Description |
|--------|---------|-------------|
| `getFaction(factionId)` | `Faction \| null` | Look up a faction by ID |
| `getAllFactions()` | `Faction[]` | All factions |
| `getRace(raceId)` | `Race \| null` | Look up a race by ID |
| `getAllRaces()` | `Race[]` | All races |
| `getBloodline(bloodlineId)` | `Bloodline \| null` | Look up a bloodline by ID |
| `getBloodlinesByRace(raceId)` | `Bloodline[]` | Bloodlines for a race |
| `getAncestry(ancestryId)` | `Ancestry \| null` | Look up an ancestry by ID |
| `getAncestriesByBloodline(bloodlineId)` | `Ancestry[]` | Ancestries for a bloodline |

## NPC Infrastructure

| Method | Returns | Description |
|--------|---------|-------------|
| `getNpcCorporation(corporationId)` | `NpcCorporation \| null` | Look up an NPC corporation |
| `getNpcCorporationsByFaction(factionId)` | `NpcCorporation[]` | NPC corps in a faction |
| `getNpcStation(stationId)` | `NpcStation \| null` | Look up an NPC station |
| `getNpcStationsBySystem(systemId)` | `NpcStation[]` | Stations in a system |
| `getNpcStationsByOwner(ownerId)` | `NpcStation[]` | Stations owned by a corporation |

## Market

| Method | Returns | Description |
|--------|---------|-------------|
| `getMarketGroup(marketGroupId)` | `MarketGroup \| null` | Look up a market group |
| `getMarketGroupsByParent(parentGroupId)` | `MarketGroup[]` | Child groups of a parent |
| `getRootMarketGroups()` | `MarketGroup[]` | Top-level market groups (no parent) |
| `getTypesByMarketGroup(marketGroupId)` | `EveType[]` | Types in a market group |
| `searchMarketGroupsByName(query, limit?)` | `MarketGroup[]` | Search market groups by name |

## Meta / UI

| Method | Returns | Description |
|--------|---------|-------------|
| `getMetaGroup(metaGroupId)` | `MetaGroup \| null` | Look up a meta group (Tech I, Tech II, etc.) |
| `getAllMetaGroups()` | `MetaGroup[]` | All meta groups |
| `getIcon(iconId)` | `Icon \| null` | Look up an icon by ID |
| `getGraphic(graphicId)` | `Graphic \| null` | Look up a graphic by ID |

## Dogma

| Method | Returns | Description |
|--------|---------|-------------|
| `getDogmaAttribute(attributeId)` | `DogmaAttribute \| null` | Look up a dogma attribute |
| `searchDogmaAttributesByName(query, limit?)` | `DogmaAttribute[]` | Search attributes by name |
| `getDogmaEffect(effectId)` | `DogmaEffect \| null` | Look up a dogma effect |
| `searchDogmaEffectsByName(query, limit?)` | `DogmaEffect[]` | Search effects by name |
| `getDogmaAttributeCategory(attributeCategoryId)` | `DogmaAttributeCategory \| null` | Look up an attribute category |
| `getAllDogmaAttributeCategories()` | `DogmaAttributeCategory[]` | All attribute categories |
| `getDogmaUnit(unitId)` | `DogmaUnit \| null` | Look up a dogma unit |
| `getAllDogmaUnits()` | `DogmaUnit[]` | All dogma units |

## Industry

| Method | Returns | Description |
|--------|---------|-------------|
| `getBlueprint(blueprintTypeId)` | `Blueprint \| null` | Look up a blueprint. Activities are nested under `activities.manufacturing`, `activities.research_material`, etc. |
| `getPlanetSchematic(planetSchematicId)` | `PlanetSchematic \| null` | Look up a planet schematic |
| `getAllPlanetSchematics()` | `PlanetSchematic[]` | All planet schematics |
| `getIndustryActivity(industryActivityId)` | `IndustryActivity \| null` | Look up an industry activity type |
| `getAllIndustryActivities()` | `IndustryActivity[]` | All industry activity types |

## Agent System

| Method | Returns | Description |
|--------|---------|-------------|
| `getAgentType(agentTypeId)` | `AgentType \| null` | Look up an agent type |
| `getAllAgentTypes()` | `AgentType[]` | All agent types |
| `getAgentInSpace(characterId)` | `AgentInSpace \| null` | Look up an in-space agent |
| `getAgentsInSpaceBySystem(systemId)` | `AgentInSpace[]` | In-space agents in a system |

## Certificates

| Method | Returns | Description |
|--------|---------|-------------|
| `getCertificate(certificateId)` | `Certificate \| null` | Look up a certificate |
| `getAllCertificates()` | `Certificate[]` | All certificates |

## Character Attributes

| Method | Returns | Description |
|--------|---------|-------------|
| `getCharacterAttribute(attributeId)` | `CharacterAttribute \| null` | Look up a character attribute (perception, willpower, etc.) |
| `getAllCharacterAttributes()` | `CharacterAttribute[]` | All character attributes |

## NPC Characters

| Method | Returns | Description |
|--------|---------|-------------|
| `getNpcCharacter(characterId)` | `NpcCharacter \| null` | Look up an NPC character |
| `getNpcCharactersByCorporation(corporationId)` | `NpcCharacter[]` | NPC characters in a corporation |
| `searchNpcCharactersByName(query, limit?)` | `NpcCharacter[]` | Search NPC characters by name |

## Clone Grades

| Method | Returns | Description |
|--------|---------|-------------|
| `getCloneGrade(cloneGradeId)` | `CloneGrade \| null` | Look up a clone grade |
| `getAllCloneGrades()` | `CloneGrade[]` | All clone grades |

## Corporation Reference

| Method | Returns | Description |
|--------|---------|-------------|
| `getCorporationActivity(corporationActivityId)` | `CorporationActivity \| null` | Look up a corporation activity type |
| `getAllCorporationActivities()` | `CorporationActivity[]` | All corporation activities |
| `getNpcCorporationDivision(npcCorporationDivisionId)` | `NpcCorporationDivision \| null` | Look up a corporation division |
| `getAllNpcCorporationDivisions()` | `NpcCorporationDivision[]` | All corporation divisions |

## Landmarks

| Method | Returns | Description |
|--------|---------|-------------|
| `getLandmark(landmarkId)` | `Landmark \| null` | Look up a landmark |
| `getAllLandmarks()` | `Landmark[]` | All landmarks |

## Notifications

| Method | Returns | Description |
|--------|---------|-------------|
| `getNotificationType(notificationTypeId)` | `NotificationType \| null` | Look up a notification type |

## Schools

| Method | Returns | Description |
|--------|---------|-------------|
| `getSchool(schoolId)` | `School \| null` | Look up a school |
| `getAllSchools()` | `School[]` | All schools |

## Secondary Suns

| Method | Returns | Description |
|--------|---------|-------------|
| `getSecondarySun(secondarySunId)` | `SecondarySun \| null` | Look up a secondary sun |
| `getSecondarySunsBySystem(systemId)` | `SecondarySun[]` | Secondary suns in a system |

## Skins

| Method | Returns | Description |
|--------|---------|-------------|
| `getSkin(skinId)` | `Skin \| null` | Look up a SKIN |
| `getSkinLicense(licenseTypeId)` | `SkinLicense \| null` | Look up a SKIN license |
| `getSkinLicensesBySkin(skinId)` | `SkinLicense[]` | Licenses for a given SKIN |

## Station Operations & Services

| Method | Returns | Description |
|--------|---------|-------------|
| `getStationOperation(stationOperationId)` | `StationOperation \| null` | Look up a station operation type |
| `getAllStationOperations()` | `StationOperation[]` | All station operations |
| `getStationService(stationServiceId)` | `StationService \| null` | Look up a station service |
| `getAllStationServices()` | `StationService[]` | All station services |

## Type Extensions

| Method | Returns | Description |
|--------|---------|-------------|
| `getTypeDogma(typeId)` | `TypeDogma \| null` | Dogma attributes and effects for a type |
| `getTypeMaterial(typeId)` | `TypeMaterial \| null` | Reprocessing materials for a type |
| `getTypeBonus(typeId)` | `TypeBonus \| null` | Bonuses for a type |

## Missions & Content

| Method | Returns | Description |
|--------|---------|-------------|
| `getMission(missionId)` | `Mission \| null` | Look up a mission |
| `getDungeon(dungeonId)` | `Dungeon \| null` | Look up a dungeon |
| `getEpicArc(epicArcId)` | `EpicArc \| null` | Look up an epic arc |
| `getAllEpicArcs()` | `EpicArc[]` | All epic arcs |

## Generic Accessors

For entities without dedicated methods, or for dynamic table access:

| Method | Returns | Description |
|--------|---------|-------------|
| `getEntity<T>(tableName, id)` | `T \| null` | Look up any entity by table name and ID |
| `getAllEntities<T>(tableName)` | `T[]` | All entities in a table |

Table names follow the convention `eve_<snake_case_entity>`. Examples:

| Table Name | Entity Type |
|------------|-------------|
| `eve_types` | `EveType` |
| `eve_groups` | `EveGroup` |
| `eve_solar_systems` | `SolarSystem` |
| `eve_blueprints` | `Blueprint` |
| `eve_dogma_attributes` | `DogmaAttribute` |
| `eve_skins` | `Skin` |
| `eve_archetypes` | `Archetype` |
| `eve_epic_arcs` | `EpicArc` |

## Version & Lifecycle

| Method | Returns | Description |
|--------|---------|-------------|
| `getVersion()` | `SdeVersionInfo` | SDE build number, build date, and import timestamp |
| `close()` | `void` | Release all in-memory data |

### SdeVersionInfo

```ts
interface SdeVersionInfo {
  version: string;     // SDE build number (e.g., "2025-09-15.1")
  buildDate: string;   // CCP release date
  importedAt: string;  // ISO timestamp when data was loaded
  checksum?: string;   // Optional integrity hash
}
```
