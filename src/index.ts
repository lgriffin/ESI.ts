import { ApiClientBuilder } from './core/ApiClientBuilder';
import { FactionAPIBuilder } from './builders/FactionApiBuilder';
import { getConfig } from './config/configManager';
import logger from './core/logger/logger'; // Ensure logger is imported
import { AllianceClient } from './clients/AllianceClient'; // Import the AllianceClient correctly
import { WarsAPIBuilder } from './builders/WarsAPIBuilder';
import { UniverseAPIBuilder } from './builders/UniverseApiBuilder';
import { StatusAPIBuilder } from './builders/StatusApiBuilder';
import { InsuranceAPIBuilder } from './builders/InsuranceApiBuilder';
import { DogmaAPIBuilder } from './builders/DogmaApiBuilder';
import { RouteApiBuilder } from './builders/RouteApiBuilder';
import { IncursionsApiBuilder } from './builders/IncursionsApiBuilder';
import { OpportunitiesApiBuilder } from './builders/OpportunitiesApiBuilder';
import { SearchApiBuilder } from './builders/SearchApiBuilder';
import { SovereigntyApiBuilder } from './builders/SovereigntyApiBuilder';
import { AssetsApiBuilder } from './builders/AssetsApiBuilder';
import { BookmarkApiBuilder } from './builders/BookmarkApiBuilder';
import { CalendarApiBuilder } from './builders/CalendarApiBuilder';
import { ClonesApiBuilder } from './builders/ClonesApiBuilder';
import { CharacterApiBuilder } from './builders/CharacterApiBuilder';
import { ContractsApiBuilder } from './builders/ContractsApiBuilder';
import { CorporationsApiBuilder } from './builders/CorporationsApiBuilder';
import { FittingsApiBuilder } from './builders/FittingsApiBuilder';
import { FleetApiBuilder } from './builders/FleetApiBuilder';
import { IndustryApiBuilder } from './builders/IndustryApiBuilder';
import { KillmailsApiBuilder } from './builders/KillmailsBuilder';
import { LocationApiBuilder } from './builders/LocationApiBuilder';
import { LoyaltyApiBuilder } from './builders/LoyaltyApiBuilder';
import { PiApiBuilder } from './builders/PiApiBuilder';
import { SkillsApiBuilder } from './builders/SkillsApiBuilder';
import { MailApiBuilder } from './builders/MailApiBuilder';
import { UiApiBuilder } from './builders/UiApiBuilder';
import { WalletApiBuilder } from './builders/WalletApiBuilder';
const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined) // Allow undefined token
    .build();

const factionClient = new FactionAPIBuilder(client).build();
const allianceClient = new AllianceClient(client); 
const warsClient = new WarsAPIBuilder(client).build();
const universeClient = new UniverseAPIBuilder(client).build();
const statusClient = new StatusAPIBuilder(client).build();
const insuranceClient = new InsuranceAPIBuilder(client).build();
const dogmaClient = new DogmaAPIBuilder(client).build();
const routeClient = new RouteApiBuilder(client).build();
const incursionsClient = new IncursionsApiBuilder(client).build();
const searchClient = new SearchApiBuilder(client).build();
const sovereigntyClient = new SovereigntyApiBuilder(client).build();
const opportunitiesClient = new OpportunitiesApiBuilder(client).build();
const assetsClient = new AssetsApiBuilder(client).build();
const bookmarkClient = new BookmarkApiBuilder(client).build();
const calendarClient = new CalendarApiBuilder(client).build();
const clonesClient = new ClonesApiBuilder(client).build();
const characterClient = new CharacterApiBuilder(client).build();
const contractsClient = new ContractsApiBuilder(client).build();
const corporationsClient = new CorporationsApiBuilder(client).build();
const fittingsClient = new FittingsApiBuilder(client).build();
const fleetClient = new FleetApiBuilder(client).build();
const industryClient = new IndustryApiBuilder(client).build();
const killmailsClient = new KillmailsApiBuilder(client).build();
const locationClient = new LocationApiBuilder(client).build();
const loyaltyClient = new LoyaltyApiBuilder(client).build();
const piClient = new PiApiBuilder(client).build();
const skillsClient = new SkillsApiBuilder(client).build();
const mailClient = new MailApiBuilder(client).build();
const uiClient = new UiApiBuilder(client).build();
const walletClient = new WalletApiBuilder(client).build();

