# Static Data Export (SDE) Module

ESI.ts includes a standalone module for querying CCP's EVE Online Static Data Export — 102 YAML files loaded into in-memory Maps with 109 typed interfaces, Zod validation, and ~97 query methods. No database, no external services.

## Quick Start

### 1. Download SDE Data

```bash
npx ts-node scripts/sde-ingest.ts --output sde-data
```

This downloads the latest SDE ZIP from CCP (~200 MB), extracts all YAML files to `./sde-data/`, and removes the ZIP. The `sde-data/` directory is gitignored.

### 2. Create a Provider and Query

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

## Providers

### SdeDataProvider (Primary)

The primary provider, backed by in-memory Maps from parsed YAML files:

```typescript
import { SdeDataProvider } from '@lgriffin/esi.ts/sde';

// From extracted YAML directory
const sde = SdeDataProvider.fromDirectory('./sde-data');

// From ZIP file directly
const sde2 = SdeDataProvider.fromZip(
  './eve-online-static-data-latest-yaml.zip',
);
```

### MemorySdeProvider

In-memory provider for testing or small datasets — accepts pre-built arrays:

```typescript
import { MemorySdeProvider } from '@lgriffin/esi.ts/sde/memory';
const sde = new MemorySdeProvider(yamlData);
```

### SdeTestDataFactory

Generates realistic test data without requiring real SDE files:

```typescript
import { SdeTestDataFactory } from '@lgriffin/esi.ts/sde';

const factory = new SdeTestDataFactory();
const type = factory.createType({ name: 'Test Item', groupId: 18 });
const system = factory.createSolarSystem({ name: 'Test System' });
```

## Architecture

### Data Flow

```
CCP SDE ZIP (~200 MB)
    ↓
scripts/sde-ingest.ts         Download + extract YAML to disk
    ↓
SdeDataProvider.fromDirectory(path)
    ↓
    ├── Reads _sde.yaml for build metadata
    ├── Iterates SDE_FILE_REGISTRY (102 entries)
    └── For each YAML file:
          1. yaml.load() → raw records
          2. transformRecordNative() → normalize fields + extract locales
          3. Store in Map<id, record>
    ↓
In-memory Maps
    ├── getById<T>(tableName, id)      O(1) lookup
    ├── getByFk<T>(tableName, fk, v)   Lazy-built FK index, then O(1)
    ├── filterBy<T>(tableName, pred)    Linear scan
    └── searchBy<T>(tableName, field)   Case-insensitive substring match
```

### Key Design Decisions

- **YAML-native, no database.** All data lives in `Map<string, Map<number|string, Record>>`. Trades memory (~500 MB at peak) for zero external dependencies and instant queries.
- **Field normalization.** CCP uses `groupID`, `solarSystemID`; the module normalizes to `groupId`, `solarSystemId` via regex, applied recursively to nested objects.
- **Locale extraction.** CCP YAML encodes localized strings as `{en: "Tritanium", de: "Tritanium"}`. The transform extracts the `en` value into a plain string.
- **Lazy FK indexing.** Foreign key indexes are built on first query, then reused. First call scans; subsequent calls hit the index directly.
- **`z.looseObject()` schemas.** Extra fields from the SDE are preserved, not stripped — prevents data loss when CCP adds new fields.

## API Reference

All methods are defined on `IStaticDataProvider`. Single-entity lookups return `T | null`. Collection lookups return `T[]` (empty if none found). Search methods accept an optional `limit` parameter.

### Types, Groups, Categories

```typescript
sde.getType(34); // EveType | null
sde.getTypesByGroup(18); // EveType[] — all minerals
sde.getGroup(18); // EveGroup | null
sde.getGroupsByCategory(4); // EveGroup[] — groups in "Material"
sde.getCategory(4); // EveCategory | null
sde.getAllCategories(); // EveCategory[]
sde.searchTypesByName('Trit'); // EveType[] — fuzzy search
```

### Geography

```typescript
sde.getRegion(10000002); // Region | null — "The Forge"
sde.getAllRegions(); // Region[]
sde.getConstellation(20000020); // Constellation | null
sde.getConstellationsByRegion(10000002); // Constellation[]
sde.getSolarSystem(30000142); // SolarSystem | null — "Jita"
sde.getSolarSystemsByConstellation(20000020); // SolarSystem[]
sde.getStargate(50001248); // Stargate | null
sde.getStargatesBySystem(30000142); // Stargate[]
sde.searchSolarSystemsByName('Jita'); // SolarSystem[]
```

