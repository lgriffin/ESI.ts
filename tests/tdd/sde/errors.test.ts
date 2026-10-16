import {
  SdeError,
  SdeValidationError,
  SdeVersionMismatchError,
  isSdeError,
  isSdeValidationError,
  isSdeVersionMismatch,
} from '../../../src/sde/errors';

describe('ARCH-11: SDE error classes', () => {
  describe('SdeError', () => {
    it('should create with correct name and message', () => {
      const err = new SdeError('test error');
      expect(err.name).toBe('SdeError');
      expect(err.message).toBe('test error');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('SdeValidationError', () => {
    it('should create with entity type and validation error', () => {
      const zodError = { issues: [{ message: 'required' }] };
      const err = new SdeValidationError('EveType', zodError, 34);
      expect(err.name).toBe('SdeValidationError');
      expect(err.message).toBe('SDE validation failed for EveType (id: 34)');
      expect(err.entityType).toBe('EveType');
      expect(err.entityId).toBe(34);
      expect(err.validationError).toBe(zodError);
      expect(err).toBeInstanceOf(SdeError);
    });

    it('should handle missing entity ID', () => {
      const err = new SdeValidationError('EveGroup', 'bad data');
      expect(err.message).toBe('SDE validation failed for EveGroup');
      expect(err.entityId).toBeUndefined();
    });
  });

  describe('SdeVersionMismatchError', () => {
    it('should create with expected and actual versions', () => {
      const err = new SdeVersionMismatchError('2.0', '1.0');
      expect(err.name).toBe('SdeVersionMismatchError');
      expect(err.message).toBe('SDE version mismatch: expected 2.0, got 1.0');
      expect(err.expected).toBe('2.0');
      expect(err.actual).toBe('1.0');
      expect(err).toBeInstanceOf(SdeError);
    });
  });
});

describe('ARCH-11: SDE type guards', () => {
  const sdeError = new SdeError('base');
  const valError = new SdeValidationError('Type', 'err');
  const verError = new SdeVersionMismatchError('2', '1');
  const plainError = new Error('plain');

  describe('isSdeError', () => {
    it('should return true for SdeError instances', () => {
      expect(isSdeError(sdeError)).toBe(true);
    });

    it('should return true for SdeError subclasses', () => {
      expect(isSdeError(valError)).toBe(true);
      expect(isSdeError(verError)).toBe(true);
    });

    it('should return false for non-SdeError', () => {
      expect(isSdeError(plainError)).toBe(false);
      expect(isSdeError(null)).toBe(false);
      expect(isSdeError('string')).toBe(false);
    });
  });

  describe('isSdeValidationError', () => {
    it('should return true for SdeValidationError', () => {
      expect(isSdeValidationError(valError)).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isSdeValidationError(sdeError)).toBe(false);
      expect(isSdeValidationError(verError)).toBe(false);
    });
  });

  describe('isSdeVersionMismatch', () => {
    it('should return true for SdeVersionMismatchError', () => {
      expect(isSdeVersionMismatch(verError)).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isSdeVersionMismatch(sdeError)).toBe(false);
      expect(isSdeVersionMismatch(plainError)).toBe(false);
    });
  });
});
