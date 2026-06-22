import path from 'path';
import { getConfig } from '../../../src/config/configManager';

describe('configManager', () => {
  describe('getConfig', () => {
    it('should return a config object with required fields', () => {
      const config = getConfig();

      expect(config).toBeDefined();
      expect(config).toHaveProperty('projectName');
      expect(config).toHaveProperty('link');
      expect(config).toHaveProperty('language');
    });

    it('should return a valid ESI link', () => {
      const config = getConfig();

      expect(config.link).toMatch(/^https:\/\/esi\.evetech\.net\//);
    });

    it('should return the same config on subsequent calls', () => {
      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).toBe(config2);
    });

    it('should have string values for all config fields', () => {
      const config = getConfig();

      expect(typeof config.projectName).toBe('string');
      expect(typeof config.link).toBe('string');
      expect(typeof config.language).toBe('string');
    });
  });

  describe('getDirname (via loadConfig)', () => {
    it('should resolve config from the package directory, not process.cwd()', () => {
      // getConfig() internally uses getDirname() to find esi.json.
      // If getDirname() incorrectly returned process.cwd(), this would fail
      // whenever tests are run from a directory other than src/config/.
      // The fact that getConfig() succeeds proves getDirname() returns the
      // correct directory (src/config/) where esi.json lives.
      const configDir = path.resolve(__dirname, '../../../src/config');
      const esiJsonPath = path.join(configDir, 'esi.json');

      // Verify esi.json exists at the expected location
      const fs = require('fs');
      expect(fs.existsSync(esiJsonPath)).toBe(true);

      // Verify getConfig() works (proving getDirname resolves correctly)
      expect(() => getConfig()).not.toThrow();
    });
  });
});