### Universe (Stars, Planets, Moons, Belts)

```typescript
sde.getStar(40009082); // Star | null
sde.getStarBySystem(30000142); // Star | null
sde.getPlanet(40009077); // Planet | null
sde.getPlanetsBySystem(30000142); // Planet[]
sde.getMoon(40009078); // Moon | null
sde.getMoonsBySystem(30000142); // Moon[]
sde.getAsteroidBelt(40009079); // AsteroidBelt | null
sde.getAsteroidBeltsBySystem(30000142); // AsteroidBelt[]
sde.getSecondarySun(40009080); // SecondarySun | null
sde.getLandmark(1001); // Landmark | null
sde.getAllLandmarks(); // Landmark[]
```

### Character and Lore

```typescript
sde.getFaction(500001); // Faction | null — "Caldari State"
sde.getAllFactions(); // Faction[]
sde.getRace(1); // Race | null — "Caldari"
sde.getAllRaces(); // Race[]
sde.getBloodline(1); // Bloodline | null
sde.getBloodlinesByRace(1); // Bloodline[]
sde.getAncestry(1); // Ancestry | null
sde.getAncestriesByBloodline(1); // Ancestry[]
sde.getCharacterAttribute(1); // CharacterAttribute | null
sde.getCloneGrade(1); // CloneGrade | null
sde.getSchool(1); // School | null
```

### NPC Infrastructure

```typescript
sde.getNpcCorporation(1000035); // NpcCorporation | null
sde.getNpcCorporationsByFaction(500001); // NpcCorporation[]
sde.getNpcStation(60003760); // NpcStation | null
sde.getNpcStationsBySystem(30000142); // NpcStation[]
sde.getNpcStationsByOwner(1000035); // NpcStation[]
sde.getNpcCharacter(3004001); // NpcCharacter | null
sde.getNpcCharactersByCorporation(1000035); // NpcCharacter[]
sde.searchNpcCharactersByName('Aura'); // NpcCharacter[]
```

### Market

```typescript
sde.getMarketGroup(1857); // MarketGroup | null
sde.getMarketGroupsByParent(1857); // MarketGroup[] — children
sde.getRootMarketGroups(); // MarketGroup[] — top-level
sde.getTypesByMarketGroup(1857); // EveType[] — types in group
sde.searchMarketGroupsByName('Minerals'); // MarketGroup[]
```

### Dogma

```typescript
sde.getDogmaAttribute(9); // DogmaAttribute | null
sde.searchDogmaAttributesByName('power'); // DogmaAttribute[]
sde.getDogmaEffect(11); // DogmaEffect | null
sde.searchDogmaEffectsByName('shield'); // DogmaEffect[]
sde.getDogmaAttributeCategory(1); // DogmaAttributeCategory | null
sde.getDogmaUnit(1); // DogmaUnit | null
```

### Industry

```typescript
sde.getBlueprint(950); // Blueprint | null
sde.getPlanetSchematic(65); // PlanetSchematic | null
sde.getAllPlanetSchematics(); // PlanetSchematic[]
sde.getIndustryActivity(1); // IndustryActivity | null
sde.getAllIndustryActivities(); // IndustryActivity[]
```

### Other Entities

```typescript
// Agents
sde.getAgentType(1); // AgentType | null
sde.getAgentInSpace(3004001); // AgentInSpace | null
sde.getAgentsInSpaceBySystem(30000142); // AgentInSpace[]

// Certificates
sde.getCertificate(1); // Certificate | null
sde.getAllCertificates(); // Certificate[]

// Skins
sde.getSkin(1); // Skin | null
sde.getSkinLicense(1); // SkinLicense | null
sde.getSkinLicensesBySkin(1); // SkinLicense[]

// Station Operations & Services
sde.getStationOperation(1); // StationOperation | null
sde.getStationService(1); // StationService | null

// Type Extensions
sde.getTypeDogma(34); // TypeDogma | null
sde.getTypeMaterial(34); // TypeMaterial | null
sde.getTypeBonus(34); // TypeBonus | null

// Missions & Content
sde.getMission(1); // Mission | null
sde.getDungeon(1); // Dungeon | null
sde.getEpicArc(1); // EpicArc | null

// Generic accessor for any entity
sde.getEntity('eve_types', 34); // Record | null
sde.getAllEntities('eve_types'); // Record[]

// Version
sde.getVersion(); // { version, buildDate, importedAt }
sde.close(); // Cleanup
```

## Use Cases

### Ship Fitting Stats

Look up a ship's attributes from dogma data:

