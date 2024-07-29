import { PostCharacterMailLabelsApi } from '../../../src/api/mail/postCharacterMailLabels';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const mailLabelsApi = new PostCharacterMailLabelsApi(client);

describe('PostCharacterMailLabelsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should create a mail label', async () => {
        const mockResponse = {
            label_id: 1
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const body = {
            name: "New Label"
        };

        const result = await mailLabelsApi.createMailLabel(123456, body);

        expect(result).toHaveProperty('label_id');
        expect(typeof result.label_id).toBe('number');
    });
});
