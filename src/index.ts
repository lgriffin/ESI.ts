import { ApiClientBuilder } from './core/ApiClientBuilder';
import { FactionAPIBuilder } from './api/factions/FactionApiBuilder';
import { getConfig } from './config/configManager';
import logger from './core/logger/logger'; // Ensure logger is imported
import { AllianceClient } from './api/alliances/AllianceClient'; // Import the AllianceClient correctly

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined) // Allow undefined token
    .build();

const factionClient = new FactionAPIBuilder(client).build();
const allianceClient = new AllianceClient(client); // Ensure this is declared and imported correctly

const demoCharacter = 1689391488;
const demoCorp = 98742334;
const demoAlliance = 99003214;

const testFactionAPIs = async () => {
    try {
        console.log('Testing Faction Warfare Character Stats');
        const characterStats = await factionClient.getCharacterStats(demoCharacter);
        console.log('Character Stats:', JSON.stringify(characterStats, null, 2));

        console.log('Testing Faction Warfare Leaderboards - Characters');
        const leaderboardsCharacters = await factionClient.getLeaderboardsCharacters();
        console.log('Leaderboards - Characters:', JSON.stringify(leaderboardsCharacters, null, 2));

        console.log('Testing Faction Warfare Leaderboards - Corporations');
        const leaderboardsCorporations = await factionClient.getLeaderboardsCorporations();
        console.log('Leaderboards - Corporations:', JSON.stringify(leaderboardsCorporations, null, 2));

        console.log('Testing Faction Warfare Leaderboards - Overall');
        const leaderboardsOverall = await factionClient.getLeaderboardsOverall();
        console.log('Leaderboards - Overall:', JSON.stringify(leaderboardsOverall, null, 2));

        console.log('Testing Faction Warfare Stats');
        const stats = await factionClient.getStats();
        console.log('Stats:', JSON.stringify(stats, null, 2));

        console.log('Testing Faction Warfare Corporation Stats');
        const corporationStats = await factionClient.getCorporationStats(demoCorp);
        console.log('Corporation Stats:', JSON.stringify(corporationStats, null, 2));

        console.log('Testing Faction Warfare Systems');
        const systems = await factionClient.getSystems();
        console.log('Systems:', JSON.stringify(systems, null, 2));

        console.log('Testing Faction Warfare Wars');
        const wars = await factionClient.getWars();
        console.log('Wars:', JSON.stringify(wars, null, 2));
    } catch (error) {
        console.error('Error testing Faction Warfare APIs:', error);
    }
};

const testAllianceAPIs = async () => {
    try {
        console.log('Testing Alliance Info');
        const allianceInfo = await allianceClient.getAllianceById(demoAlliance);
        console.log('Alliance Info:', JSON.stringify(allianceInfo, null, 2));

        console.log('Testing Alliance Contacts');
        const allianceContacts = await allianceClient.getContacts(demoAlliance);
        console.log('Alliance Contacts:', JSON.stringify(allianceContacts, null, 2));

        console.log('Testing Alliance Contact Labels');
        const allianceContactLabels = await allianceClient.getContactLabels(demoAlliance);
        console.log('Alliance Contact Labels:', JSON.stringify(allianceContactLabels, null, 2));

        console.log('Testing Alliance Corporations');
        const allianceCorporations = await allianceClient.getCorporations(demoAlliance);
        console.log('Alliance Corporations:', JSON.stringify(allianceCorporations, null, 2));

        console.log('Testing Alliance Icons');
        const allianceIcons = await allianceClient.getIcons(demoAlliance);
        console.log('Alliance Icons:', JSON.stringify(allianceIcons, null, 2));

        console.log('Testing All Alliances');
        const allAlliances = await allianceClient.getAlliances();
        console.log('All Alliances:', JSON.stringify(allAlliances, null, 2));
    } catch (error) {
        console.error('Error testing Alliance APIs:', error);
    }
};

logger.info('Testing about to begin');
logger.info('Auth Token is ' + config.authToken + ' be happy if this is not set and a blank space exists');
logger.info('config is pointing towards ' + config.link);

testFactionAPIs();
testAllianceAPIs();