const demoCharacter = 1689391488;
const demoCorp = 98742334;
const demoAlliance = 99005338;
const demoWarId = 740620;
const demoItemIds = [111, 222, 333];

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

const testInsurancePrices = async () => {
    try {
        console.log('Testing Insurance Prices');
        const prices = await insuranceClient.getInsurancePrices();
        console.log('Insurance Prices:', JSON.stringify(prices, null, 2));
    } catch (error) {
        console.error('Error testing Insurance Prices:', error);
    }
};

const testDogmaAPI = async () => {
    try {
        console.log('Testing Dogma Attributes');
        const attributes = await dogmaClient.getAttributes();
        console.log('Attributes:', JSON.stringify(attributes, null, 2));

        console.log('Testing Dogma Attribute by ID');
        const attributeInfo = await dogmaClient.getAttributeById(1237); // Replace with a valid attribute ID
        console.log('Attribute Info:', JSON.stringify(attributeInfo, null, 2));

        console.log('Testing Dogma Dynamic Item Information');
        const dynamicItemInfo = await dogmaClient.getDynamicItemInfo(1, 1); // Replace with valid type_id and item_id
        console.log('Dynamic Item Info:', JSON.stringify(dynamicItemInfo, null, 2));

        console.log('Testing Dogma Effects');
        const effects = await dogmaClient.getEffects();
        console.log('Effects:', JSON.stringify(effects, null, 2));

        console.log('Testing Dogma Effect by ID');
        const effectInfo = await dogmaClient.getEffectById(6402); // Replace with a valid effect ID
        console.log('Effect Info:', JSON.stringify(effectInfo, null, 2));
    } catch (error) {
       console.error('Error in the Dogma testing');
    }
};

const testRouteAPI = async () => {
    try {
        console.log('Testing Route API');
        const route = await routeClient.getRoute(30003283, 30000142);
        console.log('Route:', JSON.stringify(route, null, 2));
    } catch (error) {
        console.error('Error testing Route API:', error);
    }
};

const testIncursionsAPI = async () => {

    try{
        console.log("Testing incursions API");
        const incursions = await incursionsClient.getIncursions();
        console.log(incursions);
    } catch (error) {
        console.error('Hmmm we hit an error testing our incursions API:',error);
    }

}

const testOpportunitiesAPIs = async () => {
    try {
        console.log('Testing Character Opportunities');
        const characterOpportunities = await opportunitiesClient.getCharacterOpportunities(12345); // Replace with a valid character ID
        console.log('Character Opportunities:', JSON.stringify(characterOpportunities, null, 2));

        console.log('Testing Opportunities Groups');
        const opportunitiesGroups = await opportunitiesClient.getOpportunitiesGroups();
        console.log('Opportunities Groups:', JSON.stringify(opportunitiesGroups, null, 2));

        console.log('Testing Opportunities Group by ID');
        const opportunitiesGroupById = await opportunitiesClient.getOpportunitiesGroupById(100); // Replace with a valid group ID using 100 as an example
        console.log('Opportunities Group by ID:', JSON.stringify(opportunitiesGroupById, null, 2));

        console.log('Testing Opportunities Tasks');
        const opportunitiesTasks = await opportunitiesClient.getOpportunitiesTasks();
        console.log('Opportunities Tasks:', JSON.stringify(opportunitiesTasks, null, 2));

        console.log('Testing Opportunities Task by ID');
        const opportunitiesTaskById = await opportunitiesClient.getOpportunitiesTaskById(102); // Replace with a valid task ID using 102 as an example
        console.log('Opportunities Task by ID:', JSON.stringify(opportunitiesTaskById, null, 2));

    } catch (error) {
        console.error('Error testing Opportunities APIs:', error);
    }
};

const testCharacterSearchAPI = async () => {
    try {
     
        console.log('Testing Character Search');
        const searchResults = await searchClient.characterSearch(demoCharacter, 'Test');
        console.log('Search Results:', JSON.stringify(searchResults, null, 2));
    } catch (error) {
        console.error('Error testing Character Search API:', error);
    }
};

