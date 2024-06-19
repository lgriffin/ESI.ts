import { request, inputValidation } from '../config/util';
import logger from '../config/logger';

export const factionWarfare = {
  leaderboards: {
    characters: async (): Promise<object> => {
      logger.info('Fetching character leaderboards');
      try {
        const data = await request({ subUrl: 'fw/leaderboards/characters' });
        logger.info('Character leaderboards fetched successfully');
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error fetching character leaderboards: ${error.message}`);
        } else {
          logger.error('Unknown error fetching character leaderboards');
        }
        throw error;
      }
    },
    corps: async (): Promise<object> => {
      logger.info('Fetching corporation leaderboards');
      try {
        const data = await request({ subUrl: 'fw/leaderboards/corporations' });
        logger.info('Corporation leaderboards fetched successfully');
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error fetching corporation leaderboards: ${error.message}`);
        } else {
          logger.error('Unknown error fetching corporation leaderboards');
        }
        throw error;
      }
    },
    leaderboard: async (): Promise<object> => {
      logger.info('Fetching overall leaderboards');
      try {
        const data = await request({ subUrl: 'fw/leaderboards' });
        logger.info('Overall leaderboards fetched successfully');
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error fetching overall leaderboards: ${error.message}`);
        } else {
          logger.error('Unknown error fetching overall leaderboards');
        }
        throw error;
      }
    }
  },
  stats: {
    stats: async (): Promise<object> => {
      logger.info('Fetching faction warfare stats');
      try {
        const data = await request({ subUrl: 'fw/stats' });
        logger.info('Faction warfare stats fetched successfully');
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error fetching faction warfare stats: ${error.message}`);
        } else {
          logger.error('Unknown error fetching faction warfare stats');
        }
        throw error;
      }
    },
    characterStats: async (characterID: number): Promise<object> => {
      logger.info(`Fetching stats for character ID: ${characterID}`);
      inputValidation({
        input: characterID,
        type: 'number',
        message: "The function 'fw.stats.characterStats' requires a character ID!"
      });
      try {
        const data = await request({
          subUrl: `characters/${characterID}/fw/stats`,
          needsAuth: true
        });
        logger.info(`Stats for character ID ${characterID} fetched successfully`);
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error fetching stats for character ID ${characterID}: ${error.message}`);
        } else {
          logger.error(`Unknown error fetching stats for character ID ${characterID}`);
        }
        throw error;
      }
    },
    corporationStats: async (corporationID: number): Promise<object> => {
      logger.info(`Fetching stats for corporation ID: ${corporationID}`);
      inputValidation({
        input: corporationID,
        type: 'number',
        message: "The function 'fw.stats.corporationStats' requires a corporation ID!"
      });
      try {
        const data = await request({
          subUrl: `corporations/${corporationID}/fw/stats`,
          needsAuth: true
        });
        logger.info(`Stats for corporation ID ${corporationID} fetched successfully`);
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error fetching stats for corporation ID ${corporationID}: ${error.message}`);
        } else {
          logger.error(`Unknown error fetching stats for corporation ID ${corporationID}`);
        }
        throw error;
      }
    }
  },
  systems: async (): Promise<object> => {
    logger.info('Fetching faction warfare systems');
    try {
      const data = await request({ subUrl: 'fw/systems' });
      logger.info('Faction warfare systems fetched successfully');
      return data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error fetching faction warfare systems: ${error.message}`);
      } else {
        logger.error('Unknown error fetching faction warfare systems');
      }
      throw error;
    }
  },
  wars: async (): Promise<object> => {
    logger.info('Fetching faction warfare wars');
    try {
      const data = await request({ subUrl: 'fw/wars' });
      logger.info('Faction warfare wars fetched successfully');
      return data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error fetching faction warfare wars: ${error.message}`);
      } else {
        logger.error('Unknown error fetching faction warfare wars');
      }
      throw error;
    }
  }
};
