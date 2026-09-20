import { esiEnum } from '../../../src/schemas/esiEnum';

describe('esiEnum', () => {
  const schema = esiEnum(['active', 'closed', 'pending']);

  it('should accept known enum values', () => {
    expect(schema.safeParse('active').success).toBe(true);
    expect(schema.safeParse('closed').success).toBe(true);
    expect(schema.safeParse('pending').success).toBe(true);
  });

  it('should accept unknown string values', () => {
    const result = schema.safeParse('new_unknown_state');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('new_unknown_state');
    }
  });

  it('should reject non-string values', () => {
    expect(schema.safeParse(42).success).toBe(false);
    expect(schema.safeParse(true).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse([]).success).toBe(false);
  });

  it('should preserve the original string value', () => {
    const result = schema.safeParse('future_ccp_value');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('future_ccp_value');
    }
  });
});
