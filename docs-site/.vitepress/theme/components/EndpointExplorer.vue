<script setup lang="ts">
import { ref, computed } from 'vue';

interface Endpoint {
  client: string;
  property: string;
  method: string;
  httpMethod: string;
  description: string;
  auth: 'Yes' | 'No' | 'Some';
  snippet: string;
  streaming?: boolean;
}

const endpoints: Endpoint[] = [
  // Alliance
  { client: 'Alliance', property: 'alliance', method: 'getAlliances()', httpMethod: 'GET', description: 'List all active alliance IDs', auth: 'No', snippet: `const alliances = await client.alliance.getAlliances();` },
  { client: 'Alliance', property: 'alliance', method: 'getAllianceById(id)', httpMethod: 'GET', description: 'Get alliance info by ID', auth: 'No', snippet: `const alliance = await client.alliance.getAllianceById(99000001);
console.log(alliance.name, alliance.ticker);` },
  { client: 'Alliance', property: 'alliance', method: 'getAllianceCorporations(id)', httpMethod: 'GET', description: 'List member corporations of an alliance', auth: 'No', snippet: `const corps = await client.alliance.getAllianceCorporations(99000001);` },
  { client: 'Alliance', property: 'alliance', method: 'getAllianceIcons(id)', httpMethod: 'GET', description: 'Get alliance icon URLs', auth: 'No', snippet: `const icons = await client.alliance.getAllianceIcons(99000001);
console.log(icons.px128x128);` },
  { client: 'Alliance', property: 'alliance', method: 'getAllianceContacts(id)', httpMethod: 'GET', description: 'Get alliance contacts', auth: 'Yes', snippet: `const contacts = await client.alliance.getAllianceContacts(allianceId);` },

  // Assets
  { client: 'Assets', property: 'assets', method: 'getCharacterAssets(id)', httpMethod: 'GET', description: 'List character assets', auth: 'Yes', snippet: `const assets = await client.assets.getCharacterAssets(characterId);
for (const item of assets) {
  console.log(item.type_id, item.quantity, item.location_id);
}` },
  { client: 'Assets', property: 'assets', method: 'getCorporationAssets(id)', httpMethod: 'GET', description: 'List corporation assets', auth: 'Yes', snippet: `const assets = await client.assets.getCorporationAssets(corpId);` },
  { client: 'Assets', property: 'assets', method: 'postCharacterAssetLocations(id, ids)', httpMethod: 'POST', description: 'Get precise locations of character assets', auth: 'Yes', snippet: `const locations = await client.assets.postCharacterAssetLocations(
  characterId, [itemId1, itemId2]
);` },

  // Characters
  { client: 'Characters', property: 'characters', method: 'getCharacterPublicInfo(id)', httpMethod: 'GET', description: 'Get public character info', auth: 'No', snippet: `const char = await client.characters.getCharacterPublicInfo(1689391488);
console.log(char.name, char.corporation_id);` },
  { client: 'Characters', property: 'characters', method: 'getCharacterPortrait(id)', httpMethod: 'GET', description: 'Get character portrait URLs', auth: 'No', snippet: `const portrait = await client.characters.getCharacterPortrait(1689391488);
console.log(portrait.px256x256);` },
  { client: 'Characters', property: 'characters', method: 'getCharacterAffiliations(ids)', httpMethod: 'POST', description: 'Bulk lookup character affiliations', auth: 'No', snippet: `const affiliations = await client.characters.getCharacterAffiliations([123, 456]);` },
  { client: 'Characters', property: 'characters', method: 'getCharacterRoles(id)', httpMethod: 'GET', description: 'Get character corporation roles', auth: 'Yes', snippet: `const roles = await client.characters.getCharacterRoles(characterId);` },

  // Contacts
  { client: 'Contacts', property: 'contacts', method: 'getCharacterContacts(id)', httpMethod: 'GET', description: 'Get character contacts', auth: 'Yes', snippet: `const contacts = await client.contacts.getCharacterContacts(characterId);` },
  { client: 'Contacts', property: 'contacts', method: 'postCharacterContacts(id, standing, ids)', httpMethod: 'POST', description: 'Add contacts for a character', auth: 'Yes', snippet: `await client.contacts.postCharacterContacts(characterId, 10, [targetId]);` },
  { client: 'Contacts', property: 'contacts', method: 'deleteCharacterContacts(id, contactIds)', httpMethod: 'DELETE', description: 'Delete character contacts', auth: 'Yes', snippet: `await client.contacts.deleteCharacterContacts(characterId, [contactId]);` },

  // Contracts
  { client: 'Contracts', property: 'contracts', method: 'getCharacterContracts(id)', httpMethod: 'GET', description: 'List character contracts', auth: 'Yes', snippet: `const contracts = await client.contracts.getCharacterContracts(characterId);` },
  { client: 'Contracts', property: 'contracts', method: 'getPublicContracts(regionId)', httpMethod: 'GET', description: 'List public contracts in a region', auth: 'No', snippet: `const contracts = await client.contracts.getPublicContracts(10000002);` },

  // Corporations
  { client: 'Corporations', property: 'corporations', method: 'getCorporationInfo(id)', httpMethod: 'GET', description: 'Get corporation info', auth: 'No', snippet: `const corp = await client.corporations.getCorporationInfo(98000001);
console.log(corp.name, corp.member_count);` },
  { client: 'Corporations', property: 'corporations', method: 'getCorporationMembers(id)', httpMethod: 'GET', description: 'Get corporation member list', auth: 'Yes', snippet: `const members = await client.corporations.getCorporationMembers(corpId);` },

  // Cosmetics
  { client: 'Cosmetics', property: 'cosmetics', method: 'getSkinr(id)', httpMethod: 'GET', description: 'Get SKINR design details', auth: 'No', snippet: `const design = await client.cosmetics.getSkinr(designId);` },
  { client: 'Cosmetics', property: 'cosmetics', method: 'getCharacterSkinr(charId)', httpMethod: 'GET', description: 'Get character SKINR licenses', auth: 'Yes', snippet: `const licenses = await client.cosmetics.getCharacterSkinr(characterId);` },

  // Dogma
  { client: 'Dogma', property: 'dogma', method: 'getDogmaAttributes()', httpMethod: 'GET', description: 'List all dogma attribute IDs', auth: 'No', snippet: `const attributes = await client.dogma.getDogmaAttributes();` },
  { client: 'Dogma', property: 'dogma', method: 'getDogmaAttribute(id)', httpMethod: 'GET', description: 'Get dogma attribute details', auth: 'No', snippet: `const attr = await client.dogma.getDogmaAttribute(attributeId);
console.log(attr.name, attr.description);` },
  { client: 'Dogma', property: 'dogma', method: 'getDynamicItemInfo(typeId, itemId)', httpMethod: 'GET', description: 'Get Abyssal (mutaplasmid) item info', auth: 'No', snippet: `const item = await client.dogma.getDynamicItemInfo(47740, itemId);` },

  // Factions / Faction Warfare
  { client: 'Factions', property: 'factions', method: 'getFactionWarStats()', httpMethod: 'GET', description: 'Get faction warfare statistics', auth: 'No', snippet: `const stats = await client.factions.getFactionWarStats();` },
  { client: 'Factions', property: 'factions', method: 'getFactionWarSystems()', httpMethod: 'GET', description: 'Get faction warfare system ownership', auth: 'No', snippet: `const systems = await client.factions.getFactionWarSystems();` },

  // Fittings
  { client: 'Fittings', property: 'fittings', method: 'getFittings(id)', httpMethod: 'GET', description: 'Get character ship fittings', auth: 'Yes', snippet: `const fittings = await client.fittings.getFittings(characterId);` },
  { client: 'Fittings', property: 'fittings', method: 'createFitting(id, body)', httpMethod: 'POST', description: 'Save a new ship fitting', auth: 'Yes', snippet: `const result = await client.fittings.createFitting(characterId, {
  name: 'PvP Harbinger',
  ship_type_id: 24690,
  description: 'Armor HAM',
  items: [{ type_id: 3170, flag: 11, quantity: 1 }],
});` },

  // Fleets
  { client: 'Fleets', property: 'fleets', method: 'getFleetInformation(id)', httpMethod: 'GET', description: 'Get fleet information', auth: 'Yes', snippet: `const fleet = await client.fleets.getFleetInformation(fleetId);
console.log(fleet.motd);` },
  { client: 'Fleets', property: 'fleets', method: 'getFleetMembers(id)', httpMethod: 'GET', description: 'Get fleet member list', auth: 'Yes', snippet: `const members = await client.fleets.getFleetMembers(fleetId);` },

  // Freelance Jobs
  { client: 'Freelance Jobs', property: 'freelanceJobs', method: 'getFreelanceJobs()', httpMethod: 'GET', description: 'Get public freelance job listings', auth: 'No', snippet: `const jobs = await client.freelanceJobs.getFreelanceJobs();
console.log(jobs.freelance_jobs);` },

  // Incursions
  { client: 'Incursions', property: 'incursions', method: 'getIncursions()', httpMethod: 'GET', description: 'List active incursions', auth: 'No', snippet: `const incursions = await client.incursions.getIncursions();
for (const inc of incursions) {
  console.log(inc.type, inc.state, inc.staging_solar_system_id);
}` },

  // Industry
  { client: 'Industry', property: 'industry', method: 'getCharacterIndustryJobs(id)', httpMethod: 'GET', description: 'Get character industry jobs', auth: 'Yes', snippet: `const jobs = await client.industry.getCharacterIndustryJobs(characterId);` },
  { client: 'Industry', property: 'industry', method: 'getIndustrySystems()', httpMethod: 'GET', description: 'Get system cost indices', auth: 'No', snippet: `const systems = await client.industry.getIndustrySystems();` },

  // Insurance
  { client: 'Insurance', property: 'insurance', method: 'getInsurancePrices()', httpMethod: 'GET', description: 'Get insurance prices for all ships', auth: 'No', snippet: `const prices = await client.insurance.getInsurancePrices();` },

  // Killmails
  { client: 'Killmails', property: 'killmails', method: 'getKillmail(id, hash)', httpMethod: 'GET', description: 'Get a single killmail', auth: 'No', snippet: `const km = await client.killmails.getKillmail(killmailId, hash);
console.log(km.victim, km.attackers.length);` },
  { client: 'Killmails', property: 'killmails', method: 'getCharacterRecentKillmails(id)', httpMethod: 'GET', description: 'Get character recent killmail refs', auth: 'Yes', snippet: `const kms = await client.killmails.getCharacterRecentKillmails(characterId);` },

  // Location
  { client: 'Location', property: 'location', method: 'getCharacterLocation(id)', httpMethod: 'GET', description: 'Get character current location', auth: 'Yes', snippet: `const loc = await client.location.getCharacterLocation(characterId);
console.log(loc.solar_system_id, loc.station_id);` },
  { client: 'Location', property: 'location', method: 'getCharacterShip(id)', httpMethod: 'GET', description: 'Get character current ship', auth: 'Yes', snippet: `const ship = await client.location.getCharacterShip(characterId);
console.log(ship.ship_type_id, ship.ship_name);` },

  // Loyalty
  { client: 'Loyalty', property: 'loyalty', method: 'getCharacterLoyaltyPoints(id)', httpMethod: 'GET', description: 'Get character LP balances', auth: 'Yes', snippet: `const lp = await client.loyalty.getCharacterLoyaltyPoints(characterId);` },

  // Mail
  { client: 'Mail', property: 'mail', method: 'getCharacterMail(id)', httpMethod: 'GET', description: 'Get character mail headers', auth: 'Yes', snippet: `const mail = await client.mail.getCharacterMail(characterId);` },
  { client: 'Mail', property: 'mail', method: 'sendMail(id, body)', httpMethod: 'POST', description: 'Send an EVE mail', auth: 'Yes', snippet: `await client.mail.sendMail(characterId, {
  recipients: [{ recipient_id: targetId, recipient_type: 'character' }],
  subject: 'Hello from ESI.ts',
  body: 'This mail was sent via the API!',
});` },

  // Market
  { client: 'Market', property: 'market', method: 'getMarketPrices()', httpMethod: 'GET', description: 'Get average market prices', auth: 'No', snippet: `const prices = await client.market.getMarketPrices();
const tritanium = prices.find(p => p.type_id === 34);
console.log('Tritanium avg:', tritanium?.average_price);` },
  { client: 'Market', property: 'market', method: 'getMarketOrders(regionId)', httpMethod: 'GET', description: 'Get market orders in a region', auth: 'No', snippet: `const orders = await client.market.getMarketOrders(10000002);` },
  { client: 'Market', property: 'market', method: 'getMarketHistory(regionId, typeId)', httpMethod: 'GET', description: 'Get price history for a type in a region', auth: 'No', snippet: `const history = await client.market.getMarketHistory(10000002, 34);
for (const day of history) {
  console.log(day.date, day.average, day.volume);
}` },
  { client: 'Market', property: 'market', method: 'streamMarketOrders(regionId)', httpMethod: 'GET', description: 'Stream market orders page by page', auth: 'No', streaming: true, snippet: `for await (const page of client.market.streamMarketOrders(10000002)) {
  console.log(\`Page \${page.page}/\${page.totalPages}: \${page.data.length} orders\`);
}` },

  // Mercenary
  { client: 'Mercenary', property: 'mercenary', method: 'getMercenaryDens(charId)', httpMethod: 'GET', description: 'Get mercenary dens for a character', auth: 'Yes', snippet: `const dens = await client.mercenary.getMercenaryDens(characterId);` },

  // Meta
  { client: 'Meta', property: 'meta', method: 'getOpenApiJson()', httpMethod: 'GET', description: 'Get the ESI OpenAPI spec as JSON', auth: 'No', snippet: `const spec = await client.meta.getOpenApiJson();` },

  // Military Campaigns
  { client: 'Military Campaigns', property: 'militaryCampaigns', method: 'getMilitaryCampaigns()', httpMethod: 'GET', description: 'List active military campaigns', auth: 'No', snippet: `const campaigns = await client.militaryCampaigns.getMilitaryCampaigns();` },

  // Paragon Hub
  { client: 'Paragon Hub', property: 'paragonHub', method: 'getPublicListings()', httpMethod: 'GET', description: 'Get public Paragon marketplace listings', auth: 'No', snippet: `const listings = await client.paragonHub.getPublicListings();` },

  // PI
  { client: 'PI', property: 'pi', method: 'getCharacterPlanets(id)', httpMethod: 'GET', description: 'Get character planetary colonies', auth: 'Yes', snippet: `const planets = await client.pi.getCharacterPlanets(characterId);` },

  // Route
  { client: 'Route', property: 'route', method: 'getRoute(origin, dest)', httpMethod: 'GET', description: 'Plan a route between systems', auth: 'No', snippet: `const route = await client.route.getRoute(30000142, 30002187);
console.log(\`\${route.length} jumps from Jita to Amarr\`);` },

  // Search
  { client: 'Search', property: 'search', method: 'search(charId, query)', httpMethod: 'GET', description: 'Search for entities', auth: 'Yes', snippet: `const results = await client.search.search(characterId, 'Jita');` },

  // Skills
  { client: 'Skills', property: 'skills', method: 'getCharacterSkills(id)', httpMethod: 'GET', description: 'Get character trained skills', auth: 'Yes', snippet: `const skills = await client.skills.getCharacterSkills(characterId);
console.log('Total SP:', skills.total_sp);` },

  // Skyhooks
  { client: 'Skyhooks', property: 'skyhooks', method: 'getRaidableSkyhooks()', httpMethod: 'GET', description: 'Get all raidable orbital skyhooks', auth: 'No', snippet: `const skyhooks = await client.skyhooks.getRaidableSkyhooks();` },
  { client: 'Skyhooks', property: 'skyhooks', method: 'getSovereigntyHubs(corpId)', httpMethod: 'GET', description: 'Get sovereignty hubs for a corporation', auth: 'Yes', snippet: `const hubs = await client.skyhooks.getSovereigntyHubs(corpId);` },

  // Sovereignty
  { client: 'Sovereignty', property: 'sovereignty', method: 'getSovereigntySystems()', httpMethod: 'GET', description: 'Get sovereignty map data', auth: 'No', snippet: `const systems = await client.sovereignty.getSovereigntySystems();` },

  // Status
  { client: 'Status', property: 'status', method: 'getStatus()', httpMethod: 'GET', description: 'Get Tranquility server status', auth: 'No', snippet: `const status = await client.status.getStatus();
console.log(\`\${status.players} online, started \${status.start_time}\`);` },

  // UI
  { client: 'UI', property: 'ui', method: 'setAutopilotWaypoint(destId, addToBeginning, clear)', httpMethod: 'POST', description: 'Set autopilot waypoint (in-game)', auth: 'Yes', snippet: `await client.ui.setAutopilotWaypoint(30000142, false, true);` },
  { client: 'UI', property: 'ui', method: 'openMarketDetails(typeId)', httpMethod: 'POST', description: 'Open market details in-game', auth: 'Yes', snippet: `await client.ui.openMarketDetails(34); // Opens Tritanium market window` },

  // Universe
  { client: 'Universe', property: 'universe', method: 'getSystemById(id)', httpMethod: 'GET', description: 'Get solar system info', auth: 'No', snippet: `const system = await client.universe.getSystemById(30000142);
console.log(system.name, system.security_status);` },
  { client: 'Universe', property: 'universe', method: 'getTypeById(id)', httpMethod: 'GET', description: 'Get item type info', auth: 'No', snippet: `const type = await client.universe.getTypeById(34);
console.log(type.name, type.description);` },
  { client: 'Universe', property: 'universe', method: 'getRegionById(id)', httpMethod: 'GET', description: 'Get region info', auth: 'No', snippet: `const region = await client.universe.getRegionById(10000002);
console.log(region.name); // "The Forge"` },
  { client: 'Universe', property: 'universe', method: 'postUniverseNames(ids)', httpMethod: 'POST', description: 'Bulk resolve IDs to names', auth: 'No', snippet: `const names = await client.universe.postUniverseNames([30000142, 34, 1689391488]);
for (const n of names) console.log(n.id, n.name, n.category);` },
  { client: 'Universe', property: 'universe', method: 'getStargate(id)', httpMethod: 'GET', description: 'Get stargate info', auth: 'No', snippet: `const gate = await client.universe.getStargate(stargateId);` },

  // Wallet
  { client: 'Wallet', property: 'wallet', method: 'getCharacterWallet(id)', httpMethod: 'GET', description: 'Get character ISK balance', auth: 'Yes', snippet: `const balance = await client.wallet.getCharacterWallet(characterId);
console.log(\`Balance: \${balance.toLocaleString()} ISK\`);` },
  { client: 'Wallet', property: 'wallet', method: 'getCharacterWalletJournal(id)', httpMethod: 'GET', description: 'Get character wallet journal', auth: 'Yes', snippet: `const journal = await client.wallet.getCharacterWalletJournal(characterId);` },
  { client: 'Wallet', property: 'wallet', method: 'getCharacterWalletTransactions(id)', httpMethod: 'GET', description: 'Get character wallet transactions', auth: 'Yes', snippet: `const txns = await client.wallet.getCharacterWalletTransactions(characterId);` },

  // Wars
  { client: 'Wars', property: 'wars', method: 'getWars()', httpMethod: 'GET', description: 'List active war IDs', auth: 'No', snippet: `const wars = await client.wars.getWars();` },
  { client: 'Wars', property: 'wars', method: 'getWarById(id)', httpMethod: 'GET', description: 'Get war details', auth: 'No', snippet: `const war = await client.wars.getWarById(warId);
console.log(war.aggressor, war.defender);` },
];

