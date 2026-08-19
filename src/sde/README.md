# SDE Module

Typed, in-memory query layer for the EVE Online Static Data Export (SDE). Reads CCP's YAML files directly from disk into `Map` structures -- no SQLite, no database, no external services. All 102 SDE YAML files are supported, producing 109 strongly-typed entity interfaces with Zod validation schemas.

## Quick Start

### 1. Download SDE data

```bash
npx ts-node scripts/sde-ingest.ts --output sde-data
```

This downloads the latest SDE ZIP from CCP (~200 MB), extracts all YAML files to `./sde-data/`, and removes the ZIP. The `sde-data/` directory is gitignored.

### 2. Create a provider and query

```typescript
import { SdeDataProvider } from '@lgriffin/esi.ts/sde';

const sde = SdeDataProvider.fromDirectory('./sde-data');

const tritanium = sde.getType(34);
console.log(tritanium?.name); // "Tritanium"
console.log(tritanium?.published); // true

const jita = sde.getSolarSystem(30000142);
console.log(jita?.name); // "Jita"
console.log(jita?.securityStatus); // 0.9459...

const minerals = sde.getTypesByGroup(18);
console.log(minerals.map((t) => t.name));
// ["Tritanium", "Pyerite", "Mexallon", ...]

sde.close();
```

You can also load directly from a ZIP without extracting first:

```typescript
const sde = SdeDataProvider.fromZip('./eve-online-static-data-latest-yaml.zip');
```

## Architecture

### Data Flow

```
CCP SDE ZIP
    |
    v
scripts/sde-ingest.ts      Download + extract YAML to disk
    |
    v
SdeDataProvider.fromDirectory(path)
    |
    +-- Reads _sde.yaml for build metadata
    +-- Iterates SDE_FILE_REGISTRY (102 entries)
    +-- For each YAML file:
    |     1. yaml.load() -> raw records
    |     2. transformRecordNative() -> normalize fields + extract locales
    |     3. Store in Map<id, record>
    |
    v
In-memory Maps
    |
    +-- getById<T>(tableName, id)     O(1) lookup
    +-- getByFk<T>(tableName, fk, v)  Lazy-built FK index, then O(1)
    +-- filterBy<T>(tableName, pred)  Linear scan
    +-- searchBy<T>(tableName, field) Case-insensitive substring match
```

### Key Design Decisions

**YAML-native, no database.** All data lives in `Map<string, Map<number|string, Record<string, unknown>>>`. The outer map is keyed by table name (e.g., `eve_types`), the inner map by entity primary key. This trades memory (~500 MB at peak) for zero external dependencies and instant startup queries.

**Field normalization.** CCP uses `groupID`, `solarSystemID`; we normalize to `groupId`, `solarSystemId` via regex `/ID(?=[A-Z]|$)/g`. This applies recursively to nested objects (e.g., stargate `destination.solarSystemId`).

**Locale extraction.** CCP YAML encodes localized strings as `{en: "Tritanium", de: "Tritanium"}`. The transform extracts the `en` value into a plain string.

**Lazy FK indexing.** Foreign key indexes are built on first query. Calling `getTypesByGroup(18)` the first time scans all types to build a `groupId -> type[]` index; subsequent calls hit the index directly.

**`z.looseObject()` schemas.** All Zod schemas use `z.looseObject({})` so extra fields from the SDE are preserved, not stripped. This prevents data loss when CCP adds new fields between SDE releases.

### File Structure

```
src/sde/
  index.ts                    Barrel exports
  IStaticDataProvider.ts      Provider interface (~97 methods)
  SdeDataProvider.ts          YAML-backed provider (fromDirectory / fromZip)
  MemorySdeProvider.ts        Array-backed provider for testing
  SdeTestDataFactory.ts       Test data factory with realistic defaults
  types.ts                    109 entity interfaces
  schemas.ts                  110 Zod validation schemas
  version.ts                  SdeVersionInfo type
  errors.ts                   SdeError hierarchy
  ingestion/
    constants.ts              SDE_FILE_REGISTRY (102 file specs)
    transforms.ts             Field normalization + locale extraction
    SdeDownloader.ts          HTTP download with progress callback
    SdeExtractor.ts           ZIP parsing (adm-zip + js-yaml)
  docs/
    ARCHITECTURE.md
    DEVELOPER_GUIDE.md
    USAGE.md
```

## API Reference

All methods are defined on `IStaticDataProvider`. Single-entity lookups return `T | null`. Collection lookups return `T[]` (empty if none found). Search methods accept an optional `limit` parameter.

