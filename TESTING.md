# Testing Guide for ESI.ts

## Test Structure

```
tests/
├── tdd/                          # Unit tests (one per domain client)
│   ├── alliances/AllianceClient.test.ts
│   ├── assets/AssetsClient.test.ts
│   ├── calendar/CalendarClient.test.ts
│   ├── characters/CharacterClient.test.ts
│   ├── clones/ClonesClient.test.ts
│   ├── contacts/ContactsClient.test.ts
│   ├── core/
│   │   ├── ETagCacheManager.test.ts
│   │   └── ETagIntegration.test.ts
│   ├── corporations/CorporationsClient.test.ts
│   ├── factions/FactionClient.test.ts
│   ├── fittings/FittingsClient.test.ts
│   ├── fleets/FleetClient.test.ts
│   ├── incursions/IncursionsClient.test.ts
│   ├── industry/IndustryClient.test.ts
│   ├── insurance/InsuranceClient.test.ts
│   ├── killmails/KillmailClient.test.ts
│   ├── location/LocationClient.test.ts
│   ├── loyalty/LoyaltyClient.test.ts
│   ├── mail/MailClient.test.ts
│   ├── market/MarketClient.test.ts
│   ├── pi/PiClient.test.ts
│   ├── route/RouteClient.test.ts
│   ├── search/searchClient.test.ts
│   ├── skills/SkillsClient.test.ts
│   ├── sovereignty/SovereigntyClient.test.ts
│   ├── status/StatusClient.test.ts
│   ├── ui/UiClient.test.ts
│   ├── universe/UniverseClient.test.ts
│   ├── wallet/WalletClient.test.ts
│   └── wars/WarsClient.test.ts
├── bdd-scenarios/                # BDD scenario tests
│   ├── core/
│   │   ├── bdd-alliance.test.ts
│   │   ├── bdd-character.test.ts
│   │   ├── bdd-clones.test.ts
│   │   ├── bdd-corporation.test.ts
│   │   ├── bdd-etag-caching.test.ts
│   │   ├── bdd-market.test.ts
│   │   ├── bdd-meta.test.ts
│   │   └── bdd-universe.test.ts
│   ├── integration/
│   │   └── bdd-integration-workflows.test.ts
│   └── performance/
│       └── bdd-performance.test.ts
└── bdd/
    └── simple-bdd-demo.test.ts
```

## Running Tests

```bash
# All tests (TDD + BDD) — 40 suites, 263 tests
npm test

# Watch mode for development
npm run test:watch

# With coverage report
npm run coverage
```

### Running Subsets

```bash
# BDD scenarios only
npm run bdd

# Individual BDD domains
npm run bdd:alliance
npm run bdd:character
npm run bdd:corporation
npm run bdd:market
npm run bdd:universe
npm run bdd:integration
npm run bdd:performance
```

### Live API Verification

The `examples/` directory contains scripts that hit the real ESI API (public endpoints only, no auth needed):

```bash
npm run example:status       # Quickest smoke test — server status
npm run example:character    # Character lookup
npm run example:universe     # System/constellation/region/station
npm run example:market       # Market prices + history
npm run example:alliance     # Alliance info + member corps
npm run example:route        # Route planning with system names
npm run example:wars         # Recent wars
npm run example:sovereignty  # Nullsec sovereignty map
npm run example:industry     # Industry facilities + insurance
npm run example:incursions   # Incursions + faction warfare
npm run example:dogma        # Item types + dogma attributes
```

## How Tests Work

### Configuration

A single Jest config drives all tests:

- **Config file**: `jest.unit.config.cjs`
- **Setup**: `src/config/jest/jest.setup.ts` — enables `jest-fetch-mock`, creates a shared `ApiClient`, resets rate limiter before each test
- **Global setup/teardown**: `src/config/jest/globalSetup.ts` and `globalTeardown.ts`

### Mocking

