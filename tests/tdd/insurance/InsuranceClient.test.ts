import { InsuranceClient } from '../../../src/clients/InsuranceClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

const config = getConfig();
const client = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
  .build();

const insuranceClient = new InsuranceClient(client);

describe('InsuranceClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should return valid insurance prices', async () => {
    const mockResponse = [
      {
        type_id: 587,
        name: 'Basic',
        cost: 1000,
        payout: 5000,
        levels: [
          { cost: 10, payout: 40, name: 'Basic' },
          { cost: 30, payout: 120, name: 'Standard' },
          { cost: 60, payout: 240, name: 'Bronze' },
        ],
      },
      {
        type_id: 621,
        name: 'Standard',
        cost: 2000,
        payout: 10000,
        levels: [
          { cost: 20, payout: 80, name: 'Basic' },
          { cost: 60, payout: 240, name: 'Standard' },
          { cost: 120, payout: 480, name: 'Bronze' },
        ],
      },
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
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/insurance/prices',
    );
  });

  describeClientErrors('InsuranceClient', () =>
    insuranceClient.getInsurancePrices(),
  );
});
