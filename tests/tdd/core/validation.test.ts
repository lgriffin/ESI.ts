import {
  validatePathParam,
  validateQueryParam,
} from '../../../src/core/util/validation';

describe('validatePathParam', () => {
  it('should accept valid numeric IDs', () => {
    expect(validatePathParam('allianceId', 99003214)).toBe('99003214');
    expect(validatePathParam('characterId', 12345)).toBe('12345');
  });

  it('should accept valid string values', () => {
    expect(validatePathParam('hash', 'abc123def')).toBe('abc123def');
  });

  it('should reject empty values', () => {
    expect(() => validatePathParam('id', '')).toThrow('must not be empty');
    expect(() => validatePathParam('id', null)).toThrow('must not be empty');
    expect(() => validatePathParam('id', undefined)).toThrow(
      'must not be empty',
    );
  });

  it('should reject values with path traversal characters', () => {
    expect(() => validatePathParam('id', '../etc/passwd')).toThrow(
      'invalid characters',
    );
    expect(() => validatePathParam('id', 'foo/bar')).toThrow(
      'invalid characters',
    );
    expect(() => validatePathParam('id', 'foo\\bar')).toThrow(
      'invalid characters',
    );
  });

  it('should reject values with query string characters', () => {
    expect(() => validatePathParam('id', 'foo?bar=1')).toThrow(
      'invalid characters',
    );
    expect(() => validatePathParam('id', 'foo#anchor')).toThrow(
      'invalid characters',
    );
  });

  it('should reject NaN and Infinity', () => {
    expect(() => validatePathParam('id', NaN)).toThrow('finite number');
    expect(() => validatePathParam('id', Infinity)).toThrow('finite number');
    expect(() => validatePathParam('id', -Infinity)).toThrow('finite number');
  });
});

describe('validateQueryParam', () => {
  it('should accept valid string values', () => {
    expect(validateQueryParam('type_id', '34')).toBe('34');
    expect(validateQueryParam('name', 'Tritanium')).toBe('Tritanium');
  });

  it('should accept valid numeric values', () => {
    expect(validateQueryParam('type_id', 34)).toBe('34');
  });

  it('should reject null and undefined', () => {
    expect(() => validateQueryParam('type_id', null)).toThrow(
      'must not be null',
    );
    expect(() => validateQueryParam('type_id', undefined)).toThrow(
      'must not be null',
    );
  });

  it('should reject NaN and Infinity', () => {
    expect(() => validateQueryParam('page', NaN)).toThrow('finite number');
    expect(() => validateQueryParam('page', Infinity)).toThrow('finite number');
  });

  it('should reject overly long values', () => {
    const longString = 'a'.repeat(2001);
    expect(() => validateQueryParam('search', longString)).toThrow(
      'exceeds maximum length',
    );
  });

  it('should accept values at the length limit', () => {
    const maxString = 'a'.repeat(2000);
    expect(validateQueryParam('search', maxString)).toBe(maxString);
  });
});