### Types, Groups, Categories

```typescript
getType(typeId: number): EveType | null
getTypesByGroup(groupId: number): EveType[]
getGroup(groupId: number): EveGroup | null
getGroupsByCategory(categoryId: number): EveGroup[]
getCategory(categoryId: number): EveCategory | null
getAllCategories(): EveCategory[]
searchTypesByName(query: string, limit?: number): EveType[]
```

### Geography

```typescript
getRegion(regionId: number): Region | null
getAllRegions(): Region[]
getConstellation(constellationId: number): Constellation | null
getConstellationsByRegion(regionId: number): Constellation[]
getSolarSystem(systemId: number): SolarSystem | null
getSolarSystemsByConstellation(constellationId: number): SolarSystem[]
getStargate(stargateId: number): Stargate | null
getStargatesBySystem(systemId: number): Stargate[]
searchSolarSystemsByName(query: string, limit?: number): SolarSystem[]
```

### Universe (Stars, Planets, Moons, Belts)

```typescript
getStar(starId: number): Star | null
getStarBySystem(systemId: number): Star | null
getPlanet(planetId: number): Planet | null
getPlanetsBySystem(systemId: number): Planet[]
getMoon(moonId: number): Moon | null
getMoonsBySystem(systemId: number): Moon[]
getAsteroidBelt(asteroidBeltId: number): AsteroidBelt | null
getAsteroidBeltsBySystem(systemId: number): AsteroidBelt[]
getSecondarySun(secondarySunId: number): SecondarySun | null
getSecondarySunsBySystem(systemId: number): SecondarySun[]
getLandmark(landmarkId: number): Landmark | null
getAllLandmarks(): Landmark[]
```

### Character and Lore

```typescript
getFaction(factionId: number): Faction | null
getAllFactions(): Faction[]
getRace(raceId: number): Race | null
getAllRaces(): Race[]
getBloodline(bloodlineId: number): Bloodline | null
getBloodlinesByRace(raceId: number): Bloodline[]
getAncestry(ancestryId: number): Ancestry | null
getAncestriesByBloodline(bloodlineId: number): Ancestry[]
getCharacterAttribute(attributeId: number): CharacterAttribute | null
getAllCharacterAttributes(): CharacterAttribute[]
getCloneGrade(cloneGradeId: number): CloneGrade | null
getAllCloneGrades(): CloneGrade[]
getSchool(schoolId: number): School | null
getAllSchools(): School[]
```

### NPC Infrastructure

```typescript
getNpcCorporation(corporationId: number): NpcCorporation | null
getNpcCorporationsByFaction(factionId: number): NpcCorporation[]
getNpcStation(stationId: number): NpcStation | null
getNpcStationsBySystem(systemId: number): NpcStation[]
getNpcStationsByOwner(ownerId: number): NpcStation[]
getNpcCharacter(characterId: number): NpcCharacter | null
getNpcCharactersByCorporation(corporationId: number): NpcCharacter[]
searchNpcCharactersByName(query: string, limit?: number): NpcCharacter[]
getCorporationActivity(corporationActivityId: number): CorporationActivity | null
getAllCorporationActivities(): CorporationActivity[]
getNpcCorporationDivision(npcCorporationDivisionId: number): NpcCorporationDivision | null
getAllNpcCorporationDivisions(): NpcCorporationDivision[]
```

### Market

```typescript
getMarketGroup(marketGroupId: number): MarketGroup | null
getMarketGroupsByParent(parentGroupId: number): MarketGroup[]
getRootMarketGroups(): MarketGroup[]
getTypesByMarketGroup(marketGroupId: number): EveType[]
searchMarketGroupsByName(query: string, limit?: number): MarketGroup[]
```

### Meta and UI

```typescript
getMetaGroup(metaGroupId: number): MetaGroup | null
getAllMetaGroups(): MetaGroup[]
getIcon(iconId: number): Icon | null
getGraphic(graphicId: number): Graphic | null
```

### Dogma

```typescript
getDogmaAttribute(attributeId: number): DogmaAttribute | null
searchDogmaAttributesByName(query: string, limit?: number): DogmaAttribute[]
getDogmaEffect(effectId: number): DogmaEffect | null
searchDogmaEffectsByName(query: string, limit?: number): DogmaEffect[]
getDogmaAttributeCategory(attributeCategoryId: number): DogmaAttributeCategory | null
getAllDogmaAttributeCategories(): DogmaAttributeCategory[]
getDogmaUnit(unitId: number): DogmaUnit | null
getAllDogmaUnits(): DogmaUnit[]
```

