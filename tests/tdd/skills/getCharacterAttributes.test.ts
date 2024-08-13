import { GetCharacterAttributesApi } from '../../../src/api/skills/getCharacterAttributes';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterAttributesApi = new GetCharacterAttributesApi(client);

describe('GetCharacterAttributesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character attributes', async () => {
        const mockResponse = {
            intelligence: 20,
            memory: 20,
            charisma: 20,
            perception: 20,
            willpower: 20
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => characterAttributesApi.getCharacterAttributes(123456));

        expect(result).toHaveProperty('intelligence');
        expect(typeof result.intelligence).toBe('number');
        expect(result).toHaveProperty('memory');
        expect(typeof result.memory).toBe('number');
        expect(result).toHaveProperty('charisma');
        expect(typeof result.charisma).toBe('number');
        expect(result).toHaveProperty('perception');
        expect(typeof result.perception).toBe('number');
        expect(result).toHaveProperty('willpower');
        expect(typeof result.willpower).toBe('number');
    });
});
