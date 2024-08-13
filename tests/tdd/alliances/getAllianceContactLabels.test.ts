import { AllianceContactLabelsApi } from '../../../src/api/alliances/getAllianceContactLabels';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

interface ContactLabel {
    label_id: number;
    label_name: string;
}

let allianceContactLabelsApi: AllianceContactLabelsApi;

beforeAll(() => {
    allianceContactLabelsApi = new AllianceContactLabelsApi(getClient());
});

describe('AllianceContactLabelsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for alliance contact labels', async () => {
        const mockResponse: ContactLabel[] = [
            {
                label_id: 123,
                label_name: "Friendly"
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => allianceContactLabelsApi.getAllianceContactLabels(99000006)) as ContactLabel[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((label: ContactLabel) => {
            expect(label).toHaveProperty('label_id');
            expect(typeof label.label_id).toBe('number');
            expect(label).toHaveProperty('label_name');
            expect(typeof label.label_name).toBe('string');
        });
    });
});
