# SDE Module

Typed, in-memory query layer for the EVE Online Static Data Export (SDE). Reads CCP's YAML files directly from disk into `Map` structures -- no SQLite, no database, no external services. All 102 SDE YAML files are supported, producing 109 strongly-typed entity interfaces with Zod validation schemas.

How the module sits next to the ESI client, with C4 diagrams and the isolation rule, is in [guides/SDE.md](../../guides/SDE.md).

## Quick Start

### Install the optional peer dependencies

`SdeDataProvider` reads CCP's files with two packages that are optional peer dependencies of `@lgriffin/esi.ts`, so they are not installed with it:

| Package   | Needed by                                                    | Install               |
| --------- | ------------------------------------------------------------ | --------------------- |
| `js-yaml` | `SdeDataProvider.fromDirectory` and `fromZip` (YAML parsing) | `npm install js-yaml` |
| `adm-zip` | `SdeDataProvider.fromZip` (ZIP reading)                      | `npm install adm-zip` |

Importing `@lgriffin/esi.ts/sde` does not load either package, and `MemorySdeProvider` (also available from `@lgriffin/esi.ts/sde/memory`) never needs them. They are loaded the first time a YAML file or a ZIP archive is read; if one is missing, that call throws an `SdeError` such as:

```
js-yaml is required to parse SDE YAML files. It is an optional peer dependency of @lgriffin/esi.ts; install it with: npm install js-yaml
```

### 1. Download SDE data

```bash
npx ts-node scripts/sde/sde-ingest.ts --output sde-data
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
scripts/sde/sde-ingest.ts      Download + extract YAML to disk
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

**YAML-native, no database.** All data lives in `Map<string, Map<number|string, Record<string, unknown>>>`. The outer map is keyed by table name (e.g., `eve_types`), the inner map by entity primary key. This trades memory for zero external dependencies and instant startup queries. What it costs is measured, not estimated: on the generated 50,000-type benchmark set the loaded heap is 64 MiB after a full collection (RSS 348 MiB, load 0.7 s, Node 22), and every night `nightly-sde.yml` loads CCP's current export and publishes the same table for that build (load time, heap and RSS after load, peak heap over 100,000 lookups, heap after `close()`) in its step summary; `npm run soak -- --sde --dir sde-data` prints it for an export on disk.

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
  optionalPeers.ts            Lazy loading of js-yaml and adm-zip (optional peers)
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

<!-- doc-example: no-check method signature listing, not a statement -->

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

<!-- doc-example: no-check method signature listing, not a statement -->

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

<!-- doc-example: no-check method signature listing, not a statement -->

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

<!-- doc-example: no-check method signature listing, not a statement -->

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

<!-- doc-example: no-check method signature listing, not a statement -->

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

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getMarketGroup(marketGroupId: number): MarketGroup | null
getMarketGroupsByParent(parentGroupId: number): MarketGroup[]
getRootMarketGroups(): MarketGroup[]
getTypesByMarketGroup(marketGroupId: number): EveType[]
searchMarketGroupsByName(query: string, limit?: number): MarketGroup[]
```

### Meta and UI

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getMetaGroup(metaGroupId: number): MetaGroup | null
getAllMetaGroups(): MetaGroup[]
getIcon(iconId: number): Icon | null
getGraphic(graphicId: number): Graphic | null
```

### Dogma

<!-- doc-example: no-check method signature listing, not a statement -->

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

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getBlueprint(blueprintTypeId: number): Blueprint | null
getPlanetSchematic(planetSchematicId: number): PlanetSchematic | null
getAllPlanetSchematics(): PlanetSchematic[]
getIndustryActivity(industryActivityId: number): IndustryActivity | null
getAllIndustryActivities(): IndustryActivity[]
```

### Agent System

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getAgentType(agentTypeId: number): AgentType | null
getAllAgentTypes(): AgentType[]
getAgentInSpace(characterId: number): AgentInSpace | null
getAgentsInSpaceBySystem(systemId: number): AgentInSpace[]
```

### Certificates

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getCertificate(certificateId: number): Certificate | null
getAllCertificates(): Certificate[]
```

