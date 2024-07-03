import { ApiClientBuilder } from './core/ApiClientBuilder';
import { FactionAPIBuilder } from './api/factions/FactionApiBuilder';
import { getConfig } from './config/configManager';
import logger from './core/logger/logger'; // Ensure logger is imported
import { AllianceClient } from './api/alliances/AllianceClient'; // Import the AllianceClient correctly
import { WarsAPIBuilder } from './api/wars/WarsAPIBuilder';
import { UniverseApiBuilder } from './api/universe/UniverseApiBuilder';
import { StatusAPIBuilder } from './api/status/StatusApiBuilder';

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined) // Allow undefined token
    .build();

const factionClient = new FactionAPIBuilder(client).build();
const allianceClient = new AllianceClient(client); 
const warsClient = new WarsAPIBuilder(client).build();
const universeClient = new UniverseApiBuilder(client).build();
const statusClient = new StatusAPIBuilder(client).build();

const demoCharacter = 1689391488;
const demoCorp = 98742334;
const demoAlliance = 99005338;
const demoWarId = 740620; // just a test

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
     //   const allAlliances = await allianceClient.getAlliances();
      //  console.log('All Alliances:', JSON.stringify(allAlliances, null, 2));
    } catch (error) {
        console.error('Error testing Alliance APIs:', error);
    }
};

const testWarsAPI = async () => {

    try {
        console.log('Testing War Info');
        const warInfo = await warsClient.getWarById(demoWarId);
        console.log('War Info:', JSON.stringify(warInfo, null, 2));

        console.log('Testing War Killmails');
        const warKillmails = await warsClient.getWarKillmails(demoWarId);
        console.log('War Killmails:', JSON.stringify(warKillmails, null, 2));

        console.log('Testing Getting Wars');
        const activeWars = await warsClient.getWars();
        console.log(activeWars);

        
    } catch (error) {
        console.error('Error testing Wars APIs:', error);
    }

}

