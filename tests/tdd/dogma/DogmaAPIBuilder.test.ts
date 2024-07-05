import { ApiClient } from '../../../src/core/ApiClient';
import { DogmaAPIBuilder } from '../../../src/builders/DogmaAPIBuilder';
import { DogmaClient } from '../../../src/clients/DogmaClient';

describe('DogmaAPIBuilder', () => {
    it('should build DogmaClient', () => {
        const apiClient = new ApiClient('test', 'https://esi.evetech.net/latest');
        const builder = new DogmaAPIBuilder(apiClient);
        const client = builder.build();

        expect(client).toBeInstanceOf(DogmaClient);
    });
});
