import {
  USER_AGENT,
  PACKAGE_NAME,
  PACKAGE_VERSION,
  COMPATIBILITY_DATE,
} from '../../../src/core/constants';

describe('constants', () => {
  it('should have the correct package name', () => {
    expect(PACKAGE_NAME).toBe('esi.ts');
  });

  it('should have a valid semver version', () => {
    expect(PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should construct USER_AGENT from name and version', () => {
    expect(USER_AGENT).toBe(`${PACKAGE_NAME}/${PACKAGE_VERSION}`);
  });

  it('should have a valid compatibility date', () => {
    expect(COMPATIBILITY_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
