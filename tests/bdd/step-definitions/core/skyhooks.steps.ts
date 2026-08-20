import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/skyhooks.feature');

const TEST_CORPORATION_ID = 98000002;

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN getting sovereignty hubs as Upwell structures, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedHubs = [
      {
        structure_id: 100000001,
        system_id: 30000142,
        corporation_id: 98000002,
        alliance_id: 99000006,
        online: true,
        remaining_reagents: 500,
        installed_upgrades: [1, 2, 3],
      },
      {
        structure_id: 100000002,
        system_id: 30004759,
        corporation_id: 98000003,
        alliance_id: 99000001,
        online: false,
        remaining_reagents: 0,
        installed_upgrades: [],
      },
    ];

    given('sovereignty hubs exist', () => {
      jest
        .spyOn(client.skyhooks, 'getSovereigntyHubs')
        .mockResolvedValue(expectedHubs as any);
    });

    when('the client requests hubs', async () => {
      result = await client.skyhooks.getSovereigntyHubs(TEST_CORPORATION_ID);
    });

    then(
      'the client shall return hub data with online status and upgrades',
      () => {
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        expect(result[0].online).toBe(true);
        expect(result[0].installed_upgrades).toEqual([1, 2, 3]);
        expect(result[1].online).toBe(false);
      },
    );
  });

  test('WHEN getting orbital skyhooks with silo data, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedSkyhooks = [
      {
        structure_id: 200000001,
        system_id: 30000142,
        corporation_id: 98000002,
        alliance_id: 99000006,
        online: true,
        reagent_silo_capacity: 1000,
        reagent_silo_level: 750,
      },
    ];

    given('orbital skyhooks are deployed', () => {
      jest
        .spyOn(client.skyhooks, 'getOrbitalSkyhooks')
        .mockResolvedValue(expectedSkyhooks as any);
    });

    when('the client requests skyhooks', async () => {
      result = await client.skyhooks.getOrbitalSkyhooks(TEST_CORPORATION_ID);
    });

    then('the client shall return silo capacity and levels', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].reagent_silo_capacity).toBe(1000);
      expect(result[0].reagent_silo_level).toBe(750);
    });
  });

  test('WHEN getting skyhooks that are currently raidable, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedRaidable = [
      {
        structure_id: 200000001,
        system_id: 30000142,
        corporation_id: 98000002,
        alliance_id: 99000006,
        raidable_at: '2026-05-20T12:00:00Z',
        is_raidable: true,
      },
      {
        structure_id: 200000002,
        system_id: 30004759,
        corporation_id: 98000003,
        alliance_id: 99000001,
        raidable_at: '2026-05-21T08:00:00Z',
        is_raidable: false,
      },
    ];

    given('raidable skyhooks exist across New Eden', () => {
      jest
        .spyOn(client.skyhooks, 'getRaidableSkyhooks')
        .mockResolvedValue(expectedRaidable as any);
    });

    when('the client requests raidable skyhooks', async () => {
      result = await client.skyhooks.getRaidableSkyhooks();
    });

    then('the client shall return the raidable list', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      const raidableNow = result.filter((s: any) => s.is_raidable);
      expect(raidableNow).toHaveLength(1);
      expect(raidableNow[0].structure_id).toBe(200000001);
    });
  });

  test('WHEN getting skyhook detail, the client shall return detailed skyhook data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedDetail = {
      id: 200000001,
      planet_id: 40000002,
      state: 'ShieldVulnerable',
      is_active: true,
      effective_workforce: 1000,
      reagents: [
        {
          type_id: 81143,
          secured_stock: 1000,
          unsecured_stock: 300,
          last_cycle: '2026-05-20T12:00:00Z',
        },
      ],
      theft_vulnerability: {
        start: '2026-05-20T12:00:00Z',
        end: '2026-05-20T16:00:00Z',
      },
    };

    given('a skyhook exists with detail data', () => {
      jest
        .spyOn(client.skyhooks, 'getSkyhookDetail')
        .mockResolvedValue(expectedDetail as any);
    });

    when('the client requests skyhook detail', async () => {
      result = await client.skyhooks.getSkyhookDetail(
        TEST_CORPORATION_ID,
        200000001,
      );
    });

    then('the client shall return reagents and state information', () => {
      expect(result).toBeDefined();
      expect(result.id).toBe(200000001);
      expect(result.state).toBe('ShieldVulnerable');
      expect(result.is_active).toBe(true);
      expect(result.reagents).toHaveLength(1);
      expect(result.reagents[0].type_id).toBe(81143);
      expect(result.theft_vulnerability.start).toBe('2026-05-20T12:00:00Z');
    });
  });

  test('WHEN getting sovereignty hub detail, the client shall return detailed hub data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedDetail = {
      id: 100000001,
      solar_system_id: 30000142,
      upgrades: [{ type_id: 32458, power_state: 'Online' }],
      reagent_bay: {
        last_updated: '2026-05-20T12:00:00Z',
        reagents: [{ type_id: 81143, amount: 500, burning_per_hour: 10 }],
      },
      resources: {
        power: { available: 100, used: 60 },
        workforce: { available: 1000, used: 750 },
      },
      workforce_transport: {},
      vulnerability_window: {
        start: '2026-05-23T12:00:00Z',
        end: '2026-05-23T16:00:00Z',
      },
    };

    given('a sovereignty hub exists with detail data', () => {
      jest
        .spyOn(client.skyhooks, 'getSovereigntyHubDetail')
        .mockResolvedValue(expectedDetail as any);
    });

    when('the client requests sovereignty hub detail', async () => {
      result = await client.skyhooks.getSovereigntyHubDetail(
        TEST_CORPORATION_ID,
        100000001,
      );
    });

    then('the client shall return upgrades and resource information', () => {
      expect(result).toBeDefined();
      expect(result.id).toBe(100000001);
      expect(result.solar_system_id).toBe(30000142);
      expect(result.upgrades).toHaveLength(1);
      expect(result.upgrades[0].power_state).toBe('Online');
      expect(result.reagent_bay.reagents).toHaveLength(1);
      expect(result.resources.power.available).toBe(100);
      expect(result.vulnerability_window.start).toBe('2026-05-23T12:00:00Z');
    });
  });

  test('IF service unavailable error for skyhooks, THEN the client shall handle the service outage', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI service is down for skyhooks', () => {
      const error = TestDataFactory.createError(503);
      jest
        .spyOn(client.skyhooks, 'getSovereigntyHubs')
        .mockRejectedValue(error);
    });

    when('the client requests skyhook data', async () => {
      try {
        await client.skyhooks.getSovereigntyHubs(TEST_CORPORATION_ID);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 503 skyhooks error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
