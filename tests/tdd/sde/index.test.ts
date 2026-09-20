import * as sde from '../../../src/sde/index';

describe('src/sde/index barrel export', () => {
  it('should export SdeDataProvider', () => {
    expect(sde.SdeDataProvider).toBeDefined();
  });

  it('should export MemorySdeProvider', () => {
    expect(sde.MemorySdeProvider).toBeDefined();
  });

  it('should export SdeTestDataFactory', () => {
    expect(sde.SdeTestDataFactory).toBeDefined();
  });

  it('should export SdeError classes', () => {
    expect(sde.SdeError).toBeDefined();
    expect(sde.SdeDatabaseError).toBeDefined();
    expect(sde.SdeValidationError).toBeDefined();
    expect(sde.SdeVersionMismatchError).toBeDefined();
  });

  it('should export type guard functions', () => {
    expect(sde.isSdeError).toBeDefined();
    expect(sde.isSdeDatabaseError).toBeDefined();
    expect(sde.isSdeValidationError).toBeDefined();
    expect(sde.isSdeVersionMismatch).toBeDefined();
  });
});
