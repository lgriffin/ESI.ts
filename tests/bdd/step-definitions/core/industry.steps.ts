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

const feature = loadFeature('tests/bdd/features/core/0017-industry.feature');

/**
 * An industry job as ESI sends it. TestDataFactory.createIndustryJob omits
 * station_id, blueprint_location_id, output_location_id and duration, which
 * IndustryJobSchema requires, so the payload is completed here.
 */
function industryJob(overrides: Record<string, unknown> = {}) {
  return TestDataFactory.createIndustryJob({
    station_id: 60003760,
    blueprint_location_id: 60003760,
    output_location_id: 60003760,
    duration: 86400,
    ...overrides,
  });
}

/** Match a request whose path ends exactly at `path`. */
const exactPath = (path: string): RegExp => new RegExp(`${path}(\\?|$)`);

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Manufacturing and invention jobs with blueprint and run counts', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with active industry jobs', () => {
      queueResponse({
        match: `/characters/${characterId}/industry/jobs`,
        body: [
          industryJob({
            job_id: 1000001,
            activity_id: 1,
            status: 'active',
            blueprint_type_id: 17918,
            runs: 10,
            start_date: '2026-04-20T12:00:00Z',
            end_date: '2026-04-25T12:00:00Z',
          }),
          industryJob({
            job_id: 1000002,
            activity_id: 8,
            status: 'delivered',
            blueprint_type_id: 11399,
            runs: 1,
            start_date: '2026-04-18T08:00:00Z',
            end_date: '2026-04-19T08:00:00Z',
          }),
        ],
      });
    });

    when('the client requests their industry jobs', async () => {
      result = await client.industry.getCharacterIndustryJobs(characterId);
    });

    then(
      'the client shall return job details including status and blueprint info',
      () => {
        expect(lastRequest().url.pathname).toBe(
          `/characters/${characterId}/industry/jobs`,
        );
        expect(lastRequest().headers.authorization).toBe(
          'Bearer bdd-access-token',
        );
        expect(
          result.map((j: any) => [
            j.job_id,
            j.activity_id,
            j.status,
            j.blueprint_type_id,
            j.runs,
            j.start_date,
            j.end_date,
          ]),
        ).toEqual([
          [
            1000001,
            1,
            'active',
            17918,
            10,
            '2026-04-20T12:00:00Z',
            '2026-04-25T12:00:00Z',
          ],
          [
            1000002,
            8,
            'delivered',
            11399,
            1,
            '2026-04-18T08:00:00Z',
            '2026-04-19T08:00:00Z',
          ],
        ]);
      },
    );
  });

  test('Character with no jobs installed', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no industry jobs', () => {
      queueResponse({
        match: `/characters/${characterId}/industry/jobs`,
        body: [],
      });
    });

    when('the client requests their industry jobs', async () => {
      result = await client.industry.getCharacterIndustryJobs(characterId);
    });

    then('the client shall return an empty array', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  test('Corporation jobs across three installers', ({ given, when, then }) => {
    const corporationId = 1344654522;
    let result: any;

    given('a corporation with running industry jobs', () => {
      queueResponse({
        match: `/corporations/${corporationId}/industry/jobs`,
        body: [
          industryJob({
            job_id: 2000001,
            installer_id: 1689391488,
            facility_id: 60003760,
            activity_id: 1,
            status: 'active',
          }),
          industryJob({
            job_id: 2000002,
            installer_id: 123456789,
            facility_id: 1021975535893,
            activity_id: 5,
            status: 'active',
          }),
          industryJob({
            job_id: 2000003,
            installer_id: 111111111,
            facility_id: 60008494,
            activity_id: 8,
            status: 'delivered',
          }),
        ],
      });
    });

    when('the client requests the corporation industry jobs', async () => {
      result = await client.industry.getCorporationIndustryJobs(corporationId);
    });

    then('the client shall return the full list of corporation jobs', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporations/${corporationId}/industry/jobs`,
      );
      expect(
        result.map((j: any) => [j.job_id, j.installer_id, j.facility_id]),
      ).toEqual([
        [2000001, 1689391488, 60003760],
        [2000002, 123456789, 1021975535893],
        [2000003, 111111111, 60008494],
      ]);
    });
  });

  test('Facilities report their owner, location, and tax', ({
    given,
    when,
    then,
  }) => {
    const expectedFacilities = [
      {
        facility_id: 60003760,
        owner_id: 1000035,
        region_id: 10000002,
        solar_system_id: 30000142,
        tax: 0.1,
        type_id: 1529,
      },
      {
        facility_id: 60008494,
        owner_id: 1000125,
        region_id: 10000043,
        solar_system_id: 30002187,
        tax: 0.05,
        type_id: 1932,
      },
    ];
    let result: any;

    given('industry facilities exist in the universe', () => {
      queueResponse({
        match: '/industry/facilities',
        body: expectedFacilities,
      });
    });

    when('the client requests the facility list', async () => {
      result = await client.industry.getIndustryFacilities();
    });

    then(
      'the client shall return facilities with location and tax info',
      () => {
        expect(lastRequest().url.pathname).toBe('/industry/facilities');
        expect(lastRequest().headers.authorization).toBeUndefined();
        expect(result).toEqual(expectedFacilities);
      },
    );
  });

  test('Cost indices per activity for two systems', ({ given, when, then }) => {
    const expectedSystems = [
      {
        solar_system_id: 30000142,
        cost_indices: [
          { activity: 'manufacturing', cost_index: 0.048 },
          { activity: 'researching_time_efficiency', cost_index: 0.032 },
          { activity: 'researching_material_efficiency', cost_index: 0.031 },
          { activity: 'copying', cost_index: 0.025 },
          { activity: 'invention', cost_index: 0.041 },
        ],
      },
      {
        solar_system_id: 30002187,
        cost_indices: [
          { activity: 'manufacturing', cost_index: 0.012 },
          { activity: 'copying', cost_index: 0.008 },
        ],
      },
    ];
    let result: any;

    given('solar systems with industry activity', () => {
      queueResponse({ match: '/industry/systems', body: expectedSystems });
    });

    when('the client requests system indices', async () => {
      result = await client.industry.getIndustrySystems();
    });

    then('the client shall return cost index data per activity', () => {
      expect(lastRequest().url.pathname).toBe('/industry/systems');
      expect(result).toEqual(expectedSystems);
      expect(result[0].cost_indices.map((c: any) => c.activity)).toEqual([
        'manufacturing',
        'researching_time_efficiency',
        'researching_material_efficiency',
        'copying',
        'invention',
      ]);
      expect(result[1].cost_indices.map((c: any) => c.activity)).toEqual([
        'manufacturing',
        'copying',
      ]);
    });
  });

  test('Two days of ore mined across two systems', ({ given, when, then }) => {
    const characterId = 1689391488;
    const expectedLedger = [
      {
        date: '2026-04-22',
        solar_system_id: 30000142,
        type_id: 1230,
        quantity: 15000,
      },
      {
        date: '2026-04-22',
        solar_system_id: 30000142,
        type_id: 1228,
        quantity: 8500,
      },
      {
        date: '2026-04-21',
        solar_system_id: 30002187,
        type_id: 1230,
        quantity: 22000,
      },
    ];
    let result: any;

    given('a character who has been mining', () => {
      queueResponse({
        match: `/characters/${characterId}/mining`,
        body: expectedLedger,
      });
    });

    when('the client requests their mining ledger', async () => {
      result = await client.industry.getCharacterMiningLedger(characterId);
    });

    then('the client shall return daily ore quantities', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/mining`,
      );
      expect(lastRequest().headers.authorization).toBe(
        'Bearer bdd-access-token',
      );
      expect(result).toEqual(expectedLedger);
    });
  });

  test('Structure observers with last update times', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    const expectedObservers = [
      {
        observer_id: 1021975535893,
        observer_type: 'structure',
        last_updated: '2026-04-22',
      },
      {
        observer_id: 1021975535894,
        observer_type: 'structure',
        last_updated: '2026-04-21',
      },
    ];
    let result: any;

    given('a corporation with mining observers', () => {
      queueResponse({
        match: exactPath(`/corporation/${corporationId}/mining/observers`),
        body: expectedObservers,
      });
    });

    when('the client requests the observer list', async () => {
      result =
        await client.industry.getCorporationMiningObservers(corporationId);
    });

    then('the client shall return observer details', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporation/${corporationId}/mining/observers`,
      );
      expect(lastRequest().headers.authorization).toBe(
        'Bearer bdd-access-token',
      );
      expect(result).toEqual(expectedObservers);
    });
  });

  test('Observer breaks mining down per character', ({ given, when, then }) => {
    const corporationId = 1344654522;
    const observerId = 1021975535893;
    const expectedEntries = [
      {
        character_id: 1689391488,
        recorded_corporation_id: 1344654522,
        type_id: 1230,
        quantity: 50000,
        last_updated: '2026-04-22',
      },
      {
        character_id: 123456789,
        recorded_corporation_id: 98000001,
        type_id: 1228,
        quantity: 30000,
        last_updated: '2026-04-22',
      },
    ];
    let result: any;

    given('a valid mining observer', () => {
      queueResponse({
        match: exactPath(
          `/corporation/${corporationId}/mining/observers/${observerId}`,
        ),
        body: expectedEntries,
      });
    });

    when('the client requests the observer activity', async () => {
      result = await client.industry.getCorporationMiningObserver(
        corporationId,
        observerId,
      );
    });

    then('the client shall return character mining entries', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporation/${corporationId}/mining/observers/${observerId}`,
      );
      expect(result).toEqual(expectedEntries);
    });
  });

  test('Character industry jobs with an expired token', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an invalid or expired token', () => {
      queueError(403, 'token is expired', {
        match: `/characters/${characterId}/industry/jobs`,
      });
    });

    when('the client requests character industry jobs', async () => {
      try {
        await client.industry.getCharacterIndustryJobs(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then(
      'the client shall return a 403 forbidden error for industry jobs',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
        expect((caughtError as EsiError).statusCode).toBe(403);
        // 403 is not retryable: the refusal is final after one request.
        expect(sentRequests()).toHaveLength(1);
      },
    );
  });

  test('Mining observers without the required corporation role', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let caughtError: any;

    given('insufficient corporation roles', () => {
      queueError(403, 'Character does not have required role(s)', {
        match: exactPath(`/corporation/${corporationId}/mining/observers`),
      });
    });

    when('the client requests mining observers', async () => {
      try {
        await client.industry.getCorporationMiningObservers(corporationId);
      } catch (error) {
        caughtError = error;
      }
    });

    then(
      'the client shall return a 403 forbidden error for mining observers',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
        expect((caughtError as EsiError).statusCode).toBe(403);
        expect(sentRequests()).toHaveLength(1);
      },
    );
  });

  test('Jobs, facilities, and systems fetched in parallel', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let jobs: any;
    let facilities: any;
    let systems: any;

    given('an authenticated character for concurrent industry fetch', () => {
      // Responses arrive in the reverse of call order, so a client that paired
      // them by arrival rather than by URL would hand back the wrong payloads.
      queueResponse({
        match: '/industry/systems',
        delayMs: 1,
        body: [
          {
            solar_system_id: 30000142,
            cost_indices: [{ activity: 'manufacturing', cost_index: 0.048 }],
          },
        ],
      });
      queueResponse({
        match: '/industry/facilities',
        delayMs: 5,
        body: [
          {
            facility_id: 60003760,
            owner_id: 1000035,
            region_id: 10000002,
            solar_system_id: 30000142,
            tax: 0.1,
            type_id: 1529,
          },
        ],
      });
      queueResponse({
        match: `/characters/${characterId}/industry/jobs`,
        delayMs: 10,
        body: [industryJob({ job_id: 1000001, status: 'active' })],
      });
    });

    when(
      'the client fetches industry jobs, facilities, and systems in parallel',
      async () => {
        [jobs, facilities, systems] = await Promise.all([
          client.industry.getCharacterIndustryJobs(characterId),
          client.industry.getIndustryFacilities(),
          client.industry.getIndustrySystems(),
        ]);
      },
    );

    then('all three industry requests shall resolve successfully', () => {
      expect(sentRequests()).toHaveLength(3);
      expect(jobs.map((j: any) => [j.job_id, j.status])).toEqual([
        [1000001, 'active'],
      ]);
      expect(facilities.map((f: any) => f.facility_id)).toEqual([60003760]);
      expect(systems.map((s: any) => s.solar_system_id)).toEqual([30000142]);
      expect(systems[0].cost_indices).toEqual([
        { activity: 'manufacturing', cost_index: 0.048 },
      ]);
    });
  });
});
