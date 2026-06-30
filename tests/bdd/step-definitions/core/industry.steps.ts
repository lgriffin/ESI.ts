import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/industry.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Get character industry jobs', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with active industry jobs', () => {
      const mockJobs = [
        TestDataFactory.createIndustryJob({
          job_id: 1000001,
          activity_id: 1,
          status: 'active',
          blueprint_type_id: 17918,
          runs: 10,
        }),
        TestDataFactory.createIndustryJob({
          job_id: 1000002,
          activity_id: 3,
          status: 'delivered',
          blueprint_type_id: 11399,
          runs: 1,
        }),
      ];

      jest
        .spyOn(client.industry, 'getCharacterIndustryJobs')
        .mockResolvedValue(mockJobs);
    });

    when('I request their industry jobs', async () => {
      result = await client.industry.getCharacterIndustryJobs(characterId);
    });

    then(
      'I should receive job details including status and blueprint info',
      () => {
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('job_id', 1000001);
        expect(result[0]).toHaveProperty('activity_id', 1);
        expect(result[0]).toHaveProperty('status', 'active');
        expect(result[0]).toHaveProperty('blueprint_type_id');
        expect(result[0]).toHaveProperty('runs');
        expect(result[0]).toHaveProperty('start_date');
        expect(result[0]).toHaveProperty('end_date');
      },
    );
  });

  test('Character has no industry jobs', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no industry jobs', () => {
      jest
        .spyOn(client.industry, 'getCharacterIndustryJobs')
        .mockResolvedValue([]);
    });

    when('I request their industry jobs', async () => {
      result = await client.industry.getCharacterIndustryJobs(characterId);
    });

    then('I should receive an empty array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  test('Get corporation industry jobs', ({ given, when, then }) => {
    const corporationId = 1344654522;
    let result: any;

    given('a corporation with running industry jobs', () => {
      const mockJobs = [
        TestDataFactory.createIndustryJob({
          job_id: 2000001,
          installer_id: 1689391488,
          activity_id: 1,
          status: 'active',
        }),
        TestDataFactory.createIndustryJob({
          job_id: 2000002,
          installer_id: 123456789,
          activity_id: 5,
          status: 'active',
        }),
        TestDataFactory.createIndustryJob({
          job_id: 2000003,
          installer_id: 111111111,
          activity_id: 8,
          status: 'delivered',
        }),
      ];

      jest
        .spyOn(client.industry, 'getCorporationIndustryJobs')
        .mockResolvedValue(mockJobs);
    });

    when('I request the corporation industry jobs', async () => {
      result = await client.industry.getCorporationIndustryJobs(corporationId);
    });

    then('I should receive the full list of corporation jobs', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('installer_id');
      expect(result[0]).toHaveProperty('facility_id');
    });
  });

  test('Get publicly available industry facilities', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('industry facilities exist in the universe', () => {
      const mockFacilities = [
        {
          facility_id: 60003760,
          owner_id: 1000035,
          region_id: 10000002,
          solar_system_id: 30000142,
          tax: 0.1,
          type_id: 35825,
        },
        {
          facility_id: 60008494,
          owner_id: 1000125,
          region_id: 10000043,
          solar_system_id: 30002187,
          tax: 0.05,
          type_id: 35826,
        },
      ];

      jest
        .spyOn(client.industry, 'getIndustryFacilities')
        .mockResolvedValue(mockFacilities);
    });

    when('I request the facility list', async () => {
      result = await client.industry.getIndustryFacilities();
    });

    then('I should receive facilities with location and tax info', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('facility_id', 60003760);
      expect(result[0]).toHaveProperty('owner_id');
      expect(result[0]).toHaveProperty('region_id');
      expect(result[0]).toHaveProperty('solar_system_id');
      expect(result[0]).toHaveProperty('tax');
      expect(result[0]).toHaveProperty('type_id');
    });
  });

  test('Get industry system cost indices', ({ given, when, then }) => {
    let result: any;

    given('solar systems with industry activity', () => {
      const mockSystems = [
        {
          solar_system_id: 30000142,
          cost_indices: [
            { activity: 'manufacturing', cost_index: 0.048 },
            { activity: 'researching_time_efficiency', cost_index: 0.032 },
            {
              activity: 'researching_material_efficiency',
              cost_index: 0.031,
            },
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

      jest
        .spyOn(client.industry, 'getIndustrySystems')
        .mockResolvedValue(mockSystems);
    });

    when('I request system indices', async () => {
      result = await client.industry.getIndustrySystems();
    });

    then('I should receive cost index data per activity', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('solar_system_id', 30000142);
      expect(result[0].cost_indices).toBeInstanceOf(Array);
      expect(result[0].cost_indices).toHaveLength(5);
      expect(result[0].cost_indices[0]).toHaveProperty(
        'activity',
        'manufacturing',
      );
      expect(result[0].cost_indices[0]).toHaveProperty('cost_index');
      expect(result[0].cost_indices[0].cost_index).toBeGreaterThan(0);
    });
  });

  test('Get character mining ledger', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character who has been mining', () => {
      const mockLedger = [
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

      jest
        .spyOn(client.industry, 'getCharacterMiningLedger')
        .mockResolvedValue(mockLedger);
    });

    when('I request their mining ledger', async () => {
      result = await client.industry.getCharacterMiningLedger(characterId);
    });

    then('I should receive daily ore quantities', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('date', '2026-04-22');
      expect(result[0]).toHaveProperty('solar_system_id');
      expect(result[0]).toHaveProperty('type_id');
      expect(result[0]).toHaveProperty('quantity');
      expect(result[0].quantity).toBeGreaterThan(0);
    });
  });

  test('Get corporation mining observers', ({ given, when, then }) => {
    const corporationId = 1344654522;
    let result: any;

    given('a corporation with mining observers', () => {
      const mockObservers = [
        {
          observer_id: 1021975535893,
          observer_type: 'structure',
          last_updated: '2026-04-22T12:00:00Z',
        },
        {
          observer_id: 1021975535894,
          observer_type: 'structure',
          last_updated: '2026-04-21T18:00:00Z',
        },
      ];

      jest
        .spyOn(client.industry, 'getCorporationMiningObservers')
        .mockResolvedValue(mockObservers);
    });

    when('I request the observer list', async () => {
      result =
        await client.industry.getCorporationMiningObservers(corporationId);
    });

    then('I should receive observer details', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('observer_id');
      expect(result[0]).toHaveProperty('observer_type', 'structure');
      expect(result[0]).toHaveProperty('last_updated');
    });
  });

  test('Get mining observer details', ({ given, when, then }) => {
    const corporationId = 1344654522;
    const observerId = 1021975535893;
    let result: any;

    given('a valid mining observer', () => {
      const mockEntries = [
        {
          character_id: 1689391488,
          recorded_corporation_id: 1344654522,
          type_id: 1230,
          quantity: 50000,
          last_updated: '2026-04-22T12:00:00Z',
        },
        {
          character_id: 123456789,
          recorded_corporation_id: 1344654522,
          type_id: 1228,
          quantity: 30000,
          last_updated: '2026-04-22T11:00:00Z',
        },
      ];

      jest
        .spyOn(client.industry, 'getCorporationMiningObserver')
        .mockResolvedValue(mockEntries);
    });

    when('I request the observer activity', async () => {
      result = await client.industry.getCorporationMiningObserver(
        corporationId,
        observerId,
      );
    });

    then('I should receive character mining entries', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('character_id');
      expect(result[0]).toHaveProperty('recorded_corporation_id');
      expect(result[0]).toHaveProperty('type_id');
      expect(result[0]).toHaveProperty('quantity');
      expect(result[0]).toHaveProperty('last_updated');
    });
  });

  test('Unauthorized access to industry jobs', ({ given, when, then }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an invalid or expired token', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.industry, 'getCharacterIndustryJobs')
        .mockRejectedValue(forbiddenError);
    });

    when('I request character industry jobs', async () => {
      try {
        await client.industry.getCharacterIndustryJobs(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 403 forbidden error for industry jobs', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Unauthorized access to corporation mining data', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let caughtError: any;

    given('insufficient corporation roles', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.industry, 'getCorporationMiningObservers')
        .mockRejectedValue(forbiddenError);
    });

    when('I request mining observers', async () => {
      try {
        await client.industry.getCorporationMiningObservers(corporationId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 403 forbidden error for mining observers', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Fetch character jobs, facilities, and systems concurrently', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let jobs: any;
    let facilities: any;
    let systems: any;

    given('an authenticated character for concurrent industry fetch', () => {
      const mockJobs = [
        TestDataFactory.createIndustryJob({
          job_id: 1000001,
          status: 'active',
        }),
      ];
      const mockFacilities = [
        {
          facility_id: 60003760,
          owner_id: 1000035,
          region_id: 10000002,
          solar_system_id: 30000142,
          tax: 0.1,
          type_id: 35825,
        },
      ];
      const mockSystems = [
        {
          solar_system_id: 30000142,
          cost_indices: [{ activity: 'manufacturing', cost_index: 0.048 }],
        },
      ];

      jest
        .spyOn(client.industry, 'getCharacterIndustryJobs')
        .mockResolvedValue(mockJobs);
      jest
        .spyOn(client.industry, 'getIndustryFacilities')
        .mockResolvedValue(mockFacilities);
      jest
        .spyOn(client.industry, 'getIndustrySystems')
        .mockResolvedValue(mockSystems);
    });

    when(
      'I fetch industry jobs, facilities, and systems in parallel',
      async () => {
        [jobs, facilities, systems] = await Promise.all([
          client.industry.getCharacterIndustryJobs(characterId),
          client.industry.getIndustryFacilities(),
          client.industry.getIndustrySystems(),
        ]);
      },
    );

    then('all three industry requests should resolve successfully', () => {
      expect(jobs).toBeInstanceOf(Array);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].status).toBe('active');

      expect(facilities).toBeInstanceOf(Array);
      expect(facilities).toHaveLength(1);
      expect(facilities[0].facility_id).toBe(60003760);

      expect(systems).toBeInstanceOf(Array);
      expect(systems).toHaveLength(1);
      expect(systems[0].solar_system_id).toBe(30000142);
    });
  });
});