```typescript
const ship = sde.getType(24690); // Harbinger
const dogma = sde.getTypeDogma(24690);
console.log(ship?.name);

if (dogma) {
  for (const attr of dogma.attributes) {
    const def = sde.getDogmaAttribute(attr.attributeId);
    console.log(`${def?.name}: ${attr.value}`);
  }
}
```

### Blueprint Manufacturing

Look up what materials are needed to build an item:

```typescript
const bp = sde.getBlueprint(950); // Rifter Blueprint
const mfg = bp?.activities?.manufacturing;
if (mfg) {
  for (const mat of mfg.materials ?? []) {
    const type = sde.getType(mat.typeId);
    console.log(`${type?.name}: ${mat.quantity}`);
  }
}
```

### Market Group Tree

Walk the market group hierarchy:

```typescript
function printTree(groupId: number, depth = 0) {
  const group = sde.getMarketGroup(groupId);
  if (!group) return;
  console.log('  '.repeat(depth) + group.name);
  const children = sde.getMarketGroupsByParent(groupId);
  for (const child of children) {
    printTree(child.marketGroupId, depth + 1);
  }
}

const roots = sde.getRootMarketGroups();
for (const root of roots) {
  printTree(root.marketGroupId);
}
```

### Universe Navigation

Traverse the geography hierarchy:

```typescript
const forge = sde.getRegion(10000002);
console.log(`Region: ${forge?.name}`);

const constellations = sde.getConstellationsByRegion(10000002);
for (const c of constellations) {
  const systems = sde.getSolarSystemsByConstellation(c.constellationId);
  console.log(`  ${c.name}: ${systems.length} systems`);
}
```

## Entity Coverage

The module covers all 102 SDE YAML files:

| Domain             | Entities | Key Types                                                                      |
| ------------------ | -------- | ------------------------------------------------------------------------------ |
| Types and Items    | 8        | `EveType`, `EveGroup`, `EveCategory`, `MetaGroup`, `TypeDogma`, `TypeMaterial` |
| Geography          | 8        | `Region`, `Constellation`, `SolarSystem`, `Stargate`, `Star`, `Planet`, `Moon` |
| Character and Lore | 8        | `Faction`, `Race`, `Bloodline`, `Ancestry`, `CharacterAttribute`, `CloneGrade` |
| NPC                | 6        | `NpcCorporation`, `NpcStation`, `NpcCharacter`, `CorporationActivity`          |
| Dogma              | 5        | `DogmaAttribute`, `DogmaEffect`, `DogmaAttributeCategory`, `DogmaUnit`         |
| Industry           | 5        | `Blueprint`, `PlanetSchematic`, `IndustryActivity`                             |
| Market             | 2        | `MarketGroup`, `ContrabandType`                                                |
| Skins              | 12       | `Skin`, `SkinLicense`, `SkinMaterial`, `SkinrComponent`                        |
| Stations           | 4        | `StationOperation`, `StationService`, `SovereigntyUpgrade`                     |
| Content            | 5        | `Mission`, `Dungeon`, `EpicArc`, `Certificate`, `Landmark`                     |
| Miscellaneous      | 46       | `Icon`, `Graphic`, `NotificationType`, `TranslationLanguage`, `SkillPlan`      |

All 109 interfaces are exported from `@lgriffin/esi.ts/sde` and have corresponding Zod schemas.

## SDE Ingestion CLI

```bash
npx ts-node scripts/sde-ingest.ts [options]

Options:
  --output, -o   Output directory (default: ./sde-data)
  --check        Check latest SDE build version without downloading
  --force        Re-download even if data already exists
  --verbose      Show detailed progress
```

## SDE vs ESI

The SDE and ESI API complement each other:

| Data               | SDE                              | ESI API                             |
| ------------------ | -------------------------------- | ----------------------------------- |
| Item types         | All types with full attributes   | Single type lookup by ID            |
| Solar systems      | All systems with security status | Single system lookup by ID          |
| Market prices      | None (static data only)          | Live prices and order books         |
| Blueprints         | Manufacturing requirements       | Character/corp blueprint ownership  |
| Character data     | Bloodlines, ancestries           | Live character info, skills, assets |
| NPC corps/stations | All NPC infrastructure           | Limited station info                |
| Dogma              | All attributes and effects       | Limited dynamic item info           |
| Update frequency   | Monthly SDE releases             | Real-time                           |

Use the SDE for reference data (what items exist, what blueprints require) and the ESI API for live game state (prices, character data, sovereignty).