const testSovereigntyAPIs = async () => {
    try {
        console.log('Testing Sovereignty Campaigns');
        const campaigns = await sovereigntyClient.getSovereigntyCampaigns();
        console.log('Campaigns:', JSON.stringify(campaigns, null, 2));

        console.log('Testing Sovereignty Map');
        const map = await sovereigntyClient.getSovereigntyMap();
        console.log('Map:', JSON.stringify(map, null, 2));

        console.log('Testing Sovereignty Structures');
        const structures = await sovereigntyClient.getSovereigntyStructures();
        console.log('Structures:', JSON.stringify(structures, null, 2));
    } catch (error) {
        console.error('Error testing Sovereignty APIs:', error);
    }
};

const testAssetsAPI = async () => {
    try {
        console.log('Testing Character Assets');
        const characterAssets = await assetsClient.getCharacterAssets(demoCharacter);
        console.log('Character Assets:', JSON.stringify(characterAssets, null, 2));

        console.log('Testing Post Character Asset Locations');
        const characterAssetLocations = await assetsClient.postCharacterAssetLocations(demoCharacter, demoItemIds);
        console.log('Character Asset Locations:', JSON.stringify(characterAssetLocations, null, 2));

        console.log('Testing Post Character Asset Names');
        const characterAssetNames = await assetsClient.postCharacterAssetNames(demoCharacter, demoItemIds);
        console.log('Character Asset Names:', JSON.stringify(characterAssetNames, null, 2));

        console.log('Testing Corporation Assets');
        const corporationAssets = await assetsClient.getCorporationAssets(demoCorp);
        console.log('Corporation Assets:', JSON.stringify(corporationAssets, null, 2));

        console.log('Testing Post Corporation Asset Locations');
        const corporationAssetLocations = await assetsClient.postCorporationAssetLocations(demoCorp, demoItemIds);
        console.log('Corporation Asset Locations:', JSON.stringify(corporationAssetLocations, null, 2));

        console.log('Testing Post Corporation Asset Names');
        const corporationAssetNames = await assetsClient.postCorporationAssetNames(demoCorp, demoItemIds);
        console.log('Corporation Asset Names:', JSON.stringify(corporationAssetNames, null, 2));
    } catch (error) {
        console.error('Error testing Assets APIs:', error);
    }
};

const testBookmarkAPIs = async () => {

    try {
        console.log('Testing Character Bookmarks');
        const characterBookmarks = await bookmarkClient.getCharacterBookmarks(demoCharacter);
        console.log('Character Bookmarks:', JSON.stringify(characterBookmarks, null, 2));

        console.log('Testing Character Bookmark Folders');
        const characterBookmarkFolders = await bookmarkClient.getCharacterBookmarkFolders(demoCharacter);
        console.log('Character Bookmark Folders:', JSON.stringify(characterBookmarkFolders, null, 2));

        console.log('Testing Corporation Bookmarks');
        const corporationBookmarks = await bookmarkClient.getCorporationBookmarks(demoCorp);
        console.log('Corporation Bookmarks:', JSON.stringify(corporationBookmarks, null, 2));

        console.log('Testing Corporation Bookmark Folders');
        const corporationBookmarkFolders = await bookmarkClient.getCorporationBookmarkFolders(demoCorp);
        console.log('Corporation Bookmark Folders:', JSON.stringify(corporationBookmarkFolders, null, 2));
    } catch (error) {
        console.error('Error testing Bookmark APIs:', error);
    }
};

const testCalendarAPIs = async () => {
       try {
        console.log('Testing Calendar Events');
        const calendarEvents = await calendarClient.getCalendarEvents(demoCharacter);
        console.log('Calendar Events:', JSON.stringify(calendarEvents, null, 2));

        console.log('Testing Calendar Event by ID');
        const calendarEvent = await calendarClient.getCalendarEventById(demoCharacter, 67890);
        console.log('Calendar Event:', JSON.stringify(calendarEvent, null, 2));

        console.log('Testing Respond to Calendar Event');
        const response = await calendarClient.respondToCalendarEvent(demoCharacter, 67890, 'accepted');
        console.log('Response to Calendar Event:', JSON.stringify(response, null, 2));

        console.log('Testing Get Event Attendees');
        const attendees = await calendarClient.getEventAttendees(demoCharacter, 67890);
        console.log('Event Attendees:', JSON.stringify(attendees, null, 2));

    } catch (error) {
        console.error('Error testing Calendar APIs:', error);
    }
};

