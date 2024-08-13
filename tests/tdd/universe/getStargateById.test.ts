import { UniverseStargateByIdApi } from '../../../src/api/universe/getStargateById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseStargateByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeStargateByIdApi = new UniverseStargateByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getStargateById', async () => {
        const mockResponse = {
            stargate_id: 50000001,
            name: 'Stargate Alpha',
            type_id: 29632,
            system_id: 30000142,
            destination: {
                system_id: 30002550,
                stargate_id: 50001039
            }
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type StargateResponse = {
            stargate_id: number;
            name: string;
            type_id: number;
            system_id: number;
            destination: {
                system_id: number;
                stargate_id: number;
            };
        };

        const result = await getBody(() => universeStargateByIdApi.getStargateById(50000001)) as StargateResponse;

        expect(result).toHaveProperty('stargate_id');
        expect(typeof result.stargate_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('type_id');
        expect(typeof result.type_id).toBe('number');
        expect(result).toHaveProperty('system_id');
        expect(typeof result.system_id).toBe('number');
        expect(result).toHaveProperty('destination');
        expect(typeof result.destination).toBe('object');
        expect(result.destination).toHaveProperty('system_id');
        expect(typeof result.destination.system_id).toBe('number');
        expect(result.destination).toHaveProperty('stargate_id');
        expect(typeof result.destination.stargate_id).toBe('number');
    });
});
