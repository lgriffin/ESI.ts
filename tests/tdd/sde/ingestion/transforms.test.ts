import {
  extractLocale,
  normalizeSdeFieldName,
  toSqliteValue,
  transformRecord,
  transformRecordNative,
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

describe('transformRecordNative', () => {
  it('should inject entity ID when injectId is true', () => {
    const raw = { name: { en: 'Mineral' }, published: true };
    const result = transformRecordNative(18, raw, {
      idAttribute: 'groupId',
      injectId: true,
    });
    expect(result.groupId).toBe(18);
  });

  it('should not inject entity ID when injectId is false', () => {
    const raw = { name: { en: 'hp' }, value: 100 };
    const result = transformRecordNative(9, raw, {
      idAttribute: 'attributeId',
      injectId: false,
    });
    expect(result).not.toHaveProperty('attributeId');
  });

  it('should extract locale from name fields', () => {
    const raw = { name: { en: 'Tritanium', de: 'Tritanium' }, groupID: 18 };
    const result = transformRecordNative(34, raw, {
      idAttribute: 'typeId',
      injectId: true,
    });
    expect(result.name).toBe('Tritanium');
  });

  it('should normalize field names', () => {
    const raw = { groupID: 18, marketGroupID: 1857 };
    const result = transformRecordNative(34, raw, {
      idAttribute: 'typeId',
      injectId: true,
    });
    expect(result).toHaveProperty('groupId', 18);
    expect(result).toHaveProperty('marketGroupId', 1857);
  });

  it('should preserve booleans as native booleans', () => {
    const raw = { published: true };
    const result = transformRecordNative(1, raw, {
      idAttribute: 'categoryId',
      injectId: true,
    });
    expect(result.published).toBe(true);
  });

  it('should handle string entity IDs', () => {
    const raw = { name: { en: 'English' } };
    const result = transformRecordNative('en', raw, {
      idAttribute: 'translationLanguageId',
      injectId: true,
    });
    expect(result.translationLanguageId).toBe('en');
  });

  it('should preserve nested objects as native objects', () => {
    const raw = {
      activities: {
        manufacturing: {
          time: 6000,
          materials: [{ typeID: 34, quantity: 100 }],
        },
      },
    };
    const result = transformRecordNative(787, raw, {
      idAttribute: 'blueprintTypeId',
      injectId: true,
    });
    expect(typeof result.activities).toBe('object');
    expect(result.activities).not.toBeNull();
  });

  it('should recursively normalize nested object keys (normalizeNested)', () => {
    const raw = {
      destination: { solarSystemID: 30000140, stargateID: 50000802 },
    };
    const result = transformRecordNative(50001248, raw, {
      idAttribute: 'stargateId',
      injectId: true,
    });
    const dest = result.destination as Record<string, unknown>;
    expect(dest).toHaveProperty('solarSystemId', 30000140);
    expect(dest).toHaveProperty('stargateId', 50000802);
    expect(dest).not.toHaveProperty('solarSystemID');
    expect(dest).not.toHaveProperty('stargateID');
  });

  it('should recursively normalize keys in arrays of objects', () => {
    const raw = {
      items: [
        { typeID: 34, groupID: 18 },
        { typeID: 35, groupID: 18 },
      ],
    };
    const result = transformRecordNative(1, raw, {
      idAttribute: 'id',
      injectId: true,
    });
    const items = result.items as Array<Record<string, unknown>>;
    expect(items[0]).toHaveProperty('typeId', 34);
    expect(items[0]).toHaveProperty('groupId', 18);
    expect(items[1]).toHaveProperty('typeId', 35);
  });

  it('should extract locale from nested locale maps', () => {
    const raw = {
      details: { label: { en: 'Test Label', de: 'Testbezeichnung' } },
    };
    const result = transformRecordNative(1, raw, {
      idAttribute: 'id',
      injectId: true,
    });
    const details = result.details as Record<string, unknown>;
    expect(details.label).toBe('Test Label');
  });

  it('should handle null/undefined values in nested normalization', () => {
    const raw = {
      destination: null,
      status: undefined,
      count: 42,
      label: 'hello',
    };
    const result = transformRecordNative(1, raw, {
      idAttribute: 'id',
      injectId: true,
    });
    expect(result.destination).toBeNull();
    expect(result.status).toBeUndefined();
    expect(result.count).toBe(42);
    expect(result.label).toBe('hello');
  });

  it('should handle deeply nested objects', () => {
    const raw = {
      level1: {
        level2: {
          solarSystemID: 30000142,
          items: [{ typeID: 34 }],
        },
      },
    };
    const result = transformRecordNative(1, raw, {
      idAttribute: 'id',
      injectId: true,
    });
    const l1 = result.level1 as Record<string, unknown>;
    const l2 = l1.level2 as Record<string, unknown>;
    expect(l2).toHaveProperty('solarSystemId', 30000142);
    const items = l2.items as Array<Record<string, unknown>>;
    expect(items[0]).toHaveProperty('typeId', 34);
  });
});