const testClonesAPI = async () => {
 
    try {
        console.log('Testing Clones');
        const clones = await clonesClient.getClones(demoCharacter);
        console.log('Clones:', JSON.stringify(clones, null, 2));

        console.log('Testing Implants');
        const implants = await clonesClient.getImplants(demoCharacter);
        console.log('Implants:', JSON.stringify(implants, null, 2));
    } catch (error) {
        console.error('Error testing Clones API:', error);
    }
};

const testCharacterApi = async () => {
    try {
        console.log('Testing Character Public Info');
        const characterPublicInfo = await characterClient.getCharacterPublicInfo(demoCharacter);
        console.log('Character Public Info:', JSON.stringify(characterPublicInfo, null, 2));

        console.log('Testing Character Agents Research');
        const characterAgentsResearch = await characterClient.getCharacterAgentsResearch(demoCharacter);
        console.log('Character Agents Research:', JSON.stringify(characterAgentsResearch, null, 2));

        console.log('Testing Character Blueprints');
        const characterBlueprints = await characterClient.getCharacterBlueprints(demoCharacter);
        console.log('Character Blueprints:', JSON.stringify(characterBlueprints, null, 2));

        console.log('Testing Character Corporation History');
        const characterCorporationHistory = await characterClient.getCharacterCorporationHistory(demoCharacter);
        console.log('Character Corporation History:', JSON.stringify(characterCorporationHistory, null, 2));

        console.log('Testing CSPA Charge Cost');
        const cspaChargeCost = await characterClient.postCspaChargeCost(demoCharacter, [1234567890, 1234567891]);
        console.log('CSPA Charge Cost:', JSON.stringify(cspaChargeCost, null, 2));
    } catch (error) {
        console.error('Error testing Character APIs:', error);
    }
};

const testContracts = async () => {
    try {
        console.log('Testing Character Contracts');
        const characterContracts = await contractsClient.getCharacterContracts(demoCharacter);
        console.log('Character Contracts:', characterContracts);

        console.log('Testing Character Contract Bids');
        const characterContractBids = await contractsClient.getCharacterContractBids(demoCharacter, 206732670);
        console.log('Character Contract Bids:', characterContractBids);

        console.log('Testing Character Contract Items');
        const characterContractItems = await contractsClient.getCharacterContractItems(demoCharacter, 987654321);
        console.log('Character Contract Items:', characterContractItems);

        console.log('Testing Public Contracts');
        const publicContracts = await contractsClient.getPublicContracts(10000001);
        console.log('Public Contracts:', publicContracts);

        console.log('Testing Public Contract Bids');
        const publicContractBids = await contractsClient.getPublicContractBids(206732670); // update to a valid contract ID, this works right now!
        console.log('Public Contract Bids:', publicContractBids);

        console.log('Testing Public Contract Items');
        const publicContractItems = await contractsClient.getPublicContractItems(206732670);
        console.log('Public Contract Items:', publicContractItems);

        console.log('Testing Corporation Contracts');
        const corporationContracts = await contractsClient.getCorporationContracts(demoCorp);
        console.log('Corporation Contracts:', corporationContracts);

        console.log('Testing Corporation Contract Bids');
        const corporationContractBids = await contractsClient.getCorporationContractBids(demoCorp, 987654321);
        console.log('Corporation Contract Bids:', corporationContractBids);

        console.log('Testing Corporation Contract Items');
        const corporationContractItems = await contractsClient.getCorporationContractItems(demoCorp, 987654321);
        console.log('Corporation Contract Items:', corporationContractItems);
    } catch (error) {
        console.error('Error testing Contracts APIs:', error);
    }
};

