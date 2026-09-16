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

const feature = loadFeature('tests/bdd/features/core/0019-killmails.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Three recent kills for a character', ({ given, when, then }) => {
    const characterId = 1689391488;
    const expectedSummaries = [
      { killmail_id: 100001, killmail_hash: 'abc123def456' },
      { killmail_id: 100002, killmail_hash: 'ghi789jkl012' },
      { killmail_id: 100003, killmail_hash: 'mno345pqr678' },
    ];
    let result: any;

    given('an authenticated character with killmails', () => {
      queueResponse({
        match: `/characters/${characterId}/killmails/recent`,
        body: expectedSummaries,
      });
    });

    when('the client requests their recent killmails', async () => {
      result = await client.killmails.getCharacterRecentKillmails(characterId);
    });

    then('the client shall return a list of killmail summaries', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(
        new RegExp(`/characters/${characterId}/killmails/recent/?$`),
      );
      expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedSummaries);
      for (const summary of result) {
        expect(typeof summary.killmail_id).toBe('number');
        expect(typeof summary.killmail_hash).toBe('string');
      }
    });
  });

  test('Character with no recent PvP', ({ given, when, then }) => {
    const characterId = 111111111;
    let result: any;

    given('an authenticated character with no recent PvP activity', () => {
      queueResponse({
        match: `/characters/${characterId}/killmails/recent`,
        body: [],
      });
    });

    when('the client requests their killmails', async () => {
      result = await client.killmails.getCharacterRecentKillmails(characterId);
    });

    then('the client shall return an empty killmail list', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual([]);
    });
  });

  test('Full kill report with victim and attackers', ({
    given,
    when,
    then,
  }) => {
    const killmailId = 100001;
    const killmailHash = 'abc123def456';
    const expectedDetail = {
      killmail_id: killmailId,
      killmail_time: '2024-01-15T12:30:00Z',
      solar_system_id: 30000142,
      victim: {
        ship_type_id: 587,
        character_id: 987654321,
        corporation_id: 1344654522,
        damage_taken: 8200,
        position: { x: 1.0e12, y: -2.5e10, z: 3.3e11 },
        items: [
          {
            item_type_id: 3170,
            quantity_destroyed: 1,
            flag: 11,
            singleton: 0,
          },
        ],
      },
      attackers: [
        {
          character_id: 1689391488,
          corporation_id: 98000001,
          ship_type_id: 24690,
          weapon_type_id: 2929,
          damage_done: 5000,
          final_blow: true,
          security_status: 5.0,
        },
        {
          character_id: 123456789,
          corporation_id: 98000002,
          ship_type_id: 17918,
          weapon_type_id: 2961,
          damage_done: 3200,
          final_blow: false,
          security_status: 3.2,
        },
      ],
    };
    let result: any;

    given('a valid killmail ID and hash', () => {
      queueResponse({
        match: `/killmails/${killmailId}/${killmailHash}`,
        body: expectedDetail,
      });
    });

    when('the client requests the killmail details', async () => {
      result = await client.killmails.getKillmail(killmailId, killmailHash);
    });

    then('the client shall return the complete kill report', () => {
      expect(lastRequest().url.pathname).toMatch(
        new RegExp(`/killmails/${killmailId}/${killmailHash}/?$`),
      );
      expect(result.killmail_id).toBe(killmailId);
      expect(result.killmail_time).toBe('2024-01-15T12:30:00Z');
      expect(result.solar_system_id).toBe(30000142);
      expect(result.victim).toEqual(expectedDetail.victim);
      expect(result.attackers).toEqual(expectedDetail.attackers);
    });
  });

  test('Killmail hash that does not match the ID', ({ given, when, then }) => {
    const killmailId = 100001;
    const invalidHash = 'invalid_hash_value';
    let caughtError: any;

    given('an invalid killmail hash', () => {
      queueError(404, 'Killmail not found', {
        match: `/killmails/${killmailId}/${invalidHash}`,
      });
    });

    when(
      'the client requests the killmail details with invalid hash',
      async () => {
        try {
          await client.killmails.getKillmail(killmailId, invalidHash);
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then('the client shall return a 404 not found error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      // 404 is not retryable: exactly one request reached ESI.
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().url.pathname).toContain(
        `/killmails/${killmailId}/${invalidHash}`,
      );
    });
  });

  test('Five recent kills for a corporation', ({ given, when, then }) => {
    const corporationId = 1344654522;
    const expectedSummaries = [
      { killmail_id: 200001, killmail_hash: 'corp_hash_aaa' },
      { killmail_id: 200002, killmail_hash: 'corp_hash_bbb' },
      { killmail_id: 200003, killmail_hash: 'corp_hash_ccc' },
      { killmail_id: 200004, killmail_hash: 'corp_hash_ddd' },
      { killmail_id: 200005, killmail_hash: 'corp_hash_eee' },
    ];
    let result: any;

    given('an authenticated corporation member', () => {
      queueResponse({
        match: `/corporations/${corporationId}/killmails/recent`,
        body: expectedSummaries,
      });
    });

    when('the client requests corporation killmails', async () => {
      result =
        await client.killmails.getCorporationRecentKillmails(corporationId);
    });

    then('the client shall return the corporation kill feed', () => {
      const request = lastRequest();
      expect(request.url.pathname).toMatch(
        new RegExp(`/corporations/${corporationId}/killmails/recent/?$`),
      );
      expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedSummaries);
      for (const summary of result) {
        expect(typeof summary.killmail_id).toBe('number');
        expect(typeof summary.killmail_hash).toBe('string');
      }
    });
  });

  test('Summary hash feeds the detail lookup', ({ given, when, then }) => {
    const characterId = 1689391488;
    let summaryList: any;
    let detail: any;

    given('a character with recent killmails for chaining', () => {
      queueResponse({
        match: `/characters/${characterId}/killmails/recent`,
        body: [
          { killmail_id: 300001, killmail_hash: 'chain_hash_001' },
          { killmail_id: 300002, killmail_hash: 'chain_hash_002' },
        ],
      });
      queueResponse({
        match: '/killmails/300001/chain_hash_001',
        body: {
          killmail_id: 300001,
          killmail_time: '2024-01-15T14:00:00Z',
          solar_system_id: 30002187,
          victim: {
            ship_type_id: 11393,
            character_id: 555555555,
            corporation_id: 666666666,
            damage_taken: 12500,
            items: [],
          },
          attackers: [
            {
              character_id: 1689391488,
              ship_type_id: 17918,
              damage_done: 12500,
              final_blow: true,
              security_status: 5.0,
            },
          ],
        },
      });
    });

    when(
      'the client fetches summaries and then look up details for the first kill',
      async () => {
        summaryList =
          await client.killmails.getCharacterRecentKillmails(characterId);
        const firstSummary = summaryList[0];
        detail = await client.killmails.getKillmail(
          firstSummary.killmail_id,
          firstSummary.killmail_hash,
        );
      },
    );

    then('the client shall return the full kill chain', () => {
      const requests = sentRequests();
      expect(requests).toHaveLength(2);
      // The detail request is addressed by the pair the summary carried.
      expect(requests[1].url.pathname).toMatch(
        /\/killmails\/300001\/chain_hash_001\/?$/,
      );
      // The public detail endpoint does not need the character's token.
      expect(requests[1].headers['authorization']).toBeUndefined();
      expect(summaryList.map((s: any) => s.killmail_id)).toEqual([
        300001, 300002,
      ]);
      expect(detail.killmail_id).toBe(summaryList[0].killmail_id);
      expect(detail.victim.ship_type_id).toBe(11393);
      expect(detail.attackers).toHaveLength(1);
      expect(detail.attackers[0].character_id).toBe(characterId);
    });
  });

  test('Final blow and damage totals across three attackers', ({
    given,
    when,
    then,
  }) => {
    const killmailId = 400001;
    const killmailHash = '8f3b2c1d4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c';
    let result: any;
    let finalBlowAttacker: any;
    let totalDamage: number;

    given('a killmail with multiple attackers', () => {
      queueResponse({
        match: `/killmails/${killmailId}/${killmailHash}`,
        body: {
          killmail_id: killmailId,
          killmail_time: '2024-02-01T08:00:00Z',
          solar_system_id: 30000142,
          victim: {
            ship_type_id: 645,
            character_id: 333333333,
            corporation_id: 444444444,
            damage_taken: 15600,
            items: [],
          },
          attackers: [
            {
              character_id: 1689391488,
              ship_type_id: 24690,
              damage_done: 8000,
              final_blow: false,
              security_status: 5.0,
            },
            {
              character_id: 123456789,
              ship_type_id: 17918,
              damage_done: 5500,
              final_blow: false,
              security_status: 3.2,
            },
            {
              character_id: 111111111,
              ship_type_id: 587,
              damage_done: 2100,
              final_blow: true,
              security_status: 1.5,
            },
          ],
        },
      });
    });

    when('the client analyzes the attackers', async () => {
      result = await client.killmails.getKillmail(killmailId, killmailHash);
      finalBlowAttacker = result.attackers.find((a: any) => a.final_blow);
      totalDamage = result.attackers.reduce(
        (sum: number, a: any) => sum + a.damage_done,
        0,
      );
    });

    then('I shall identify the final blow dealer and total damage', () => {
      expect(
        result.attackers.map((a: any) => [
          a.character_id,
          a.damage_done,
          a.final_blow,
        ]),
      ).toEqual([
        [1689391488, 8000, false],
        [123456789, 5500, false],
        [111111111, 2100, true],
      ]);
      expect(finalBlowAttacker.character_id).toBe(111111111);
      expect(totalDamage).toBe(15600);
      expect(totalDamage).toBe(result.victim.damage_taken);
    });
  });

  test('Character killmails without a token', ({ given, when, then }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an unauthenticated killmail request', () => {
      // ESI refuses a token that lacks esi-killmails.read_killmails.v1 with 403.
      queueError(403, 'Token not valid for scope(s)', {
        match: `/characters/${characterId}/killmails/recent`,
      });
    });

    when('the client requests character killmails without auth', async () => {
      try {
        await client.killmails.getCharacterRecentKillmails(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 403 forbidden error for killmails', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
    });
  });
});
