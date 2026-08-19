# SDE Module Architecture

The SDE (Static Data Export) module provides typed, in-memory access to CCP's EVE Online static game data. It reads YAML files natively from disk into `Map`-based storage with no database intermediary. 109 entity types, 110 Zod schemas, ~100 typed query methods covering all 102 SDE YAML files.

## 1. System Context (C4 Level 1)

```mermaid
C4Context
    title SDE Module - System Context

    Person(dev, "Developer", "EVE Online tool/app developer")

    System(sde, "SDE Module", "Typed in-memory provider for EVE static data. 109 entity types, ~100 query methods.")

    System_Ext(ccp_sde, "CCP SDE", "Static Data Export: 102 YAML files published by CCP (~200 MB ZIP)")

    Rel(dev, sde, "Queries static data", "TypeScript API")
    Rel(sde, ccp_sde, "Downloads & parses", "HTTPS + js-yaml")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## 2. Container Diagram (C4 Level 2)

```mermaid
C4Container
    title SDE Module - Container View

    Container_Boundary(sde_module, "SDE Module (src/sde/)") {
        Container(provider, "SdeDataProvider", "TypeScript class", "Core provider. Loads YAML, normalizes fields, stores in Maps. ~100 typed query methods.")
        Container(interface, "IStaticDataProvider", "TypeScript interface", "97-method contract. Decouples consumers from implementation.")
        Container(memory, "MemorySdeProvider", "TypeScript class", "In-memory test double. Accepts typed arrays, implements full interface.")
        Container(types, "Entity Types", "109 TypeScript interfaces", "Strongly typed interfaces for all SDE entities (EveType, SolarSystem, Blueprint, etc.)")
        Container(schemas, "Zod Schemas", "110 z.looseObject schemas", "Runtime validation. Preserves extra fields from SDE.")
        Container(factory, "SdeTestDataFactory", "TypeScript class", "Generates realistic test fixtures for all entity types.")
    }

    Container_Boundary(ingestion, "Ingestion Pipeline (src/sde/ingestion/)") {
        Container(downloader, "SdeDownloader", "TypeScript class", "Downloads CCP SDE ZIP via native fetch. Checks latest build number.")
        Container(extractor, "SdeExtractor", "TypeScript class", "Extracts/parses YAML from ZIP using adm-zip + js-yaml.")
        Container(transforms, "Transforms", "TypeScript functions", "Field normalization, locale extraction, recursive nested normalization.")
        Container(constants, "SDE_FILE_REGISTRY", "102-entry config array", "Maps each YAML file to table name, PK attribute, ID type, and injection flag.")
    }

    Rel(provider, interface, "implements")
    Rel(memory, interface, "implements")
    Rel(provider, transforms, "uses for field normalization")
    Rel(provider, constants, "iterates registry to load files")
    Rel(provider, extractor, "uses for ZIP loading (fromZip)")
    Rel(provider, types, "casts records to")
    Rel(schemas, types, "validates against")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## 3. Component Diagram (C4 Level 3) - SdeDataProvider Internals