const testCorporations = async () => {
    try {
        console.log('Testing Corporation Info');
        const corporationInfo = await corporationsClient.getCorporationInfo(123456789);
        console.log('Corporation Info:', corporationInfo);

        console.log('Testing Corporation Alliance History');
        const allianceHistory = await corporationsClient.getCorporationAllianceHistory(123456789);
        console.log('Alliance History:', allianceHistory);

        console.log('Testing Corporation Blueprints');
        const blueprints = await corporationsClient.getCorporationBlueprints(123456789);
        console.log('Blueprints:', blueprints);

        console.log('Testing Corporation ALSC Logs');
        const alscLogs = await corporationsClient.getCorporationAlscLogs(123456789);
        console.log('ALSC Logs:', alscLogs);

        console.log('Testing Corporation Divisions');
        const divisions = await corporationsClient.getCorporationDivisions(123456789);
        console.log('Divisions:', divisions);

        console.log('Testing Corporation Facilities');
        const facilities = await corporationsClient.getCorporationFacilities(123456789);
        console.log('Facilities:', facilities);

        console.log('Testing Corporation Icon');
        const icon = await corporationsClient.getCorporationIcon(123456789);
        console.log('Icon:', icon);

        console.log('Testing Corporation Medals');
        const medals = await corporationsClient.getCorporationMedals(123456789);
        console.log('Medals:', medals);

        console.log('Testing Corporation Issued Medals');
        const issuedMedals = await corporationsClient.getCorporationIssuedMedals(123456789);
        console.log('Issued Medals:', issuedMedals);

        console.log('Testing Corporation Members');
        const members = await corporationsClient.getCorporationMembers(123456789);
        console.log('Members:', members);

        console.log('Testing Corporation Member Limit');
        const memberLimit = await corporationsClient.getCorporationMemberLimit(123456789);
        console.log('Member Limit:', memberLimit);

        console.log('Testing Corporation Member Titles');
        const memberTitles = await corporationsClient.getCorporationMemberTitles(123456789);
        console.log('Member Titles:', memberTitles);

        console.log('Testing Corporation Member Tracking');
        const memberTracking = await corporationsClient.getCorporationMemberTracking(123456789);
        console.log('Member Tracking:', memberTracking);

        console.log('Testing Corporation Roles');
        const roles = await corporationsClient.getCorporationRoles(123456789);
        console.log('Roles:', roles);

        console.log('Testing Corporation Roles History');
        const rolesHistory = await corporationsClient.getCorporationRolesHistory(123456789);
        console.log('Roles History:', rolesHistory);

        console.log('Testing Corporation Shareholders');
        const shareholders = await corporationsClient.getCorporationShareholders(123456789);
        console.log('Shareholders:', shareholders);

        console.log('Testing Corporation Standings');
        const standings = await corporationsClient.getCorporationStandings(123456789);
        console.log('Standings:', standings);

        console.log('Testing Corporation Starbases');
        const starbases = await corporationsClient.getCorporationStarbases(123456789);
        console.log('Starbases:', starbases);

        console.log('Testing Corporation Starbase Detail');
        const starbaseDetail = await corporationsClient.getCorporationStarbaseDetail(123456789, 987654321);
        console.log('Starbase Detail:', starbaseDetail);

        console.log('Testing Corporation Structures');
        const structures = await corporationsClient.getCorporationStructures(123456789);
        console.log('Structures:', structures);

        console.log('Testing Corporation Titles');
        const titles = await corporationsClient.getCorporationTitles(123456789);
        console.log('Titles:', titles);

        console.log('Testing NPC Corporations');
        const npcCorporations = await corporationsClient.getNpcCorporations();
        console.log('NPC Corporations:', npcCorporations);

    } catch (error) {
        console.error('Error testing CorporationsClient:', error);
    }


};

const testFittings = async () => {
    try {
  

        // Test get fittings
        console.log('Testing getCharacterFittings...');
        const fittings = await fittingsClient.getFittings(demoCharacter);
        console.log('Character Fittings:', fittings);

        // Test create fitting
        console.log('Testing createCharacterFitting...');
        const newFitting = {
            name: 'New Fitting',
            description: 'Test fitting',
            ship_type_id: 1234,
            items: [
                {
                    type_id: 5678,
                    quantity: 1,
                    flag: 12
                }
            ]
        };
        const createdFitting = await fittingsClient.createFitting(demoCharacter, newFitting);
        console.log('Created Fitting:', createdFitting);

        // Test delete fitting
        console.log('Testing deleteCharacterFitting...');
        const fittingIdToDelete = 1; // Replace with actual fitting ID
        await fittingsClient.deleteFitting(demoCharacter, fittingIdToDelete);
        console.log('Deleted Fitting ID:', fittingIdToDelete);

    } catch (error) {
        console.error('Error testing fittings:', error);
    }
};


