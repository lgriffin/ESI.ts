import { InsuranceClient } from '../../../src/clients/InsuranceClient';
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

const insuranceClient = new InsuranceClient(client);

describe('InsuranceClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid insurance prices', async () => {
        const mockResponse = [
            {
                name: 'Basic',
                cost: 1000,
                payout: 5000
            },
            {
                name: 'Standard',
                cost: 2000,
                payout: 10000
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => insuranceClient.getInsurancePrices());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((insurance: any) => {
            expect(insurance).toHaveProperty('name');
            expect(typeof insurance.name).toBe('string');
            expect(insurance).toHaveProperty('cost');
            expect(typeof insurance.cost).toBe('number');
            expect(insurance).toHaveProperty('payout');
            expect(typeof insurance.payout).toBe('number');
        });
    });
});
