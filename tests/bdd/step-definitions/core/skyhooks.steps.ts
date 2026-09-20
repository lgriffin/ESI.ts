import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  RETRYABLE_ATTEMPTS,
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0032-skyhooks.feature');

const TEST_CORPORATION_ID = 98000002;

/**
 * Match a request whose path ends exactly at `path`, so a listing route does
 * not also serve the per-structure detail route beneath it.
 */
const exactPath = (path: string): RegExp => new RegExp(`${path}(\\?|$)`);

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Hub listing reports an online hub with upgrades and an offline hub without', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedHubs = [
      {
        structure_id: 1046000000001,
        system_id: 30004759,
        corporation_id: TEST_CORPORATION_ID,
        alliance_id: 99000006,
        online: true,
        remaining_reagents: 500,
        installed_upgrades: [81615, 81619, 81621],
      },
      {
        structure_id: 1046000000002,
        system_id: 30004760,
        corporation_id: TEST_CORPORATION_ID,
        alliance_id: 99000006,
        online: false,
        remaining_reagents: 0,
        installed_upgrades: [],
      },
    ];

    given('sovereignty hubs exist', () => {
      queueResponse({
        match: exactPath(
          `/corporations/${TEST_CORPORATION_ID}/structures/sovereignty-hubs`,
        ),
        body: expectedHubs,
      });
    });

    when('the client requests hubs', async () => {
      result = await client.skyhooks.getSovereigntyHubs(TEST_CORPORATION_ID);
    });

    then(
      'the client shall return hub data with online status and upgrades',
      () => {
        expect(lastRequest().url.pathname).toBe(
          `/corporations/${TEST_CORPORATION_ID}/structures/sovereignty-hubs`,
        );
        expect(lastRequest().headers.authorization).toBe(
          'Bearer bdd-access-token',
        );
        expect(
          result.map((h: any) => [
            h.structure_id,
            h.online,
            h.installed_upgrades,
          ]),
        ).toEqual([
          [1046000000001, true, [81615, 81619, 81621]],
          [1046000000002, false, []],
        ]);
      },
    );
  });

  test('Skyhook listing reports silo capacity and current fill level', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedSkyhooks = [
      {
        structure_id: 1047000000001,
        system_id: 30004759,
        corporation_id: TEST_CORPORATION_ID,
        alliance_id: 99000006,
        online: true,
        reagent_silo_capacity: 1000,
        reagent_silo_level: 750,
      },
      {
        structure_id: 1047000000002,
        system_id: 30004760,
        corporation_id: TEST_CORPORATION_ID,
        alliance_id: 99000006,
        online: true,
        reagent_silo_capacity: 1000,
        reagent_silo_level: 120,
      },
    ];

    given('orbital skyhooks are deployed', () => {
      queueResponse({
        match: exactPath(
          `/corporations/${TEST_CORPORATION_ID}/structures/skyhooks`,
        ),
        body: expectedSkyhooks,
      });
    });

    when('the client requests skyhooks', async () => {
      result = await client.skyhooks.getOrbitalSkyhooks(TEST_CORPORATION_ID);
    });

    then('the client shall return silo capacity and levels', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporations/${TEST_CORPORATION_ID}/structures/skyhooks`,
      );
      expect(
        result.map((s: any) => [
          s.structure_id,
          s.reagent_silo_capacity,
          s.reagent_silo_level,
        ]),
      ).toEqual([
        [1047000000001, 1000, 750],
        [1047000000002, 1000, 120],
      ]);
    });
  });

  test('Raidable listing includes entries both inside and outside their raid window', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedRaidable = [
      {
        structure_id: 1047000000001,
        system_id: 30004759,
        corporation_id: 98000002,
        alliance_id: 99000006,
        raidable_at: '2026-05-20T12:00:00Z',
        is_raidable: true,
      },
      {
        structure_id: 1047000000003,
        system_id: 30001984,
        corporation_id: 98000003,
        raidable_at: '2026-05-21T08:00:00Z',
        is_raidable: false,
      },
    ];

    given('raidable skyhooks exist across New Eden', () => {
      queueResponse({ match: '/skyhooks/raidable', body: expectedRaidable });
    });

    when('the client requests raidable skyhooks', async () => {
      result = await client.skyhooks.getRaidableSkyhooks();
    });

    then('the client shall return the raidable list', () => {
      expect(lastRequest().url.pathname).toBe('/skyhooks/raidable');
      // Cluster-wide and public: no token is sent.
      expect(lastRequest().headers.authorization).toBeUndefined();
      expect(
        result.map((s: any) => [s.structure_id, s.is_raidable, s.raidable_at]),
      ).toEqual([
        [1047000000001, true, '2026-05-20T12:00:00Z'],
        [1047000000003, false, '2026-05-21T08:00:00Z'],
      ]);
    });
  });

  test('Skyhook detail returns shield state, reagent stock, and theft window', ({
    given,
    when,
    then,
  }) => {
    const skyhookId = 1047000000001;
    let result: any;
    const expectedDetail = {
      id: skyhookId,
      planet_id: 40302401,
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
        {
          type_id: 81144,
          secured_stock: 400,
          unsecured_stock: 50,
          last_cycle: '2026-05-20T12:00:00Z',
        },
      ],
      theft_vulnerability: {
        start: '2026-05-20T12:00:00Z',
        end: '2026-05-20T16:00:00Z',
      },
    };

    given('a skyhook exists with detail data', () => {
      queueResponse({
        match: exactPath(
          `/corporations/${TEST_CORPORATION_ID}/structures/skyhooks/${skyhookId}`,
        ),
        body: expectedDetail,
      });
    });

    when('the client requests skyhook detail', async () => {
      result = await client.skyhooks.getSkyhookDetail(
        TEST_CORPORATION_ID,
        skyhookId,
      );
    });

    then('the client shall return reagents and state information', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporations/${TEST_CORPORATION_ID}/structures/skyhooks/${skyhookId}`,
      );
      expect(result).toEqual(expectedDetail);
    });
  });

  test('Hub detail returns upgrade power state, reagent bay, and resource pools', ({
    given,
    when,
    then,
  }) => {
    const hubId = 1046000000001;
    let result: any;
    const expectedDetail = {
      id: hubId,
      solar_system_id: 30004759,
      upgrades: [
        { type_id: 81615, power_state: 'Online' },
        { type_id: 81619, power_state: 'Low' },
      ],
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
      queueResponse({
        match: exactPath(
          `/corporations/${TEST_CORPORATION_ID}/structures/sovereignty-hubs/${hubId}`,
        ),
        body: expectedDetail,
      });
    });

    when('the client requests sovereignty hub detail', async () => {
      result = await client.skyhooks.getSovereigntyHubDetail(
        TEST_CORPORATION_ID,
        hubId,
      );
    });

    then('the client shall return upgrades and resource information', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporations/${TEST_CORPORATION_ID}/structures/sovereignty-hubs/${hubId}`,
      );
      expect(result).toEqual(expectedDetail);
    });
  });

  test('ESI outage rejects the hub request with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI service is down for skyhooks', () => {
      // 503 is retryable, so the outage has to outlast the retry budget.
      queueError(503, 'Service unavailable', {
        match: exactPath(
          `/corporations/${TEST_CORPORATION_ID}/structures/sovereignty-hubs`,
        ),
        times: RETRYABLE_ATTEMPTS,
      });
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
      expect((caughtError as EsiError).statusCode).toBe(503);
      expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
    });
  });
});
