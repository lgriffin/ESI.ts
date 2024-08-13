import { getCorporationContactLabels } from '../../../src/api/contacts/getCorporationContactLabels';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const corporationContactLabelsApi = new getCorporationContactLabels(client);

describe('getCorporationContactLabels', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return corporation contact labels', async () => {
        const mockResponse = [
            {
                label_id: 1,
                name: 'VIPs'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationContactLabelsApi.getLabels(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((label: any) => {
            expect(label).toHaveProperty('label_id');
            expect(label).toHaveProperty('name');
        });
    });
});
