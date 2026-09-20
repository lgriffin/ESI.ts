import fs from 'fs';
import path from 'path';

interface Config {
  projectName: string;
  link: string;
  language: string;
}

let config: Config;

// Cross-platform way to get __dirname that works in both CommonJS and ES modules.
// In CommonJS (the default for this project), __dirname is always available.
// The fallback avoids process.cwd() which would point to the consuming project,
// not the ESI.ts package directory.
const getDirname = (): string => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  // Fallback: resolve this module's own location via require.resolve.
  // This works when require() is available but __dirname is not (e.g. bundled CommonJS).
  try {
    return path.dirname(require.resolve('./configManager'));
  } catch {
    throw new Error(
      'Unable to determine config directory: __dirname is not available and ' +
        'require.resolve failed. Ensure ESI.ts is used in a CommonJS environment.',
    );
  }
};

const loadConfig = () => {
  const __dirname = getDirname();
  const configPath = path.join(__dirname, 'esi.json');

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (fs.existsSync(configPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const configFile = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configFile) as Config;
  } else {
    throw new Error('Configuration file not found');
  }
};

const getConfig = (): Config => {
  if (!config) {
    loadConfig();
  }
  return config;
};

export { getConfig };
