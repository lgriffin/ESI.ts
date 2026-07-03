# Runtime Response Validation

ESI.ts validates API responses at runtime using [Zod](https://zod.dev/) schemas. When ESI returns data that doesn't match the expected shape — a renamed field, a changed type, a missing required property — the library catches it immediately instead of silently passing bad data to your application.

## Why Runtime Validation?

TypeScript interfaces only exist at compile time. If CCP changes the ESI API (adds a required field, renames a property, changes a type), your code still compiles but silently receives wrong data. Zod schemas check the actual JSON at runtime, turning silent data corruption into an explicit error.

## How It Works

Every ESI endpoint has a Zod schema that describes its response shape. After each successful HTTP response, the JSON body is validated against the schema:

1. Response comes back from ESI
2. JSON is parsed
3. Schema validates the parsed data (if `validateResponse` is enabled)
4. Validated data is returned to your code

Validation is **on by default**. Extra fields from ESI are preserved (passthrough mode), so new fields added by CCP won't break your application.

## Configuration

### Disable validation globally

```typescript
const client = new EsiClient({
  validateResponse: false, // skip all runtime validation
});
```

### When to disable

- **Performance-critical hot paths** where microseconds matter (validation is fast but not free)
- **Consuming raw ESI data** where you handle unknown shapes yourself
- **Working around a temporary ESI schema change** before the library is updated

In practice, the validation overhead is negligible compared to network latency. Leave it on unless you have a specific reason to disable it.

## Error Handling

When validation fails, an `EsiValidationError` is thrown:

```typescript
import {
  EsiClient,
  EsiValidationError,
  isValidationError,
} from '@lgriffin/esi.ts';

const client = new EsiClient();

try {
  const character = await client.characters.getCharacterPublicInfo(12345);
} catch (err) {
  if (isValidationError(err)) {
    console.error('ESI response did not match expected schema');
    console.error('URL:', err.url);
    console.error('Details:', err.validationError); // Zod error object
  }
}
```

`EsiValidationError` extends `EsiError`, so existing error handling that catches `EsiError` will also catch validation errors. The `validationError` property contains the full Zod error with details about which fields failed validation.

## Using Schemas Directly

All Zod schemas are exported under the `schemas` namespace for direct use:

```typescript
import { schemas } from '@lgriffin/esi.ts';

// Validate data you received from another source
const result = schemas.CharacterInfoSchema.safeParse(someData);
if (result.success) {
  console.log(result.data.name); // fully typed
} else {
  console.error(result.error.issues);
}

// Parse with assertion (throws on failure)
const character = schemas.CharacterInfoSchema.parse(someData);

// Use schemas for input validation in your own API
app.post('/character', (req, res) => {
  const body = schemas.CharacterInfoSchema.parse(req.body);
  // body is fully typed and validated
});
```

## Schema Design Decisions

### Loose object mode

All schemas use Zod 4's `z.looseObject()` instead of `z.object().passthrough()`. This means:

- **Known fields** are validated against their expected types
- **Unknown fields** are preserved in the output, not stripped or rejected

This is intentional. CCP regularly adds new fields to ESI responses. Loose object mode ensures new fields flow through to your code without the library needing an update first.

### Type derivation

All TypeScript types in `src/types/` are derived from their Zod schemas using `z.infer<>`. The schemas are the single source of truth — there is no drift between the runtime validation and the compile-time types.

```typescript
// In src/schemas/character.ts
export const CharacterInfoSchema = z.looseObject({
  character_id: z.number().optional(),
  name: z.string(),
  // ...
});

// In src/types/character.ts
export type CharacterInfo = z.infer<typeof CharacterInfoSchema>;
```

### Generated types are separate

The auto-generated types in `src/types/generated/esi-spec.generated.ts` (148 interfaces from the ESI Swagger spec) are **not** converted to Zod schemas. They serve as a ground-truth reference for CI contract validation, not as consumer-facing types. The hand-written schemas in `src/schemas/` are what the library uses at runtime.

## Available Schemas

Every domain module has a corresponding schema file in `src/schemas/`. The naming convention is `<InterfaceName>Schema`:

| Module        | Schemas                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| `character`   | `CharacterInfoSchema`, `CharacterPortraitSchema`, `CharacterAttributesSchema`, ... |
| `alliance`    | `AllianceInfoSchema`, `AllianceContactSchema`, `AllianceIconSchema`, ...           |
| `corporation` | `CorporationInfoSchema`, `CorporationAllianceHistorySchema`, ...                   |
| `universe`    | `SolarSystemInfoSchema`, `TypeInfoSchema`, `StationInfoSchema`, ...                |
| `market`      | `MarketOrderSchema`, `MarketHistorySchema`                                         |
| ...           | All 31 domain modules have schemas                                                 |

Import individual schemas from `@lgriffin/esi.ts`:

```typescript
import { schemas } from '@lgriffin/esi.ts';

// Access any schema
schemas.CharacterInfoSchema;
schemas.MarketOrderSchema;
schemas.SolarSystemInfoSchema;
```

## Extending Schemas

You can extend the built-in schemas for your own validation needs:

```typescript
import { schemas } from '@lgriffin/esi.ts';
import { z } from 'zod';

// Add custom validation
const StrictCharacterSchema = schemas.CharacterInfoSchema.extend({
  name: z.string().min(3).max(37),
});

// Compose schemas
const MyResponseSchema = z.object({
  character: schemas.CharacterInfoSchema,
  alliance: schemas.AllianceInfoSchema.optional(),
});
```
