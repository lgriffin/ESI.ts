import { GetCorporationIssuedMedalsApi } from '../../../src/api/corporations/getCorporationIssuedMedals';
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

const corporationIssuedMedalsApi = new GetCorporationIssuedMedalsApi(client);

describe('GetCorporationIssuedMedalsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation issued medals', async () => {
        const mockResponse = [
            {
                medal_id: 1,
                recipient_id: 54321,
                issuer_id: 12345,
                issued_at: '2024-07-01T12:00:00Z',
                reason: 'Great performance',
                status: 'public'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationIssuedMedalsApi.getCorporationIssuedMedals(12345);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((medal: { medal_id: number; recipient_id: number; issuer_id: number; issued_at: string; reason: string; status: string }) => {
            expect(medal).toHaveProperty('medal_id');
            expect(typeof medal.medal_id).toBe('number');
            expect(medal).toHaveProperty('recipient_id');
            expect(typeof medal.recipient_id).toBe('number');
            expect(medal).toHaveProperty('issuer_id');
            expect(typeof medal.issuer_id).toBe('number');
            expect(medal).toHaveProperty('issued_at');
            expect(typeof medal.issued_at).toBe('string');
            expect(medal).toHaveProperty('reason');
            expect(typeof medal.reason).toBe('string');
            expect(medal).toHaveProperty('status');
            expect(typeof medal.status).toBe('string');
        });
    });
});