### Skins

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getSkin(skinId: number): Skin | null
getSkinLicense(licenseTypeId: number): SkinLicense | null
getSkinLicensesBySkin(skinId: number): SkinLicense[]
```

### Station Operations and Services

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getStationOperation(stationOperationId: number): StationOperation | null
getAllStationOperations(): StationOperation[]
getStationService(stationServiceId: number): StationService | null
getAllStationServices(): StationService[]
```

### Type Extensions

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getTypeDogma(typeId: number): TypeDogma | null
getTypeMaterial(typeId: number): TypeMaterial | null
getTypeBonus(typeId: number): TypeBonus | null
```

### Missions and Content

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getMission(missionId: number): Mission | null
getDungeon(dungeonId: number): Dungeon | null
getEpicArc(epicArcId: number): EpicArc | null
getAllEpicArcs(): EpicArc[]
```

### Notifications

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getNotificationType(notificationTypeId: number): NotificationType | null
```

### Generic Accessors

For entity types without dedicated methods, or for dynamic access:

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getEntity<T>(tableName: string, id: number | string): T | null
getAllEntities<T>(tableName: string): T[]
```

Table names follow the pattern `eve_<entity>` (e.g., `eve_types`, `eve_solar_systems`, `eve_blueprints`). See `SDE_FILE_REGISTRY` in `src/sde/ingestion/constants.ts` for the full list.

### Version and Lifecycle

<!-- doc-example: no-check method signature listing, not a statement -->

```typescript
getVersion(): SdeVersionInfo    // { version, buildDate, importedAt }
close(): void                   // No-op for YAML provider; present for interface compat
```

## Testing

The module uses a four-layer testing pyramid.

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

### Property Tests (3 suites, ~10s)

```bash
npm run fuzz -- --testPathPatterns sde-
```

fast-check properties in `tests/fuzz/`, 100 runs each on a pull request and 10,000 in `nightly-properties.yml` (`npm run fuzz:properties` selects all three) (`FC_NUM_RUNS`, `FC_SEED` and `FC_PATH` replay a failure, see `tests/fuzz/AGENTS.md`):

- `sde-transforms.property.test.ts` -- field-name normalisation is idempotent and reversible on the `ID` suffix; locale extraction always yields a string; record transforms rename keys and extract locale maps at any depth and flatten to SQLite values; metadata reads the nested `sde:` block first
- `sde-provider-model.property.test.ts` -- a generated, internally consistent data set (a controlled fraction of foreign keys dangling) loaded into `MemorySdeProvider`, and into `SdeDataProvider` from a directory, answers every lookup as a naive oracle over the same arrays, lazily built foreign-key indexes included
- `sde-schema-fuzz.test.ts` -- a record generated from each zod schema round-trips through `parse` with an extra field kept, and is rejected once a required key is removed

Every model-based property fails against registered known-bad providers and transforms (a dropped record, an ignored limit, an off-by-one ID, a stale foreign-key index), so a property that could not catch a defect cannot load.

### BDD Tests (188 scenarios, ~3s)

```bash
npm run bdd:sde
```

Feature files in `tests/bdd/features/sde/`, one EARS requirement per `Rule:`:

