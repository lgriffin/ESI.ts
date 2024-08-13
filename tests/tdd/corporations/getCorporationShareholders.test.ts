import { GetCorporationShareholdersApi } from '../../../src/api/corporations/getCorporationShareholders';
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

const corporationShareholdersApi = new GetCorporationShareholdersApi(client);

describe('GetCorporationShareholdersApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation shareholders', async () => {
        const mockResponse = [
            {
                shareholder_id: 12345,
                shareholder_type: 'character',
                shares: 1000
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationShareholdersApi.getCorporationShareholders(12345));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((shareholder: { shareholder_id: number, shareholder_type: string, shares: number }) => {
            expect(shareholder).toHaveProperty('shareholder_id');
            expect(typeof shareholder.shareholder_id).toBe('number');
            expect(shareholder).toHaveProperty('shareholder_type');
            expect(typeof shareholder.shareholder_type).toBe('string');
            expect(shareholder).toHaveProperty('shares');
            expect(typeof shareholder.shares).toBe('number');
        });
    });
});
