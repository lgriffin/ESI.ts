# Examples

ESI.ts includes 52 runnable example scripts in the `examples/` directory, covering every domain client. Each can be run directly via npm scripts.

## Quick Test

```bash
# Fastest smoke test — no auth needed
npm run example:status
```

## Public Endpoints (No Auth)

These examples work without an EVE SSO token:

| Script             | Command                         | Description                                          |
| ------------------ | ------------------------------- | ---------------------------------------------------- |
| Server Status      | `npm run example:status`        | Check Tranquility online status and player count     |
| Character Lookup   | `npm run example:character`     | Public character info, portrait, corporation history |
| Universe Info      | `npm run example:universe`      | Solar systems, constellations, regions, stations     |
| Market Prices      | `npm run example:market`        | Average prices and Tritanium price history           |
| Market Orders      | `npm run example:market-orders` | Region market orders with filtering                  |
| Alliance Info      | `npm run example:alliance`      | Alliance details, member corps, icons                |
| Corporation        | `npm run example:corporation`   | Corporation info and public details                  |
| Sovereignty        | `npm run example:sovereignty`   | Sovereignty map and system ownership                 |
| Incursions         | `npm run example:incursions`    | Active Sansha incursions                             |
| Wars               | `npm run example:wars`          | War declarations and details                         |
| Dogma              | `npm run example:dogma`         | Dogma attributes and effects                         |
| Insurance          | `npm run example:insurance`     | Ship insurance prices                                |
| Route Planner      | `npm run example:route`         | Route calculation between systems                    |
| Streaming          | `npm run example:streaming`     | AsyncGenerator pagination demo                       |
| Freelance Jobs     | `npm run example:freelance`     | Freelance job listings                               |
| Military Campaigns | `npm run example:military`      | Military campaign data                               |
| Skyhooks           | `npm run example:skyhooks`      | Raidable orbital skyhooks                            |
| Cosmetics          | `npm run example:cosmetics`     | SKINR design data                                    |
| Paragon Hub        | `npm run example:paragon`       | Paragon marketplace listings                         |

## Authenticated Endpoints

These require `ESI_ACCESS_TOKEN` to be set:

| Script            | Command                     | Description                                |
| ----------------- | --------------------------- | ------------------------------------------ |
| Character Profile | `npm run example:profile`   | Full character profile with skills, wallet |
| Wallet            | `npm run example:wallet`    | ISK balance, journal, transactions         |
| Assets            | `npm run example:assets`    | Character asset inventory                  |
| Skills            | `npm run example:skills`    | Trained skills and skill queue             |
| Mail              | `npm run example:mail`      | EVE mail inbox                             |
| Contacts          | `npm run example:contacts`  | Contact list management                    |
| Contracts         | `npm run example:contracts` | Contract browser                           |
| Fittings & Clones | `npm run example:fittings`  | Ship fittings and clone data               |
| Industry          | `npm run example:industry`  | Industry jobs and blueprints               |
| Location          | `npm run example:location`  | Current location tracking                  |
| Loyalty & PI      | `npm run example:loyalty`   | LP balances and planetary interaction      |
| Killmails         | `npm run example:killmails` | Recent killmail data                       |
| Fleet             | `npm run example:fleet`     | Fleet operations (requires active fleet)   |
| Calendar          | `npm run example:calendar`  | Calendar events                            |
| Mercenary         | `npm run example:mercenary` | Mercenary den data                         |

## Advanced Patterns

| Script            | Command                         | Description                                 |
| ----------------- | ------------------------------- | ------------------------------------------- |
| Rate Limiting     | `npm run example:rate-limiting` | Rate limiter monitoring and group status    |
| Retry & Timeout   | `npm run example:retry`         | Retry strategy and timeout configuration    |
| Cursor Pagination | `npm run example:cursor`        | Cursor-based pagination for newer endpoints |
| Token Refresh     | `npm run example:token-refresh` | Automatic token refresh on 401              |
| Write Operations  | `npm run example:write`         | POST/PUT/DELETE lifecycle examples          |

## SDE Examples

| Script       | Command                        | Description                         |
| ------------ | ------------------------------ | ----------------------------------- |
| Basic Lookup | `npm run example:sde`          | Type, system, and faction lookups   |
| Fitting      | `npm run example:sde-fitting`  | Ship fitting analysis with SDE data |
| Industry     | `npm run example:sde-industry` | Blueprint and manufacturing data    |
| Market Tree  | `npm run example:sde-market`   | Market group hierarchy              |

## Running Examples

All examples are standalone TypeScript files. Run any of them:

```bash
# Via npm script
npm run example:status

# Or directly
npx ts-node examples/status.ts
```

For authenticated examples, set your token first:

```bash
export ESI_ACCESS_TOKEN=your-eve-sso-token
npm run example:wallet
```
