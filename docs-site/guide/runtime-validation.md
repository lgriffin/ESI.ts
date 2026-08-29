# Runtime Validation

ESI.ts validates API responses at runtime using [Zod](https://zod.dev/) schemas, catching data shape changes from CCP before they cause bugs in your application.

## How It Works

All GET endpoints have Zod schemas. When a response arrives, it's parsed through the schema before being returned. If the shape doesn't match, an `EsiValidationError` is thrown immediately.

Validation is **on by default**. Extra fields from ESI are preserved via `z.looseObject()` passthrough mode — new fields added by CCP flow through untouched.

```typescript
const client = new EsiClient();

// Validation happens automatically on every GET
const character = await client.characters.getCharacterPublicInfo(12345);
```

## Disabling Validation

```typescript
// Disable globally
const rawClient = new EsiClient({ validateResponse: false });
```

## Request Body Validation

For POST/PUT/DELETE endpoints, opt-in request body validation ensures outgoing payloads match the endpoint schema:

```typescript
const client = new EsiClient({ validateRequest: true });

// Throws EsiValidationError if body doesn't match the endpoint's requestSchema
await client.mail.sendMail(characterId, {
  recipients: [{ recipient_id: 12345, recipient_type: 'character' }],
  subject: 'Hello',
  body: 'Message body',
});
```

## Using Schemas Directly

Import schemas for your own validation:

```typescript
import { MarketOrderSchema } from '@lgriffin/esi.ts/schemas';

const result = MarketOrderSchema.safeParse(someData);
if (result.success) {
  console.log(result.data.price);
} else {
  console.log(result.error.issues);
}
```

All schemas follow the `*Schema` naming convention (e.g., `CharacterInfoSchema`, `AllianceInfoSchema`, `ServerStatusSchema`).

## Handling Validation Errors

```typescript
import { isValidationError } from '@lgriffin/esi.ts';

try {
  await client.characters.getCharacterPublicInfo(12345);
} catch (err) {
  if (isValidationError(err)) {
    console.log('Schema mismatch:', err.validationError);
    console.log('Endpoint:', err.url);
  }
}
```

## Schema Design

Schemas use `z.looseObject({})` (not `z.object()`) so extra fields from ESI are preserved. This means:

- **Known fields** are typed and validated
- **Unknown fields** pass through without error
- Your code won't break when CCP adds new fields to existing endpoints

See [guides/RUNTIME-VALIDATION.md](https://github.com/lgriffin/ESI.ts/blob/master/guides/RUNTIME-VALIDATION.md) for the full guide.
