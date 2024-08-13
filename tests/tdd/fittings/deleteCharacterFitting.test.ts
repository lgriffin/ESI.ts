import { DeleteCharacterFittingApi } from '../../../src/api/fittings/deleteCharacterFitting';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterFittingApi = new DeleteCharacterFittingApi(client);

describe('DeleteCharacterFittingApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should delete a character fitting', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await getBody(() => characterFittingApi.deleteFitting(123456, 1));

        expect(result).toEqual({ error: 'no content' });
    });
});
