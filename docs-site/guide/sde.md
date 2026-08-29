# Static Data Export (SDE) Module

ESI.ts includes a standalone module for querying CCP's EVE Online Static Data Export — 102 YAML files loaded into in-memory Maps with typed interfaces, Zod validation, and ~97 query methods.

## Quick Start

```typescript
import { SdeDataProvider } from '@lgriffin/esi.ts/sde';

const sde = SdeDataProvider.fromDirectory('./sde-data');

const tritanium = sde.getType(34);
console.log(tritanium?.name); // "Tritanium"

const jita = sde.getSolarSystem(30000142);
const minerals = sde.getTypesByGroup(18);
const caldari = sde.getFaction(500001);

sde.close();
```

## Getting SDE Data

Download SDE data with the included script:

```bash
npx ts-node scripts/sde-ingest.ts --output sde-data
```

## Providers

### SdeDataProvider (SQLite)

The primary provider, backed by SQLite for persistent, disk-efficient storage:

```typescript
import { SdeDataProvider } from '@lgriffin/esi.ts/sde';
const sde = SdeDataProvider.fromDirectory('./sde-data');
```

### MemorySdeProvider

In-memory provider for testing or small datasets:

```typescript
import { MemorySdeProvider } from '@lgriffin/esi.ts/sde/memory';
const sde = new MemorySdeProvider(yamlData);
```

## Key Query Methods

The `IStaticDataProvider` interface exposes ~97 methods across these entity types:

| Category           | Methods                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------- |
| **Types**          | `getType(id)`, `getTypesByGroup(groupId)`, `getTypesByCategory(catId)`, `searchTypes(query)` |
| **Solar Systems**  | `getSolarSystem(id)`, `getSolarSystemsByConstellation(id)`, `getSolarSystemsByRegion(id)`    |
| **Regions**        | `getRegion(id)`, `getAllRegions()`                                                           |
| **Constellations** | `getConstellation(id)`, `getConstellationsByRegion(id)`                                      |
| **Factions**       | `getFaction(id)`, `getAllFactions()`                                                         |
| **Stations**       | `getStation(id)`, `getStationsBySolarSystem(id)`                                             |
| **Blueprints**     | `getBlueprint(typeId)`, `getBlueprintsByProduct(typeId)`                                     |
| **Market Groups**  | `getMarketGroup(id)`, `getMarketGroupTree()`                                                 |
| **Icons**          | `getIcon(id)`, `getIconsByCategory(category)`                                                |

## Documentation

For full details, see the SDE module documentation:

- [Module Overview](https://github.com/lgriffin/ESI.ts/blob/master/src/sde/README.md) — Quick start, API reference, entity coverage
- [Architecture](https://github.com/lgriffin/ESI.ts/blob/master/src/sde/docs/ARCHITECTURE.md) — C4 diagrams, data flow, design decisions
- [Usage Guide](https://github.com/lgriffin/ESI.ts/blob/master/src/sde/docs/USAGE.md) — Provider patterns, query examples
- [API Contracts](https://github.com/lgriffin/ESI.ts/blob/master/src/sde/docs/API_CONTRACTS.md) — Complete method reference