### Industry

```typescript
getBlueprint(blueprintTypeId: number): Blueprint | null
getPlanetSchematic(planetSchematicId: number): PlanetSchematic | null
getAllPlanetSchematics(): PlanetSchematic[]
getIndustryActivity(industryActivityId: number): IndustryActivity | null
getAllIndustryActivities(): IndustryActivity[]
```

### Agent System

```typescript
getAgentType(agentTypeId: number): AgentType | null
getAllAgentTypes(): AgentType[]
getAgentInSpace(characterId: number): AgentInSpace | null
getAgentsInSpaceBySystem(systemId: number): AgentInSpace[]
```

### Certificates

```typescript
getCertificate(certificateId: number): Certificate | null
getAllCertificates(): Certificate[]
```

### Skins

```typescript
getSkin(skinId: number): Skin | null
getSkinLicense(licenseTypeId: number): SkinLicense | null
getSkinLicensesBySkin(skinId: number): SkinLicense[]
```

### Station Operations and Services

```typescript
getStationOperation(stationOperationId: number): StationOperation | null
getAllStationOperations(): StationOperation[]
getStationService(stationServiceId: number): StationService | null
getAllStationServices(): StationService[]
```

### Type Extensions

```typescript
getTypeDogma(typeId: number): TypeDogma | null
getTypeMaterial(typeId: number): TypeMaterial | null
getTypeBonus(typeId: number): TypeBonus | null
```

### Missions and Content

```typescript
getMission(missionId: number): Mission | null
getDungeon(dungeonId: number): Dungeon | null
getEpicArc(epicArcId: number): EpicArc | null
getAllEpicArcs(): EpicArc[]
```

### Notifications

```typescript
getNotificationType(notificationTypeId: number): NotificationType | null
```

### Generic Accessors

For entity types without dedicated methods, or for dynamic access:

```typescript
getEntity<T>(tableName: string, id: number | string): T | null
getAllEntities<T>(tableName: string): T[]
```

Table names follow the pattern `eve_<entity>` (e.g., `eve_types`, `eve_solar_systems`, `eve_blueprints`). See `SDE_FILE_REGISTRY` in `src/sde/ingestion/constants.ts` for the full list.

### Version and Lifecycle

```typescript
getVersion(): SdeVersionInfo    // { version, buildDate, importedAt }
close(): void                   // No-op for YAML provider; present for interface compat
```

## Testing

The module uses a three-layer testing pyramid.

### Unit Tests (288 tests, ~1s)

```bash
npm test -- tests/tdd/sde/
```

Covers schemas, test data factory, `MemorySdeProvider`, `SdeDataProvider` internals, ingestion transforms, extractor, and downloader. Uses `MemorySdeProvider` with `SdeTestDataFactory` -- no real SDE data required.

Test files:

- `schemas.test.ts` -- Zod schema validation, nullable fields, extra-field preservation, rejection
- `SdeTestDataFactory.test.ts` -- factory defaults, overrides, hierarchical data
- `IStaticDataProvider.contract.test.ts` -- provider contract (get by ID, FK queries, null returns)
- `MemorySdeProvider.test.ts` -- empty state, search, filtering
- `SdeDataProvider.test.ts` -- loading, transform integration
- `transforms.test.ts` -- field normalization, locale extraction, nested normalization
- `SdeExtractor.test.ts` -- ZIP parsing
- `SdeDownloader.test.ts` -- HTTP mocking

### BDD Tests (23 tests, ~1s)

```bash
npm test -- tests/bdd/step-definitions/sde/
```

Feature files in `tests/bdd/features/sde/`:

- `static-data-lookup.feature` -- type lookup, search, hierarchy navigation, stargates
- `sde-universe-hierarchy.feature` -- stars, planets, moons, asteroid belts
- `sde-character-lore.feature` -- factions, races, bloodlines, NPC stations
- `sde-dogma-industry.feature` -- dogma attributes, blueprints, planet schematics

### Integration Tests (63 tests, ~60s)

```bash
npx jest --config jest.integration.config.cjs -- tests/integration/sde/
```

Requires `sde-data/` to be populated. Tests against real CCP data:

