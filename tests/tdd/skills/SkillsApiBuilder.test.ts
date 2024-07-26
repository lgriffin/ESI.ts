import { SkillsApiBuilder } from '../../../src/builders/SkillsApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { CharacterSkillsClient } from '../../../src/clients/SkillsClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('CharacterSkillsApiBuilder', () => {
    it('should build and return a CharacterSkillsClient instance', () => {
        const builder = new SkillsApiBuilder(client);
        const characterSkillsClient = builder.build();

        expect(characterSkillsClient).toBeInstanceOf(CharacterSkillsClient);
    });
});
