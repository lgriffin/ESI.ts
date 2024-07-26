import { GetSchematicInformationApi } from '../../../src/api/pi/getSchematicInformation';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const schematicInformationApi = new GetSchematicInformationApi(client);

describe('GetSchematicInformationApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return schematic information', async () => {
        const mockResponse = {
            schematic_id: 1,
            schematic_name: 'Test Schematic',
            cycle_time: 300,
            output_quantity: 10
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await schematicInformationApi.getSchematicInformation(1);

        expect(result).toHaveProperty('schematic_id');
        expect(typeof result.schematic_id).toBe('number');
        expect(result).toHaveProperty('schematic_name');
        expect(typeof result.schematic_name).toBe('string');
        expect(result).toHaveProperty('cycle_time');
        expect(typeof result.cycle_time).toBe('number');
        expect(result).toHaveProperty('output_quantity');
        expect(typeof result.output_quantity).toBe('number');
    });
});
