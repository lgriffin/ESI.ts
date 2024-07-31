import { deleteCharacterContacts } from '../../../src/api/contacts/deleteCharacterContacts';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterContactsApi = new deleteCharacterContacts(client);

describe('DeleteCharacterContactsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should delete character contacts', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const contactIds = [123, 456];
        const result = await characterContactsApi.deleteCharacterContacts(123456, contactIds);

        expect(result).toEqual({ error: 'no content' });
    });
});
