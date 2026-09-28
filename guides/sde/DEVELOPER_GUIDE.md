# SDE Developer Guide

Guide for contributors adding entities, writing tests, or modifying the SDE module internals.

## Project Structure

The guides, this one included, live in `guides/sde/` next to [guides/SDE.md](../SDE.md); the source tree is:

```
src/sde/
├── index.ts                   # ./sde entry point
├── memory.ts                  # ./sde/memory entry point
├── errors.ts                  # Error hierarchy
├── version.ts                 # SdeVersionInfo type
├── clock.ts                   # The module's clock
├── optionalPeers.ts           # Lazy js-yaml / adm-zip loading
├── ports/
│   └── IStaticDataProvider.ts # Provider interface (99 methods)
├── domain/                    # One folder per SDE domain
│   ├── types.ts               # Barrel: every entity interface
│   ├── schemas.ts             # Barrel: every Zod schema
│   ├── universe/              # types.ts + schemas.ts
│   ├── types/                 # (and the same for dogma, industry, market,
│   │   ...                    #  characters, corporations, skins, content, ui)
│   └── version/schemas.ts     # SdeVersionSchema
├── providers/
│   ├── order.ts               # ID ordering shared by both providers
│   ├── yaml/SdeDataProvider.ts       # YAML-backed provider (production)
│   └── memory/MemorySdeProvider.ts   # In-memory provider (tests, own data)
├── ingestion/                 # YAML download + parsing pipeline
│   ├── constants.ts           # SDE_FILE_REGISTRY (102 YAML file specs)
│   ├── SdeDownloader.ts       # HTTP download from CCP
│   ├── SdeExtractor.ts        # ZIP parsing + YAML extraction
│   ├── metadata.ts            # _sde.yaml parsing
│   ├── SdeDatabaseBuilder.ts  # (legacy, unused)
│   └── transforms.ts          # Field normalization + locale extraction
└── testing/
    └── SdeTestDataFactory.ts  # Test data factories
```

The guides for the module are in `guides/sde/` and the front door is [guides/SDE.md](../SDE.md), whose "Layers inside the module" section lists which folder may import which; `npm run lint:layers` fails on a crossing.

## Adding a New Entity Type

When CCP adds a new YAML file to the SDE, follow these steps:

### 1. Define the interface in `domain/<domain>/types.ts`

```ts
/** eve_new_things [row_count rows] */
export interface NewThing {
  newThingId: number;
  name: string;
  description: string | null;
  categoryId: number;
}
```

Use normalized field names (see Field Normalization below). Add a JSDoc comment with the table name and approximate row count for reference.

### 2. Add the Zod schema in `domain/<domain>/schemas.ts`

<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
export const NewThingSchema = z.looseObject({
  newThingId: z.int(),
  name: z.string(),
  description: z.string().nullable(),
  categoryId: z.int(),
});
```

Always use `z.looseObject({})` so extra fields from the SDE are preserved rather than stripped.

### 3. Register in `ingestion/constants.ts`

Add an entry to `SDE_FILE_REGISTRY`:

<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
{
  yamlFile: 'newThings.yaml',
  tableName: 'eve_new_things',
  idAttribute: 'newThingId',
  injectId: true,
  idType: 'number',
},
```

- `yamlFile` — filename as it appears in the SDE ZIP (case-sensitive)
- `tableName` — internal table name (convention: `eve_<snake_case>`)
- `idAttribute` — the PK field name after normalization
- `injectId` — `true` if the YAML key IS the entity ID (most entities); `false` if the ID is already in the record body (e.g., dogma attributes)
- `idType` — `'number'` or `'string'` for string-keyed entities

### 4. Add methods to `ports/IStaticDataProvider.ts`

<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
// --- New Things ---
getNewThing(newThingId: number): NewThing | null;
getAllNewThings(): NewThing[];
getNewThingsByCategory(categoryId: number): NewThing[];  // if FK query needed
```

### 5. Implement in `providers/yaml/SdeDataProvider.ts`

<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
getNewThing(newThingId: number): NewThing | null {
  return this.getById<NewThing>('eve_new_things', newThingId);
}

getAllNewThings(): NewThing[] {
  return this.getAllRecords<NewThing>('eve_new_things');
}

getNewThingsByCategory(categoryId: number): NewThing[] {
  return this.getByFk<NewThing>('eve_new_things', 'categoryId', categoryId);
}
```

The generic helpers handle all the Map lookups and lazy FK indexing.

### 6. Implement in `providers/memory/MemorySdeProvider.ts`

Add the field to `MemorySdeData`:

<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
export interface MemorySdeData {
  // ... existing fields
  newThings?: NewThing[];
}
```

Register in the constructor:

<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
register('eve_new_things', data.newThings, 'newThingId');
```

Add the query methods using the generic helpers:

<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
getNewThing(newThingId: number): NewThing | null {
  return this.getById<NewThing>('eve_new_things', newThingId);
}
```

### 7. Add factory methods in `testing/SdeTestDataFactory.ts`

<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
static createNewThing(overrides: Partial<NewThing> = {}): NewThing {
  return {
    newThingId: 1,
    name: 'Test Thing',
    description: 'A test thing.',
    categoryId: 1,
    ...overrides,
  };
}
```

Use realistic default values based on actual SDE data when possible.

### 8. Export from `index.ts`

