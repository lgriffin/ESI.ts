# SDE Module Architecture

## Purpose

The SDE (Static Data Export) module provides optional access to EVE Online's static game data — item types, groups, categories, regions, constellations, solar systems, and stargates. It complements the ESI API layer without altering it.

## Design Rationale

### SDE as a Complement, Not a Replacement

ESI.ts remains an OpenAPI-driven SDK for the EVE ESI API. The SDE module answers a different question:

```
ESI API  → "What are the current market orders for region 10000002?"
SDE      → "What is type_id 34? What region is 10000002?"
```

These two data sources are kept architecturally separate. ESI responses are never silently mutated with SDE data.

### Sub-Path Export

The SDE is exported as `@lgriffin/esi.ts/sde`, matching the existing pattern for `./schemas`, `./testing`, and `./errors`. This avoids a monorepo restructure while keeping the SDE cleanly separated.

### Optional Dependency

`better-sqlite3` is an optional peer dependency. Applications that don't use the SDE have no SQLite dependency. The `SdeLocalEngine` constructor throws a clear error if better-sqlite3 is not installed.

## Architecture

```
@lgriffin/esi.ts/sde
         │
    ┌────┴────┐
    │         │
  Port    Entities
    │         │
    ▼         ▼
IStaticDataProvider    EveType, EveGroup, EveCategory,
    │                  Region, Constellation, SolarSystem,
    │                  Stargate
    │
    ├── SdeLocalEngine (SQLite, better-sqlite3)
    │
    └── MemorySdeProvider (in-memory, for testing)
```

### Port / Adapter Pattern

`IStaticDataProvider` is the port — a pure interface defining the contract for static data access. Implementations are adapters:

- **SdeLocalEngine** — reads from a SQLite database file using better-sqlite3
- **MemorySdeProvider** — stores entities in Maps, used for testing and lightweight applications

Future adapters could include JSONL files, remote APIs, or browser-compatible WASM SQLite.

### Data Flow

```
CCP SDE Release (YAML/SQL)
         │
         ▼
  Ingestion Pipeline (future CLI tool)
         │
    Zod Validation
         │
         ▼
  SQLite Database File
         │
         ▼
  SdeLocalEngine (readonly)
         │
         ▼
  Application Code
```

Data is validated at the ingestion boundary using Zod schemas. The `SdeLocalEngine` opens the database in readonly mode and uses prepared statements for performance.

### Entity Model

Entities use camelCase properties (TypeScript convention) rather than the snake_case used by ESI API responses. This distinction reinforces that SDE entities are a separate domain model.

**Type Hierarchy:**
```
EveCategory (e.g., "Material")
    └── EveGroup (e.g., "Mineral")
            └── EveType (e.g., "Tritanium")
```

**Geography Hierarchy:**
```
Region (e.g., "The Forge")
    └── Constellation (e.g., "Kimotoro")
            └── SolarSystem (e.g., "Jita")
                    └── Stargate (connections to other systems)
```

### Error Taxonomy

SDE errors extend `Error` directly, not `EsiError`. They are local data access errors with no HTTP semantics:

```
Error
  └── SdeError (base)
        ├── SdeDatabaseError (open/query failures)
        ├── SdeValidationError (Zod validation failures)
        └── SdeVersionMismatchError (schema incompatibility)
```

Each error class has a corresponding type guard function (`isSdeError`, etc.).

## Database Schema

Seven tables with foreign keys and indexes:

| Table | Primary Key | Indexes |
|-------|-------------|---------|
| `sde_metadata` | `key` | — |
| `eve_categories` | `categoryId` | — |
| `eve_groups` | `groupId` | `categoryId` |
| `eve_types` | `typeId` | `groupId`, `name` |
| `eve_regions` | `regionId` | — |
| `eve_constellations` | `constellationId` | `regionId` |
| `eve_solar_systems` | `systemId` | `constellationId`, `regionId`, `name` |
| `eve_stargates` | `stargateId` | `systemId` |

The `SDE_SCHEMA_SQL` constant is exported for use by ingestion tools.

## Future Phases

- **Phase 2**: Explicit resolution — `DataResolver` to enrich ESI responses with SDE data
- **Phase 3**: OpenAPI integration — generated resolver metadata for ESI identifier fields
- **Phase 4**: Developer API — `client.sde.types`, `client.sde.systems`, entity traversal
- **Phase 5**: Domain services — market analysis, industry analysis, route planning
- **Phase 6**: SDE CLI, profiles, incremental updates, browser/serverless providers
