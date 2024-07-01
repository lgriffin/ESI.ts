import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { AllianceApiBuilder } from '../../../src/api/alliances/AllianceApiBuilder';
import { getConfig } from '../../../src/config/configManager';

describe('AllianceApiBuilder', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    it('should build an AllianceClient instance', () => {
        const builder = new AllianceApiBuilder(client);
        const allianceClient = builder.build();
        expect(allianceClient).toBeDefined();
        expect(allianceClient.getAllianceById).toBeInstanceOf(Function);
        expect(allianceClient.getContacts).toBeInstanceOf(Function);
        expect(allianceClient.getContactLabels).toBeInstanceOf(Function);
        expect(allianceClient.getCorporations).toBeInstanceOf(Function);
        expect(allianceClient.getIcons).toBeInstanceOf(Function);
        expect(allianceClient.getAlliances).toBeInstanceOf(Function);
    });
});
