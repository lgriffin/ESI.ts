import { request } from '../../core/util/request';
import { logInfo, logError } from '../../core/logger/loggerUtil';

export const factionWarfare = {
  systems: async (): Promise<object> => {
    logInfo('Fetching faction warfare systems');
    try {
      const data = await request({ subUrl: 'fw/systems' });
      logInfo('Faction warfare systems fetched successfully');
      return data;
    } catch (error) {
      if (error instanceof Error) {
        logError(`Error fetching faction warfare systems: ${error.message}`);
      } else {
        logError('Unknown error fetching faction warfare systems');
      }
      throw error;
    }
  }
};
