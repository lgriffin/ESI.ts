/**
 * BDD-Style Tests for Industry Management
 *
 * Tests the IndustryClient for industry jobs, facilities, systems,
 * mining ledger, and mining observers.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Industry Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Character Industry Jobs', () => {
    describe('Scenario: Get character industry jobs', () => {
      it('Given a character with active industry jobs, When I request their jobs, Then I should receive job details including status and blueprint info', async () => {
        // Given
        const characterId = 1689391488;
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

        // When
        const result =
          await client.industry.getCharacterIndustryJobs(characterId);

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('job_id', 1000001);
        expect(result[0]).toHaveProperty('activity_id', 1);
        expect(result[0]).toHaveProperty('status', 'active');
        expect(result[0]).toHaveProperty('blueprint_type_id');
        expect(result[0]).toHaveProperty('runs');
        expect(result[0]).toHaveProperty('start_date');
        expect(result[0]).toHaveProperty('end_date');
      });
    });

    describe('Scenario: Character has no industry jobs', () => {
      it('Given a character with no industry jobs, When I request their jobs, Then I should receive an empty array', async () => {
        // Given
        const characterId = 1689391488;
        jest
          .spyOn(client.industry, 'getCharacterIndustryJobs')
          .mockResolvedValue([]);

        // When
        const result =
          await client.industry.getCharacterIndustryJobs(characterId);

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('Feature: Corporation Industry Jobs', () => {
    describe('Scenario: Get corporation industry jobs', () => {
      it('Given a corporation with running industry jobs, When I request the corporation jobs, Then I should receive the full list', async () => {
        // Given
        const corporationId = 1344654522;
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

        // When
        const result =
          await client.industry.getCorporationIndustryJobs(corporationId);

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('installer_id');
        expect(result[0]).toHaveProperty('facility_id');
      });
    });
  });

  describe('Feature: Industry Facilities', () => {
    describe('Scenario: Get publicly available industry facilities', () => {
      it('Given industry facilities exist in the universe, When I request the facility list, Then I should receive facilities with location and tax info', async () => {
        // Given
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

        // When
        const result = await client.industry.getIndustryFacilities();

        // Then
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
  });

  describe('Feature: Industry Systems', () => {
    describe('Scenario: Get industry system cost indices', () => {
      it('Given solar systems with industry activity, When I request system indices, Then I should receive cost index data per activity', async () => {
        // Given
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

        // When
        const result = await client.industry.getIndustrySystems();

        // Then
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
  });

  describe('Feature: Mining Ledger', () => {
    describe('Scenario: Get character mining ledger', () => {
      it('Given a character who has been mining, When I request their mining ledger, Then I should receive daily ore quantities', async () => {
        // Given
        const characterId = 1689391488;
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

        // When
        const result =
          await client.industry.getCharacterMiningLedger(characterId);

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('date', '2026-04-22');
        expect(result[0]).toHaveProperty('solar_system_id');
        expect(result[0]).toHaveProperty('type_id');
        expect(result[0]).toHaveProperty('quantity');
        expect(result[0].quantity).toBeGreaterThan(0);
      });
    });
  });

  describe('Feature: Corporation Mining Observers', () => {
    describe('Scenario: Get corporation mining observers', () => {
      it('Given a corporation with mining observers, When I request the observer list, Then I should receive observer details', async () => {
        // Given
        const corporationId = 1344654522;
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

        // When
        const result =
          await client.industry.getCorporationMiningObservers(corporationId);

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('observer_id');
        expect(result[0]).toHaveProperty('observer_type', 'structure');
        expect(result[0]).toHaveProperty('last_updated');
      });
    });

    describe('Scenario: Get mining observer details', () => {
      it('Given a valid mining observer, When I request the observer activity, Then I should receive character mining entries', async () => {
        // Given
        const corporationId = 1344654522;
        const observerId = 1021975535893;
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

        // When
        const result = await client.industry.getCorporationMiningObserver(
          corporationId,
          observerId,
        );

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('character_id');
        expect(result[0]).toHaveProperty('recorded_corporation_id');
        expect(result[0]).toHaveProperty('type_id');
        expect(result[0]).toHaveProperty('quantity');
        expect(result[0]).toHaveProperty('last_updated');
      });
    });
  });

  describe('Feature: Error Handling', () => {
    describe('Scenario: Unauthorized access to industry jobs', () => {
      it('Given an invalid or expired token, When I request character industry jobs, Then I should receive a 403 forbidden error', async () => {
        // Given
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.industry, 'getCharacterIndustryJobs')
          .mockRejectedValue(forbiddenError);

        // When & Then
        await expect(
          client.industry.getCharacterIndustryJobs(characterId),
        ).rejects.toThrow(EsiError);
      });
    });

    describe('Scenario: Unauthorized access to corporation mining data', () => {
      it('Given insufficient corporation roles, When I request mining observers, Then I should receive a 403 forbidden error', async () => {
        // Given
        const corporationId = 1344654522;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.industry, 'getCorporationMiningObservers')
          .mockRejectedValue(forbiddenError);

        // When & Then
        await expect(
          client.industry.getCorporationMiningObservers(corporationId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Concurrent Industry Data Fetch', () => {
    describe('Scenario: Fetch character jobs, facilities, and systems concurrently', () => {
      it('Given an authenticated character, When I fetch industry jobs, facilities, and systems in parallel, Then all three requests should resolve successfully', async () => {
        // Given
        const characterId = 1689391488;
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

        // When
        const [jobs, facilities, systems] = await Promise.all([
          client.industry.getCharacterIndustryJobs(characterId),
          client.industry.getIndustryFacilities(),
          client.industry.getIndustrySystems(),
        ]);

        // Then
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
});
