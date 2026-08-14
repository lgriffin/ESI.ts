# SDE Module Usage Guide

## Installation

The SDE module requires `better-sqlite3` as an optional peer dependency:

```bash
npm install better-sqlite3
```

No additional setup is needed if you only use the `MemorySdeProvider` (e.g., for testing).

## Importing

```ts
import {
  SdeLocalEngine,
  MemorySdeProvider,
  SdeTestDataFactory,
  type IStaticDataProvider,
  type EveType,
  type SolarSystem,
} from '@lgriffin/esi.ts/sde';
```

## Using SdeLocalEngine (SQLite)

### Prerequisites

You need a pre-built SQLite database file containing EVE SDE data. The database must use the schema defined by `SDE_SCHEMA_SQL` (exported from the module).

### Basic Usage

```ts
import { SdeLocalEngine } from '@lgriffin/esi.ts/sde';

const sde = new SdeLocalEngine({
  databasePath: './eve-sde.sqlite',
});

try {
  // Look up an item type
  const tritanium = sde.getType(34);
  console.log(tritanium?.name); // "Tritanium"

  // Navigate the type hierarchy
  const group = sde.getGroup(tritanium!.groupId);
  const category = sde.getCategory(group!.categoryId);
  console.log(`${category?.name} > ${group?.name} > ${tritanium?.name}`);
  // "Material > Mineral > Tritanium"

  // Look up geography
  const jita = sde.getSolarSystem(30000142);
  console.log(`${jita?.name}: security ${jita?.securityStatus.toFixed(2)}`);

  // Search
  const results = sde.searchTypesByName('Rifter');
  results.forEach((r) => console.log(r.name));

  // Version info
  const version = sde.getVersion();
  console.log(`SDE v${version.version}, built ${version.buildDate}`);
} finally {
  sde.close();
}
```

### Configuration

```ts
const sde = new SdeLocalEngine({
  databasePath: './eve-sde.sqlite',
  walMode: true,         // Enable WAL journal mode (default: true)
  validateOnRead: false,  // Validate rows against Zod schemas (default: false)
});
```

Set `validateOnRead: true` during development to catch data integrity issues. Disable in production for performance.

## Using MemorySdeProvider (Testing)

The `MemorySdeProvider` implements the same `IStaticDataProvider` interface using in-memory Maps. Use it in tests to avoid SQLite dependencies:

```ts
import { MemorySdeProvider, SdeTestDataFactory } from '@lgriffin/esi.ts/sde';

const provider = new MemorySdeProvider({
  types: [
    SdeTestDataFactory.createEveType({ typeId: 34, name: 'Tritanium' }),
    SdeTestDataFactory.createEveType({ typeId: 35, name: 'Pyerite' }),
  ],
  groups: [SdeTestDataFactory.createEveGroup()],
  categories: [SdeTestDataFactory.createEveCategory()],
});

const type = provider.getType(34);
// { typeId: 34, name: 'Tritanium', ... }
```

For a complete dataset with consistent foreign key relationships:

```ts
const provider = new MemorySdeProvider(
  SdeTestDataFactory.createHierarchicalTestData(),
);
```

## Using SDE with ESI

The SDE module is independent from the ESI client. Use both together for enriched data:

```ts
import { EsiClient } from '@lgriffin/esi.ts';
import { SdeLocalEngine } from '@lgriffin/esi.ts/sde';

const esi = new EsiClient({ accessToken: '...' });
const sde = new SdeLocalEngine({ databasePath: './eve-sde.sqlite' });

// Get market orders from ESI
const orders = await esi.market.getRegionOrders(10000002, 34);

// Enrich with SDE data
const typeInfo = sde.getType(34);
console.log(`${typeInfo?.name}: ${orders.length} active orders`);

sde.close();
esi.shutdown();
```

## Error Handling

```ts
import {
  SdeLocalEngine,
  SdeDatabaseError,
  isSdeDatabaseError,
  isSdeError,
} from '@lgriffin/esi.ts/sde';

try {
  const sde = new SdeLocalEngine({ databasePath: './missing.sqlite' });
} catch (err) {
  if (isSdeDatabaseError(err)) {
    console.error('Database error:', err.message);
    console.error('Cause:', err.cause);
  } else if (isSdeError(err)) {
    console.error('SDE error:', err.message);
  }
}
```

## Writing a Custom Provider

Implement `IStaticDataProvider` to create a custom data source:

```ts
import type { IStaticDataProvider } from '@lgriffin/esi.ts/sde';

class MyCustomProvider implements IStaticDataProvider {
  getType(typeId: number) { /* ... */ }
  getTypesByGroup(groupId: number) { /* ... */ }
  // ... implement all methods
  close() { /* cleanup */ }
}
```

## API Reference

### IStaticDataProvider Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getType(typeId)` | `EveType \| null` | Look up an item type |
| `getTypesByGroup(groupId)` | `EveType[]` | All types in a group |
| `getGroup(groupId)` | `EveGroup \| null` | Look up an item group |
| `getGroupsByCategory(categoryId)` | `EveGroup[]` | All groups in a category |
| `getCategory(categoryId)` | `EveCategory \| null` | Look up an item category |
| `getAllCategories()` | `EveCategory[]` | All categories |
| `getRegion(regionId)` | `Region \| null` | Look up a region |
| `getAllRegions()` | `Region[]` | All regions |
| `getConstellation(constellationId)` | `Constellation \| null` | Look up a constellation |
| `getConstellationsByRegion(regionId)` | `Constellation[]` | Constellations in a region |
| `getSolarSystem(systemId)` | `SolarSystem \| null` | Look up a solar system |
| `getSolarSystemsByConstellation(constellationId)` | `SolarSystem[]` | Systems in a constellation |
| `getStargate(stargateId)` | `Stargate \| null` | Look up a stargate |
| `getStargatesBySystem(systemId)` | `Stargate[]` | Stargates in a system |
| `searchTypesByName(query, limit?)` | `EveType[]` | Search types by name |
| `searchSolarSystemsByName(query, limit?)` | `SolarSystem[]` | Search systems by name |
| `getVersion()` | `SdeVersionInfo` | SDE version metadata |
| `close()` | `void` | Release resources |
