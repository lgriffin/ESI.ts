import { GetCharacterMailLabelsApi } from '../../../src/api/mail/getCharacterMailLabels';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const mailLabelsApi = new GetCharacterMailLabelsApi(client);

describe('GetCharacterMailLabelsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return mail labels and unread counts', async () => {
        const mockResponse = {
            labels: [
                {
                    label_id: 1,
                    name: "Label 1",
                    unread_count: 5
                }
            ],
            total_unread_count: 5
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await mailLabelsApi.getMailLabels(123456789);

        expect(result).toHaveProperty('labels');
        expect(Array.isArray(result.labels)).toBe(true);
        result.labels.forEach((label: { label_id: number, name: string, unread_count: number }) => {
            expect(label).toHaveProperty('label_id');
            expect(typeof label.label_id).toBe('number');
            expect(label).toHaveProperty('name');
            expect(typeof label.name).toBe('string');
            expect(label).toHaveProperty('unread_count');
            expect(typeof label.unread_count).toBe('number');
        });
        expect(result).toHaveProperty('total_unread_count');
        expect(typeof result.total_unread_count).toBe('number');
    });
});
