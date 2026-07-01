import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/skyhooks.feature');

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
      result = await client.skyhooks.getSovereigntyHubs();
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
      result = await client.skyhooks.getOrbitalSkyhooks();
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
        await client.skyhooks.getSovereigntyHubs();
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 503 skyhooks error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
