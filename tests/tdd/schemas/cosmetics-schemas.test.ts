/**
 * The SKINR schemas of `./schemas` (cosmetics): each accepts a valid body,
 * rejects a wrong type and keeps an unknown field (z.looseObject).
 */
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import {
  CharacterSkinrComponentsSchema,
  CharacterSkinrSchema,
  SkinrComponentLicenseSchema,
  SkinrComponentRunsSchema,
  SkinrLayoutSchema,
  SkinrLayoutSlotSchema,
  SkinrLicenseSchema,
  SkinrSchema,
  SkinrTierSchema,
} from '../../../src/schemas';

interface SchemaTestCase {
  name: string;
  schema: z.ZodType;
  validData: Record<string, unknown>;
  invalidData: Record<string, unknown>;
}

const license = {
  skinr_id: '5ad758a15e0bdfe1dff831b138068f4fabacb28ad94a7527073b818b566383fd',
  activated: true,
  unactivated: 2,
};
const componentLicense = {
  component_id: 4012,
  type: 'pattern',
  runs: { remaining: 3 },
};
const slot = { id: 1, configuration: { nanocoating_id: 77 } };
const layout = { slots: [slot], pattern_blend_mode: 'normal' };
const skinr = {
  id: '5ad758a15e0bdfe1dff831b138068f4fabacb28ad94a7527073b818b566383fd',
  name: 'Sun God Ra Avatar',
  line: 'Uglyyoda Designs',
  creator_id: 2119597578,
  ship_type_id: 11567,
  tier: { level: 15 },
  layout,
};

const schemaCases: SchemaTestCase[] = [
  {
    name: 'SkinrLicenseSchema',
    schema: SkinrLicenseSchema,
    validData: license,
    invalidData: { ...license, activated: 'yes' },
  },
  {
    name: 'CharacterSkinrSchema',
    schema: CharacterSkinrSchema,
    validData: { licenses: [license] },
    invalidData: { licenses: [{ ...license, unactivated: '2' }] },
  },
  {
    name: 'SkinrComponentRunsSchema',
    schema: SkinrComponentRunsSchema,
    validData: { unlimited: true },
    invalidData: { remaining: 'three' },
  },
  {
    name: 'SkinrComponentLicenseSchema',
    schema: SkinrComponentLicenseSchema,
    validData: componentLicense,
    invalidData: { ...componentLicense, component_id: '4012' },
  },
  {
    name: 'CharacterSkinrComponentsSchema',
    schema: CharacterSkinrComponentsSchema,
    validData: { licenses: [componentLicense] },
    invalidData: { licenses: 'none' },
  },
  {
    name: 'SkinrTierSchema',
    schema: SkinrTierSchema,
    validData: { level: 15 },
    invalidData: { level: 'fifteen' },
  },
  {
    name: 'SkinrLayoutSlotSchema',
    schema: SkinrLayoutSlotSchema,
    validData: slot,
    invalidData: { ...slot, configuration: 'pattern' },
  },
  {
    name: 'SkinrLayoutSchema',
    schema: SkinrLayoutSchema,
    validData: layout,
    invalidData: { ...layout, pattern_blend_mode: 3 },
  },
  {
    name: 'SkinrSchema',
    schema: SkinrSchema,
    validData: skinr,
    invalidData: { ...skinr, ship_type_id: '11567' },
  },
];

describe('cosmetics (SKINR) schemas', () => {
  describe.each(schemaCases)('$name', ({ schema, validData, invalidData }) => {
    it('accepts a valid body', () => {
      expect(schema.safeParse(validData).success).toBe(true);
    });

    it('rejects a wrong type on a field', () => {
      expect(schema.safeParse(invalidData).success).toBe(false);
    });

    it('keeps an unknown field', () => {
      const result = schema.safeParse({ ...validData, _extra_field: 'kept' });
      expect(result.success).toBe(true);
      expect(
        (result.data as Record<string, unknown> | undefined)?._extra_field,
      ).toBe('kept');
    });
  });

  it('SkinrSchema accepts the recorded GET /cosmetics/skinr/{skinr_id} body', () => {
    const fixture = JSON.parse(
      fs.readFileSync(
        path.resolve(
          __dirname,
          '../../contract/fixtures/recorded/cosmetics.getSkinr.json',
        ),
        'utf8',
      ),
    ) as { pages: { body: unknown }[] };
    expect(SkinrSchema.safeParse(fixture.pages[0]!.body).success).toBe(true);
  });
});