All tests use [jest-fetch-mock](https://github.com/jefflau/jest-fetch-mock) to intercept `fetch` calls. No real HTTP requests are made during tests.

```typescript
import fetchMock from 'jest-fetch-mock';

fetchMock.mockResponseOnce(JSON.stringify({ name: 'Jita' }));
const result = await universeClient.getSystemById(30000142);
expect(result.name).toBe('Jita');
```

Error scenarios mock non-200 status codes:

```typescript
fetchMock.mockResponseOnce('Not Found', { status: 404 });
await expect(client.getAllianceById(99999999)).rejects.toThrow('Resource not found');
```

### Test Helpers

**`src/core/util/testHelpers.ts`** — provides `getBody()` and `getHeaders()` wrappers used in TDD tests:

```typescript
import { getBody } from '../../../src/core/util/testHelpers';

const result = await getBody(() => allianceClient.getAllianceById(allianceId));
expect(result.name).toBe('Goonswarm Federation');
```

**`src/testing/TestDataFactory.ts`** — factory for creating mock data with sensible defaults and optional overrides:

```typescript
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

// Create mock data with defaults
const alliance = TestDataFactory.createAllianceInfo();
// => { alliance_id: 99005338, name: 'Goonswarm Federation', ticker: 'CONDI', ... }

// Override specific fields
const custom = TestDataFactory.createAllianceInfo({ name: 'My Alliance', ticker: 'TEST' });

// Create error instances
const notFound = TestDataFactory.createError(404);
// => EsiError { statusCode: 404, message: 'Resource not found' }
```

Available factory methods:

| Method | Returns |
|--------|---------|
| `createAllianceInfo()` | `AllianceInfo` |
| `createAllianceContact()` | `AllianceContact` |
| `createAllianceContactLabel()` | `AllianceContactLabel` |
| `createCharacterInfo()` | `CharacterInfo` |
| `createCharacterPortrait()` | `CharacterPortrait` |
| `createCharacterAttributes()` | `CharacterAttributes` |
| `createCharacterSkill()` | `CharacterSkill` |
| `createCharacterRoles()` | Roles object |
| `createCharacterLocation()` | Location object |
| `createCharacterSkills()` | Skills summary |
| `createCharacterAsset()` | Asset object |
| `createCorporationInfo()` | `CorporationInfo` |
| `createCorporationMemberRoles()` | Member roles object |
| `createCorporationAsset()` | Corp asset object |
| `createCorporationStructure()` | Structure object |
| `createCorporationWallet()` | Wallet division |
| `createMarketOrder()` | `MarketOrder` |
| `createMarketPrice()` | Price object |
| `createMarketHistory()` | History entry |
| `createWalletTransaction()` | `WalletTransaction` |
| `createWalletJournalEntry()` | Journal entry |
| `createContract()` | `Contract` |
| `createFleetInfo()` | Fleet object |
| `createFleetMember()` | Fleet member |
| `createFleetWing()` | Fleet wing |
| `createIndustryJob()` | Industry job |
| `createBlueprint()` | Blueprint object |
| `createSolarSystem()` | System object |
| `createStation()` | Station object |
| `createStructure()` | Structure object |
| `createItemType()` | Type object |
| `createItemGroup()` | Group object |
| `createStar()` | Star object |
| `createPlanet()` | Planet object |
| `createError(statusCode)` | `EsiError` |
| `createPerformanceTestData(size)` | Bulk test data |
| `createRealisticTestData()` | Linked alliance/corp/character |

## TDD Test Pattern

Each domain client has one test file. Tests instantiate the client directly with a mock `ApiClient`, mock the fetch response, call the method, and assert the result.

```typescript
import { AllianceClient } from '../../../src/clients/AllianceClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getBody } from '../../../src/core/util/testHelpers';
import fetchMock from 'jest-fetch-mock';

describe('AllianceClient', () => {
    let allianceClient: AllianceClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        const client = new ApiClientBuilder()
            .setClientId('test')
            .setLink('https://esi.evetech.net')
            .build();
        allianceClient = new AllianceClient(client);
    });

    it('should return alliance info', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({
            alliance_id: 99005338,
            name: 'Goonswarm Federation',
            ticker: 'CONDI'
        }));

        const result = await getBody(() => allianceClient.getAllianceById(99005338));
        expect(result.name).toBe('Goonswarm Federation');
    });

    it('should throw on 404', async () => {
        fetchMock.mockResponseOnce('Not Found', { status: 404 });
        await expect(allianceClient.getAllianceById(99999999))
            .rejects.toThrow('Resource not found');
    });
});
```

## BDD Test Pattern

BDD tests use `EsiClient` with `jest.spyOn` to mock at the client method level. Tests follow a Given/When/Then narrative structure.

```typescript
import { EsiClient } from '../../../src/EsiClient';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('Feature: Retrieve Alliance Information', () => {
    let client: EsiClient;

    beforeEach(() => {
        client = new EsiClient({ clientId: 'test-client' });
    });

    describe('Scenario: Get alliance details for valid ID', () => {
        it('Given a valid alliance ID, When I request details, Then I receive alliance info', async () => {
            // Given
            const expected = TestDataFactory.createAllianceInfo({ name: 'Goonswarm Federation' });
            jest.spyOn(client.alliance, 'getAllianceById').mockResolvedValue(expected);

            // When
            const result = await client.alliance.getAllianceById(99005338);

            // Then
            expect(result.name).toBe('Goonswarm Federation');
            expect(result).toHaveProperty('ticker');
        });
    });
});
```

### BDD Test Categories

- **Core** (`bdd-scenarios/core/`): Domain-specific scenarios — alliance, character, clones, corporation, market, meta, universe, ETag caching
- **Integration** (`bdd-scenarios/integration/`): Cross-domain workflows — character profile assembly, market analysis, fleet operations
- **Performance** (`bdd-scenarios/performance/`): Concurrent requests, large dataset handling, memory efficiency, error handling performance

## Error Handling in Tests

API errors are modeled with `EsiError` (from `src/core/util/error.ts`):

```typescript
import { EsiError } from '../../../src/core/util/error';

// The API layer throws EsiError on 4xx/5xx responses
fetchMock.mockResponseOnce('Not Found', { status: 404 });
await expect(client.getAllianceById(99999999))
    .rejects.toThrow('Resource not found');

// Or use TestDataFactory for mock errors
const error = TestDataFactory.createError(429, 'Rate limit exceeded');
jest.spyOn(client.alliance, 'getAllianceById').mockRejectedValue(error);
```

## Adding New Tests

1. **TDD test**: Create `tests/tdd/<domain>/<ClientName>.test.ts`. Mock fetch responses, call client methods, assert results.
2. **BDD test**: Add scenarios to existing files in `tests/bdd-scenarios/core/` or create new ones. Use `jest.spyOn` on `EsiClient` properties.
3. **Test data**: Add factory methods to `src/testing/TestDataFactory.ts` if new response types are needed.

All tests run through the single `jest.unit.config.cjs` config — no separate config files needed.

## Debugging

```bash
# Run a single test file
npx jest --config jest.unit.config.cjs tests/tdd/alliances/AllianceClient.test.ts

# Run tests matching a name pattern
npx jest --config jest.unit.config.cjs --testNamePattern="should return valid alliance"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --config jest.unit.config.cjs --runInBand
```