```mermaid
graph TB
    subgraph SdeDataProvider
        direction TB

        subgraph Storage
            entities["entities: Map&lt;tableName, Map&lt;id, Record&gt;&gt;"]
            fkIndexes["fkIndexes: Map&lt;tableName:field, Map&lt;fkValue, Record[]&gt;&gt;"]
        end

        subgraph "Factory Methods"
            fromDir["fromDirectory(path)"]
            fromZip["fromZip(path)"]
        end

        subgraph "Load Pipeline"
            loadRecords["loadRecords(spec, rawYaml)"]
            transform["transformRecordNative()"]
            normalize["normalizeSdeFieldName()"]
            locale["extractLocale()"]
            nested["normalizeNested()"]
        end

        subgraph "Query Methods"
            getById["getById&lt;T&gt;(table, id)"]
            getByFk["getByFk&lt;T&gt;(table, field, value)"]
            getAllRecords["getAllRecords&lt;T&gt;(table)"]
            search["search&lt;T&gt;(table, field, query, limit)"]
            filterBy["filterBy&lt;T&gt;(table, predicate)"]
        end
    end

    fromDir -->|"reads YAML files"| loadRecords
    fromZip -->|"extracts from ZIP"| loadRecords
    loadRecords -->|"per record"| transform
    transform --> normalize
    transform --> locale
    transform -->|"nested objects"| nested
    nested -->|"recursive"| normalize
    nested -->|"locale maps"| locale
    loadRecords -->|"stores"| entities

    getById -->|"direct lookup"| entities
    getByFk -->|"lazy build + cache"| fkIndexes
    fkIndexes -.->|"built from"| entities
    getAllRecords -->|"values iterator"| entities
    search -->|"linear scan"| entities
    filterBy -->|"predicate scan"| entities

    style entities fill:#4a9eff,color:#fff
    style fkIndexes fill:#ff9f43,color:#fff
```

## 4. Data Flow

```mermaid
sequenceDiagram
    participant CLI as sde-ingest.ts
    participant DL as SdeDownloader
    participant EX as SdeExtractor
    participant FS as Filesystem
    participant DP as SdeDataProvider
    participant TR as transformRecordNative
    participant MAP as Entity Maps

    Note over CLI,MAP: Ingestion (one-time setup)
    CLI->>DL: download(outputPath)
    DL->>DL: fetch ZIP from CCP (~200MB)
    DL-->>CLI: sde-data.zip
    CLI->>EX: extractAll(zipPath, outputDir)
    EX->>FS: write 102 YAML files to sde-data/
    CLI->>FS: delete ZIP

    Note over CLI,MAP: Loading (per application start)
    CLI->>DP: fromDirectory("./sde-data")
    DP->>FS: read _sde.yaml (metadata)
    loop For each spec in SDE_FILE_REGISTRY
        DP->>FS: readFileSync(yamlFile)
        FS-->>DP: raw YAML string
        DP->>DP: yaml.load() to parsed object
        loop For each [id, record] in parsed
            DP->>TR: transformRecordNative(id, record, spec)
            TR->>TR: normalizeSdeFieldName (groupID to groupId)
            TR->>TR: extractLocale ({en: "Jita"} to "Jita")
            TR->>TR: normalizeNested (recursive for objects/arrays)
            TR-->>DP: normalized record
        end
        DP->>MAP: entities.set(tableName, recordMap)
    end
    DP-->>CLI: SdeDataProvider instance

    Note over CLI,MAP: Querying
    CLI->>DP: getType(34)
    DP->>MAP: entities.get("eve_types").get(34)
    MAP-->>DP: Tritanium record
    DP-->>CLI: EveType

    CLI->>DP: getTypesByGroup(18)
    DP->>DP: lazy-build FK index for eve_types:groupId
    DP->>MAP: fkIndexes.get("eve_types:groupId").get(18)
    MAP-->>DP: [Tritanium, Pyerite, ...]
    DP-->>CLI: EveType[]
```

## 5. Entity Relationship Diagram