- `0001-static-data-lookup.feature` -- type lookup, search, hierarchy navigation, stargates
- `0002-sde-universe-hierarchy.feature` -- stars, planets, moons, asteroid belts by system
- `0003-sde-market-hierarchy.feature` -- root market groups and children
- `0004-sde-dogma-industry.feature` -- dogma attributes, blueprints, planet schematics
- `0005-sde-character-lore.feature` -- factions, races, bloodlines, NPC stations
- `0006-sde-version-management.feature`, `0007-sde-error-handling.feature`
- `0008-sde-type-classification.feature` -- types of a group, groups of a category, every category
- `0009-sde-universe-geography.feature` -- regions, constellations, systems and stargates by ID, system search
- `0010-sde-celestial-bodies.feature` -- stars, planets, moons, asteroid belts by their own ID
- `0011-sde-market-groups.feature` -- market group by ID, its types, group search
- `0012-sde-dogma-definitions.feature` -- effects, attribute categories, units, attribute and effect search
- `0013-sde-character-reference.feature` -- factions and races whole, bloodline and ancestry by ID, character attributes, clone grades, schools
- `0014-sde-npc-organisations.feature` -- NPC corporations, stations by system and owner, NPC characters and their search, activities, divisions, agents
- `0015-sde-presentation-tables.feature` -- meta groups, icons, graphics, skins and licences, notification types
- `0016-sde-universe-reference.feature` -- landmarks, secondary suns, station operations and services
- `0017-sde-industry-reference.feature` -- schematics whole, industry activities, certificates, type dogma, materials and bonuses
- `0018-sde-mission-content.feature` -- missions, dungeons, epic arcs
- `0019-sde-generic-access.feature` -- `getEntity` and `getAllEntities` by table name
- `0020-sde-loading.feature` -- `fromDirectory` and `fromZip`: the version record, locale and ID-suffix reshaping, foreign-key lookups, missing paths, `close`
- `0021-sde-optional-peers.feature` -- the `SdeError` raised when js-yaml or adm-zip is not installed
- `0022-sde-memory-entry.feature` -- `./sde/memory` exports everything `./sde` does except `SdeDataProvider`
- `0023-sde-ingestion.feature` -- downloader, extractor, database builder and the transforms, with the network answered at the transport seam

`npm run spec:coverage:sde` lists the provider methods no Rule names and no
bound step reaches; `scripts/sde/sde-spec-coverage-baseline.json` holds that
list and may only shrink.

### Integration Tests (63 tests, ~60s)

```bash
npx jest --config config/jest/integration.config.cjs -- tests/integration/sde/
```

Requires `sde-data/` (or `SDE_DATA_PATH`) to be populated; skips otherwise, or fails with `SDE_REQUIRE_DATA=1`, which is how `nightly-sde.yml` runs it every night against CCP's current export. Tests against real CCP data:

- Well-known entity lookups (Tritanium, Jita, The Forge, Caldari State)
- Minimum row count validation (40K+ types, 8K+ systems, 200K+ moons)
- Universe hierarchy traversal (star/planet/moon/stargate relationships)
- Cross-entity referential integrity (types->groups->categories, constellations->regions)
- FK query methods (getTypesByGroup, getConstellationsByRegion, getRootMarketGroups)
- Name search (types, systems, market groups, dogma attributes)
- Blueprint activity structure
- Data quality checks (published types have names, valid security ranges, market group tree integrity)
- Version metadata
- One table per entity family, through the generic accessor and the family's own lookup

## Examples

| File                           | Description                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `examples/sde-basic-lookup.ts` | Type/group/category hierarchy, geography navigation, star/stargate traversal, search |
| `examples/sde-market-tree.ts`  | Recursive market group hierarchy walker with type counts                             |
| `examples/sde-fitting.ts`      | Ship type + dogma attribute lookup for fitting stats                                 |
| `examples/sde-industry.ts`     | Blueprint manufacturing requirements with material name resolution                   |

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
npx ts-node scripts/sde/sde-ingest.ts [options]

Options:
  --output, -o   Output directory (default: ./sde-data)
  --check        Check latest SDE build version without downloading
  --force        Re-download even if data already exists
  --verbose      Show detailed progress
  --from-zip <f> Extract an archive already on disk instead of downloading
  --keep-zip     Leave the downloaded archive next to the output directory
```

The script downloads from `https://developers.eveonline.com/static-data/eve-online-static-data-latest-yaml.zip`, extracts all YAML files, and cleans up the ZIP. The output directory is gitignored and must be re-created locally.

`npm run sde:drift` compares an extracted export with what this module knows: the file list against `SDE_FILE_REGISTRY`, and each registered file's record keys against the table's Zod schema. It writes `reports/sde-drift.json` and exits 1 on drift; `nightly-sde.yml` runs it against CCP's current build every night and keeps one issue open while the export and the module disagree.

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
