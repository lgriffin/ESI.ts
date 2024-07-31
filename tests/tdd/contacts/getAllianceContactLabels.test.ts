import { getAllianceContactLabels } from '../../../src/api/contacts/getAllianceContactLabels';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const allianceContactLabelsApi = new getAllianceContactLabels(client);

describe('GetAllianceContactLabelsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return alliance contact labels', async () => {
        const mockResponse = [
            {
                label_id: 1,
                label_name: 'Friends'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await allianceContactLabelsApi.getAllianceContactLabels(123456);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((label: any) => {
            expect(label).toHaveProperty('label_id');
            expect(label).toHaveProperty('label_name');
        });
    });
});
