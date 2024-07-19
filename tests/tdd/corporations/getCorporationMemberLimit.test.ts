import { GetCorporationMemberLimitApi } from '../../../src/api/corporations/getCorporationMemberLimit';
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

const corporationMemberLimitApi = new GetCorporationMemberLimitApi(client);

describe('GetCorporationMemberLimitApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation member limit', async () => {
        const mockResponse = { member_limit: 100 };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationMemberLimitApi.getCorporationMemberLimit(12345);

        expect(result).toHaveProperty('member_limit');
        expect(typeof result.member_limit).toBe('number');
    });
});