```mermaid
erDiagram
    EveCategory ||--o{ EveGroup : "has groups"
    EveGroup ||--o{ EveType : "has types"
    EveType ||--o| TypeDogma : "has dogma"
    EveType ||--o| TypeMaterial : "has materials"
    EveType ||--o| TypeBonus : "has bonuses"

    Region ||--o{ Constellation : "contains"
    Constellation ||--o{ SolarSystem : "contains"
    SolarSystem ||--o| Star : "has star"
    SolarSystem ||--o{ Planet : "has planets"
    SolarSystem ||--o{ Moon : "has moons"
    SolarSystem ||--o{ AsteroidBelt : "has belts"
    SolarSystem ||--o{ Stargate : "has gates"
    SolarSystem ||--o{ NpcStation : "has stations"
    SolarSystem ||--o{ SecondarySun : "has secondary suns"

    Stargate }|--|| SolarSystem : "destination"

    Faction ||--o{ NpcCorporation : "has corps"
    Faction ||--o{ Race : "memberRaces"
    Race ||--o{ Bloodline : "has bloodlines"
    Bloodline ||--o{ Ancestry : "has ancestries"
    NpcCorporation ||--o{ NpcStation : "owns"
    NpcCorporation ||--o{ NpcCharacter : "employs"

    MarketGroup ||--o{ MarketGroup : "parentGroupId (tree)"
    MarketGroup ||--o{ EveType : "has types"

    Blueprint ||--|| EveType : "blueprintTypeId"
    Blueprint ||--|| BlueprintActivities : "activities"

    DogmaAttribute }o--|| DogmaAttributeCategory : "categoryId"
    DogmaAttribute }o--o| DogmaUnit : "unitId"

    Skin ||--o{ SkinLicense : "has licenses"
```

## 6. Key Design Decisions

### YAML-Native, No SQLite

The original design used better-sqlite3 to import SDE YAML into an SQLite database. This was replaced with direct YAML-to-Map loading because:

- **Simpler dependency tree**: No native binary dependency (better-sqlite3 requires node-gyp)
- **No build/import step**: No separate database build required before querying
- **Native JS types**: Objects, arrays, booleans stay as-is instead of being serialized to JSON text columns
- **Acceptable performance**: Full SDE (~500K records) loads in ~60 seconds and fits comfortably in memory (~200MB)
- **Nested structures preserved**: Stargate `destination`, star `statistics`, blueprint `activities` remain native objects

### `z.looseObject()` for All Schemas

CCP may add new fields to SDE YAML at any time. Using `z.looseObject({})` instead of `z.object({})` means:

- Extra/unknown fields pass validation and are preserved on the output
- Consumers can access new CCP fields immediately without waiting for a schema update
- Matches the main ESI SDK's established pattern

### Lazy FK Index Building

Foreign key indexes are built on first query, not at load time:

```
getByFk("eve_types", "groupId", 18)
  -> checks fkIndexes for "eve_types:groupId"
  -> if missing: scans all eve_types, builds Map<groupId, Type[]>, caches it
  -> returns cached result
```

This avoids building indexes for FK relationships that are never queried. Many of the 102 entity tables have FK columns that most consumers never filter by.

### `transformRecordNative` vs `transformRecord`

Two transform functions exist:

| Function | Output types | Use case |
|----------|-------------|----------|
| `transformRecord` | `Record<string, SqliteValue>` | Legacy SQLite path (booleans to 0/1, objects to JSON strings) |
| `transformRecordNative` | `Record<string, unknown>` | YAML-native path (preserves JS types as-is) |

`transformRecordNative` is used by `SdeDataProvider`. Both share field normalization (`groupID` to `groupId`) and locale extraction (`{en: "Jita"}` to `"Jita"`).

### Recursive Nested Normalization

CCP's YAML uses `PascalCaseID` field names at all levels. The `normalizeNested()` function recursively normalizes keys in nested objects and arrays:

```
Raw YAML:    { destination: { solarSystemID: 30000140, stargateID: 50000802 } }
Normalized:  { destination: { solarSystemId: 30000140, stargateId: 50000802 } }
```

This ensures that typed interfaces (e.g., `StargateDestination.solarSystemId`) match the runtime data regardless of nesting depth.

### SDE_FILE_REGISTRY as Single Source of Truth

All 102 YAML files are registered in one array:

```typescript
interface SdeFileSpec {
  yamlFile: string;      // "mapRegions.yaml"
  tableName: string;     // "eve_regions"
  idAttribute: string;   // "regionId"
  idType: 'number' | 'string';
  injectId: boolean;     // true = YAML key becomes the PK field
}
```

`SdeDataProvider.fromDirectory()` iterates this registry and skips missing files silently. This means the provider works with partial SDE extracts and is forward-compatible with new CCP YAML files (add a registry entry and interface).

