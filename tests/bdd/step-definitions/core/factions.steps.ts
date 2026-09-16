import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0012-factions.feature');

/**
 * Matches exactly one ESI path. `fw/stats` would otherwise also match
 * `characters/{id}/fw/stats` and `corporations/{id}/fw/stats`.
 */
const esiPath = (path: string) =>
  new RegExp(`^https://esi\\.evetech\\.net/${path}(\\?|$)`);

const FACTION_STATS = [
  {
    faction_id: 500001,
    pilots: 15000,
    systems_controlled: 42,
    kills: { last_week: 1200, total: 500000, yesterday: 180 },
    victory_points: { last_week: 85000, total: 12000000, yesterday: 12000 },
  },
  {
    faction_id: 500002,
    pilots: 12000,
    systems_controlled: 38,
    kills: { last_week: 1100, total: 480000, yesterday: 160 },
    victory_points: { last_week: 78000, total: 11000000, yesterday: 11000 },
  },
];

const CHARACTER_STATS = {
  faction_id: 500001,
  enlisted_on: '2023-06-01T00:00:00Z',
  current_rank: 5,
  highest_rank: 7,
  kills: { last_week: 15, total: 500, yesterday: 3 },
  victory_points: { last_week: 2000, total: 85000, yesterday: 300 },
};

const CORPORATION_STATS = {
  faction_id: 500001,
  enlisted_on: '2023-01-15T00:00:00Z',
  pilots: 250,
  kills: { last_week: 120, total: 15000, yesterday: 18 },
  victory_points: { last_week: 25000, total: 1200000, yesterday: 3500 },
};

const FW_SYSTEMS = [
  {
    solar_system_id: 30002057,
    owner_faction_id: 500001,
    occupier_faction_id: 500001,
    contested: 'uncontested',
    victory_points: 0,
    victory_points_threshold: 3000,
  },
  {
    solar_system_id: 30002058,
    owner_faction_id: 500001,
    occupier_faction_id: 500002,
    contested: 'contested',
    victory_points: 1500,
    victory_points_threshold: 3000,
  },
];

