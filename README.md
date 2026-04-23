# ESI.ts

[![npm version](https://badge.fury.io/js/%40lgriffin%2Fesi.ts.svg)](https://badge.fury.io/js/%40lgriffin%2Fesi.ts)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![CI/CD Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml)
[![PR Validation](https://github.com/lgriffin/ESI.ts/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/pr-validation.yml)

A type-safe TypeScript client for the [EVE Online ESI API](https://esi.evetech.net/).

- Typed responses for all endpoints
- ETag caching with Cache-Control TTL, stale-on-error, and write invalidation
- Automatic offset-based pagination and cursor-based pagination support
- Rate limiting with header-driven backoff
- 32 domain clients covering the full ESI surface

## Installation

```bash
npm install @lgriffin/esi.ts
```

### Building from Source

```bash
git clone https://github.com/lgriffin/ESI.ts.git
cd ESI.ts
npm install        # installs dependencies and compiles (via the prepare script)
```

If you've already installed and just need to recompile:

```bash
npm run build
```

Verify everything works:

```bash
npm run example:status   # quick smoke test — checks ESI is reachable
npm test                 # run the full test suite
```

## Quick Start

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();

// Public data — no auth required
const alliances = await client.alliance.getAlliances();
const character = await client.characters.getCharacterPublicInfo(1689391488);
const system = await client.universe.getSystemById(30000142);
const prices = await client.market.getMarketPrices();

// Authenticated data — token read from ESI_ACCESS_TOKEN env var
const authedClient = new EsiClient();
const assets = await authedClient.assets.getCharacterAssets(characterId);
const wallet = await authedClient.wallet.getCharacterWallet(characterId);

// Clean up when done
await client.shutdown();
```

## Configuration

```typescript
const client = new EsiClient({
  clientId: 'my-app', // User-Agent identifier (default: 'esi-client')
  accessToken: 'your-token', // EVE SSO token for authenticated endpoints
  baseUrl: 'https://esi.evetech.net', // ESI base URL (default)
  timeout: 30000, // Request timeout in ms (default: 30000)
  retryAttempts: 3, // Retry count (default: 3)
  enableETagCache: true, // ETag caching (default: true)
  etagCacheConfig: {
    maxEntries: 1000, // Max cached responses (default: 1000)
    defaultTtl: 300000, // Fallback TTL in ms (default: 5 min)
    cleanupInterval: 60000, // Expired entry cleanup interval (default: 1 min)
  },
});
```

The access token can be updated at runtime:

```typescript
client.setAccessToken('new-token');
```

## Authentication

Many ESI endpoints require an EVE SSO access token. There are three ways to provide one:

### 1. Environment variable (recommended)

Set `ESI_ACCESS_TOKEN` in your environment or a `.env` file. The client reads it automatically — no token in source code.

```bash
# Copy the example and fill in your token
cp .env.example .env
```

```env
ESI_ACCESS_TOKEN=your-eve-sso-access-token
ESI_CLIENT_ID=my-app-name
```

If you use a `.env` loader like [dotenv](https://www.npmjs.com/package/dotenv), load it before creating the client:

```typescript
import 'dotenv/config';
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();
// Token is picked up from process.env.ESI_ACCESS_TOKEN
```

### 2. Constructor parameter

Pass the token directly (useful for apps that manage tokens themselves):

```typescript
const client = new EsiClient({ accessToken: token });
```

### 3. Runtime update

Set or refresh the token after construction:

```typescript
client.setAccessToken(newToken);
```

### Getting an EVE SSO token

1. Register an application at [EVE Developers](https://developers.eveonline.com/)
2. Set a callback URL and select the ESI scopes your app needs
3. Implement the [OAuth2 flow](https://docs.esi.evetech.net/docs/sso/) to obtain an access token
4. Access tokens expire — use the refresh token to get new ones

### Environment variables reference

| Variable           | Description                                  | Default                   |
| ------------------ | -------------------------------------------- | ------------------------- |
| `ESI_ACCESS_TOKEN` | EVE SSO access token                         | none                      |
| `ESI_CLIENT_ID`    | User-Agent identifier                        | `esi-client`              |
| `ESI_BASE_URL`     | ESI API base URL                             | `https://esi.evetech.net` |
| `ESI_LOG_LEVEL`    | Log level (`error`, `warn`, `info`, `debug`) | `warn`                    |

## Available APIs

All clients are accessed as properties on the `EsiClient` instance. Authenticated endpoints require an access token.

| Client         | Property               | Auth | Examples                                                 |
| -------------- | ---------------------- | ---- | -------------------------------------------------------- |
| Alliance       | `client.alliance`      | Some | `getAlliances()`, `getAllianceById(id)`                  |
| Assets         | `client.assets`        | Yes  | `getCharacterAssets(id)`                                 |
| Calendar       | `client.calendar`      | Yes  | `getCharacterCalendar(id)`                               |
| Characters     | `client.characters`    | Some | `getCharacterPublicInfo(id)`, `getCharacterPortrait(id)` |
| Clones         | `client.clones`        | Yes  | `getCharacterClones(id)`                                 |
| Contacts       | `client.contacts`      | Yes  | `getCharacterContacts(id)`                               |
| Contracts      | `client.contracts`     | Yes  | `getCharacterContracts(id)`                              |
| Corporations   | `client.corporations`  | Some | `getCorporationInfo(id)`, `getCorporationMembers(id)`    |
| Dogma          | `client.dogma`         | No   | `getDogmaAttributes()`, `getDogmaEffects()`              |
| Factions       | `client.factions`      | Some | `getFactionWarStats()`                                   |
| Fittings       | `client.fittings`      | Yes  | `getFittings(id)`, `createFitting(id, body)`             |
| Fleets         | `client.fleets`        | Yes  | `getFleet(id)`, `getFleetMembers(id)`                    |
| Incursions     | `client.incursions`    | No   | `getIncursions()`                                        |
| Industry       | `client.industry`      | Some | `getCharacterIndustryJobs(id)`                           |
| Insurance      | `client.insurance`     | No   | `getInsurancePrices()`                                   |
| Killmails      | `client.killmails`     | Some | `getKillmail(id, hash)`                                  |
| Location       | `client.location`      | Yes  | `getCharacterLocation(id)`                               |
| Loyalty        | `client.loyalty`       | Yes  | `getCharacterLoyaltyPoints(id)`                          |
| Mail           | `client.mail`          | Yes  | `getCharacterMail(id)`                                   |
| Market         | `client.market`        | Some | `getMarketPrices()`, `getMarketOrders(regionId)`         |
| PI             | `client.pi`            | Yes  | `getCharacterPlanets(id)`                                |
| Route          | `client.route`         | No   | `getRoute(origin, destination)`                          |
| Search         | `client.search`        | Some | `search(characterId, query)`                             |
| Skills         | `client.skills`        | Yes  | `getCharacterSkills(id)`                                 |
| Sovereignty    | `client.sovereignty`   | No   | `getSovereigntyMap()`                                    |
| Status         | `client.status`        | No   | `getStatus()`                                            |
| UI             | `client.ui`            | Yes  | `setWaypoint(id)`                                        |
| Universe       | `client.universe`      | Some | `getSystemById(id)`, `getTypeById(id)`                   |
| Wallet         | `client.wallet`        | Yes  | `getCharacterWallet(id)`                                 |
| Wars           | `client.wars`          | No   | `getWars()`, `getWarById(id)`                            |
| Freelance Jobs | `client.freelanceJobs` | Some | `getFreelanceJobs()`, `getFreelanceJobById(id)`          |
| Meta           | `client.meta`          | No   | `getOpenApiJson()`, `getOpenApiYaml()`                   |

## Caching

ETag caching is enabled by default. The client automatically:

1. Stores ETag and response data on GET requests
2. Sends `If-None-Match` on subsequent requests
3. Returns cached data on `304 Not Modified`
4. Parses `Cache-Control: max-age` from ESI for per-endpoint TTL
5. Serves stale cached data when ESI returns 5xx errors
6. Invalidates related GET caches when POST/PUT/DELETE requests are made

```typescript
// Cache stats
const stats = client.getCacheStats();
console.log(`${stats.totalEntries}/${stats.maxEntries} entries cached`);

// Manual cache operations
client.clearCache();
client.updateCacheConfig({ maxEntries: 2000 });

// Disable caching entirely
const uncachedClient = new EsiClient({ enableETagCache: false });
```

## Cursor-based Pagination

Newer ESI routes (Freelance Jobs, and future routes) use cursor-based pagination with opaque `before`/`after` tokens in the response body. See the [ESI blog post](https://developers.eveonline.com/blog/changing-pagination-turning-a-new-page) for background.

```typescript
import { EsiClient, fetchAllCursorPages } from '@lgriffin/esi.ts';

const client = new EsiClient();

// Fetch first page — returns { cursor: { before, after }, freelance_jobs: [...] }
const page = await client.freelanceJobs.getFreelanceJobs();
console.log(page.freelance_jobs); // job records
console.log(page.cursor.after); // opaque token for next page

// Fetch next page using the cursor
const nextPage = await client.freelanceJobs.getFreelanceJobs(
  undefined,
  page.cursor.after,
);

// Auto-fetch all pages in one call
const allJobs = await fetchAllCursorPages(
  (before, after) => client.freelanceJobs.getFreelanceJobs(before, after),
  (response) => response.freelance_jobs,
  (response) => response.cursor,
);

// Authenticated endpoints — character/corporation freelance jobs
const authedClient = new EsiClient({ accessToken: 'your-token' });
const myJobs =
  await authedClient.freelanceJobs.getCharacterFreelanceJobs(characterId);
const corpJobs =
  await authedClient.freelanceJobs.getCorporationFreelanceJobs(corporationId);
```

**Polling for changes** — cursor tokens persist across sessions, so you can save the last `after` token and poll later to get only records that changed:

```typescript
// After initial scan, save the final cursor
let savedCursor = lastPage.cursor.after;

// Later: check for updates (hours, days, or weeks later)
const updates = await client.freelanceJobs.getFreelanceJobs(
  undefined,
  savedCursor,
);
if (updates.freelance_jobs.length > 0) {
  // Process changed records — duplicates are expected for modified records
  savedCursor = updates.cursor.after;
}
```

Key points:

- Cursor tokens are **opaque strings** — never parse or validate them
- An **empty result array** signals the end of the dataset (not a short page)
- **Duplicates across pages** are expected when records are modified between requests
- Existing offset-based routes (`getMarketOrders`, etc.) are unchanged

## Error Handling

API errors throw `EsiError` with `statusCode`, `message`, and `url` properties:

```typescript
import { EsiError } from '@lgriffin/esi.ts';

try {
  const alliance = await client.alliance.getAllianceById(99999999);
  console.log('Alliance:', alliance.name);
} catch (err) {
  if (err instanceof EsiError) {
    console.log(`ESI error ${err.statusCode}: ${err.message}`);
    // e.g. "ESI error 404: Resource not found"
  } else {
    console.error('Network or parse error:', err);
  }
}
```

- **204 No Content** — returns `undefined` (valid for DELETE/POST actions)
- **304 Not Modified** — handled internally, returns cached data
- **4xx/5xx** — throws `EsiError`
- **5xx with cache** — returns stale cached data instead of throwing

## Lightweight Clients

If you only need a subset of APIs, use `CustomEsiClient` or `EsiClientBuilder` to load only what you need:

```typescript
import { EsiClientBuilder } from '@lgriffin/esi.ts';

const client = new EsiClientBuilder()
  .addClients(['market', 'universe', 'characters'])
  .withClientId('my-trading-bot')
  .withAccessToken('your-token')
  .build();

const prices = await client.market?.getMarketPrices();
const system = await client.universe?.getSystemById(30000142);
```

Or create standalone single-API clients:

```typescript
import { EsiApiFactory } from '@lgriffin/esi.ts';

const marketClient = EsiApiFactory.createMarketClient({
  clientId: 'price-checker',
});
const prices = await marketClient.getMarketPrices();
```

## Examples

Runnable examples are in the `examples/` directory.

### Public Endpoints (no auth needed)

```bash
npm run example:status       # Server status — quickest smoke test
npm run example:character    # Character public info, portrait, corporation
npm run example:universe     # Solar system, constellation, region, station
npm run example:market       # Average prices + Tritanium price history
npm run example:alliance     # Alliance info + member corporations
npm run example:route        # Jita-to-Amarr route with system names
npm run example:wars         # Recent wars with aggressor/defender details
npm run example:sovereignty  # Nullsec sovereignty map + active campaigns
npm run example:industry     # Industry facilities, cost indices, insurance
npm run example:incursions   # Active incursions + faction warfare stats
npm run example:dogma        # Item type details + dogma attributes
npm run example:contracts    # Public region contracts + auction bids/items
npm run example:rate-limiting      # Rate limiter & pagination demonstration
npm run example:cursor-pagination  # Freelance Jobs with cursor pagination
```

### Authenticated Endpoints (require ESI_ACCESS_TOKEN)

These examples require an EVE SSO token with the listed scopes. Set `ESI_ACCESS_TOKEN` in your environment or `.env` file.

```bash
npm run example                    # Full character profile assembly
npm run example:wallet       # Wallet balance, journal, transactions    (esi-wallet.read_character_wallet.v1)
npm run example:skills       # Trained skills, queue, attributes        (esi-skills.read_skills.v1, esi-skills.read_skillqueue.v1)
npm run example:assets       # Asset inventory with bulk name lookup    (esi-assets.read_assets.v1)
npm run example:killmails    # Recent killmails + full details          (esi-killmails.read_killmails.v1)
npm run example:fleet        # Fleet info, members, wing/squad structure (esi-fleets.read_fleet.v1)
npm run example:mail         # Inbox headers, labels, mailing lists    (esi-mail.read_mail.v1)
npm run example:location     # Current system, online status, ship     (esi-location.read_location.v1)
npm run example:fittings     # Saved fittings + clone state + implants (esi-fittings.read_fittings.v1, esi-clones.read_clones.v1)
npm run example:contacts     # Contact list with standings + labels    (esi-characters.read_contacts.v1)
```

### Parallel Requests

```typescript
const [character, portrait, corp] = await Promise.all([
  client.characters.getCharacterPublicInfo(characterId),
  client.characters.getCharacterPortrait(characterId),
  client.corporations.getCorporationInfo(corporationId),
]);

console.log(`${character.name} [${corp.ticker}]`);
```

### Market Analysis

```typescript
const [orders, history] = await Promise.all([
  client.market.getMarketOrders(regionId),
  client.market.getMarketHistory(regionId, typeId),
]);

const buyOrders = orders.filter((o) => o.is_buy_order);
const sellOrders = orders.filter((o) => !o.is_buy_order);

console.log(`Best buy: ${Math.max(...buyOrders.map((o) => o.price))}`);
console.log(`Best sell: ${Math.min(...sellOrders.map((o) => o.price))}`);
```

## Resource Management

Always call `shutdown()` when you're done to clean up cache timers:

```typescript
const client = new EsiClient();
try {
  const status = await client.status.getStatus();
  console.log(status.server_version);
} finally {
  await client.shutdown();
}
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Code Quality Tools

The project uses a comprehensive suite of static analysis and code quality tools:

| Tool                                                                                 | Purpose                                                 | Command                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------ |
| [ESLint](https://eslint.org/)                                                        | Linting with TypeScript, security, and code smell rules | `npm run lint`                 |
| [Prettier](https://prettier.io/)                                                     | Code formatting                                         | `npm run format:check`         |
| [knip](https://knip.dev/)                                                            | Dead code and unused export detection                   | `npm run knip`                 |
| [eslint-plugin-security](https://github.com/eslint-community/eslint-plugin-security) | Security anti-pattern detection                         | Integrated into `npm run lint` |
| [eslint-plugin-sonarjs](https://github.com/SonarSource/eslint-plugin-sonarjs)        | Cognitive complexity and code smell detection           | Integrated into `npm run lint` |
| [husky](https://typicode.github.io/husky/)                                           | Git pre-commit hooks                                    | Automatic on commit            |
| [lint-staged](https://github.com/lint-staged/lint-staged)                            | Run linters on staged files only                        | Automatic on commit            |

### Available Scripts

```bash
# Development
npm run build              # Compile TypeScript
npm run lint               # Run ESLint
npm run lint:fix           # Run ESLint with auto-fix
npm run format             # Format code with Prettier
npm run format:check       # Check formatting without modifying

# Testing
npm test                   # Unit tests
npm run test:all           # Unit + improved + BDD tests
npm run coverage           # Tests with coverage report (thresholds enforced)
npm run bdd                # BDD scenario tests

# Static Analysis
npm run knip               # Detect dead code and unused exports
npm run validate:esi       # Validate endpoints against live ESI swagger spec
npm run validate           # Run all checks: lint, format, build, coverage, knip

# Documentation
npm run docs               # Generate TypeDoc API documentation
npm run docs:serve         # Serve docs locally on port 8080
```

### ESI Endpoint Validation

To verify that the codebase endpoint definitions match the live ESI swagger spec:

```bash
npm run validate:esi
```

This fetches `https://esi.evetech.net/latest/swagger.json` and reports:

- Endpoints in the codebase that are no longer in the ESI spec
- Endpoints in the ESI spec that the codebase doesn't cover
- HTTP method mismatches between codebase and spec

### Pre-commit Hooks

The project uses husky with lint-staged to run ESLint and Prettier on staged files before each commit. This is set up automatically when you run `npm install`.

### CI/CD

Every pull request runs the full validation suite:

- ESLint (with security and sonarjs plugins)
- Prettier formatting check
- TypeScript compilation
- Unit tests across Node.js 18, 20, and 22
- BDD scenario tests
- Coverage threshold enforcement (branches: 50%, functions: 50%, lines: 65%, statements: 65%)
- Dead code detection via knip
- npm security audit

See [.github/workflows/README.md](.github/workflows/README.md) for full workflow details.

## Testing

```bash
npm test          # Unit + integration tests (73 suites, 577 tests)
npm run coverage  # Tests with coverage report (thresholds enforced)
npm run bdd       # BDD scenario tests only
```

To verify against the live ESI API:

```bash
npm run example:status    # Confirms ESI connectivity and server status
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Run `npm run validate` to check everything passes
5. Open a Pull Request

## License

GPL-3.0-or-later - see the [LICENSE](LICENSE) file for details.

---

**o7**