const searchQuery = ref('');
const selectedClient = ref('all');
const selectedAuth = ref('all');
const selectedMethod = ref('all');
const currentPage = ref(1);
const pageSize = 15;

const clientNames = computed(() => {
  const names = [...new Set(endpoints.map((e) => e.client))].sort();
  return ['all', ...names];
});

const filtered = computed(() => {
  currentPage.value = 1;
  return endpoints.filter((e) => {
    const matchesSearch =
      !searchQuery.value ||
      e.method.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      e.client.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesClient =
      selectedClient.value === 'all' || e.client === selectedClient.value;
    const matchesAuth =
      selectedAuth.value === 'all' || e.auth === selectedAuth.value;
    const matchesMethod =
      selectedMethod.value === 'all' ||
      e.httpMethod === selectedMethod.value;
    return matchesSearch && matchesClient && matchesAuth && matchesMethod;
  });
});

const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize));
const paginatedEndpoints = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filtered.value.slice(start, start + pageSize);
});

const expandedIndex = ref<number | null>(null);

function toggleExpand(index: number) {
  expandedIndex.value = expandedIndex.value === index ? null : index;
}

function copySnippet(snippet: string) {
  navigator.clipboard.writeText(snippet);
}
</script>

<template>
  <div class="endpoint-explorer">
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search endpoints... (e.g. market, getCharacter, wallet)"
      />
      <select v-model="selectedClient">
        <option v-for="c in clientNames" :key="c" :value="c">
          {{ c === 'all' ? 'All Clients' : c }}
        </option>
      </select>
      <select v-model="selectedAuth">
        <option value="all">Any Auth</option>
        <option value="No">Public</option>
        <option value="Yes">Authenticated</option>
        <option value="Some">Partial</option>
      </select>
      <select v-model="selectedMethod">
        <option value="all">All Methods</option>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
      </select>
    </div>

    <div class="results-count">
      {{ filtered.length }} endpoint{{ filtered.length !== 1 ? 's' : '' }}
      found
    </div>

    <div
      v-for="(ep, i) in paginatedEndpoints"
      :key="`${ep.client}-${ep.method}`"
      class="endpoint-card"
      @click="toggleExpand(i)"
      style="cursor: pointer"
    >
      <div class="endpoint-header">
        <span :class="['method-badge', ep.httpMethod.toLowerCase()]">
          {{ ep.httpMethod }}
        </span>
        <span class="endpoint-path">
          client.{{ ep.property }}.{{ ep.method }}
        </span>
      </div>

      <div style="font-size: 0.85rem; color: var(--vp-c-text-2); margin-top: 0.25rem">
        {{ ep.description }}
      </div>

      <div class="endpoint-meta">
        <span :class="['meta-tag', ep.auth === 'No' ? 'public' : 'auth']">
          {{ ep.auth === 'No' ? 'Public' : ep.auth === 'Yes' ? 'Auth Required' : 'Some Auth' }}
        </span>
        <span class="meta-tag">{{ ep.client }}</span>
        <span v-if="ep.streaming" class="meta-tag">Streaming</span>
      </div>

      <div v-if="expandedIndex === i" class="code-snippet" @click.stop>
        <button class="copy-btn" @click="copySnippet(ep.snippet)">
          Copy
        </button>
        <pre><code>{{ ep.snippet }}</code></pre>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination-controls">
      <button :disabled="currentPage <= 1" @click="currentPage--">
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button :disabled="currentPage >= totalPages" @click="currentPage++">
        Next
      </button>
    </div>
  </div>
</template>
