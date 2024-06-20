import { request } from '../../core/util/request';
import { inputValidation } from '../../core/util/inputValidation';
import { logInfo, logError } from '../../core/logger/loggerUtil';

export const factionWarfare = {
  stats: {
    stats: async (): Promise<object> => {
      logInfo('Fetching faction warfare stats');
      try {
        const data = await request({ subUrl: 'fw/stats' });
        logInfo('Faction warfare stats fetched successfully');
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logError(`Error fetching faction warfare stats: ${error.message}`);
        } else {
          logError('Unknown error fetching faction warfare stats');
        }
        throw error;
      }
    },
    characterStats: async (characterID: number): Promise<object> => {
      logInfo(`Fetching stats for character ID: ${characterID}`);
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
        logInfo(`Stats for character ID ${characterID} fetched successfully`);
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logError(`Error fetching stats for character ID ${characterID}: ${error.message}`);
        } else {
          logError(`Unknown error fetching stats for character ID ${characterID}`);
        }
        throw error;
      }
    },
    corporationStats: async (corporationID: number): Promise<object> => {
      logInfo(`Fetching stats for corporation ID: ${corporationID}`);
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
        logInfo(`Stats for corporation ID ${corporationID} fetched successfully`);
        return data;
      } catch (error) {
        if (error instanceof Error) {
          logError(`Error fetching stats for corporation ID ${corporationID}: ${error.message}`);
        } else {
          logError(`Unknown error fetching stats for corporation ID ${corporationID}`);
        }
        throw error;
      }
    }
  }
};