export const testFleet = async () => {
    try {
        const characterFleetInfo = await fleetClient.getCharacterFleetInfo(1234567890);
        console.log('Character Fleet Info:', characterFleetInfo);

        const fleetInfo = await fleetClient.getFleetInformation(1234567890);
        console.log('Fleet Info:', fleetInfo);

        const updateFleetBody = { is_free_move: true };
        const updateFleet = await fleetClient.updateFleet(1234567890, updateFleetBody);
        console.log('Update Fleet:', updateFleet);

        const fleetMembers = await fleetClient.getFleetMembers(1234567890);
        console.log('Fleet Members:', fleetMembers);

        const createFleetInvitationBody = { character_id: 123456, role: 'squad_member' };
        const createFleetInvitation = await fleetClient.createFleetInvitation(1234567890, createFleetInvitationBody);
        console.log('Create Fleet Invitation:', createFleetInvitation);

        const kickFleetMember = await fleetClient.kickFleetMember(1234567890, 123456789);
        console.log('Kick Fleet Member:', kickFleetMember);

        const moveFleetMemberBody = { role: 'squad_member', squad_id: 1, wing_id: 2 };
        const moveFleetMember = await fleetClient.moveFleetMember(1234567890, 123456789, moveFleetMemberBody);
        console.log('Move Fleet Member:', moveFleetMember);

        const deleteFleetSquad = await fleetClient.deleteFleetSquad(1234567890, 1);
        console.log('Delete Fleet Squad:', deleteFleetSquad);

        const renameFleetSquad = await fleetClient.renameFleetSquad(1234567890, 1, 'New Squad Name');
        console.log('Rename Fleet Squad:', renameFleetSquad);

        const fleetWings = await fleetClient.getFleetWings(1234567890);
        console.log('Fleet Wings:', fleetWings);

        const createFleetWingBody = { name: 'New Wing' };
        const createFleetWing = await fleetClient.createFleetWing(1234567890, createFleetWingBody);
        console.log('Create Fleet Wing:', createFleetWing);

        const deleteFleetWing = await fleetClient.deleteFleetWing(1234567890, 1);
        console.log('Delete Fleet Wing:', deleteFleetWing);

        const renameFleetWing = await fleetClient.renameFleetWing(1234567890, 1, 'New Wing Name');
        console.log('Rename Fleet Wing:', renameFleetWing);

        const createFleetSquad = await fleetClient.createFleetSquad(1234567890, 1);
        console.log('Create Fleet Squad:', createFleetSquad);
    } catch (error) {
        console.error('Error:', error);
    }
};

const testIndustry = async () => {
    const observerId = 11223344; // Replace with a valid observer ID


    try {
        console.log('Testing Industry APIs...');

        // Test character industry jobs
        const characterIndustryJobs = await industryClient.getCharacterIndustryJobs(demoCharacter);
        console.log('Character Industry Jobs:', characterIndustryJobs);

        // Test character mining ledger
        const characterMiningLedger = await industryClient.getCharacterMiningLedger(demoCharacter);
        console.log('Character Mining Ledger:', characterMiningLedger);

        // Test corporation mining extractions
        const moonExtractionTimers = await industryClient.getMoonExtractionTimers(demoCorp);
        console.log('Moon Extraction Timers:', moonExtractionTimers);

        // Test corporation mining observers
        const corporationMiningObservers = await industryClient.getCorporationMiningObservers(demoCorp);
        console.log('Corporation Mining Observers:', corporationMiningObservers);

        // Test observed corporation mining
        const observedCorporationMining = await industryClient.getMoonExtractionTimers(demoCorp);
        console.log('Observed Corporation Mining:', observedCorporationMining);

        // Test corporation industry jobs
        const corporationIndustryJobs = await industryClient.getCorporationIndustryJobs(demoCorp);
        console.log('Corporation Industry Jobs:', corporationIndustryJobs);

        // Test industry facilities
        const industryFacilities = await industryClient.getIndustryFacilities();
        console.log('Industry Facilities:', industryFacilities);

        // Test solar system cost indices
        const solarSystemCostIndices = await industryClient.getIndustrySystems();
        console.log('Solar System Cost Indices:', solarSystemCostIndices);
        console.log(solarSystemCostIndices.length);

    } catch (error) {
        console.error('Error testing Industry APIs:', error);
    }
};

