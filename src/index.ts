import { factionWarfare } from './api/factionWarfare';
import logger from './config/logger';

const testFactionWarfare = async () => {
  try {
    const characterLeaderboard = await factionWarfare.leaderboards.characters();
    logger.info('Character Leaderboard:', characterLeaderboard);

    const factionStats = await factionWarfare.stats.stats();
    logger.info('Faction Stats:', factionStats);

    const systems = await factionWarfare.systems();
    logger.info('Faction Warfare Systems:', systems);

    const wars = await factionWarfare.wars();
    logger.info('Faction Warfare Wars:', wars);
  } catch (error) {
    logger.error('Error:', error);
  }
};

testFactionWarfare();