- Well-known entity lookups (Tritanium, Jita, The Forge, Caldari State)
- Minimum row count validation (40K+ types, 8K+ systems, 200K+ moons)
- Universe hierarchy traversal (star/planet/moon/stargate relationships)
- Cross-entity referential integrity (types->groups->categories, constellations->regions)
- FK query methods (getTypesByGroup, getConstellationsByRegion, getRootMarketGroups)
- Name search (types, systems, market groups, dogma attributes)
- Blueprint activity structure
- Data quality checks (published types have names, valid security ranges, market group tree integrity)
- Version metadata

## Examples

| File                              | Description                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| `examples/sde-basic-lookup.ts`    | Type/group/category hierarchy, geography navigation, star/stargate traversal, search |
| `examples/sde-cross-reference.ts` | SDE static data combined with live ESI market API calls                              |
| `examples/sde-market-tree.ts`     | Recursive market group hierarchy walker with type counts                             |
| `examples/sde-fitting.ts`         | Ship type + dogma attribute lookup for fitting stats                                 |
| `examples/sde-industry.ts`        | Blueprint manufacturing requirements with material name resolution                   |

Run any example:

```bash
npx ts-node examples/sde-basic-lookup.ts
```

## Entity Coverage

The module covers all 102 SDE YAML files. Major entity groups:

| Domain             | Entities | Key Types                                                                                                       |
| ------------------ | -------- | --------------------------------------------------------------------------------------------------------------- |
| Types and Items    | 8        | `EveType`, `EveGroup`, `EveCategory`, `MetaGroup`, `TypeDogma`, `TypeMaterial`, `TypeBonus`, `CompressibleType` |
| Geography          | 8        | `Region`, `Constellation`, `SolarSystem`, `Stargate`, `Star`, `Planet`, `Moon`, `AsteroidBelt`                  |
| Character and Lore | 8        | `Faction`, `Race`, `Bloodline`, `Ancestry`, `CharacterAttribute`, `CloneGrade`, `School`, `SchoolMap`           |
| NPC                | 6        | `NpcCorporation`, `NpcStation`, `NpcCharacter`, `NpcCorporationDivision`, `CorporationActivity`, `AgentInSpace` |
| Dogma              | 5        | `DogmaAttribute`, `DogmaEffect`, `DogmaAttributeCategory`, `DogmaUnit`, `DynamicItemAttribute`                  |
| Industry           | 5        | `Blueprint`, `PlanetSchematic`, `IndustryActivity`, `IndustryAssemblyLine`, `IndustryInstallationType`          |
| Market             | 2        | `MarketGroup`, `ContrabandType`                                                                                 |
| Skins              | 12       | `Skin`, `SkinLicense`, `SkinMaterial`, `SkinrComponent`, `SkinrSlot`, and related                               |
| Stations           | 4        | `StationOperation`, `StationService`, `StationStandingsRestriction`, `SovereigntyUpgrade`                       |
| Content            | 5        | `Mission`, `Dungeon`, `EpicArc`, `Certificate`, `Landmark`                                                      |
| Miscellaneous      | 46       | `Icon`, `Graphic`, `NotificationType`, `TranslationLanguage`, `SkillPlan`, and more                             |

All 109 interfaces are exported from `src/sde/index.ts` and have corresponding Zod schemas in `src/sde/schemas.ts`.

## SDE Ingestion CLI

```bash
npx ts-node scripts/sde-ingest.ts [options]

Options:
  --output, -o   Output directory (default: ./sde-data)
  --check        Check latest SDE build version without downloading
  --force        Re-download even if data already exists
  --verbose      Show detailed progress
```

The script downloads from `https://developers.eveonline.com/static-data/eve-online-static-data-latest-yaml.zip`, extracts all YAML files, and cleans up the ZIP. The output directory is gitignored and must be re-created locally.

## CCP SDE Data Notes

- Post-September 2025 format: all YAML files flat at ZIP root, no subdirectories
- Localization: names encoded as `{en: "...", de: "...", ...}` -- the module extracts the `en` locale
- Field naming: CCP uses `groupID`, `solarSystemID`; the module normalizes to `groupId`, `solarSystemId`
- Nested objects (e.g., stargate destinations) are recursively normalized
- Some entities (stars, planets, moons) have no `name` field -- they are identified by ID and system relationship
- Stargates use a `destination: { solarSystemId, stargateId }` object
- Factions use `memberRaces: number[]` (not `raceIds`)
- NPC stations use `ownerId` (not `corporationId`) and have no `name` or `security` fields
- Blueprint activities are nested under `activities: { manufacturing?, research_material?, copying?, invention? }`