### Port/Adapter Pattern

`IStaticDataProvider` is the port (97 typed methods). Implementations are adapters:

- **SdeDataProvider** — production adapter, reads YAML from disk or ZIP
- **MemorySdeProvider** — test adapter, accepts typed arrays, no I/O

### Error Taxonomy

SDE errors extend `Error` directly, not `EsiError`. They are local data access errors with no HTTP semantics:

```
Error
  +-- SdeError (base)
        +-- SdeDatabaseError (open/query failures)
        +-- SdeValidationError (Zod validation failures)
        +-- SdeVersionMismatchError (schema incompatibility)
```

Each error class has a corresponding type guard function (`isSdeError`, `isSdeDatabaseError`, etc.).

## 7. Testing Architecture

```mermaid
graph TB
    subgraph "Testing Pyramid"
        direction TB

        integration["Integration Tests (63 tests)
        Real CCP SDE data (~60s)
        Well-known entity lookups
        Referential integrity checks
        Row count validation
        Data quality assertions"]

        bdd["BDD Tests (23 tests, 7 suites)
        jest-cucumber feature scenarios
        Universe hierarchy navigation
        Character/lore lookups
        Dogma and industry queries
        Static data lookups"]

        unit["Unit Tests (288 tests, 8 suites)
        Schema validation (valid/invalid/extra fields)
        SdeTestDataFactory (defaults + overrides)
        MemorySdeProvider (all query methods)
        IStaticDataProvider contract (null/empty returns)
        Ingestion transforms (normalization, locale)"]
    end

    integration --- bdd
    bdd --- unit

    style unit fill:#4caf50,color:#fff
    style bdd fill:#2196f3,color:#fff
    style integration fill:#ff9800,color:#fff
```

### Test Infrastructure

| Component | Purpose |
|-----------|---------|
| `SdeTestDataFactory` | Creates realistic test fixtures matching real CCP data structures. One factory method per entity type. `createHierarchicalTestData()` builds a connected graph of entities. |
| `MemorySdeProvider` | Accepts typed arrays via `MemorySdeData`, implements `IStaticDataProvider`. Used in all unit and BDD tests. No file I/O. |
| `IStaticDataProvider` contract tests | Verify null returns for missing IDs, empty arrays for missing FK values, and correct typing on all 97 methods. |
| Integration tests | Load real CCP SDE data via `SdeDataProvider.fromDirectory()`. Skipped automatically when `sde-data/` directory is absent (CI-safe). |

### Running Tests

```bash
npm test -- tests/tdd/sde/                                               # Unit (288 tests, ~1s)
npm test -- tests/bdd/step-definitions/sde/                              # BDD (23 tests, ~1s)
npx jest --config jest.integration.config.cjs -- tests/integration/sde/  # Integration (63 tests, ~60s)
```

## 8. Module File Layout

```
src/sde/
  IStaticDataProvider.ts    # 97-method interface contract
  SdeDataProvider.ts        # Core YAML-backed provider (fromDirectory, fromZip)
  MemorySdeProvider.ts      # In-memory test double
  SdeTestDataFactory.ts     # Test fixture factory
  types.ts                  # 109 entity interfaces
  schemas.ts                # 110 Zod validation schemas
  version.ts                # SdeVersionInfo type
  errors.ts                 # SdeError hierarchy (4 error classes + type guards)
  index.ts                  # Barrel exports
  ingestion/
    constants.ts            # SDE_FILE_REGISTRY (102 entries), CCP URLs
    SdeDownloader.ts        # HTTP download with progress callback
    SdeExtractor.ts         # ZIP extraction and YAML parsing
    transforms.ts           # Field normalization, locale extraction
    index.ts                # Barrel exports
  docs/
    ARCHITECTURE.md         # This file
    API_CONTRACTS.md        # Complete API method reference
    DEVELOPER_GUIDE.md      # Developer guide for contributors
    USAGE.md                # End-user usage guide
```