const testKillmails = async () => {
    try {
        console.log('Testing getCharacterRecentKillmails...');
        const characterKillmails = await killmailsClient.getCharacterRecentKillmails(demoCharacter);
        console.log('Character Recent Killmails:', characterKillmails);

        console.log('Testing getCorporationRecentKillmails...');
        const corporationKillmails = await killmailsClient.getCorporationRecentKillmails(demoCorp);
        console.log('Corporation Recent Killmails:', corporationKillmails);

        console.log('Testing getKillmail...');
        const killmail = await killmailsClient.getKillmail(119525756, 'abcdef1234567890');
        console.log('Killmail:', killmail);

        console.log('All Killmails API tests passed!');
    } catch (error) {
        console.error('Killmails API test failed:', error);
    }
};

const testLocationApis = async () => {
    try {
        console.log("LOCATION TESTING");
        const location = await locationClient.getCharacterLocation(demoCharacter);
        console.log('Character Location:', location);

        const onlineStatus = await locationClient.getCharacterOnline(demoCharacter);
        console.log('Character Online Status:', onlineStatus);

        const ship = await locationClient.getCharacterShip(demoCharacter);
        console.log('Character Ship:', ship);

    } catch (error) {
        console.error('Error testing Location APIs:', error);
    }
};


const testLoyaltyApis = async () => {
    try {
        const corporationId = 123;

        const loyaltyPoints = await loyaltyClient.getLoyaltyPoints(demoCharacter);
        console.log('Loyalty Points:', loyaltyPoints);

        const loyaltyStoreOffers = await loyaltyClient.getLoyaltyStoreOffers(56);
        console.log('Loyalty Store Offers:', loyaltyStoreOffers);

    } catch (error) {
        console.error('Error testing Loyalty APIs:', error);
    }
};


const testPI = async () => {

    try {
        console.log('Testing getColonies...');
        const colonies = await piClient.getColonies(demoCharacter);
        console.log('Colonies:', colonies);

        console.log('Testing getColonyLayout...');
        const colonyLayout = await piClient.getColonyLayout(demoCharacter, 123);
        console.log('Colony Layout:', colonyLayout);

        console.log('Testing getCorporationCustomsOffices...');
        const customsOffices = await piClient.getCorporationCustomsOffices(demoCorp);
        console.log('Customs Offices:', customsOffices);

        console.log('Testing getSchematicInformation...');
        const schematicInformation = await piClient.getSchematicInformation(1);
        console.log('Schematic Information:', schematicInformation);

    } catch (error) {
        console.error('Error testing PI APIs:', error);
    }
};

const testCharacterSkills = async () => {
       try {
        console.log('Testing getCharacterAttributes...');
        const attributes = await skillsClient.getCharacterAttributes(demoCharacter);
        console.log('Attributes:', attributes);

        console.log('Testing getCharacterSkillQueue...');
        const skillQueue = await skillsClient.getCharacterSkillQueue(demoCharacter);
        console.log('Skill Queue:', skillQueue);

        console.log('Testing getCharacterSkills...');
        const skills = await skillsClient.getCharacterSkills(demoCharacter);
        console.log('Skills:', skills);
    } catch (error) {
        console.error('Error testing Character Skills APIs:', error);
    }
};

