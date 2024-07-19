import { CorporationsClient } from '../../../src/clients/CorporationsClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

const corporationsClient = new CorporationsClient(client);

describe('CorporationsClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getCorporationInfo', async () => {
        const mockResponse = {
            corporation_id: 123,
            name: 'Test Corporation',
            ticker: 'TEST',
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationsClient.getCorporationInfo(123456789);

        expect(result).toHaveProperty('corporation_id');
        expect(typeof result.corporation_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('ticker');
        expect(typeof result.ticker).toBe('string');
    });

    it('should return valid structure for getCorporationAllianceHistory', async () => {
        const mockResponse = [
            {
                alliance_id: 1,
                is_deleted: false,
                record_id: 456,
                start_date: '2024-07-01T12:00:00Z',
            },
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationsClient.getCorporationAllianceHistory(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((history: { alliance_id: number; is_deleted: boolean; record_id: number; start_date: string }) => {
            expect(history).toHaveProperty('alliance_id');
            expect(typeof history.alliance_id).toBe('number');
            expect(history).toHaveProperty('is_deleted');
            expect(typeof history.is_deleted).toBe('boolean');
            expect(history).toHaveProperty('record_id');
            expect(typeof history.record_id).toBe('number');
            expect(history).toHaveProperty('start_date');
            expect(typeof history.start_date).toBe('string');
        });
    });

    it('should return valid structure for getCorporationBlueprints', async () => {
        const mockResponse = [
            {
                item_id: 1,
                type_id: 2,
                location_id: 3,
                location_flag: 'Hangar',
                quantity: 1,
                time_efficiency: 10,
                material_efficiency: 10,
                runs: 5,
            },
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationsClient.getCorporationBlueprints(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((blueprint: { item_id: number; type_id: number; location_id: number; location_flag: string; quantity: number; time_efficiency: number; material_efficiency: number; runs: number }) => {
            expect(blueprint).toHaveProperty('item_id');
            expect(typeof blueprint.item_id).toBe('number');
            expect(blueprint).toHaveProperty('type_id');
            expect(typeof blueprint.type_id).toBe('number');
            expect(blueprint).toHaveProperty('location_id');
            expect(typeof blueprint.location_id).toBe('number');
            expect(blueprint).toHaveProperty('location_flag');
            expect(typeof blueprint.location_flag).toBe('string');
            expect(blueprint).toHaveProperty('quantity');
            expect(typeof blueprint.quantity).toBe('number');
            expect(blueprint).toHaveProperty('time_efficiency');
            expect(typeof blueprint.time_efficiency).toBe('number');
            expect(blueprint).toHaveProperty('material_efficiency');
            expect(typeof blueprint.material_efficiency).toBe('number');
            expect(blueprint).toHaveProperty('runs');
            expect(typeof blueprint.runs).toBe('number');
        });
    });

    it('should return valid structure for getCorporationAlscLogs', async () => {
        const mockResponse = [
            {
                action: 'lock',
                character_id: 123,
                timestamp: '2024-07-01T12:00:00Z',
                item_id: 456,
                location_flag: 'Hangar',
                location_id: 789,
                quantity: 1,
            },
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationsClient.getCorporationAlscLogs(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((log: { action: string; character_id: number; timestamp: string; item_id: number; location_flag: string; location_id: number; quantity: number }) => {
            expect(log).toHaveProperty('action');
            expect(typeof log.action).toBe('string');
            expect(log).toHaveProperty('character_id');
            expect(typeof log.character_id).toBe('number');
            expect(log).toHaveProperty('timestamp');
            expect(typeof log.timestamp).toBe('string');
            expect(log).toHaveProperty('item_id');
            expect(typeof log.item_id).toBe('number');
            expect(log).toHaveProperty('location_flag');
            expect(typeof log.location_flag).toBe('string');
            expect(log).toHaveProperty('location_id');
            expect(typeof log.location_id).toBe('number');
            expect(log).toHaveProperty('quantity');
            expect(typeof log.quantity).toBe('number');
        });
    });

    it('should return valid structure for getCorporationDivisions', async () => {
        const mockResponse = {
            hangar: [
                {
                    name: 'Division 1',
                    division: 1,
                },
            ],
            wallet: [
                {
                    name: 'Division 1',
                    division: 1,
                },
            ],
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationsClient.getCorporationDivisions(123456789);

        expect(result).toHaveProperty('hangar');
        expect(Array.isArray(result.hangar)).toBe(true);
        result.hangar.forEach((division: { name: string; division: number }) => {
            expect(division).toHaveProperty('name');
            expect(typeof division.name).toBe('string');
            expect(division).toHaveProperty('division');
            expect(typeof division.division).toBe('number');
        });

        expect(result).toHaveProperty('wallet');
        expect(Array.isArray(result.wallet)).toBe(true);
        result.wallet.forEach((division: { name: string; division: number }) => {
            expect(division).toHaveProperty('name');
            expect(typeof division.name).toBe('string');
            expect(division).toHaveProperty('division');
            expect(typeof division.division).toBe('number');
        });
    });

    it('should return valid structure for getCorporationFacilities', async () => {
        const mockResponse = [
            {
                facility_id: 1,
                type_id: 2,
                system_id: 3,
                region_id: 4,
                solar_system_id: 5,
            },
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationsClient.getCorporationFacilities(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((facility: { facility_id: number; type_id: number; system_id: number; region_id: number; solar_system_id: number }) => {
            expect(facility).toHaveProperty('facility_id');
            expect(typeof facility.facility_id).toBe('number');
            expect(facility).toHaveProperty('type_id');
            expect(typeof facility.type_id).toBe('number');
            expect(facility).toHaveProperty('system_id');
            expect(typeof facility.system_id).toBe('number');
            expect(facility).toHaveProperty('region_id');
            expect(typeof facility.region_id).toBe('number');
            expect(facility).toHaveProperty('solar_system_id');
            expect(typeof facility.solar_system_id).toBe('number');
        });
    });

    it('should return valid structure for getCorporationIcon', async () => {
        const mockResponse = {
            px64x64: 'https://example.com/icon64.png',
            px128x128: 'https://example.com/icon128.png',
            px256x256: 'https://example.com/icon256.png',
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationsClient.getCorporationIcon(123456789);

        expect(result).toHaveProperty('px64x64');
        expect(typeof result.px64x64).toBe('string');
        expect(result).toHaveProperty('px128x128');
        expect(typeof result.px128x128).toBe('string');
        expect(result).toHaveProperty('px256x256');
        expect(typeof result.px256x256).toBe('string');
    });
});
