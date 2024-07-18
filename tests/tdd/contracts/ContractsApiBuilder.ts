import { ContractApiBuilder } from '../../../src/builders/ContractsApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { ContractsClient } from '../../../src/clients/ContractsClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('ContractApiBuilder', () => {
    it('should build and return a ContractClient instance', () => {
        const builder = new ContractApiBuilder(client);
        const contractClient = builder.build();

        expect(contractClient).toBeInstanceOf(ContractsClient);
    });
});