const testMailApis = async () => {
    try {
        console.log('Testing getMailHeaders...');
        const headers = await mailClient.getMailHeaders(demoCharacter);
        console.log('Mail headers:', headers);

        console.log('Testing sendMail...');
        const newMailBody = {
            recipients: [{ recipient_id: 123, recipient_type: 'character' }],
            subject: 'Test Mail',
            body: 'This is a test mail'
        };
        const sentMail = await mailClient.sendMail(demoCharacter, newMailBody);
        console.log('Sent mail:', sentMail);

        console.log('Testing deleteMail...');
        const deleteMailResult = await mailClient.deleteMail(demoCharacter, 1);
        console.log('Deleted mail:', deleteMailResult);

        console.log('Testing getMail...');
        const mail = await mailClient.getMail(demoCharacter, 1);
        console.log('Mail:', mail);

        console.log('Testing updateMailMetadata...');
        const updateMailBody = {
            labels: [1, 2],
            read: true
        };
        const updateMailResult = await mailClient.updateMailMetadata(demoCharacter, 1, updateMailBody);
        console.log('Updated mail metadata:', updateMailResult);

        console.log('Testing getMailLabels...');
        const labels = await mailClient.getMailLabels(demoCharacter);
        console.log('Mail labels and unread counts:', labels);

        console.log('Testing createMailLabel...');
        const newLabelBody = {
            name: 'New Label'
        };
        const createdLabel = await mailClient.createMailLabel(demoCharacter, newLabelBody);
        console.log('Created mail label:', createdLabel);

        console.log('Testing deleteMailLabel...');
        const deleteLabelResult = await mailClient.deleteMailLabel(demoCharacter, 1);
        console.log('Deleted mail label:', deleteLabelResult);

        console.log('Testing getMailingLists...');
        const mailingLists = await mailClient.getMailingLists(demoCharacter);
        console.log('Mailing lists:', mailingLists);

    } catch (error) {
        console.error('Error testing Mail APIs:', error);
    }
};

const testUIClient = async () => {
    console.log('Testing setAutopilotWaypoint');
    const autopilotResponse = await uiClient.setAutopilotWaypoint({
        destination_id: 30002505,
        clear_other_waypoints: true,
        add_to_beginning: false
    });
    console.log('setAutopilotWaypoint Response:', autopilotResponse);

    console.log('Testing openContractWindow');
    const contractWindowResponse = await uiClient.openContractWindow({
        contract_id: 123456789
    });
    console.log('openContractWindow Response:', contractWindowResponse);

    console.log('Testing openInformationWindow');
    const informationWindowResponse = await uiClient.openInformationWindow({
        target_id: 123456789
    });
    console.log('openInformationWindow Response:', informationWindowResponse);

    console.log('Testing openMarketDetailsWindow');
    const marketDetailsWindowResponse = await uiClient.openMarketDetailsWindow({
        type_id: 123456
    });
    console.log('openMarketDetailsWindow Response:', marketDetailsWindowResponse);

    console.log('Testing openNewMailWindow');
    const newMailWindowResponse = await uiClient.openNewMailWindow({
        to: [123456789],
        subject: 'Test Subject',
        body: 'Test Body'
    });
    console.log('openNewMailWindow Response:', newMailWindowResponse);
};


const testWallet = async () => {
    const division = 1;

    console.log(await walletClient.getCharacterWallet(demoCharacter));
    console.log(await walletClient.getCharacterWalletJournal(demoCharacter));
    console.log(await walletClient.getCharacterWalletTransactions(demoCharacter));

    console.log(await walletClient.getCorporationWallets(demoCorp));
    console.log(await walletClient.getCorporationWalletJournal(demoCorp, division));
    console.log(await walletClient.getCorporationWalletTransactions(demoCorp, division));
};

logger.info('Testing about to begin');
logger.info('Auth Token is ' + config.authToken + ' be happy if this is not set and a blank space exists');
logger.info('config is pointing towards ' + config.link);

//testFactionAPIs();
//testAllianceAPIs();
//testWarsAPI();
//testStatusAPI();
//testUniverseAPIs();
//testInsurancePrices();
//testDogmaAPI();
//testRouteAPI();
//testIncursionsAPI();
//testOpportunitiesAPIs();
//testCharacterSearchAPI();
//testSovereigntyAPIs();
//testAssetsAPI();
//testBookmarkAPIs();
//testCalendarAPIs();
//testClonesAPI();
//testCharacterApi();
//testContracts();
//testCorporations();
//testFittings();
//testFleet();
//testIndustry();
//testKillmails();
//testLocationApis();
//testLoyaltyApis();
//testPI();
//testCharacterSkills();
//testMailApis();
//testUIClient();
testWallet();