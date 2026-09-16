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

const feature = loadFeature('tests/bdd/features/core/0038-wars.feature');

/**
 * Match a URL whose path ends exactly at `path`, so `/wars/700001` does not
 * also serve `/wars/700001/killmails`.
 */
function exactPath(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https://esi\\.evetech\\.net${escaped}(\\?|$)`);
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('War list returns positive numeric identifiers', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('wars exist in the system', () => {
      queueResponse({
        match: exactPath('/wars'),
        body: [700005, 700004, 700003, 700002, 700001],
      });
    });

    when('the client requests the list of wars', async () => {
      result = await client.wars.getWars();
    });

    then('the client shall return an array of war IDs', () => {
      expect(lastRequest().method).toBe('GET');
      expect(lastRequest().url.pathname).toBe('/wars');
      expect(result).toEqual([700005, 700004, 700003, 700002, 700001]);
      result.forEach((warId: number) => {
        expect(typeof warId).toBe('number');
        expect(warId).toBeGreaterThan(0);
      });
    });
  });

  test('War list identifiers descend from newest to oldest', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('multiple wars exist in descending order', () => {
      queueResponse({
        match: exactPath('/wars'),
        body: [700010, 700009, 700008, 700007, 700006],
      });
    });

    when('the client requests the war list', async () => {
      result = await client.wars.getWars();
    });

    then('war IDs shall be in descending order', () => {
      expect(result).toEqual([700010, 700009, 700008, 700007, 700006]);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]).toBeGreaterThan(result[i]);
      }
    });
  });

  test('Active war returns both combatant blocks and its declaration timestamps', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an active war exists', () => {
      // ESI omits `finished` on a war that is still running.
      queueResponse({
        match: exactPath('/wars/700001'),
        body: {
          id: 700001,
          aggressor: {
            alliance_id: 99005338,
            isk_destroyed: 150000000000.0,
            ships_killed: 250,
          },
          defender: {
            alliance_id: 99000001,
            isk_destroyed: 75000000000.0,
            ships_killed: 120,
          },
          declared: '2024-01-10T00:00:00Z',
          started: '2024-01-11T00:00:00Z',
          mutual: false,
          open_for_allies: true,
        },
      });
    });

    when('the client requests the war details', async () => {
      result = await client.wars.getWarById(700001);
    });

    then('the client shall return complete war information', () => {
      expect(lastRequest().url.pathname).toBe('/wars/700001');
      expect(lastRequest().headers.authorization).toBeUndefined();
      expect(result.id).toBe(700001);
      expect(result.aggressor).toEqual({
        alliance_id: 99005338,
        isk_destroyed: 150000000000.0,
        ships_killed: 250,
      });
      expect(result.defender).toEqual({
        alliance_id: 99000001,
        isk_destroyed: 75000000000.0,
        ships_killed: 120,
      });
      expect(result.declared).toBe('2024-01-10T00:00:00Z');
      expect(result.started).toBe('2024-01-11T00:00:00Z');
      expect(result).not.toHaveProperty('finished');
    });
  });

  test('Concluded war returns a finished timestamp after its start', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a finished war exists', () => {
      queueResponse({
        match: exactPath('/wars/700002'),
        body: {
          id: 700002,
          aggressor: {
            alliance_id: 99005338,
            isk_destroyed: 500000000000.0,
            ships_killed: 800,
          },
          defender: {
            alliance_id: 99000002,
            isk_destroyed: 300000000000.0,
            ships_killed: 450,
          },
          declared: '2023-12-01T00:00:00Z',
          started: '2023-12-02T00:00:00Z',
          finished: '2024-01-01T00:00:00Z',
          mutual: false,
          open_for_allies: false,
        },
      });
    });

    when('the client requests the finished war details', async () => {
      result = await client.wars.getWarById(700002);
    });

    then('the finished timestamp shall be populated', () => {
      expect(lastRequest().url.pathname).toBe('/wars/700002');
      expect(result.id).toBe(700002);
      expect(result.finished).toBe('2024-01-01T00:00:00Z');

      const declared = new Date(result.declared).getTime();
      const started = new Date(result.started).getTime();
      const finished = new Date(result.finished).getTime();
      expect(declared).toBeLessThan(started);
      expect(started).toBeLessThan(finished);
    });
  });

  test('Mutually agreed war reports the mutual flag set', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a mutual war exists', () => {
      queueResponse({
        match: exactPath('/wars/700003'),
        body: {
          id: 700003,
          aggressor: {
            alliance_id: 99005338,
            isk_destroyed: 200000000000.0,
            ships_killed: 350,
          },
          defender: {
            alliance_id: 99000003,
            isk_destroyed: 180000000000.0,
            ships_killed: 320,
          },
          declared: '2024-01-05T00:00:00Z',
          started: '2024-01-06T00:00:00Z',
          mutual: true,
          open_for_allies: false,
        },
      });
    });

    when('the client requests the mutual war details', async () => {
      result = await client.wars.getWarById(700003);
    });

    then('the mutual flag shall be true', () => {
      expect(lastRequest().url.pathname).toBe('/wars/700003');
      expect(result.id).toBe(700003);
      expect(result.mutual).toBe(true);
      expect(result.open_for_allies).toBe(false);
    });
  });

  test('War with three kills returns an identifier and hash per summary', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a war with killmails exists', () => {
      queueResponse({
        match: exactPath('/wars/700001/killmails'),
        body: [
          { killmail_id: 90000001, killmail_hash: 'abc123def456' },
          { killmail_id: 90000002, killmail_hash: 'ghi789jkl012' },
          { killmail_id: 90000003, killmail_hash: 'mno345pqr678' },
        ],
      });
    });

    when('the client requests the war killmails', async () => {
      result = await client.wars.getWarKillmails(700001);
    });

    then('the client shall return killmail summaries', () => {
      expect(lastRequest().method).toBe('GET');
      expect(lastRequest().url.pathname).toBe('/wars/700001/killmails');
      expect(result).toEqual([
        { killmail_id: 90000001, killmail_hash: 'abc123def456' },
        { killmail_id: 90000002, killmail_hash: 'ghi789jkl012' },
        { killmail_id: 90000003, killmail_hash: 'mno345pqr678' },
      ]);
    });
  });

  test('War with no kills returns an empty killmail array', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a war with no killmails exists', () => {
      queueResponse({ match: exactPath('/wars/700004/killmails'), body: [] });
    });

    when('the client requests the war killmails for empty war', async () => {
      result = await client.wars.getWarKillmails(700004);
    });

    then('the client shall return an empty killmail array', () => {
      expect(lastRequest().url.pathname).toBe('/wars/700004/killmails');
      expect(result).toEqual([]);
    });
  });

  test('Unknown war identifier rejects the detail request with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an invalid war ID for details', () => {
      queueError(404, 'War not found', {
        match: exactPath('/wars/999999999'),
      });
    });

    when('the client requests the invalid war details', async () => {
      try {
        await client.wars.getWarById(999999999);
      } catch (e) {
        caughtError = e;
      }
    });

    then(
      'the client shall return a 404 not found error for war details',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
        expect((caughtError as EsiError).statusCode).toBe(404);
        // 404 is not retried.
        expect(sentRequests()).toHaveLength(1);
        expect(lastRequest().url.pathname).toBe('/wars/999999999');
      },
    );
  });

  test('Unknown war identifier rejects the killmail request with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an invalid war ID for killmails', () => {
      queueError(404, 'War not found', {
        match: exactPath('/wars/999999999/killmails'),
      });
    });

    when('the client requests killmails for invalid war', async () => {
      try {
        await client.wars.getWarKillmails(999999999);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 404 not found error for killmails', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().url.pathname).toBe('/wars/999999999/killmails');
    });
  });

  test('Aggressor outscores the defender on ISK destroyed and ships killed', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a war with combat data exists', () => {
      queueResponse({
        match: exactPath('/wars/700001'),
        body: {
          id: 700001,
          aggressor: {
            alliance_id: 99005338,
            isk_destroyed: 500000000000.0,
            ships_killed: 800,
          },
          defender: {
            alliance_id: 99000001,
            isk_destroyed: 200000000000.0,
            ships_killed: 300,
          },
          declared: '2024-01-10T00:00:00Z',
          started: '2024-01-11T00:00:00Z',
          mutual: false,
          open_for_allies: true,
        },
      });
    });

    when('the client analyzes the war stats', async () => {
      result = await client.wars.getWarById(700001);
    });

    then('the client shall determine the dominant side', () => {
      const aggressorIsk = result.aggressor.isk_destroyed;
      const defenderIsk = result.defender.isk_destroyed;
      const aggressorKills = result.aggressor.ships_killed;
      const defenderKills = result.defender.ships_killed;

      expect(aggressorIsk).toBe(500000000000.0);
      expect(defenderIsk).toBe(200000000000.0);
      expect(aggressorKills).toBe(800);
      expect(defenderKills).toBe(300);
      expect(aggressorIsk).toBeGreaterThan(defenderIsk);
      expect(aggressorKills).toBeGreaterThan(defenderKills);

      const totalIskDestroyed = aggressorIsk + defenderIsk;
      expect(totalIskDestroyed).toBe(700000000000.0);
      expect(aggressorIsk / totalIskDestroyed).toBeCloseTo(5 / 7);
      expect(aggressorKills + defenderKills).toBe(1100);
    });
  });

  test('War detail and killmails gathered for the same war identifier', ({
    given,
    when,
    then,
  }) => {
    let details: any;
    let killmails: any;

    given('a war ID to investigate', () => {
      queueResponse({
        match: exactPath('/wars/700001'),
        body: {
          id: 700001,
          aggressor: {
            alliance_id: 99005338,
            isk_destroyed: 150000000000.0,
            ships_killed: 250,
          },
          defender: {
            alliance_id: 99000001,
            isk_destroyed: 75000000000.0,
            ships_killed: 120,
          },
          declared: '2024-01-10T00:00:00Z',
          started: '2024-01-11T00:00:00Z',
          mutual: false,
          open_for_allies: true,
        },
      });
      queueResponse({
        match: exactPath('/wars/700001/killmails'),
        body: [
          { killmail_id: 90000001, killmail_hash: 'abc123' },
          { killmail_id: 90000002, killmail_hash: 'def456' },
        ],
      });
    });

    when(
      'the client gathers full war data including details and killmails',
      async () => {
        [details, killmails] = await Promise.all([
          client.wars.getWarById(700001),
          client.wars.getWarKillmails(700001),
        ]);
      },
    );

    then('the client shall build a complete picture of the conflict', () => {
      expect(
        sentRequests()
          .map((r) => r.url.pathname)
          .sort(),
      ).toEqual(['/wars/700001', '/wars/700001/killmails']);

      expect(details.id).toBe(700001);
      expect(details.open_for_allies).toBe(true);
      expect(details).not.toHaveProperty('finished');
      expect(
        details.aggressor.ships_killed + details.defender.ships_killed,
      ).toBe(370);

      expect(killmails).toEqual([
        { killmail_id: 90000001, killmail_hash: 'abc123' },
        { killmail_id: 90000002, killmail_hash: 'def456' },
      ]);
    });
  });
});
