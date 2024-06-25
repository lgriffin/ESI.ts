import { ApiClientBuilder } from './core/ApiClientBuilder';
import { FactionWarfareLeaderboardsApi } from './api/factions/getFactionWarfareLeaderboards';
import { FactionWarfareStatsApi } from './api/factions/getFactionWarfareStats';
import { FactionWarfareSystemsApi } from './api/factions/getFactionWarfareSystems';
import { FactionWarfareWarsApi } from './api/factions/getFactionWarfareWars';
import { getConfig } from './config/configManager';
import logger from './core/logger/logger'; // Ensure logger is imported

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined) // Allow undefined token
    .build();

const factionWarfareLeaderboardsApi = new FactionWarfareLeaderboardsApi(client);
const factionWarfareStatsApi = new FactionWarfareStatsApi(client);
const factionWarfareSystemsApi = new FactionWarfareSystemsApi(client);
const factionWarfareWarsApi = new FactionWarfareWarsApi(client);

const testFactionWarfareAPIs = async () => {
    try {
        console.log('Testing Faction Warfare Leaderboards - Characters');
        const leaderboardsCharacters = await factionWarfareLeaderboardsApi.getCharacters();
        console.log('Leaderboards - Characters:', JSON.stringify(leaderboardsCharacters, null, 2));

        console.log('Testing Faction Warfare Leaderboards - Corporations');
        const leaderboardsCorporations = await factionWarfareLeaderboardsApi.getCorporations();
        console.log('Leaderboards - Corporations:', JSON.stringify(leaderboardsCorporations, null, 2));

        console.log('Testing Faction Warfare Leaderboards - Overall');
        const leaderboardsOverall = await factionWarfareLeaderboardsApi.getOverall();
        console.log('Leaderboards - Overall:', JSON.stringify(leaderboardsOverall, null, 2));

        console.log('Testing Faction Warfare Stats');
        const stats = await factionWarfareStatsApi.getStats();
        console.log('Stats:', JSON.stringify(stats, null, 2));

        console.log('Testing Faction Warfare Character Stats');
        const characterStats = await factionWarfareStatsApi.getCharacterStats(12345); // Replace with a valid character ID
        console.log('Character Stats:', JSON.stringify(characterStats, null, 2));

        console.log('Testing Faction Warfare Corporation Stats');
        const corporationStats = await factionWarfareStatsApi.getCorporationStats(67890); // Replace with a valid corporation ID
        console.log('Corporation Stats:', JSON.stringify(corporationStats, null, 2));

        console.log('Testing Faction Warfare Systems');
        const systems = await factionWarfareSystemsApi.getSystems();
        console.log('Systems:', JSON.stringify(systems, null, 2));

        console.log('Testing Faction Warfare Wars');
        const wars = await factionWarfareWarsApi.getWars();
        console.log('Wars:', JSON.stringify(wars, null, 2));
    } catch (error) {
        console.error('Error testing Faction Warfare APIs:', error);
    }
};


logger.info('Testing about to begin');
logger.info('Auth Token is ' + config.authToken + ' be happy if this is not set and a blank space exists');
logger.info('config is pointing towards ' + config.link);
testFactionWarfareAPIs();


