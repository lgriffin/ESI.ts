import { AllianceIconsApi } from '../../../src/api/alliances/getAllianceIcons';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

interface AllianceIcons {
    px128x128: string;
    px64x64: string;
}

let allianceIconsApi: AllianceIconsApi;

beforeAll(() => {
    allianceIconsApi = new AllianceIconsApi(getClient());
});

describe('AllianceIconsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for alliance icons', async () => {
        const mockResponse: AllianceIcons = {
            px128x128: 'https://images.evetech.net/alliances/99000001/logo?size=128',
            px64x64: 'https://images.evetech.net/alliances/99000001/logo?size=64'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await allianceIconsApi.getAllianceIcons(99000001) as AllianceIcons;

        expect(result).toHaveProperty('px128x128');
        expect(typeof result.px128x128).toBe('string');
        expect(result).toHaveProperty('px64x64');
        expect(typeof result.px64x64).toBe('string');
    });
});
