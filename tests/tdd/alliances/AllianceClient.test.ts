import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { AllianceClient } from '../../../src/api/alliances/AllianceClient';
import { getConfig } from '../../../src/config/configManager';

describe('AllianceClient', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    const allianceClient = new AllianceClient(client);

    it('should call getAllianceById and return a valid response', async () => {
        const allianceId = 12345;
        const mockResponse = { alliance_id: allianceId, name: 'Test Alliance' };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await allianceClient.getAllianceById(allianceId);
        expect(result.alliance_id).toBe(allianceId);
        expect(result.name).toBe('Test Alliance');
    });

    // TODO: Add similar tests for other methods like getContacts, getContactLabels, etc.
});
