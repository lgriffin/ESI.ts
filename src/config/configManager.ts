import fs from 'fs';
import path from 'path';

import { buildError, checkForConfig, log } from './util';
import { projectConfig, server, routes } from './constants';

interface Settings {
  route?: string;
  authToken?: string;
  language?: string;
  projectName?: string;
}

const getSettings = (): Settings => {
  const configPath = path.join(__dirname, 'esi.json');
  const configFile = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(configFile);
};

const setSettings = ({ route = 'latest', authToken, language = 'en/us', projectName }: Settings): boolean => {
  if (checkForConfig()) {
    const currentSettings = getSettings();

    // Check if settings are already set, and don't change if not needed
    route = route || currentSettings.route || 'latest';
    authToken = authToken || currentSettings.authToken || '';
    language = language || currentSettings.language || 'en/us';
    projectName = projectName || currentSettings.projectName || '';

    if (!routes.includes(route)) {
      throw buildError(`setSettings needs its "route" argument to be one of these: ${routes}`);
    }
    const routeUrl = `https://${server}/${route}/`;

    try {
      const newConfig = JSON.stringify(
        {
          projectName,
          link: routeUrl,
          authToken,
          language
        },
        null,
        2
      );
      fs.writeFileSync(projectConfig, newConfig);
      log(`Successfully updated config!\nNew config:\n${newConfig}`, 'INFO');
    } catch (e) {
      throw buildError(`Couldn't write config file! Error:\n${e}`);
    }
    return true;
  }
  throw buildError('If you are seeing this error, 2 + 2 is not equal to 4 and your life is a lie.', 'THIS_SHOULDNT_EVER_HAPPEN');
};

const sleep = async (millis: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, millis));
};

export { getSettings, setSettings, sleep };
