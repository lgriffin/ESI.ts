# SDE Developer Guide

This guide walks through using the ESI.ts SDE module to access EVE Online static data in your application.

## Quick Start

### 1. Install the optional dependency

```bash
npm install better-sqlite3
```

### 2. Create or obtain an SDE database

You can seed a small test database using the included script:

```bash
npx ts-node scripts/seed-sde-test-db.ts ./eve-sde.sqlite
```

For production use, you'll need a database built from CCP's SDE release (full ingestion tooling is planned for a future release).

### 3. Use the SDE in your code

```ts
import { SdeLocalEngine } from '@lgriffin/esi.ts/sde';

const sde = new SdeLocalEngine({ databasePath: './eve-sde.sqlite' });

const tritanium = sde.getType(34);
console.log(tritanium?.name); // "Tritanium"

sde.close();
```

## Common Use Cases

### Look up an item type and its classification

```ts
import { SdeLocalEngine } from '@lgriffin/esi.ts/sde';

const sde = new SdeLocalEngine({ databasePath: './eve-sde.sqlite' });

const type = sde.getType(587); // Rifter
if (type) {
  console.log(`${type.name} (ID: ${type.typeId})`);
  console.log(`  Volume: ${type.volume} m³`);
  console.log(`  Mass: ${type.mass} kg`);

  // Navigate up the hierarchy
  const group = sde.getGroup(type.groupId);
  const category = group ? sde.getCategory(group.categoryId) : null;
  console.log(`  ${category?.name} > ${group?.name} > ${type.name}`);
  // "Ship > Frigate > Rifter"

  // Find all items in the same group
  const otherFrigates = sde.getTypesByGroup(type.groupId);
  console.log(`  Other ${group?.name}s: ${otherFrigates.map(t => t.name).join(', ')}`);
}

sde.close();
```

### Explore the EVE universe geography

```ts
import { SdeLocalEngine } from '@lgriffin/esi.ts/sde';

const sde = new SdeLocalEngine({ databasePath: './eve-sde.sqlite' });

// Start from a region
const forge = sde.getRegion(10000002);
console.log(`Region: ${forge?.name}`);

// Get its constellations
const constellations = sde.getConstellationsByRegion(10000002);
console.log(`Constellations: ${constellations.map(c => c.name).join(', ')}`);

// Get systems in Kimotoro constellation
const systems = sde.getSolarSystemsByConstellation(20000020);
for (const system of systems) {
  const stargates = sde.getStargatesBySystem(system.systemId);
  const destinations = stargates.map(sg => {
    const dest = sde.getSolarSystem(sg.destinationSystemId);
    return dest?.name ?? 'Unknown';
  });
  console.log(`  ${system.name} (${system.securityStatus.toFixed(2)}) -> ${destinations.join(', ')}`);
}

sde.close();
```

### Search for items or systems by name

```ts
import { SdeLocalEngine } from '@lgriffin/esi.ts/sde';

const sde = new SdeLocalEngine({ databasePath: './eve-sde.sqlite' });

// Search types - case-insensitive, partial match
const ships = sde.searchTypesByName('Rifter', 10);
for (const ship of ships) {
  console.log(`${ship.name} (${ship.typeId})`);
}

// Search solar systems
const systems = sde.searchSolarSystemsByName('Jita');
for (const system of systems) {
  console.log(`${system.name} - security: ${system.securityStatus.toFixed(2)}`);
}

sde.close();
```

### Enrich ESI API responses with SDE data

```ts
import { EsiClient } from '@lgriffin/esi.ts';
import { SdeLocalEngine } from '@lgriffin/esi.ts/sde';

const esi = new EsiClient();
const sde = new SdeLocalEngine({ databasePath: './eve-sde.sqlite' });

// ESI returns numeric IDs - SDE resolves them to names
const orders = await esi.market.getRegionOrders(10000002, 34);

const typeInfo = sde.getType(34);
const regionInfo = sde.getRegion(10000002);

console.log(`Market: ${typeInfo?.name} in ${regionInfo?.name}`);
console.log(`  Volume per unit: ${typeInfo?.volume} m³`);
console.log(`  Active orders: ${orders.length}`);

// Enrich each order with location names
for (const order of orders.slice(0, 5)) {
  const system = sde.getSolarSystem(order.system_id);
  console.log(`  ${order.price} ISK x${order.volume_remain} at ${system?.name ?? order.system_id}`);
}

sde.close();
esi.shutdown();
```

### Check SDE version

```ts
import { SdeLocalEngine } from '@lgriffin/esi.ts/sde';

const sde = new SdeLocalEngine({ databasePath: './eve-sde.sqlite' });

const version = sde.getVersion();
console.log(`SDE Version: ${version.version}`);
console.log(`Built: ${version.buildDate}`);
console.log(`Imported: ${version.importedAt}`);
if (version.checksum) {
  console.log(`Checksum: ${version.checksum}`);
}

sde.close();
```

## Using MemorySdeProvider for Testing

You don't need SQLite to test SDE-dependent code. Use `MemorySdeProvider` with `SdeTestDataFactory`:

```ts
import { MemorySdeProvider, SdeTestDataFactory } from '@lgriffin/esi.ts/sde';

// Create a provider with a complete hierarchy of test data
const sde = new MemorySdeProvider(SdeTestDataFactory.createHierarchicalTestData());

// Use it the same way as SdeLocalEngine
const type = sde.getType(34);
console.log(type?.name); // "Tritanium"

sde.close();
```

### Custom test data

```ts
import { MemorySdeProvider, SdeTestDataFactory } from '@lgriffin/esi.ts/sde';

const sde = new MemorySdeProvider({
  types: [
    SdeTestDataFactory.createEveType({ typeId: 587, name: 'Rifter', groupId: 25 }),
    SdeTestDataFactory.createEveType({ typeId: 603, name: 'Merlin', groupId: 25 }),
  ],
  groups: [
    SdeTestDataFactory.createEveGroup({ groupId: 25, name: 'Frigate', categoryId: 6 }),
  ],
  categories: [
    SdeTestDataFactory.createEveCategory({ categoryId: 6, name: 'Ship' }),
  ],
});

const frigates = sde.getTypesByGroup(25);
console.log(frigates.map(f => f.name)); // ['Rifter', 'Merlin']

sde.close();
```

### In Jest tests

```ts
import { MemorySdeProvider, SdeTestDataFactory } from '@lgriffin/esi.ts/sde';
import type { IStaticDataProvider } from '@lgriffin/esi.ts/sde';

describe('MyMarketService', () => {
  let sde: IStaticDataProvider;

  beforeEach(() => {
    sde = new MemorySdeProvider(SdeTestDataFactory.createHierarchicalTestData());
  });

  afterEach(() => {
    sde.close();
  });

  it('should resolve type names', () => {
    const type = sde.getType(34);
    expect(type?.name).toBe('Tritanium');
  });

  it('should navigate type hierarchy', () => {
    const type = sde.getType(34);
    const group = sde.getGroup(type!.groupId);
    const category = sde.getCategory(group!.categoryId);
    expect(category?.name).toBe('Material');
  });
});
```

## Error Handling

```ts
import {
  SdeLocalEngine,
  isSdeDatabaseError,
  isSdeError,
} from '@lgriffin/esi.ts/sde';

// Handle missing database
try {
  const sde = new SdeLocalEngine({ databasePath: './missing.sqlite' });
} catch (err) {
  if (isSdeDatabaseError(err)) {
    console.error('Could not open SDE database:', err.message);
    console.error('Original error:', err.cause);
  }
}

// Handle missing dependency
try {
  const sde = new SdeLocalEngine({ databasePath: './eve-sde.sqlite' });
} catch (err) {
  if (isSdeError(err) && err.message.includes('better-sqlite3')) {
    console.error('Install better-sqlite3: npm install better-sqlite3');
  }
}
```

## Writing a Custom Provider

Implement `IStaticDataProvider` to use any data source:

```ts
import type { IStaticDataProvider } from '@lgriffin/esi.ts/sde';
import type {
  EveType, EveGroup, EveCategory,
  Region, Constellation, SolarSystem, Stargate,
} from '@lgriffin/esi.ts/sde';
import type { SdeVersionInfo } from '@lgriffin/esi.ts/sde';

class JsonFileSdeProvider implements IStaticDataProvider {
  private data: Record<string, unknown>;

  constructor(jsonPath: string) {
    this.data = JSON.parse(require('fs').readFileSync(jsonPath, 'utf-8'));
  }

  getType(typeId: number): EveType | null {
    return (this.data.types as EveType[])?.find(t => t.typeId === typeId) ?? null;
  }

  // ... implement remaining methods

  close(): void {
    this.data = {};
  }
}
```

## Configuration Options

### SdeLocalEngine

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `databasePath` | `string` | (required) | Path to the SQLite database file |
| `walMode` | `boolean` | `true` | Enable WAL journal mode for better concurrent read performance |
| `validateOnRead` | `boolean` | `false` | Validate each row against Zod schemas on read. Enable during development, disable in production for performance |

## Available Entities

| Entity | Example | ID Field |
|--------|---------|----------|
| `EveType` | Tritanium, Rifter, Raven | `typeId` |
| `EveGroup` | Mineral, Frigate, Cruiser | `groupId` |
| `EveCategory` | Material, Ship, Module | `categoryId` |
| `Region` | The Forge, Domain | `regionId` |
| `Constellation` | Kimotoro, Throne Worlds | `constellationId` |
| `SolarSystem` | Jita, Amarr, Dodixie | `systemId` |
| `Stargate` | Jita-Perimeter gate | `stargateId` |

## Hierarchy Relationships

```
EveCategory (e.g., "Ship")
    └── EveGroup (e.g., "Frigate")
            └── EveType (e.g., "Rifter")

Region (e.g., "The Forge")
    └── Constellation (e.g., "Kimotoro")
            └── SolarSystem (e.g., "Jita")
                    └── Stargate (e.g., Jita → Perimeter)
```
