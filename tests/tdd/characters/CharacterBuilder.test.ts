import { CharacterApiBuilder } from '../../../src/builders/CharacterApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

const config = getConfig();

describe('CharacterApiBuilder', () => {
    it('should build a CharacterClient instance', () => {
        const client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        const characterApiBuilder = new CharacterApiBuilder(client);
        const characterClient = characterApiBuilder.build();

        expect(characterClient).toBeDefined();
    });
});
