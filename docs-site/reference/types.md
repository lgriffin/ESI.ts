# Types Reference

## Response Types

### EsiResponse\<T\>

Returned by `withMetadata()` methods:

```typescript
interface EsiResponse<T> {
  data: T;
  meta: EsiResponseMeta;
}
```

### EsiResult\<T\>

Returned by `withSafeMode()` methods — a discriminated union:

```typescript
type EsiResult<T> =
  | { ok: true; data: T; meta: EsiResponseMeta }
  | { ok: false; error: EsiError; meta?: EsiResponseMeta };
```

### EsiResponseMeta

```typescript
interface EsiResponseMeta {
  headers: Record<string, string>;
  fromCache: boolean;
  stale: boolean;
  cacheHitType?: 'spec-ttl' | 'etag-304' | 'stale-on-error';
  rateLimit?: RateLimitMeta;
  responseTimeMs?: number;
  requestId?: string;
  warning?: object;
}
```

### RateLimitMeta

```typescript
interface RateLimitMeta {
  remaining: number;
  limit: number;
  used: number;
  group: string;
}
```

## Branded ID Types

ESI.ts uses branded types to prevent mixing up different kinds of IDs at the type level:

```typescript
import { CharacterId, CorporationId, TypeId, brand } from '@lgriffin/esi.ts';

const charId = brand<CharacterId>(1689391488);
const corpId = brand<CorporationId>(98000001);
const typeId = brand<TypeId>(34);
```

| Type            | Underlying | Description         |
| --------------- | ---------- | ------------------- |
| `CharacterId`   | `number`   | EVE character ID    |
| `CorporationId` | `number`   | Corporation ID      |
| `AllianceId`    | `number`   | Alliance ID         |
| `TypeId`        | `number`   | Item type ID        |
| `RegionId`      | `number`   | Region ID           |
| `SystemId`      | `number`   | Solar system ID     |
| `StationId`     | `number`   | Station ID          |
| `StructureId`   | `number`   | Player structure ID |
| `OrderId`       | `number`   | Market order ID     |
| `ContractId`    | `number`   | Contract ID         |
| `KillmailId`    | `number`   | Killmail ID         |
| `FactionId`     | `number`   | Faction ID          |
| `FleetId`       | `number`   | Fleet ID            |
| `PlanetId`      | `number`   | Planet ID           |
| `WarId`         | `number`   | War ID              |

## Generated Spec Types

Types generated directly from the ESI OpenAPI spec, available as the `EsiSpec` namespace:

```typescript
import { EsiSpec } from '@lgriffin/esi.ts';

const order: EsiSpec.MarketsRegionIdOrdersGet = {
  order_id: 123,
  type_id: 34,
  price: 5.5,
  // ...
};
```

Regenerate from the latest spec:

```bash
npm run generate:types
```

## Domain Types

Each domain has typed response interfaces derived from Zod schemas via `z.infer<>`. Examples:

| Domain          | Types                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Character**   | `CharacterInfo`, `CharacterPortrait`, `CharacterAffiliation`, `CharacterRole`, `JumpFatigue`, `Medal`, `Notification`, `Standing` |
| **Alliance**    | `AllianceInfo`, `AllianceContact`, `AllianceContactLabel`, `AllianceIcon`                                                         |
| **Market**      | `MarketOrder`, `MarketPrice`, `MarketHistoryEntry`, `MarketGroup`                                                                 |
| **Corporation** | `CorporationInfo`, `CorporationMember`, `CorporationStructure`                                                                    |
| **Status**      | `ServerStatus`                                                                                                                    |
| **Universe**    | `SolarSystem`, `ItemType`, `Region`, `Constellation`, `Station`, `Stargate`                                                       |

Import them from the main package:

```typescript
import type {
  CharacterInfo,
  MarketOrder,
  ServerStatus,
} from '@lgriffin/esi.ts';
```