const FW_WARS = [
  { faction_id: 500001, against_id: 500002 },
  { faction_id: 500003, against_id: 500004 },
];

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Every faction reports pilots, systems held, and score totals', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the FW system is active', () => {
      queueResponse({ match: esiPath('fw/stats'), body: FACTION_STATS });
    });

    when('the client requests faction warfare stats', async () => {
      result = await client.factions.getStats();
    });

    then('the client shall return stats for all factions', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toBe('/fw/stats');
      expect(result).toEqual(FACTION_STATS);
      expect(
        result.map((f: any) => [
          f.faction_id,
          f.pilots,
          f.systems_controlled,
          f.kills.total,
          f.victory_points.total,
        ]),
      ).toEqual([
        [500001, 15000, 42, 500000, 12000000],
        [500002, 12000, 38, 480000, 11000000],
      ]);
    });
  });

  test('Enlisted character reports rank and personal totals', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;

    given('a character enlisted in faction warfare', () => {
      queueResponse({
        match: esiPath(`characters/${characterId}/fw/stats`),
        body: CHARACTER_STATS,
      });
    });

    when('the client requests character FW stats', async () => {
      result = await client.factions.getCharacterStats(characterId);
    });

    then('the client shall return their personal statistics', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(`/characters/${characterId}/fw/stats`);
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(CHARACTER_STATS);
      expect(result.faction_id).toBe(500001);
      expect(result.enlisted_on).toBe('2023-06-01T00:00:00Z');
      expect(result.current_rank).toBe(5);
      expect(result.highest_rank).toBe(7);
      expect(result.kills.total).toBe(500);
      expect(result.victory_points.total).toBe(85000);
    });
  });

  test('Character statistics with an expired token', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an invalid or expired token for character stats', () => {
      queueError(403, 'token is expired', {
        match: esiPath(`characters/${characterId}/fw/stats`),
      });
    });

    when(
      'the client requests character FW stats with invalid token',
      async () => {
        try {
          await client.factions.getCharacterStats(characterId);
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then(
      'the client shall return a 403 forbidden error for character stats',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
        expect((caughtError as EsiError).statusCode).toBe(403);
        expect(sentRequests()).toHaveLength(1);
        expect(lastRequest().url.pathname).toBe(
          `/characters/${characterId}/fw/stats`,
        );
      },
    );
  });

  test('Enlisted corporation reports pilot count and corporate totals', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;

    given('a corporation enlisted in faction warfare', () => {
      queueResponse({
        match: esiPath(`corporations/${corporationId}/fw/stats`),
        body: CORPORATION_STATS,
      });
    });

    when('the client requests corporation FW stats', async () => {
      result = await client.factions.getCorporationStats(corporationId);
    });

    then('the client shall return the corporation statistics', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(
        `/corporations/${corporationId}/fw/stats`,
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(CORPORATION_STATS);
      expect(result.faction_id).toBe(500001);
      expect(result.enlisted_on).toBe('2023-01-15T00:00:00Z');
      expect(result.pilots).toBe(250);
      expect(result.kills.total).toBe(15000);
      expect(result.victory_points.total).toBe(1200000);
    });
  });

  test('Corporation statistics with an expired token', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let caughtError: any;

    given('an invalid or expired token for corporation stats', () => {
      queueError(403, 'token is expired', {
        match: esiPath(`corporations/${corporationId}/fw/stats`),
      });
    });

    when(
      'the client requests corporation FW stats with invalid token',
      async () => {
        try {
          await client.factions.getCorporationStats(corporationId);
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then(
      'the client shall return a 403 forbidden error for corporation stats',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
        expect((caughtError as EsiError).statusCode).toBe(403);
        expect(sentRequests()).toHaveLength(1);
        expect(lastRequest().url.pathname).toBe(
          `/corporations/${corporationId}/fw/stats`,
        );
      },
    );
  });

  test('Contested and uncontested systems are distinguished', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('active faction warfare systems', () => {
      queueResponse({ match: esiPath('fw/systems'), body: FW_SYSTEMS });
    });

    when('the client requests FW systems', async () => {
      result = await client.factions.getSystems();
    });

    then(
      'the client shall return system ownership and contested status',
      () => {
        expect(lastRequest().url.pathname).toBe('/fw/systems');
        expect(result).toEqual(FW_SYSTEMS);
        expect(
          result.map((s: any) => [
            s.solar_system_id,
            s.owner_faction_id,
            s.occupier_faction_id,
            s.contested,
            s.victory_points,
          ]),
        ).toEqual([
          [30002057, 500001, 500001, 'uncontested', 0],
          [30002058, 500001, 500002, 'contested', 1500],
        ]);
      },
    );
  });

  test('Active conflicts list each faction and its opponent', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('faction warfare is active', () => {
      queueResponse({ match: esiPath('fw/wars'), body: FW_WARS });
    });

    when('the client requests FW wars', async () => {
      result = await client.factions.getWars();
    });

    then('the client shall return the list of faction conflicts', () => {
      expect(lastRequest().url.pathname).toBe('/fw/wars');
      expect(result).toEqual([
        { faction_id: 500001, against_id: 500002 },
        { faction_id: 500003, against_id: 500004 },
      ]);
    });
  });

  test('Overall leaderboard ranks factions by kills and victory points', ({
    given,
    when,
    then,
  }) => {
    const expectedLeaderboard = {
      kills: {
        yesterday: [
          { faction_id: 500001, amount: 180 },
          { faction_id: 500002, amount: 160 },
        ],
        last_week: [
          { faction_id: 500001, amount: 1200 },
          { faction_id: 500002, amount: 1100 },
        ],
        active_total: [
          { faction_id: 500001, amount: 500000 },
          { faction_id: 500002, amount: 480000 },
        ],
      },
      victory_points: {
        yesterday: [
          { faction_id: 500001, amount: 12000 },
          { faction_id: 500002, amount: 11000 },
        ],
        last_week: [
          { faction_id: 500001, amount: 85000 },
          { faction_id: 500002, amount: 78000 },
        ],
        active_total: [
          { faction_id: 500001, amount: 12000000 },
          { faction_id: 500002, amount: 11000000 },
        ],
      },
    };
    let result: any;

    given('faction warfare is active for leaderboard', () => {
      queueResponse({
        match: esiPath('fw/leaderboards'),
        body: expectedLeaderboard,
      });
    });

    when('the client requests the overall leaderboard', async () => {
      result = await client.factions.getLeaderboardsOverall();
    });

    then('the client shall return faction rankings', () => {
      expect(lastRequest().url.pathname).toBe('/fw/leaderboards');
      expect(result).toEqual(expectedLeaderboard);
      expect(result.kills.yesterday).toEqual([
        { faction_id: 500001, amount: 180 },
        { faction_id: 500002, amount: 160 },
      ]);
      expect(result.victory_points.active_total[0]).toEqual({
        faction_id: 500001,
        amount: 12000000,
      });
    });
  });

  test('Character leaderboard ranks individual pilots', ({
    given,
    when,
    then,
  }) => {
    const expectedLeaderboard = {
      kills: {
        yesterday: [
          { character_id: 1689391488, amount: 25 },
          { character_id: 123456789, amount: 20 },
        ],
        last_week: [
          { character_id: 1689391488, amount: 150 },
          { character_id: 123456789, amount: 120 },
        ],
        active_total: [
          { character_id: 1689391488, amount: 5000 },
          { character_id: 123456789, amount: 4500 },
        ],
      },
      victory_points: {
        yesterday: [{ character_id: 1689391488, amount: 3000 }],
        last_week: [{ character_id: 1689391488, amount: 20000 }],
        active_total: [{ character_id: 1689391488, amount: 850000 }],
      },
    };
    let result: any;

    given('faction warfare is active for character leaderboard', () => {
      queueResponse({
        match: esiPath('fw/leaderboards/characters'),
        body: expectedLeaderboard,
      });
    });

    when('the client requests the character leaderboard', async () => {
      result = await client.factions.getLeaderboardsCharacters();
    });

    then('the client shall return top character rankings', () => {
      expect(lastRequest().url.pathname).toBe('/fw/leaderboards/characters');
      expect(result).toEqual(expectedLeaderboard);
      expect(result.kills.yesterday).toEqual([
        { character_id: 1689391488, amount: 25 },
        { character_id: 123456789, amount: 20 },
      ]);
      expect(result.victory_points.active_total).toEqual([
        { character_id: 1689391488, amount: 850000 },
      ]);
    });
  });

  test('Overview gathers stats, systems, and wars in one pass', ({
    given,
    when,
    then,
  }) => {
    let factionStats: any;
    let characterStats: any;
    let corporationStats: any;
    let fwSystems: any;
    let fwWars: any;
    const characterId = 1689391488;
    const corporationId = 1344654522;

    given('an enlisted character for overview', () => {
      // Staggered delays make the responses settle out of request order, so
      // a client that crossed responses would resolve a lookup with another's.
      queueResponse({
        match: esiPath('fw/stats'),
        body: FACTION_STATS,
        delayMs: 40,
      });
      queueResponse({
        match: esiPath(`characters/${characterId}/fw/stats`),
        body: CHARACTER_STATS,
        delayMs: 30,
      });
      queueResponse({
        match: esiPath(`corporations/${corporationId}/fw/stats`),
        body: CORPORATION_STATS,
        delayMs: 20,
      });
      queueResponse({
        match: esiPath('fw/systems'),
        body: FW_SYSTEMS,
        delayMs: 10,
      });
      queueResponse({ match: esiPath('fw/wars'), body: FW_WARS });
    });

    when('the client gathers all FW data concurrently', async () => {
      [factionStats, characterStats, corporationStats, fwSystems, fwWars] =
        await Promise.all([
          client.factions.getStats(),
          client.factions.getCharacterStats(characterId),
          client.factions.getCorporationStats(corporationId),
          client.factions.getSystems(),
          client.factions.getWars(),
        ]);
    });

    then('the client shall have a complete faction warfare picture', () => {
      expect(
        sentRequests()
          .map((r) => r.url.pathname)
          .sort(),
      ).toEqual(
        [
          '/fw/stats',
          `/characters/${characterId}/fw/stats`,
          `/corporations/${corporationId}/fw/stats`,
          '/fw/systems',
          '/fw/wars',
        ].sort(),
      );
      expect(factionStats).toEqual(FACTION_STATS);
      expect(characterStats).toEqual(CHARACTER_STATS);
      expect(corporationStats).toEqual(CORPORATION_STATS);
      expect(fwSystems).toEqual(FW_SYSTEMS);
      expect(fwWars).toEqual(FW_WARS);
    });
  });
});
