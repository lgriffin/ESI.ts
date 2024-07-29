import { DeleteCharacterMailLabelApi } from '../../../src/api/mail/deleteCharacterMailLabel';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const mailLabelApi = new DeleteCharacterMailLabelApi(client);

describe('DeleteCharacterMailLabelApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should delete a mail label', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await mailLabelApi.deleteMailLabel(123456, 1);

        expect(result).toEqual({ error: 'no content' });
    });
});
