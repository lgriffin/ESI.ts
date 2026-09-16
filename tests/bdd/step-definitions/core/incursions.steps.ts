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

const feature = loadFeature('tests/bdd/features/core/0016-incursions.feature');

const INCURSIONS_PATH = '/incursions';

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Established and mobilizing incursions side by side', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const incursions = [
      {
        type: 'Incursion',
        state: 'established',
        influence: 0.65,
        has_boss: true,
        faction_id: 500019,
        constellation_id: 20000302,
        staging_solar_system_id: 30002082,
        infested_solar_systems: [30002082, 30002083, 30002084],
      },
      {
        type: 'Incursion',
        state: 'mobilizing',
        influence: 0.15,
        has_boss: false,
        faction_id: 500019,
        constellation_id: 20000145,
        staging_solar_system_id: 30001012,
        infested_solar_systems: [30001012, 30001013],
      },
    ];

    given('active incursions exist in the universe', () => {
      queueResponse({ match: INCURSIONS_PATH, body: incursions });
    });

    when('the client requests the incursion list', async () => {
      result = await client.incursions.getIncursions();
    });

    then('the client shall return complete incursion details', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(/\/incursions\/?$/);
      expect(request.headers.authorization).toBeUndefined();
      expect(sentRequests()).toHaveLength(1);

      expect(result).toEqual(incursions);

      const [established, mobilizing] = result;
      expect(established.type).toBe('Incursion');
      expect(established.state).toBe('established');
      expect(established.influence).toBe(0.65);
      expect(established.has_boss).toBe(true);
      expect(established.faction_id).toBe(500019);
      expect(established.constellation_id).toBe(20000302);
      expect(established.staging_solar_system_id).toBe(30002082);
      expect(established.infested_solar_systems).toEqual([
        30002082, 30002083, 30002084,
      ]);

      expect(mobilizing.state).toBe('mobilizing');
      expect(mobilizing.has_boss).toBe(false);
      expect(mobilizing.influence).toBe(0.15);
      expect(mobilizing.constellation_id).toBe(20000145);
      expect(mobilizing.infested_solar_systems).toEqual([30001012, 30001013]);
    });
  });

  test('No incursion active anywhere', ({ given, when, then }) => {
    let result: any;

    given('no incursions are active in the universe', () => {
      queueResponse({ match: INCURSIONS_PATH, body: [] });
    });

    when('the client requests the incursion list for empty state', async () => {
      result = await client.incursions.getIncursions();
    });

    then('the client shall return an empty array', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  test('Withdrawing incursion has zero influence and no boss', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an incursion in the withdrawing state', () => {
      queueResponse({
        match: INCURSIONS_PATH,
        body: [
          {
            type: 'Incursion',
            state: 'withdrawing',
            influence: 0.0,
            has_boss: false,
            faction_id: 500019,
            constellation_id: 20000020,
            staging_solar_system_id: 30000142,
            infested_solar_systems: [30000142],
          },
        ],
      });
    });

    when(
      'the client requests the incursion list for withdrawing state',
      async () => {
        result = await client.incursions.getIncursions();
      },
    );

    then('the incursion shall show zero influence and no boss', () => {
      expect(result).toHaveLength(1);
      expect(result[0].state).toBe('withdrawing');
      expect(result[0].influence).toBe(0);
      expect(result[0].has_boss).toBe(false);
      expect(result[0].constellation_id).toBe(20000020);
      expect(result[0].staging_solar_system_id).toBe(30000142);
      expect(result[0].infested_solar_systems).toEqual([30000142]);
    });
  });

  test('Three concurrent incursions in distinct constellations', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('multiple incursions in different regions', () => {
      queueResponse({
        match: INCURSIONS_PATH,
        body: [
          {
            type: 'Incursion',
            state: 'established',
            influence: 0.8,
            has_boss: true,
            faction_id: 500019,
            constellation_id: 20000302,
            staging_solar_system_id: 30002082,
            infested_solar_systems: [30002082, 30002083],
          },
          {
            type: 'Incursion',
            state: 'mobilizing',
            influence: 0.3,
            has_boss: false,
            faction_id: 500019,
            constellation_id: 20000145,
            staging_solar_system_id: 30001012,
            infested_solar_systems: [30001012],
          },
          {
            type: 'Incursion',
            state: 'established',
            influence: 0.55,
            has_boss: true,
            faction_id: 500019,
            constellation_id: 20000500,
            staging_solar_system_id: 30003500,
            infested_solar_systems: [30003500, 30003501, 30003502, 30003503],
          },
        ],
      });
    });

    when('the client requests the list of multiple incursions', async () => {
      result = await client.incursions.getIncursions();
    });

    then('each shall have unique constellation and staging system IDs', () => {
      expect(result).toHaveLength(3);
      expect(result.map((i: any) => i.constellation_id)).toEqual([
        20000302, 20000145, 20000500,
      ]);
      expect(result.map((i: any) => i.staging_solar_system_id)).toEqual([
        30002082, 30001012, 30003500,
      ]);
      expect(result.map((i: any) => i.state)).toEqual([
        'established',
        'mobilizing',
        'established',
      ]);
      expect(result[2].infested_solar_systems).toEqual([
        30003500, 30003501, 30003502, 30003503,
      ]);
    });
  });

  test('ESI answering 503 during downtime', ({ given, when, then }) => {
    let caughtError: any;

    given('the ESI service is experiencing downtime', () => {
      // 503 is retryable, so the downtime has to outlast the retry budget.
      queueError(503, 'Service Unavailable', {
        match: INCURSIONS_PATH,
        times: RETRYABLE_ATTEMPTS,
      });
    });

    when('the client requests incursions during downtime', async () => {
      try {
        await client.incursions.getIncursions();
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 503 service unavailable error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(503);
      expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
    });
  });

  test('ESI answering 500', ({ given, when, then }) => {
    let caughtError: any;

    given('an internal server error occurs', () => {
      queueError(500, 'Internal Server Error', { match: INCURSIONS_PATH });
    });

    when(
      'the client requests incursions and a server error happens',
      async () => {
        try {
          await client.incursions.getIncursions();
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then('the error shall indicate a server-side issue', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(500);
      expect((caughtError as EsiError).isServerError()).toBe(true);
      // 500 is not retried.
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Influence at both range endpoints', ({ given, when, then }) => {
    let result: any;

    given('active incursions with varying influence', () => {
      queueResponse({
        match: INCURSIONS_PATH,
        body: [
          {
            type: 'Incursion',
            state: 'established',
            influence: 0.0,
            has_boss: false,
            faction_id: 500019,
            constellation_id: 20000302,
            staging_solar_system_id: 30002082,
            infested_solar_systems: [30002082],
          },
          {
            type: 'Incursion',
            state: 'established',
            influence: 1.0,
            has_boss: true,
            faction_id: 500019,
            constellation_id: 20000145,
            staging_solar_system_id: 30001012,
            infested_solar_systems: [30001012],
          },
        ],
      });
    });

    when('the client examines the incursion results', async () => {
      result = await client.incursions.getIncursions();
    });

    then('all influence values shall be between 0 and 1', () => {
      expect(result.map((i: any) => i.influence)).toEqual([0, 1]);
      for (const incursion of result) {
        expect(incursion.influence).toBeGreaterThanOrEqual(0);
        expect(incursion.influence).toBeLessThanOrEqual(1);
      }
    });
  });
});
