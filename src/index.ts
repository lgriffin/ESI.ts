import { factionWarfare as leaderboardsApi } from './api/factions/getFactionWarfareLeaderboards';
import { factionWarfare as statsApi } from './api/factions/getFactionWarfareStats';
import { factionWarfare as systemsApi } from './api/factions/getFactionWarfareSystems';
import { factionWarfare as warsApi } from './api/factions/getFactionWarfareWars';

async function testFactionWarfareAPIs() {
  try {
    console.log('Testing Faction Warfare Leaderboards - Characters');
    const leaderboardsCharacters = await leaderboardsApi.leaderboards.characters();
    console.log(leaderboardsCharacters);

    console.log('Testing Faction Warfare Leaderboards - Corporations');
    const leaderboardsCorporations = await leaderboardsApi.leaderboards.corps();
    console.log(leaderboardsCorporations);

    console.log('Testing Faction Warfare Leaderboards - Overall');
    const leaderboardsOverall = await leaderboardsApi.leaderboards.leaderboard();
    console.log(leaderboardsOverall);

    console.log('Testing Faction Warfare Stats');
    const stats = await statsApi.stats.stats();
    console.log(stats);

    console.log('Testing Faction Warfare Character Stats');
    const characterStats = await statsApi.stats.characterStats(1689391488); // Replace with a valid character ID
    console.log(characterStats);

    console.log('Testing Faction Warfare Corporation Stats');
    const corporationStats = await statsApi.stats.corporationStats(98742334); // Replace with a valid corporation ID
    console.log(corporationStats);

    console.log('Testing Faction Warfare Systems');
    const systems = await systemsApi.systems();
    console.log(systems);

    console.log('Testing Faction Warfare Wars');
    const wars = await warsApi.wars();
    console.log(wars);
  } catch (error) {
    console.error('Error testing Faction Warfare APIs:', error);
  }
}

testFactionWarfareAPIs();
