import { getCharacterContactLabels } from '../../../src/api/contacts/getCharacterContactLabels';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterContactLabelsApi = new getCharacterContactLabels(client);

describe('getCharacterContactLabels', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character contact labels', async () => {
        const mockResponse = [
            {
                label_id: 1,
                name: 'Friends'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => characterContactLabelsApi.getLabels(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((label: any) => {
            expect(label).toHaveProperty('label_id');
            expect(label).toHaveProperty('name');
        });
    });
});
