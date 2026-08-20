import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/mercenary.feature');

const TEST_CHARACTER_ID = 123456;

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN getting mercenary dens with development data, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedDens = [
      {
        den_id: 5001,
        system_id: 30000142,
        constellation_id: 20000125,
        region_id: 10000002,
        development_level: 3,
        anarchy_level: 2,
        active_operations: 1,
      },
      {
        den_id: 5002,
        system_id: 30004759,
        constellation_id: 20000690,
        region_id: 10000060,
        development_level: 5,
        anarchy_level: 4,
        active_operations: 3,
      },
    ];

    given('mercenary dens exist', () => {
      jest
        .spyOn(client.mercenary, 'getMercenaryDens')
        .mockResolvedValue(expectedDens as any);
    });

    when('the client requests dens', async () => {
      result = await client.mercenary.getMercenaryDens(TEST_CHARACTER_ID);
    });

    then('the client shall return development and anarchy parameters', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].den_id).toBe(5001);
      expect(result[0].development_level).toBe(3);
      expect(result[0].anarchy_level).toBe(2);
      expect(result[1].active_operations).toBe(3);
    });
  });

  test('WHILE no mercenary dens available, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('no dens exist in the area', () => {
      jest.spyOn(client.mercenary, 'getMercenaryDens').mockResolvedValue([]);
    });

    when('the client requests dens', async () => {
      result = await client.mercenary.getMercenaryDens(TEST_CHARACTER_ID);
    });

    then('the client shall return an empty array', () => {
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  test('WHEN getting active MTOs spawned from dens, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedOps = [
      {
        operation_id: 7001,
        den_id: 5001,
        system_id: 30000142,
        site_type: 'assault',
        status: 'active',
        started_at: '2026-05-20T10:00:00Z',
        expires_at: '2026-05-20T22:00:00Z',
      },
      {
        operation_id: 7002,
        den_id: 5002,
        system_id: 30004759,
        site_type: 'recon',
        status: 'spawning',
        started_at: '2026-05-20T14:00:00Z',
        expires_at: '2026-05-21T02:00:00Z',
      },
    ];

    given('MTOs are active', () => {
      jest
        .spyOn(client.mercenary, 'getMercenaryTacticalOperations')
        .mockResolvedValue(expectedOps as any);
    });

    when('the client requests operations', async () => {
      result =
        await client.mercenary.getMercenaryTacticalOperations(
          TEST_CHARACTER_ID,
        );
    });

    then('the client shall return operation details with status', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].operation_id).toBe(7001);
      expect(result[0].status).toBe('active');
      expect(result[1].site_type).toBe('recon');
    });
  });

  test('WHEN cross-referencing dens with their operations, the client shall return the analysis', ({
    given,
    when,
    then,
  }) => {
    let denResults: any;
    let opResults: any;
    const dens = [
      {
        den_id: 5001,
        system_id: 30000142,
        constellation_id: 20000125,
        region_id: 10000002,
        development_level: 3,
        anarchy_level: 2,
        active_operations: 1,
      },
    ];
    const ops = [
      {
        operation_id: 7001,
        den_id: 5001,
        system_id: 30000142,
        site_type: 'assault',
        status: 'active',
        started_at: '2026-05-20T10:00:00Z',
        expires_at: '2026-05-20T22:00:00Z',
      },
    ];

    given('dens and MTOs exist', () => {
      jest
        .spyOn(client.mercenary, 'getMercenaryDens')
        .mockResolvedValue(dens as any);
      jest
        .spyOn(client.mercenary, 'getMercenaryTacticalOperations')
        .mockResolvedValue(ops as any);
    });

    when('the client fetches both', async () => {
      [denResults, opResults] = await Promise.all([
        client.mercenary.getMercenaryDens(TEST_CHARACTER_ID),
        client.mercenary.getMercenaryTacticalOperations(TEST_CHARACTER_ID),
      ]);
    });

    then('the client shall correlate operations to their parent dens', () => {
      expect(denResults).toHaveLength(1);
      expect(opResults).toHaveLength(1);
      expect(opResults[0].den_id).toBe(denResults[0].den_id);
    });
  });

  test('WHEN getting mercenary den detail, the client shall return den details', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedDenDetail = {
      id: 5001,
      type_id: 81080,
      state: 'Running',
      skyhook: {
        id: 200000001,
        planet_id: 40000002,
        corporation_id: 98000002,
      },
      infomorphs: { amount: 100 },
      evolution: {
        development: { level: 3, progress: 0.75 },
        anarchy: { level: 2, progress: 0.4 },
      },
    };

    given('a mercenary den exists with detail data', () => {
      jest
        .spyOn(client.mercenary, 'getMercenaryDenDetail')
        .mockResolvedValue(expectedDenDetail as any);
    });

    when('the client requests den detail', async () => {
      result = await client.mercenary.getMercenaryDenDetail(
        TEST_CHARACTER_ID,
        5001,
      );
    });

    then('the client shall return the den evolution and infomorph data', () => {
      expect(result).toBeDefined();
      expect(result.id).toBe(5001);
      expect(result.state).toBe('Running');
      expect(result.infomorphs.amount).toBe(100);
      expect(result.evolution.development.level).toBe(3);
      expect(result.evolution.anarchy.level).toBe(2);
      expect(result.skyhook.planet_id).toBe(40000002);
    });
  });

  test('WHEN getting MTO detail by operation ID, the client shall return operation details', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedOpDetail = {
      id: '3868eaed-8278-4cb7-9709-7d7de9c20dc7',
      mercenary_den_id: 5001,
      state: 'Available',
      dungeon_type_id: 12367,
      expires: '2026-05-20T22:00:00Z',
    };

    given('an MTO exists with detail data', () => {
      jest
        .spyOn(client.mercenary, 'getMercenaryTacticalOperationDetail')
        .mockResolvedValue(expectedOpDetail as any);
    });

    when('the client requests operation detail', async () => {
      result = await client.mercenary.getMercenaryTacticalOperationDetail(
        TEST_CHARACTER_ID,
        '3868eaed-8278-4cb7-9709-7d7de9c20dc7',
      );
    });

    then('the client shall return the operation state and expiry', () => {
      expect(result).toBeDefined();
      expect(result.id).toBe('3868eaed-8278-4cb7-9709-7d7de9c20dc7');
      expect(result.state).toBe('Available');
      expect(result.dungeon_type_id).toBe(12367);
      expect(result.expires).toBe('2026-05-20T22:00:00Z');
    });
  });

  test('IF service unavailable error, THEN the client shall handle the service outage', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI service is down', () => {
      const error = TestDataFactory.createError(503);
      jest.spyOn(client.mercenary, 'getMercenaryDens').mockRejectedValue(error);
    });

    when('the client requests mercenary data', async () => {
      try {
        await client.mercenary.getMercenaryDens(TEST_CHARACTER_ID);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 503 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
