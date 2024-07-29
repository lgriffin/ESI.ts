import { GetCharacterMailingListsApi } from '../../../src/api/mail/getCharacterMailingLists';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const mailingListsApi = new GetCharacterMailingListsApi(client);

describe('GetCharacterMailingListsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return mailing list subscriptions', async () => {
        const mockResponse = [
            {
                mailing_list_id: 1,
                name: "Test List"
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await mailingListsApi.getMailingLists(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((list: { mailing_list_id: number, name: string }) => {
            expect(list).toHaveProperty('mailing_list_id');
            expect(typeof list.mailing_list_id).toBe('number');
            expect(list).toHaveProperty('name');
            expect(typeof list.name).toBe('string');
        });
    });
});
