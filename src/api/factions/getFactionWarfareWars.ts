import { request } from '../../core/util/request';
import { logInfo, logError } from '../../core/logger/loggerUtil';

export const factionWarfare = {
  wars: async (): Promise<object> => {
    logInfo('Fetching faction warfare wars');
    try {
      const data = await request({ subUrl: 'fw/wars' });
      logInfo('Faction warfare wars fetched successfully');
      return data;
    } catch (error) {
      if (error instanceof Error) {
        logError(`Error fetching faction warfare wars: ${error.message}`);
      } else {
        logError('Unknown error fetching faction warfare wars');
      }
      throw error;
    }
  }
};
