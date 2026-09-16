import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0003-corporation.feature');

const CORPORATION_ID = 1344654522;

/** Matches the corporation record path itself, not its sub-resources. */
function corporationRecordPath(id: number): RegExp {
  return new RegExp(`/corporations/${id}/?(\\?|$)`);
}

/** The public corporation record as ESI sends it: no corporation_id field. */
function corporationRecord(overrides: Record<string, unknown> = {}) {
  const { corporation_id: _omitted, ...record } =
    TestDataFactory.createCorporationInfo();
  return { ...record, ...overrides };
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Public profile for a known corporation ID', ({ given, when, then }) => {
    let result: any;
    const expectedCorporation = corporationRecord({
      name: 'GoonWaffe',
      ticker: 'GEWNS',
      alliance_id: 99005338,
      ceo_id: 1689391488,
      creator_id: 1689391488,
      date_founded: '2010-06-01T00:00:00Z',
      member_count: 15000,
    });

    given('a valid corporation ID', () => {
      queueResponse({
        match: corporationRecordPath(CORPORATION_ID),
        body: expectedCorporation,
      });
    });

    when('the client requests public information', async () => {
      result = await client.corporations.getCorporationInfo(CORPORATION_ID);
    });

    then('the client shall return complete corporation profile', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(
        corporationRecordPath(CORPORATION_ID),
      );
      expect(result).toEqual(expectedCorporation);
      expect(result.name).toBe('GoonWaffe');
      expect(result.ticker).toBe('GEWNS');
      expect(result.alliance_id).toBe(99005338);
      expect(result.ceo_id).toBe(1689391488);
      expect(result.member_count).toBe(15000);
      // ESI's GET /corporations/{id} carries no corporation_id in its body;
      // the Rule's promise of one is not something the client can keep.
      expect(result.corporation_id).toBe(CORPORATION_ID);
    });
  });

  test('Unknown corporation ID rejects the request', ({
    given,
    when,
    then,
  }) => {
    const invalidCorporationId = 999999999;
    let caughtError: any;

    given('an invalid corporation ID', () => {
      queueError(404, 'Corporation not found', {
        match: corporationRecordPath(invalidCorporationId),
      });
    });

    when(
      'the client requests public information for the invalid corporation',
      async () => {
        try {
          await client.corporations.getCorporationInfo(invalidCorporationId);
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then('the client shall return a not found error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Member character IDs for an authenticated director', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedMembers = [1689391488, 1689391489, 1689391490];

    given('an authenticated corporation director', () => {
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/members`,
        body: expectedMembers,
      });
    });

    when('the client requests member list', async () => {
      result = await client.corporations.getCorporationMembers(CORPORATION_ID);
    });

    then('the client shall return member character IDs', () => {
      const request = lastRequest();
      expect(request.url.pathname).toMatch(
        new RegExp(`/corporations/${CORPORATION_ID}/members/?$`),
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedMembers);
      for (const id of result) {
        expect(typeof id).toBe('number');
      }
    });
  });

  test('Role assignments for a corporation member', ({ given, when, then }) => {
    let result: any;
    const expectedRoles = [
      TestDataFactory.createCorporationMemberRoles({
        character_id: 1689391488,
        roles: ['Director', 'Personnel_Manager'],
        grantable_roles: ['Hangar_Take_1', 'Hangar_Take_2'],
        roles_at_hq: ['Director'],
        roles_at_base: [],
        roles_at_other: [],
      }),
      TestDataFactory.createCorporationMemberRoles({
        character_id: 1689391489,
        roles: ['Accountant'],
        grantable_roles: [],
        roles_at_hq: [],
        roles_at_base: [],
        roles_at_other: [],
      }),
    ];

    given('an authenticated corporation director for roles', () => {
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/roles`,
        body: expectedRoles,
      });
    });

    when('the client requests member roles', async () => {
      result = await client.corporations.getCorporationRoles(CORPORATION_ID);
    });

    then('the client shall return role assignments', () => {
      const request = lastRequest();
      expect(request.url.pathname).toMatch(
        new RegExp(`/corporations/${CORPORATION_ID}/roles/?$`),
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedRoles);
      expect(result.map((r: any) => r.character_id)).toEqual([
        1689391488, 1689391489,
      ]);
      expect(result[0].roles).toEqual(['Director', 'Personnel_Manager']);
      expect(result[1].roles).toEqual(['Accountant']);
    });
  });

  test('Blueprint inventory entries for an authenticated member', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedBlueprints = [
      {
        item_id: 1000000000001,
        type_id: 688,
        quantity: -1,
        location_id: 60003760,
        location_flag: 'CorpSAG1',
        material_efficiency: 10,
        time_efficiency: 20,
        runs: -1,
      },
      {
        item_id: 1000000000002,
        type_id: 1146,
        quantity: -2,
        location_id: 60003760,
        location_flag: 'CorpSAG3',
        material_efficiency: 0,
        time_efficiency: 0,
        runs: 25,
      },
    ];

    given('an authenticated corporation member', () => {
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/blueprints`,
        body: expectedBlueprints,
      });
    });

    when('the client requests corporation blueprints', async () => {
      result =
        await client.corporations.getCorporationBlueprints(CORPORATION_ID);
    });

    then('the client shall return corporation inventory', () => {
      const request = lastRequest();
      expect(request.url.pathname).toMatch(
        new RegExp(`/corporations/${CORPORATION_ID}/blueprints/?$`),
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedBlueprints);
      expect(result.map((b: any) => b.location_flag)).toEqual([
        'CorpSAG1',
        'CorpSAG3',
      ]);
    });
  });

  test('Structure entries carrying a vulnerability state', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedStructures = [
      TestDataFactory.createCorporationStructure({
        structure_id: 1021975535893,
        corporation_id: CORPORATION_ID,
        type_id: 35832,
        system_id: 30000142,
        profile_id: 101853,
        fuel_expires: '2024-02-01T12:00:00Z',
        state_timer_start: '2024-01-15T12:00:00Z',
        state_timer_end: '2024-01-22T12:00:00Z',
        state: 'shield_vulnerable',
      }),
      TestDataFactory.createCorporationStructure({
        structure_id: 1021975535894,
        corporation_id: CORPORATION_ID,
        type_id: 35825,
        system_id: 30002187,
        profile_id: 101853,
        state: 'armor_reinforce',
      }),
    ];

    given('an authenticated corporation director for structures', () => {
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/structures`,
        body: expectedStructures,
      });
    });

    when('the client requests structures', async () => {
      result =
        await client.corporations.getCorporationStructures(CORPORATION_ID);
    });

    then('the client shall return structure information', () => {
      const request = lastRequest();
      expect(request.url.pathname).toMatch(
        new RegExp(`/corporations/${CORPORATION_ID}/structures/?$`),
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedStructures);
      expect(
        result.map((s: any) => [
          s.structure_id,
          s.type_id,
          s.system_id,
          s.state,
        ]),
      ).toEqual([
        [1021975535893, 35832, 30000142, 'shield_vulnerable'],
        [1021975535894, 35825, 30002187, 'armor_reinforce'],
      ]);
    });
  });

  // The two passthrough scenarios below drive the standings endpoint. ESI's
  // standings records must still satisfy the standings schema (from_id,
  // from_type, standing), so the wallet-shaped fields ride along as extra
  // fields that the loose schema has to preserve.
  test('Wallet division records returned by the standings call', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedRecords = [
      {
        from_id: 500001,
        from_type: 'faction',
        standing: 5.5,
        ...TestDataFactory.createCorporationWallet({
          division: 1,
          balance: 1000000000.0,
        }),
      },
      {
        from_id: 1000125,
        from_type: 'npc_corp',
        standing: -2.1,
        ...TestDataFactory.createCorporationWallet({
          division: 2,
          balance: 500000000.0,
        }),
      },
    ];

    given('an authenticated corporation accountant', () => {
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/standings`,
        body: expectedRecords,
      });
    });

    when(
      'the client requests corporation standings returning wallet divisions',
      async () => {
        result = (await client.corporations.getCorporationStandings(
          CORPORATION_ID,
        )) as any;
      },
    );

    then('the client shall return wallet divisions', () => {
      expect(lastRequest().url.pathname).toMatch(
        new RegExp(`/corporations/${CORPORATION_ID}/standings/?$`),
      );
      expect(result).toEqual(expectedRecords);
      expect(result.map((r: any) => [r.division, r.balance])).toEqual([
        [1, 1000000000.0],
        [2, 500000000.0],
      ]);
    });
  });

  test('Wallet journal records returned by the standings call', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedRecords = [
      {
        from_id: 3008416,
        from_type: 'agent',
        standing: 1.25,
        ...TestDataFactory.createWalletJournalEntry({
          id: 1000000001,
          date: '2024-01-15T12:00:00Z',
          ref_type: 'market_transaction',
          first_party_id: CORPORATION_ID,
          amount: 1000000.0,
          balance: 1000000000.0,
          reason: 'Market transaction',
          description: 'Sold items on market',
        }),
      },
    ];

    given('an authenticated corporation accountant for journal', () => {
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/standings`,
        body: expectedRecords,
      });
    });

    when(
      'the client requests corporation standings returning journal entries',
      async () => {
        result = (await client.corporations.getCorporationStandings(
          CORPORATION_ID,
        )) as any;
      },
    );

    then('the client shall return transaction history', () => {
      expect(result).toEqual(expectedRecords);
      expect(result[0]).toMatchObject({
        id: 1000000001,
        date: '2024-01-15T12:00:00Z',
        ref_type: 'market_transaction',
        amount: 1000000.0,
      });
    });
  });

  test('Missing director role on the member list rejects the request', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('a member without director roles', () => {
      queueError(403, 'Character does not have required role(s)', {
        match: `/corporations/${CORPORATION_ID}/members`,
      });
    });

    when('the client accesses restricted data', async () => {
      try {
        await client.corporations.getCorporationMembers(CORPORATION_ID);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a forbidden error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Invalid token on the blueprints endpoint rejects the request', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('invalid authentication credentials', () => {
      queueError(401, 'authorization not valid', {
        match: `/corporations/${CORPORATION_ID}/blueprints`,
      });
    });

    when('the client accesses corporation data', async () => {
      try {
        await client.corporations.getCorporationBlueprints(CORPORATION_ID);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return an authentication error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(401);
      expect(lastRequest().headers.authorization).toBe(
        'Bearer bdd-access-token',
      );
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Member list of ten thousand IDs', ({ given, when, then }) => {
    let result: any;
    let responseTime: number;
    const largeMemberList = Array.from(
      { length: 10000 },
      (_, i) => 1689391488 + i,
    );

    given('a large corporation with many members', () => {
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/members`,
        body: largeMemberList,
      });
    });

    when('the client requests member data', async () => {
      const startTime = Date.now();
      result = await client.corporations.getCorporationMembers(CORPORATION_ID);
      const endTime = Date.now();
      responseTime = endTime - startTime;
    });

    then('the client shall handle large data sets efficiently', () => {
      expect(result).toHaveLength(10000);
      expect(result).toEqual(largeMemberList);
      expect(responseTime).toBeLessThan(1000);
    });
  });

  test('Three corporation profiles fetched at once', ({
    given,
    when,
    then,
  }) => {
    let results: any[];
    const corporationIds = [1344654522, 1344654523, 1344654524];

    given('multiple concurrent corporation data requests', () => {
      for (const id of corporationIds) {
        queueResponse({
          match: corporationRecordPath(id),
          body: corporationRecord({
            name: `Corporation ${id}`,
            ticker: `CORP${id.toString().slice(-2)}`,
          }),
          // Answer in reverse order so a mixed-up pairing cannot line up by luck.
          delayMs: (5 - (id % 10)) * 10,
        });
      }
    });

    when('the client makes them simultaneously', async () => {
      const promises = corporationIds.map((id) =>
        client.corporations.getCorporationInfo(id),
      );
      results = await Promise.all(promises);
    });

    then('all requests shall complete successfully', () => {
      expect(sentRequests()).toHaveLength(3);
      expect(results.map((r: any) => r.name)).toEqual(
        corporationIds.map((id) => `Corporation ${id}`),
      );
      expect(results.map((r: any) => r.ticker)).toEqual([
        'CORP22',
        'CORP23',
        'CORP24',
      ]);
    });
  });

  test('Concurrent fetch of profile, members, standings, and structures', ({
    given,
    when,
    then,
  }) => {
    let corporation: any;
    let members: any;
    let standings: any;
    let structures: any;
    const mockCorporation = corporationRecord({ name: 'GoonWaffe' });
    const mockMembers = [1689391488, 1689391489];
    const mockStandings = [
      { from_id: 500001, from_type: 'faction', standing: 5.5 },
    ];
    const mockStructures = [
      TestDataFactory.createCorporationStructure({
        structure_id: 1021975535893,
        corporation_id: CORPORATION_ID,
      }),
    ];

    given('a corporation ID for profile assembly', () => {
      queueResponse({
        match: corporationRecordPath(CORPORATION_ID),
        body: mockCorporation,
      });
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/members`,
        body: mockMembers,
      });
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/standings`,
        body: mockStandings,
      });
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/structures`,
        body: mockStructures,
      });
    });

    when('the client gathers complete corporation data', async () => {
      [corporation, members, standings, structures] = await Promise.all([
        client.corporations.getCorporationInfo(CORPORATION_ID),
        client.corporations.getCorporationMembers(CORPORATION_ID),
        client.corporations.getCorporationStandings(CORPORATION_ID),
        client.corporations.getCorporationStructures(CORPORATION_ID),
      ]);
    });

    then(
      'the client shall successfully retrieve all corporation information',
      () => {
        expect(sentRequests()).toHaveLength(4);
        expect(corporation).toEqual(mockCorporation);
        expect(members).toEqual(mockMembers);
        expect(standings).toEqual(mockStandings);
        expect(structures).toEqual(mockStructures);
      },
    );
  });
});
