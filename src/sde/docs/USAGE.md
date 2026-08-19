# SDE Module Usage Guide

## Prerequisites

- Node.js 18+
- SDE data downloaded locally (YAML files from CCP's Static Data Export)

No additional runtime dependencies are required. The SDE module reads YAML files directly from disk into in-memory Maps.

## Downloading SDE Data

```bash
npx ts-node scripts/sde-ingest.ts --output sde-data
```

This downloads the latest SDE ZIP from CCP (~200 MB), extracts all YAML files to `./sde-data/`, and cleans up the archive. The directory is gitignored by default.

Options:
- `--output, -o` — output directory (default: `./sde-data`)
- `--check` — check for the latest build without downloading
- `--force` — re-download even if data already exists
- `--verbose` — show detailed progress

## Importing

```ts
import {
  SdeDataProvider,
  MemorySdeProvider,
  SdeTestDataFactory,
  type IStaticDataProvider,
  type EveType,
  type SolarSystem,
} from '@lgriffin/esi.ts/sde';
```

## Creating a Provider

### From a directory of YAML files

```ts
import { SdeDataProvider } from '@lgriffin/esi.ts/sde';

const sde = SdeDataProvider.fromDirectory('./sde-data');
```

Reads all 102 YAML files from the directory. Takes 30-90 seconds depending on hardware, loading ~500K records into memory.

### From a ZIP archive

```ts
const sde = SdeDataProvider.fromZip('./eve-online-static-data-latest-yaml.zip');
```

Parses YAML files directly from the ZIP without extracting to disk.

## Common Query Patterns

### Look up by primary key

Every entity has a dedicated `getXxx(id)` method that returns `T | null`:

```ts
const tritanium = sde.getType(34);        // EveType | null
const jita = sde.getSolarSystem(30000142); // SolarSystem | null
const caldari = sde.getFaction(500001);    // Faction | null
```

### Query by foreign key

Methods like `getXxxsByYyy(fkValue)` return arrays of related entities:

```ts
const minerals = sde.getTypesByGroup(18);                 // EveType[]
const forgeConstellations = sde.getConstellationsByRegion(10000002); // Constellation[]
const jitaGates = sde.getStargatesBySystem(30000142);     // Stargate[]
const caldariCorps = sde.getNpcCorporationsByFaction(500001); // NpcCorporation[]
```

FK indexes are built lazily on first access and cached for subsequent queries.

### Search by name

Text search methods do case-insensitive substring matching with an optional limit:

```ts
const results = sde.searchTypesByName('Rifter', 10);       // EveType[]
const systems = sde.searchSolarSystemsByName('Jita');       // SolarSystem[]
const attrs = sde.searchDogmaAttributesByName('hp', 5);     // DogmaAttribute[]
```

### Get all records

Collection methods return every entity of a given type:

```ts
const allRegions = sde.getAllRegions();       // Region[]
const allFactions = sde.getAllFactions();     // Faction[]
const allMetaGroups = sde.getAllMetaGroups(); // MetaGroup[]
```

### Generic accessor

For entities without dedicated methods, or when working with table names dynamically:

```ts
// Untyped — returns Record<string, unknown>
const entity = sde.getEntity('eve_archetypes', 42);
const all = sde.getAllEntities('eve_archetypes');

// Typed — pass a generic parameter
import type { Archetype } from '@lgriffin/esi.ts/sde';
const typed = sde.getEntity<Archetype>('eve_archetypes', 42);
const typedAll = sde.getAllEntities<Archetype>('eve_archetypes');
```

Table names follow the pattern `eve_<entity>` (e.g., `eve_types`, `eve_solar_systems`, `eve_blueprints`).

### Filter by predicate

Use `getAllEntities` with standard array methods:

```ts
const publishedTypes = sde.getAllEntities<EveType>('eve_types')
  .filter(t => t.published === true);

const highsecSystems = sde.getAllEntities<SolarSystem>('eve_solar_systems')
  .filter(s => s.securityStatus >= 0.5);
```

## Error Handling

```ts
import { SdeDataProvider, isSdeError } from '@lgriffin/esi.ts/sde';

try {
  const sde = SdeDataProvider.fromDirectory('./nonexistent');
} catch (err) {
  if (isSdeError(err)) {
    console.error('SDE error:', err.message);
  }
}
```

Error types:
- `SdeError` — base class for all SDE errors
- `SdeDatabaseError` — data loading or parsing failure
- `SdeValidationError` — Zod schema validation failure
- `SdeVersionMismatchError` — version compatibility issue

Type guards: `isSdeError()`, `isSdeDatabaseError()`, `isSdeValidationError()`, `isSdeVersionMismatch()`

## Closing the Provider

Always call `close()` when done. The provider is synchronous and holds data in memory:

```ts
const sde = SdeDataProvider.fromDirectory('./sde-data');
try {
  // ... use provider
} finally {
  sde.close();
}
```

## Using MemorySdeProvider for Testing

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for testing patterns with `MemorySdeProvider` and `SdeTestDataFactory`.

## Entity Hierarchy

```
EveCategory (e.g., "Ship")
  └── EveGroup (e.g., "Frigate")
        └── EveType (e.g., "Rifter")

Region (e.g., "The Forge")
  └── Constellation (e.g., "Kimotoro")
        └── SolarSystem (e.g., "Jita")
              ├── Star
              ├── Planet
              │     └── Moon
              ├── AsteroidBelt
              └── Stargate → destination SolarSystem

Race → Bloodline → Ancestry
Faction → NpcCorporation → NpcStation
```

For the full API reference, see [API_CONTRACTS.md](API_CONTRACTS.md).
