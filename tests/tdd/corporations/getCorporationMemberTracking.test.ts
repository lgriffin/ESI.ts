import { GetCorporationMemberTrackingApi } from '../../../src/api/corporations/getCorporationMemberTracking';
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

const corporationMemberTrackingApi = new GetCorporationMemberTrackingApi(client);

describe('GetCorporationMemberTrackingApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation member tracking', async () => {
        const mockResponse = [
            {
                character_id: 12345,
                start_date: '2024-07-01T12:00:00Z',
                location_id: 67890,
                ship_type_id: 54321
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationMemberTrackingApi.getCorporationMemberTracking(12345);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((member: { character_id: number, start_date: string, location_id: number, ship_type_id: number }) => {
            expect(member).toHaveProperty('character_id');
            expect(typeof member.character_id).toBe('number');
            expect(member).toHaveProperty('start_date');
            expect(typeof member.start_date).toBe('string');
            expect(member).toHaveProperty('location_id');
            expect(typeof member.location_id).toBe('number');
            expect(member).toHaveProperty('ship_type_id');
            expect(typeof member.ship_type_id).toBe('number');
        });
    });
});
