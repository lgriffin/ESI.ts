const fs = require('fs');
const path = require('path');

// List of API groups and their respective endpoints
const apiStructure = {
  alliances: [
    'getAlliances',
    'getAllianceById',
    'getAllianceContacts',
    'getAllianceContactLabels',
    'getAllianceCorporations',
    'getAllianceIcons'
  ],
  characters: [
    'getCharacter',
    'getCharacterAffiliation',
    'getCharacterAgentsResearch',
    'getCharacterAssets',
    'getCharacterAssetLocations',
    'getCharacterAssetNames',
    'getCharacterAttributes',
    'getCharacterBlueprints',
    'getCharacterBookmarks',
    'getCharacterBookmarkFolders',
    'getCharacterCalendarEvents',
    'getCharacterCalendarEventById',
    'getCharacterClones',
    'getCharacterContracts',
    'getCharacterContractItems',
    'getCharacterContractBids',
    'getCharacterCorporationHistory',
    'getCharacterFatigue',
    'getCharacterFittings',
    'getCharacterFleet',
    'getCharacterFwStats',
    'getCharacterImplants',
    'getCharacterIndustryJobs',
    'getCharacterKillmails',
    'getCharacterLocation',
    'getCharacterLoyaltyPoints',
    'getCharacterMail',
    'getCharacterMailLabels',
    'getCharacterMailLists',
    'getCharacterMailById',
    'getCharacterMedals',
    'getCharacterMining',
    'getCharacterNotifications',
    'getCharacterNotificationsContacts',
    'getCharacterOpportunities',
    'getCharacterOrders',
    'getCharacterOrderHistory',
    'getCharacterPlanets',
    'getCharacterPortrait',
    'getCharacterRoles',
    'getCharacterSearch',
    'getCharacterShip',
    'getCharacterSkills',
    'getCharacterSkillQueue',
    'getCharacterStandings',
    'getCharacterStats',
    'getCharacterTitles',
    'getCharacterWallet',
    'getCharacterWalletJournal',
    'getCharacterWalletTransactions'
  ],
  corporations: [
    'getCorporation',
    'getCorporationAlliances',
    'getCorporationBlueprints',
    'getCorporationBookmarks',
    'getCorporationBookmarkFolders',
    'getCorporationContacts',
    'getCorporationContactLabels',
    'getCorporationContracts',
    'getCorporationContractBids',
    'getCorporationContractItems',
    'getCorporationContainerLogs',
    'getCorporationDivisions',
    'getCorporationFacilities',
    'getCorporationFwStats',
    'getCorporationIcons',
    'getCorporationIndustryJobs',
    'getCorporationKillmails',
    'getCorporationMedals',
    'getCorporationMembers',
    'getCorporationMemberTracking',
    'getCorporationMemberLimit',
    'getCorporationMining',
    'getCorporationNotifications',
    'getCorporationOutposts',
    'getCorporationOrders',
    'getCorporationOrderHistory',
    'getCorporationRoles',
    'getCorporationShareholders',
    'getCorporationStandings',
    'getCorporationStarbases',
    'getCorporationStructures',
    'getCorporationTitles',
    'getCorporationWallets',
    'getCorporationWalletJournal',
    'getCorporationWalletTransactions'
  ],
  universe: [
    'getAncestries',
    'getAsteroidBelt',
    'getBloodlines',
    'getCategories',
    'getCategoryById',
    'getConstellations',
    'getConstellationById',
    'getFactions',
    'getGraphics',
    'getGraphicById',
    'getGroups',
    'getGroupById',
    'getMoons',
    'getMoonById',
    'getPlanets',
    'getPlanetById',
    'getRaces',
    'getRegions',
    'getRegionById',
    'getStargates',
    'getStargateById',
    'getStars',
    'getStarById',
    'getStations',
    'getStationById',
    'getStructures',
    'getSystemJumps',
    'getSystemKills',
    'getSystems',
    'getSystemById',
    'getTypes',
    'getTypeById',
    'getWars',
    'getWarById',
    'postBulkNamesToIds',
    'postBulkIdsToNames',
    'postUniverseNames'
  ],
  markets: [
    'getMarketPrices',
    'getMarketGroups',
    'getMarketGroupById',
    'getMarketOrders',
    'getMarketHistory',
    'getMarketRegionOrders',
    'getMarketRegionHistory'
  ],
  industry: [
    'getIndustrySystems',
    'getIndustryFacilities',
    'getIndustryJobs',
    'getIndustryCorporationJobs'
  ],
  contracts: [
    'getContracts',
    'getContractById',
    'getContractBids',
    'getContractItems',
    'getPublicContracts',
    'getPublicContractBids',
    'getPublicContractItems'
  ],
  factions: [
    'getFactionWarfareStats',
    'getFactionWarfareLeaderboards',
    'getFactionWarfareSystems',
    'getFactionWarfareWars'
  ],
  killmails: [
    'getKillmails',
    'getKillmailById',
    'getRecentCharacterKillmails',
    'getRecentCorporationKillmails'
  ],
  sovereignty: [
    'getSovereigntyCampaigns',
    'getSovereigntyMap',
    'getSovereigntyStructures'
  ],
  opportunities: [
    'getOpportunitiesTasks',
    'getOpportunitiesGroups'
  ],
  fleets: [
    'getFleets',
    'getFleetMembers',
    'getFleetWings',
    'getFleetSquads'
  ],
  dogma: [
    'getDogmaAttributes',
    'getDogmaAttributeById',
    'getDogmaEffects',
    'getDogmaEffectById',
    'getDogmaDynamicItemAttributes'
  ],
  incursions: [
    'getIncursions'
  ],
  insurance: [
    'getInsurancePrices'
  ],
  location: [
    'getLocation'
  ],
  search: [
    'postSearch'
  ],
  ui: [
    'postUiAutopilotWaypoint',
    'postUiOpenWindowContract',
    'postUiOpenWindowInformation',
    'postUiOpenWindowMarketDetails',
    'postUiOpenWindowNewMail'
  ],
  wars: [
    'getWars',
    'getWarById'
  ]
};

// Function to create directories and files
const createDirectoriesAndFiles = (basePath, structure, type, extension) => {
  Object.keys(structure).forEach(group => {
    const groupPath = path.join(basePath, group);
    fs.mkdirSync(groupPath, { recursive: true });

    structure[group].forEach(endpoint => {
      const filePath = path.join(groupPath, `${endpoint}.${extension}`);
      fs.writeFileSync(filePath, '');
    });
  });
};

// Base paths
const baseSrcPath = path.join(__dirname, 'src/api');
const baseBddFeaturePath = path.join(__dirname, 'tests/bdd/features');
const baseBddStepPath = path.join(__dirname, 'tests/bdd/step_definitions');
const baseTddPath = path.join(__dirname, 'tests/tdd');

// Create directories and files for API definitions
createDirectoriesAndFiles(baseSrcPath, apiStructure, 'ts', 'ts');

// Create directories and files for BDD tests (features)
createDirectoriesAndFiles(baseBddFeaturePath, apiStructure, 'feature', 'feature');

// Create directories and files for BDD tests (step definitions)
createDirectoriesAndFiles(baseBddStepPath, apiStructure, 'steps', 'ts');

// Create directories and files for TDD tests
createDirectoriesAndFiles(baseTddPath, apiStructure, 'test', 'test.ts');

console.log('Directory and file structure created successfully.');
