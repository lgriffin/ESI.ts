import { GetCorporationDivisionsApi } from '../../../src/api/corporations/getCorporationDivisions';
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

const corporationDivisionsApi = new GetCorporationDivisionsApi(client);

describe('GetCorporationDivisionsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation divisions', async () => {
        const mockResponse = {
            hangar: [
                {
                    division: 1,
                    name: 'Hangar 1'
                },
                {
                    division: 2,
                    name: 'Hangar 2'
                }
            ],
            wallet: [
                {
                    division: 1,
                    name: 'Master Wallet'
                }
            ]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationDivisionsApi.getCorporationDivisions(12345));

        expect(result).toHaveProperty('hangar');
        expect(Array.isArray(result.hangar)).toBe(true);
        result.hangar.forEach((division: { division: number; name: string }) => {
            expect(division).toHaveProperty('division');
            expect(typeof division.division).toBe('number');
            expect(division).toHaveProperty('name');
            expect(typeof division.name).toBe('string');
        });

        expect(result).toHaveProperty('wallet');
        expect(Array.isArray(result.wallet)).toBe(true);
        result.wallet.forEach((division: { division: number; name: string }) => {
            expect(division).toHaveProperty('division');
            expect(typeof division.division).toBe('number');
            expect(division).toHaveProperty('name');
            expect(typeof division.name).toBe('string');
        });
    });
});
