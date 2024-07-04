import { ApiClient } from '../../../src/core/ApiClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { InsuranceAPIBuilder } from '../../../src/builders/InsuranceAPIBuilder';
import { InsuranceClient } from '../../../src/clients/InsuranceClient';

describe('InsuranceAPIBuilder', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    it('should build an InsuranceClient', () => {
        const builder = new InsuranceAPIBuilder(client);
        const insuranceClient = builder.build();

        expect(insuranceClient).toBeInstanceOf(InsuranceClient);
    });
});
