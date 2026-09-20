# Public Endpoint Examples

These examples work without authentication — no EVE SSO token needed.

## Server Status

The quickest way to verify ESI connectivity:

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();
const status = await client.status.getStatus();

console.log(`Server: ${status.server_version}`);
console.log(`Players online: ${status.players}`);
console.log(`Started: ${status.start_time}`);
```

```bash
npm run example:status
```

## Character Lookup

Look up any character's public information:

```typescript
const client = new EsiClient();

const char = await client.characters.getCharacterPublicInfo(1689391488);
console.log(`Name: ${char.name}`);
console.log(`Corp ID: ${char.corporation_id}`);
console.log(`Birthday: ${char.birthday}`);

const portrait = await client.characters.getCharacterPortrait(1689391488);
console.log(`Portrait: ${portrait.px256x256}`);
```

## Market Data

### Average Prices

```typescript
const client = new EsiClient();
const prices = await client.market.getMarketPrices();

const tritanium = prices.find((p) => p.type_id === 34);
console.log(`Tritanium avg: ${tritanium?.average_price} ISK`);
console.log(`Tritanium adjusted: ${tritanium?.adjusted_price} ISK`);
```

### Region Orders

```typescript
const THE_FORGE = 10000002;
const orders = await client.market.getMarketOrders(THE_FORGE);

const buyOrders = orders.filter((o) => o.is_buy_order);
const sellOrders = orders.filter((o) => !o.is_buy_order);
console.log(`${buyOrders.length} buy orders, ${sellOrders.length} sell orders`);
```

### Price History

```typescript
const TRITANIUM = 34;
const THE_FORGE = 10000002;

const history = await client.market.getMarketHistory(THE_FORGE, TRITANIUM);
for (const day of history.slice(-5)) {
  console.log(`${day.date}: avg ${day.average} ISK, volume ${day.volume}`);
}
```

### Streaming Market Orders

Process large result sets without loading everything into memory:

```typescript
for await (const page of client.market.streamMarketOrders(10000002)) {
  console.log(
    `Page ${page.page}/${page.totalPages}: ${page.data.length} orders`,
  );

  for (const order of page.data) {
    if (order.is_buy_order && order.price > 1_000_000) {
      console.log(`High-value buy: type ${order.type_id} @ ${order.price} ISK`);
    }
  }
}
```

## Universe Data

```typescript
const client = new EsiClient();

// Solar system
const jita = await client.universe.getSystemById(30000142);
console.log(`${jita.name} — security: ${jita.security_status.toFixed(1)}`);

// Item type
const trit = await client.universe.getTypeById(34);
console.log(`${trit.name}: ${trit.description}`);

// Region
const forge = await client.universe.getRegionById(10000002);
console.log(`Region: ${forge.name}`);

// Bulk name resolution
const names = await client.universe.postUniverseNames([
  30000142, 34, 1689391488,
]);
for (const n of names) {
  console.log(`${n.id}: ${n.name} (${n.category})`);
}
```

## Route Planning

```typescript
const client = new EsiClient();

const JITA = 30000142;
const AMARR = 30002187;

const route = await client.route.getRoute(JITA, AMARR);
console.log(`${route.length} jumps from Jita to Amarr`);
console.log('Route:', route.join(' → '));
```

## Alliance & Corporation

```typescript
const client = new EsiClient();

// All alliances
const alliances = await client.alliance.getAlliances();
console.log(`${alliances.length} active alliances`);

// Alliance details
const goons = await client.alliance.getAllianceById(1354830081);
console.log(`${goons.name} [${goons.ticker}]`);

// Corporation details
const corp = await client.corporations.getCorporationInfo(98000001);
console.log(`${corp.name} — ${corp.member_count} members`);
```

## Sovereignty

```typescript
const client = new EsiClient();

const systems = await client.sovereignty.getSovereigntySystems();
const claimed = systems.filter((s) => s.alliance_id);
console.log(`${claimed.length} systems claimed by alliances`);
```

## Incursions

```typescript
const client = new EsiClient();

const incursions = await client.incursions.getIncursions();
for (const inc of incursions) {
  console.log(`${inc.type} — ${inc.state} in ${inc.staging_solar_system_id}`);
}
```