<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
export type { NewThing } from './types';
```

### 9. Write tests

See Testing Patterns below.

## Field Normalization

CCP's YAML uses `ID` suffix in uppercase (e.g., `groupID`, `solarSystemID`). The `transformRecordNative()` function normalizes these to camelCase `Id`:

```
groupID     → groupId
solarSystemID → solarSystemId
typeID      → typeId
```

The regex is: `/ID(?=[A-Z]|$)/g` → `Id`

Nested objects are recursively normalized. For example, a stargate's `destination` object:

```yaml
# CCP YAML
destination:
  solarSystemID: 30000140
  stargateID: 50000802
```

Becomes:

<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
{ destination: { solarSystemId: 30000140, stargateId: 50000802 } }
```

## Locale Extraction

CCP YAML stores localized strings as maps:

```yaml
name:
  en: 'Tritanium'
  de: 'Tritanium'
  fr: 'Tritanium'
  ja: 'トリタニウム'
```

The transform extracts the `en` locale to a plain string. If no `en` key exists, falls back to an empty string.

Detection: any object with an `en` key is treated as a locale map.

## Zod Schema Conventions

- **Always** use `z.looseObject({})` (never `z.object()`). This preserves extra fields CCP may add without breaking existing schemas.
- Use `z.int()` for integer IDs, not `z.number()`.
- Use `.nullable()` for fields that can be `null` in the SDE data.
- Use `.optional()` only for fields that may be entirely absent from some records.
- Schema names follow the pattern `<InterfaceName>Schema` (e.g., `EveTypeSchema`, `BlueprintSchema`).

## Running the Ingestion Script

```bash
# Download and extract SDE data
npx ts-node scripts/sde/sde-ingest.ts --output sde-data

# Check latest build without downloading
npx ts-node scripts/sde/sde-ingest.ts --check

# Force re-download
npx ts-node scripts/sde/sde-ingest.ts --force --output sde-data
```

The script downloads from `https://developers.eveonline.com/static-data/eve-online-static-data-latest-yaml.zip`.

## Testing Patterns

### Unit tests (`tests/tdd/sde/`)

Each entity domain has tests for:

**Schema tests** (`schemas.test.ts`):
<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
it('should accept valid data', () => {
  const data = SdeTestDataFactory.createNewThing();
  const result = NewThingSchema.parse(data);
  expect(result.newThingId).toBe(1);
});

it('should accept nullable fields as null', () => {
  const data = SdeTestDataFactory.createNewThing({ description: null });
  const result = NewThingSchema.parse(data);
  expect(result.description).toBeNull();
});

it('should preserve extra fields (looseObject)', () => {
  const data = { ...SdeTestDataFactory.createNewThing(), extraField: 'test' };
  const result = NewThingSchema.parse(data);
  expect((result as Record<string, unknown>).extraField).toBe('test');
});

it('should reject missing required fields', () => {
  expect(() => NewThingSchema.parse({ newThingId: 1 })).toThrow();
});
```

**Provider contract tests** (`IStaticDataProvider.contract.test.ts`):
<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
it('should return entity by ID', () => {
  const result = provider.getNewThing(1);
  expect(result).not.toBeNull();
  expect(result!.name).toBe('Test Thing');
});

it('should return null for unknown ID', () => {
  expect(provider.getNewThing(999999)).toBeNull();
});
```

**Factory tests** (`SdeTestDataFactory.test.ts`):
<!-- doc-example: no-check contributor example: code inside src/, not a consumer import -->

```ts
it('should create with defaults', () => {
  const thing = SdeTestDataFactory.createNewThing();
  expect(thing.newThingId).toBe(1);
});

it('should accept overrides', () => {
  const thing = SdeTestDataFactory.createNewThing({ name: 'Custom' });
  expect(thing.name).toBe('Custom');
});
```

### BDD tests (`tests/bdd/`)

Feature files in `tests/bdd/features/sde/`, each bound by a spec entry in `tests/bdd/specs/sde/` to the step library (`tests/bdd/steps/`, one step per file; fixtures in `tests/bdd/support/sde.ts`):

```gherkin
Feature: New Thing Lookup

  Scenario: WHEN looking up a new thing, the provider shall return details
    Given a static data provider with hierarchical test data
    When I look up new thing 1
    Then the thing name should be "Test Thing"
```

All BDD tests use `MemorySdeProvider` with `SdeTestDataFactory` data.

### Integration tests (`tests/integration/sde/`)

Test against real CCP SDE data (gitignored, must be downloaded locally):

```bash
npx jest --config config/jest/integration.config.cjs -- tests/integration/sde/
```

Tests are wrapped in `(canRun ? describe : describe.skip)` and skip automatically when `sde-data/` is absent.

## Validating Against Real Data

After downloading SDE data, run the integration test suite:

```bash
# Download data
npx ts-node scripts/sde/sde-ingest.ts --output sde-data

# Run integration tests (63 tests, ~60s)
npx jest --config config/jest/integration.config.cjs -- tests/integration/sde/

# Full validation (lint + format + build + coverage + all tests)
npm run validate
```

The integration tests verify:

- Well-known entity lookups (Tritanium, Jita, Caldari, etc.)
- Minimum row counts (40K+ types, 8K+ systems, 200K+ moons, etc.)
- Universe hierarchy navigation (star → planet → moon)
- Cross-entity referential integrity
- FK query methods
- Text search
- Blueprint activities
- Data quality (published types have names, valid security status ranges, market group tree integrity)
- SDE version metadata
