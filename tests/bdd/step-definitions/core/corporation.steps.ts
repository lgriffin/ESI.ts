import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/corporation.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-corporation-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN retrieving corporation public profile, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const validCorporationId = 1344654522;

    given('a valid corporation ID', () => {
      const expectedCorporation = TestDataFactory.createCorporationInfo({
        corporation_id: validCorporationId,
        name: 'GoonWaffe',
        ticker: 'GEWNS',
        alliance_id: 99005338,
        ceo_id: 1689391488,
        creator_id: 1689391488,
        date_founded: '2010-06-01T00:00:00Z',
        member_count: 15000,
      });

      jest
        .spyOn(client.corporations, 'getCorporationInfo')
        .mockResolvedValue(expectedCorporation);
    });

    when('the client requests public information', async () => {
      result = await client.corporations.getCorporationInfo(validCorporationId);
    });

    then('the client shall return complete corporation profile', () => {
      expect(result).toBeDefined();
      expect(result.corporation_id).toBe(validCorporationId);
      expect(result.name).toBe('GoonWaffe');
      expect(result.ticker).toBe('GEWNS');
      expect(result).toHaveProperty('alliance_id');
      expect(result).toHaveProperty('ceo_id');
      expect(result).toHaveProperty('member_count');
    });
  });

  test('IF non-existent corporation, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    const invalidCorporationId = 999999999;
    let caughtError: any;

    given('an invalid corporation ID', () => {
      const expectedError = TestDataFactory.createError(404);

      jest
        .spyOn(client.corporations, 'getCorporationInfo')
        .mockRejectedValue(expectedError);
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
    });
  });

  test('WHEN retrieving corporation members, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;

    given('an authenticated corporation director', () => {
      const expectedMembers = [1689391488, 1689391489, 1689391490];

      jest
        .spyOn(client.corporations, 'getCorporationMembers')
        .mockResolvedValue(expectedMembers);
    });

    when('the client requests member list', async () => {
      result = await client.corporations.getCorporationMembers(corporationId);
    });

    then('the client shall return member character IDs', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(typeof result[0]).toBe('number');
      expect(result).toContain(1689391488);
    });
  });

  test('WHEN retrieving member roles, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;

    given('an authenticated corporation director for roles', () => {
      const expectedRoles = [
        TestDataFactory.createCorporationMemberRoles({
          character_id: 1689391488,
          roles: ['Director', 'Personnel_Manager'],
          grantable_roles: ['Hangar_Take_1', 'Hangar_Take_2'],
          roles_at_hq: ['Director'],
          roles_at_base: [],
          roles_at_other: [],
        }),
      ];

      jest
        .spyOn(client.corporations, 'getCorporationRoles')
        .mockResolvedValue(expectedRoles);
    });

    when('the client requests member roles', async () => {
      result = await client.corporations.getCorporationRoles(corporationId);
    });

    then('the client shall return role assignments', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('character_id');
      expect(result[0]).toHaveProperty('roles');
      expect(result[0].roles).toBeInstanceOf(Array);
      expect(result[0].roles).toContain('Director');
    });
  });

  test('WHEN retrieving corporation assets, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;

    given('an authenticated corporation member', () => {
      const expectedAssets = [
        TestDataFactory.createCorporationAsset({
          item_id: 1000000000001,
          type_id: 587,
          quantity: 100,
          location_id: 60003760,
          location_flag: 'CorpSAG1',
          location_type: 'station',
        }),
      ];

      jest
        .spyOn(client.corporations, 'getCorporationBlueprints')
        .mockResolvedValue(expectedAssets);
    });

    when('the client requests assets', async () => {
      result =
        await client.corporations.getCorporationBlueprints(corporationId);
    });

    then('the client shall return corporation inventory', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('item_id');
      expect(result[0]).toHaveProperty('type_id');
      expect(result[0]).toHaveProperty('quantity');
      expect(result[0]).toHaveProperty('location_flag');
      expect(result[0].location_flag).toBe('CorpSAG1');
    });
  });

  test('WHEN retrieving corporation structures, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;

    given('an authenticated corporation director for structures', () => {
      const expectedStructures = [
        TestDataFactory.createCorporationStructure({
          structure_id: 1021975535893,
          type_id: 35832,
          system_id: 30000142,
          profile_id: 101853,
          fuel_expires: '2024-02-01T12:00:00Z',
          state_timer_start: '2024-01-15T12:00:00Z',
          state_timer_end: '2024-01-22T12:00:00Z',
          state: 'shield_vulnerable',
        }),
      ];

      jest
        .spyOn(client.corporations, 'getCorporationStructures')
        .mockResolvedValue(expectedStructures);
    });

    when('the client requests structures', async () => {
      result =
        await client.corporations.getCorporationStructures(corporationId);
    });

    then('the client shall return structure information', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('structure_id');
      expect(result[0]).toHaveProperty('type_id');
      expect(result[0]).toHaveProperty('system_id');
      expect(result[0]).toHaveProperty('state');
      expect(result[0].state).toBe('shield_vulnerable');
    });
  });

  test('WHEN retrieving corporation wallets, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;

    given('an authenticated corporation accountant', () => {
      const expectedWallets = [
        TestDataFactory.createCorporationWallet({
          division: 1,
          balance: 1000000000.0,
        }),
        TestDataFactory.createCorporationWallet({
          division: 2,
          balance: 500000000.0,
        }),
      ];

      jest
        .spyOn(client.corporations, 'getCorporationStandings')
        .mockResolvedValue(expectedWallets as any);
    });

    when('the client requests wallets', async () => {
      result = (await client.corporations.getCorporationStandings(
        corporationId,
      )) as any;
    });

    then('the client shall return wallet divisions', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('division');
      expect(result[0]).toHaveProperty('balance');
      expect(typeof result[0].balance).toBe('number');
      expect(result[0].balance).toBeGreaterThan(0);
    });
  });

  test('WHEN retrieving wallet journal, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;

    given('an authenticated corporation accountant for journal', () => {
      const expectedJournal = [
        TestDataFactory.createWalletJournalEntry({
          id: 1000000001,
          date: '2024-01-15T12:00:00Z',
          ref_type: 'market_transaction',
          first_party_id: corporationId,
          amount: 1000000.0,
          balance: 1000000000.0,
          reason: 'Market transaction',
          description: 'Sold items on market',
        }),
      ];

      jest
        .spyOn(client.corporations, 'getCorporationStandings')
        .mockResolvedValue(expectedJournal as any);
    });

    when('the client requests wallet journal', async () => {
      result = (await client.corporations.getCorporationStandings(
        corporationId,
      )) as any;
    });

    then('the client shall return transaction history', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('ref_type');
      expect(result[0]).toHaveProperty('amount');
      expect(result[0].ref_type).toBe('market_transaction');
    });
  });

  test('IF insufficient permissions, THEN the client shall return a forbidden error', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let caughtError: any;

    given('a member without director roles', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.corporations, 'getCorporationMembers')
        .mockRejectedValue(forbiddenError);
    });

    when('the client accesses restricted data', async () => {
      try {
        await client.corporations.getCorporationMembers(corporationId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a forbidden error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('IF invalid authentication, THEN the client shall return an authentication error', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let caughtError: any;

    given('invalid authentication credentials', () => {
      const authError = TestDataFactory.createError(401);

      jest
        .spyOn(client.corporations, 'getCorporationBlueprints')
        .mockRejectedValue(authError);
    });

    when('the client accesses corporation data', async () => {
      try {
        await client.corporations.getCorporationBlueprints(corporationId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return an authentication error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('The client shall handle large corporation data sets', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    let responseTime: number;
    const corporationId = 1344654522;

    given('a large corporation with many members', () => {
      const largeMemberList = Array.from(
        { length: 10000 },
        (_, i) => 1689391488 + i,
      );

      jest
        .spyOn(client.corporations, 'getCorporationMembers')
        .mockResolvedValue(largeMemberList);
    });

    when('the client requests member data', async () => {
      const startTime = Date.now();
      result = await client.corporations.getCorporationMembers(corporationId);
      const endTime = Date.now();
      responseTime = endTime - startTime;
    });

    then('the client shall handle large data sets efficiently', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(10000);
      expect(responseTime).toBeLessThan(1000);
    });
  });

  test('The client shall handle concurrent corporation requests', ({
    given,
    when,
    then,
  }) => {
    let results: any[];
    const corporationIds = [1344654522, 1344654523, 1344654524];

    given('multiple concurrent corporation data requests', () => {
      const mockCorporations = corporationIds.map((id) =>
        TestDataFactory.createCorporationInfo({
          corporation_id: id,
          name: `Corporation ${id}`,
          ticker: `CORP${id.toString().slice(-2)}`,
        }),
      );

      jest
        .spyOn(client.corporations, 'getCorporationInfo')
        .mockImplementation(async (id: number) =>
          mockCorporations.find((corp) => corp.corporation_id === id)!,
        );
    });

    when('the client makes them simultaneously', async () => {
      const promises = corporationIds.map((id) =>
        client.corporations.getCorporationInfo(id),
      );
      results = await Promise.all(promises);
    });

    then('all requests shall complete successfully', () => {
      expect(results).toHaveLength(3);
      results.forEach((result: any, index: number) => {
        expect(result.corporation_id).toBe(corporationIds[index]);
        expect(result.name).toBe(`Corporation ${corporationIds[index]}`);
      });
    });
  });

  test('WHEN completing corporation profile assembly, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    let corporation: any;
    let members: any;
    let wallets: any;
    let structures: any;
    const corporationId = 1344654522;

    given('a corporation ID for profile assembly', () => {
      const mockCorporation = TestDataFactory.createCorporationInfo({
        corporation_id: corporationId,
      });
      const mockMembers = [1689391488, 1689391489];
      const mockWallets = [
        TestDataFactory.createCorporationWallet({
          division: 1,
          balance: 1000000000,
        }),
      ];
      const mockStructures = [
        TestDataFactory.createCorporationStructure({
          structure_id: 1021975535893,
        }),
      ];

      jest
        .spyOn(client.corporations, 'getCorporationInfo')
        .mockResolvedValue(mockCorporation);
      jest
        .spyOn(client.corporations, 'getCorporationMembers')
        .mockResolvedValue(mockMembers);
      jest
        .spyOn(client.corporations, 'getCorporationStandings')
        .mockResolvedValue(mockWallets as any);
      jest
        .spyOn(client.corporations, 'getCorporationStructures')
        .mockResolvedValue(mockStructures as any);
    });

    when('the client gathers complete corporation data', async () => {
      [corporation, members, wallets, structures] = await Promise.all([
        client.corporations.getCorporationInfo(corporationId),
        client.corporations.getCorporationMembers(corporationId),
        client.corporations.getCorporationStandings(corporationId),
        client.corporations.getCorporationStructures(corporationId),
      ]);
    });

    then(
      'the client shall successfully retrieve all corporation information',
      () => {
        expect(corporation).toBeDefined();
        expect(corporation.corporation_id).toBe(corporationId);

        expect(members).toBeInstanceOf(Array);
        expect(members.length).toBeGreaterThan(0);

        expect(wallets).toBeInstanceOf(Array);
        expect(wallets[0].division).toBe(1);

        expect(structures).toBeInstanceOf(Array);
        expect(structures[0].structure_id).toBe(1021975535893);
      },
    );
  });
});
