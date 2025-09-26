import { GetCorporationProjectsApi } from '../../../src/api/corporations/getCorporationProjects';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

let getCorporationProjectsApi: GetCorporationProjectsApi;

beforeAll(() => {
    getCorporationProjectsApi = new GetCorporationProjectsApi(getClient());
});

describe('GetCorporationProjectsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should call getCorporationProjects and return corporation projects', async () => {
        const corporationId = 98000001;
        const mockProjects = [
            {
                project_id: 1,
                name: 'Test Project',
                description: 'A test project',
                status: 'active'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockProjects));

        const result = await getBody(() => getCorporationProjectsApi.getCorporationProjects(corporationId));

        expect(result).toEqual(mockProjects);
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            expect(result[0]).toHaveProperty('project_id');
            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('status');
        }
    });

    it('should handle different corporation IDs correctly', async () => {
        const corporationId = 98000002;
        const mockProjects: any[] = [];

        fetchMock.mockResponseOnce(JSON.stringify(mockProjects));

        const result = await getBody(() => getCorporationProjectsApi.getCorporationProjects(corporationId));

        expect(result).toEqual(mockProjects);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
        const corporationId = 98000001;
        
        fetchMock.mockRejectOnce(new Error('Corporation not found'));

        await expect(getBody(() => getCorporationProjectsApi.getCorporationProjects(corporationId))).rejects.toThrow();
    });
});
