import {
  extractLocale,
  normalizeSdeFieldName,
  toSqliteValue,
  transformRecord,
} from '../../../../src/sde/ingestion/transforms';

describe('extractLocale', () => {
  it('should return en locale from a locale map', () => {
    expect(extractLocale({ en: 'Tritanium', de: 'Tritanium' })).toBe(
      'Tritanium',
    );
  });

  it('should return a plain string directly', () => {
    expect(extractLocale('Tritanium')).toBe('Tritanium');
  });

  it('should return fallback for null', () => {
    expect(extractLocale(null)).toBe('');
  });

  it('should return fallback for undefined', () => {
    expect(extractLocale(undefined)).toBe('');
  });

  it('should return custom fallback', () => {
    expect(extractLocale(null, 'en', 'N/A')).toBe('N/A');
  });

  it('should return fallback when locale key is missing', () => {
    expect(extractLocale({ de: 'Tritanium' })).toBe('');
  });

  it('should return fallback for arrays', () => {
    expect(extractLocale([1, 2, 3])).toBe('');
  });

  it('should extract a non-en locale', () => {
    expect(extractLocale({ en: 'Tritanium', de: 'Tritanium' }, 'de')).toBe(
      'Tritanium',
    );
  });
});

describe('normalizeSdeFieldName', () => {
  it('should convert trailing ID to Id', () => {
    expect(normalizeSdeFieldName('groupID')).toBe('groupId');
  });

  it('should convert ID before a capital letter', () => {
    expect(normalizeSdeFieldName('solarSystemID')).toBe('solarSystemId');
  });

  it('should convert blueprintTypeID', () => {
    expect(normalizeSdeFieldName('blueprintTypeID')).toBe('blueprintTypeId');
  });

  it('should not change fields without ID', () => {
    expect(normalizeSdeFieldName('description')).toBe('description');
    expect(normalizeSdeFieldName('name')).toBe('name');
    expect(normalizeSdeFieldName('published')).toBe('published');
  });

  it('should not change already-camelCase id fields', () => {
    expect(normalizeSdeFieldName('typeId')).toBe('typeId');
  });

  it('should handle marketGroupID', () => {
    expect(normalizeSdeFieldName('marketGroupID')).toBe('marketGroupId');
  });
});

describe('toSqliteValue', () => {
  it('should convert true to 1', () => {
    expect(toSqliteValue(true)).toBe(1);
  });

  it('should convert false to 0', () => {
    expect(toSqliteValue(false)).toBe(0);
  });

  it('should pass numbers through', () => {
    expect(toSqliteValue(42)).toBe(42);
    expect(toSqliteValue(3.14)).toBe(3.14);
  });

  it('should pass strings through', () => {
    expect(toSqliteValue('hello')).toBe('hello');
  });

  it('should convert null to null', () => {
    expect(toSqliteValue(null)).toBeNull();
  });

  it('should convert undefined to null', () => {
    expect(toSqliteValue(undefined)).toBeNull();
  });

  it('should JSON.stringify objects', () => {
    expect(toSqliteValue({ a: 1 })).toBe('{"a":1}');
  });

  it('should JSON.stringify arrays', () => {
    expect(toSqliteValue([1, 2, 3])).toBe('[1,2,3]');
  });
});

describe('transformRecord', () => {
  it('should inject entity ID when injectId is true', () => {
    const raw = { name: { en: 'Mineral' }, published: true };
    const result = transformRecord(18, raw, {
      idAttribute: 'groupId',
      injectId: true,
    });
    expect(result.groupId).toBe(18);
  });

  it('should not inject entity ID when injectId is false', () => {
    const raw = { attributeId: 9, name: { en: 'hp' } };
    const result = transformRecord(9, raw, {
      idAttribute: 'attributeId',
      injectId: false,
    });
    expect(result).not.toHaveProperty('attributeId_injected');
  });

  it('should extract locale from name fields', () => {
    const raw = { name: { en: 'Tritanium', de: 'Tritanium' }, groupID: 18 };
    const result = transformRecord(34, raw, {
      idAttribute: 'typeId',
      injectId: true,
    });
    expect(result.name).toBe('Tritanium');
  });

  it('should normalize field names', () => {
    const raw = { groupID: 18, marketGroupID: 1857 };
    const result = transformRecord(34, raw, {
      idAttribute: 'typeId',
      injectId: true,
    });
    expect(result).toHaveProperty('groupId', 18);
    expect(result).toHaveProperty('marketGroupId', 1857);
  });

  it('should convert booleans to integers', () => {
    const raw = { published: true };
    const result = transformRecord(1, raw, {
      idAttribute: 'categoryId',
      injectId: true,
    });
    expect(result.published).toBe(1);
  });

  it('should handle string entity IDs', () => {
    const raw = { name: { en: 'English' } };
    const result = transformRecord('en', raw, {
      idAttribute: 'translationLanguageId',
      injectId: true,
    });
    expect(result.translationLanguageId).toBe('en');
  });

  it('should JSON.stringify complex nested values', () => {
    const raw = {
      activities: {
        manufacturing: {
          time: 6000,
          materials: [{ typeId: 34, quantity: 100 }],
        },
      },
    };
    const result = transformRecord(787, raw, {
      idAttribute: 'blueprintTypeId',
      injectId: true,
    });
    expect(typeof result.activities).toBe('string');
    expect(JSON.parse(result.activities as string)).toHaveProperty(
      'manufacturing',
    );
  });
});
