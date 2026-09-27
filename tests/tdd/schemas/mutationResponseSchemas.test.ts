import {
  AddedContactIdsSchema,
  CspaChargeCostSchema,
  FittingCreatedSchema,
  FleetSquadCreatedSchema,
  FleetWingCreatedSchema,
  MailIdSchema,
  MailLabelIdSchema,
} from '../../../src/schemas';

describe('response schemas of mutations that return a body', () => {
  it.each([
    ['CspaChargeCostSchema', CspaChargeCostSchema],
    ['MailIdSchema', MailIdSchema],
    ['MailLabelIdSchema', MailLabelIdSchema],
  ] as const)(
    '%s accepts a number and rejects anything else',
    (_name, schema) => {
      expect(schema.parse(12345)).toBe(12345);
      expect(schema.safeParse('12345').success).toBe(false);
      expect(schema.safeParse({ id: 12345 }).success).toBe(false);
      expect(schema.safeParse(null).success).toBe(false);
    },
  );

  it('AddedContactIdsSchema accepts an array of ids and rejects other shapes', () => {
    expect(AddedContactIdsSchema.parse([90000001, 90000002])).toEqual([
      90000001, 90000002,
    ]);
    expect(AddedContactIdsSchema.parse([])).toEqual([]);
    expect(AddedContactIdsSchema.safeParse(90000001).success).toBe(false);
    expect(AddedContactIdsSchema.safeParse(['90000001']).success).toBe(false);
  });

  it('FittingCreatedSchema requires fitting_id and keeps extra fields', () => {
    expect(
      FittingCreatedSchema.parse({ fitting_id: 7, extra: 'kept' }),
    ).toEqual({
      fitting_id: 7,
      extra: 'kept',
    });
    expect(FittingCreatedSchema.safeParse({}).success).toBe(false);
    expect(FittingCreatedSchema.safeParse({ fitting_id: '7' }).success).toBe(
      false,
    );
  });

  it('FleetWingCreatedSchema requires wing_id', () => {
    expect(FleetWingCreatedSchema.parse({ wing_id: 2073711261968 })).toEqual({
      wing_id: 2073711261968,
    });
    expect(FleetWingCreatedSchema.safeParse({ squad_id: 1 }).success).toBe(
      false,
    );
  });

  it('FleetSquadCreatedSchema requires squad_id', () => {
    expect(FleetSquadCreatedSchema.parse({ squad_id: 3129411261968 })).toEqual({
      squad_id: 3129411261968,
    });
    expect(FleetSquadCreatedSchema.safeParse({ wing_id: 1 }).success).toBe(
      false,
    );
  });
});
