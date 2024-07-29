import { PutCharacterMailApi } from '../../../src/api/mail/putCharacterMail';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterMailApi = new PutCharacterMailApi(client);

describe('PutCharacterMailApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should update mail metadata', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = {
            labels: [1, 2],
            read: true
        };

        const result = await characterMailApi.updateMailMetadata(123456, 1, body);

        expect(result).toEqual({ error: 'no content' });
    });
});
