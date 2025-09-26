import { PostJumpCloneActivationApi } from '../../../src/api/clones/postJumpCloneActivation';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

let postJumpCloneActivationApi: PostJumpCloneActivationApi;

beforeAll(() => {
    postJumpCloneActivationApi = new PostJumpCloneActivationApi(getClient());
});

describe('PostJumpCloneActivationApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should call activateJumpClone and return success response', async () => {
        const characterId = 90000001;
        const jumpCloneId = 12345;
        const mockResponse = { success: true };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => postJumpCloneActivationApi.activateJumpClone(characterId, jumpCloneId));

        expect(result).toEqual(mockResponse);
        expect(result).toHaveProperty('success', true);
    });

    it('should handle different character and clone IDs correctly', async () => {
        const characterId = 90000002;
        const jumpCloneId = 67890;
        const mockResponse = { success: true };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => postJumpCloneActivationApi.activateJumpClone(characterId, jumpCloneId));

        expect(result).toEqual(mockResponse);
        expect(result).toHaveProperty('success', true);
    });

    it('should handle API errors gracefully', async () => {
        const characterId = 90000001;
        const jumpCloneId = 12345;
        
        fetchMock.mockRejectOnce(new Error('Jump clone not found'));

        await expect(getBody(() => postJumpCloneActivationApi.activateJumpClone(characterId, jumpCloneId))).rejects.toThrow();
    });

    it('should send POST request to correct endpoint', async () => {
        const characterId = 90000001;
        const jumpCloneId = 12345;
        const mockResponse = { success: true };
        
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));
        
        await getBody(() => postJumpCloneActivationApi.activateJumpClone(characterId, jumpCloneId));
        
        // Verify the request was made to the correct endpoint
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining(`characters/${characterId}/clones`),
            expect.objectContaining({
                method: 'POST'
            })
        );
    });
});