const testUniverseAPIs = async () => {
    try {
        console.log('Testing Universe Ancestries');
        const ancestries = await universeClient.getAncestries();
        console.log('Ancestries:', JSON.stringify(ancestries, null, 2));

        console.log('Testing Universe Asteroid Belt Information');
        const asteroidBeltInfo = await universeClient.getAsteroidBeltInfo(12345); // Replace with a valid asteroid belt ID
        console.log('Asteroid Belt Info:', JSON.stringify(asteroidBeltInfo, null, 2));

        console.log('Testing Universe Bloodlines');
        const bloodlines = await universeClient.getBloodlines();
        console.log('Bloodlines:', JSON.stringify(bloodlines, null, 2));

        console.log('Testing Universe Constellations');
        const constellations = await universeClient.getConstellations();
        console.log('Constellations:', JSON.stringify(constellations, null, 2));

        console.log('Testing Universe Constellation by ID');
        const constellationById = await universeClient.getConstellationById(12345); // Replace with a valid constellation ID
        console.log('Constellation by ID:', JSON.stringify(constellationById, null, 2));

        console.log('Testing Universe Factions');
        const factions = await universeClient.getFactions();
        console.log('Factions:', JSON.stringify(factions, null, 2));

        console.log('Testing Universe Graphics');
        const graphics = await universeClient.getGraphics();
        console.log('Graphics:', JSON.stringify(graphics, null, 2));

        console.log('Testing Universe Graphic by ID');
        const graphicById = await universeClient.getGraphicById(12345); // Replace with a valid graphic ID
        console.log('Graphic by ID:', JSON.stringify(graphicById, null, 2));

        console.log('Testing Universe Item Categories');
        const itemCategories = await universeClient.getItemCategories();
        console.log('Item Categories:', JSON.stringify(itemCategories, null, 2));

        console.log('Testing Universe Item Category by ID');
        const itemCategoryById = await universeClient.getItemCategoryById(12345); // Replace with a valid category ID
        console.log('Item Category by ID:', JSON.stringify(itemCategoryById, null, 2));

        console.log('Testing Universe Item Groups');
        const itemGroups = await universeClient.getItemGroups();
        console.log('Item Groups:', JSON.stringify(itemGroups, null, 2));

        console.log('Testing Universe Item Group by ID');
        const itemGroupById = await universeClient.getItemGroupById(12345); // Replace with a valid group ID
        console.log('Item Group by ID:', JSON.stringify(itemGroupById, null, 2));

        console.log('Testing Universe Moon by ID');
        const moonById = await universeClient.getMoonById(12345); // Replace with a valid moon ID
        console.log('Moon by ID:', JSON.stringify(moonById, null, 2));

        console.log('Testing Universe Planet by ID');
        const planetById = await universeClient.getPlanetById(12345); // Replace with a valid planet ID
        console.log('Planet by ID:', JSON.stringify(planetById, null, 2));

        console.log('Testing Universe Races');
        const races = await universeClient.getRaces();
        console.log('Races:', JSON.stringify(races, null, 2));

        console.log('Testing Universe Region by ID');
        const regionById = await universeClient.getRegionById(12345); // Replace with a valid region ID
        console.log('Region by ID:', JSON.stringify(regionById, null, 2));

        console.log('Testing Universe Star by ID');
        const starById = await universeClient.getStarById(12345); // Replace with a valid star ID
        console.log('Star by ID:', JSON.stringify(starById, null, 2));

        console.log('Testing Universe Stargate by ID');
        const stargateById = await universeClient.getStargateById(12345); // Replace with a valid stargate ID
        console.log('Stargate by ID:', JSON.stringify(stargateById, null, 2));

        console.log('Testing Universe Station by ID');
        const stationById = await universeClient.getStationById(12345); // Replace with a valid station ID
        console.log('Station by ID:', JSON.stringify(stationById, null, 2));

        console.log('Testing Universe Structure by ID');
        const structureById = await universeClient.getStructureById(12345); // Replace with a valid structure ID
        console.log('Structure by ID:', JSON.stringify(structureById, null, 2));

        console.log('Testing Universe Structures');
        const structures = await universeClient.getStructures();
        console.log('Structures:', JSON.stringify(structures, null, 2));

        console.log('Testing Universe System by ID');
        const systemById = await universeClient.getSystemById(12345); // Replace with a valid system ID
        console.log('System by ID:', JSON.stringify(systemById, null, 2));

        console.log('Testing Universe System Jumps');
        const systemJumps = await universeClient.getSystemJumps();
        console.log('System Jumps:', JSON.stringify(systemJumps, null, 2));

        console.log('Testing Universe System Kills');
        const systemKills = await universeClient.getSystemKills();
        console.log('System Kills:', JSON.stringify(systemKills, null, 2));

        console.log('Testing Universe Systems');
        const systems = await universeClient.getSystems();
        console.log('Systems:', JSON.stringify(systems, null, 2));

        console.log('Testing Universe Type by ID');
        const typeById = await universeClient.getTypeById(12345); // Replace with a valid type ID
        console.log('Type by ID:', JSON.stringify(typeById, null, 2));

        console.log('Testing Universe Types');
        const types = await universeClient.getTypes();
        console.log('Types:', JSON.stringify(types, null, 2));

      //  console.log('Testing Bulk Names to IDs');
      //  const bulkNamesToIds = await universeClient.postBulkNamesToIds([12345, 67890]); // Replace with valid IDs
      //  console.log('Bulk Names to IDs:', JSON.stringify(bulkNamesToIds, null, 2));

      //  console.log('Testing Names and Categories for IDs');
      //  const namesAndCategories = await universeClient.postNamesAndCategories([12345, 67890]); // Replace with valid IDs
      //  console.log('Names and Categories for IDs:', JSON.stringify(namesAndCategories, null, 2));

    } catch (error) {
        console.error('Error testing Universe APIs:', error);
    }
};

const testStatusAPI = async () => {
    try {
        console.log('Testing Status API');
        const status = await statusClient.getStatus();
        console.log('Status:', JSON.stringify(status, null, 2));
    } catch (error) {
        console.error('Error testing Status API:', error);
    }
};

logger.info('Testing about to begin');
logger.info('Auth Token is ' + config.authToken + ' be happy if this is not set and a blank space exists');
logger.info('config is pointing towards ' + config.link);

//testFactionAPIs();
//testAllianceAPIs();
//testWarsAPI();
testStatusAPI();
//testUniverseAPIs();