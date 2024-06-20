import { request } from '../../core/util/request';
import { inputValidation } from '../../core/util/inputValidation';
import { logInfo, logError } from '../../core/logger/loggerUtil';

export const factionWarfare = {
  leaderboards: {
    characters: async (): Promise<object> => {
      logInfo('Fetching character leaderboards');
      try {
        const data = await request({ subUrl: 'fw/leaderboards/characters' });
        logInfo('Character leaderboards fetched successfully');
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logError(`Error fetching character leaderboards: ${error.message}`);
        } else {
          logError('Unknown error fetching character leaderboards');
        }
        throw error;
      }
    },
    corps: async (): Promise<object> => {
      logInfo('Fetching corporation leaderboards');
      try {
        const data = await request({ subUrl: 'fw/leaderboards/corporations' });
        logInfo('Corporation leaderboards fetched successfully');
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logError(`Error fetching corporation leaderboards: ${error.message}`);
        } else {
          logError('Unknown error fetching corporation leaderboards');
        }
        throw error;
      }
    },
    leaderboard: async (): Promise<object> => {
      logInfo('Fetching overall leaderboards');
      try {
        const data = await request({ subUrl: 'fw/leaderboards' });
        logInfo('Overall leaderboards fetched successfully');
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logError(`Error fetching overall leaderboards: ${error.message}`);
        } else {
          logError('Unknown error fetching overall leaderboards');
        }
        throw error;
      }
    }
  }
};
