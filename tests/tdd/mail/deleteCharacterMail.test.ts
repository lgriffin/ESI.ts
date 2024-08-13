import { DeleteCharacterMailApi } from '../../../src/api/mail/deleteCharacterMail';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const deleteMailApi = new DeleteCharacterMailApi(client);

describe('DeleteCharacterMailApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should delete a mail', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await getBody(() => deleteMailApi.deleteMail(123456, 1));

        expect(result).toEqual({ error: 'no content' });
    });
});
