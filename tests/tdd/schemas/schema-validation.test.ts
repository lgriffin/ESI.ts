import {
  CharacterInfoSchema,
  CharacterPortraitSchema,
  CharacterAttributesSchema,
  MedalSchema,
  NotificationSchema,
  StandingSchema,
  CorporationHistorySchema,
  CharacterAffiliationSchema,
  CharacterRoleSchema,
} from '../../../src/schemas/character';
import {
  AllianceInfoSchema,
  AllianceContactSchema,
  AllianceContactLabelSchema,
  AllianceIconSchema,
} from '../../../src/schemas/alliance';
import {
  MarketOrderSchema,
  MarketHistorySchema,
} from '../../../src/schemas/market';
import {
  SolarSystemInfoSchema,
  ConstellationInfoSchema,
  RegionInfoSchema,
  TypeInfoSchema,
} from '../../../src/schemas/universe';

describe('Schema Validation', () => {
  describe('Valid data parsing', () => {
    it('should parse valid CharacterInfo data successfully', () => {
      const data = {
        character_id: 1689391488,
        name: 'Test Character',
        corporation_id: 1344654522,
        alliance_id: 99005338,
        bloodline_id: 4,
        race_id: 1,
        gender: 'male',
        birthday: '2003-05-06T00:00:00Z',
        description: 'A test character',
        security_status: 5.0,
        title: 'Test Pilot',
      };

      const result = CharacterInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.character_id).toBe(1689391488);
        expect(result.data.name).toBe('Test Character');
        expect(result.data.gender).toBe('male');
      }
    });

    it('should parse valid AllianceInfo data successfully', () => {
      const data = {
        alliance_id: 99005338,
        name: 'Goonswarm Federation',
        ticker: 'CONDI',
        creator_id: 1689391488,
        creator_corporation_id: 1344654522,
        date_founded: '2010-06-01T00:00:00Z',
      };

      const result = AllianceInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alliance_id).toBe(99005338);
        expect(result.data.name).toBe('Goonswarm Federation');
        expect(result.data.ticker).toBe('CONDI');
      }
    });

    it('should parse valid MarketOrder data successfully', () => {
      const data = {
        order_id: 5000001,
        type_id: 34,
        location_id: 60003760,
        volume_total: 10000,
        volume_remain: 5000,
        min_volume: 1,
        price: 5.5,
        is_buy_order: false,
        system_id: 30000142,
        duration: 90,
        issued: '2023-01-15T12:00:00Z',
        range: 'region',
      };

      const result = MarketOrderSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order_id).toBe(5000001);
        expect(result.data.is_buy_order).toBe(false);
        expect(result.data.price).toBe(5.5);
      }
    });

    it('should parse valid SolarSystemInfo data successfully', () => {
      const data = {
        system_id: 30000142,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 0.9459131,
        star_id: 40009081,
        stargates: [50000056, 50000057],
        stations: [60003760],
        planets: [
          {
            planet_id: 40009077,
            asteroid_belts: [40009078],
            moons: [40009079, 40009080],
          },
        ],
      };

      const result = SolarSystemInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.system_id).toBe(30000142);
        expect(result.data.name).toBe('Jita');
        expect(result.data.planets).toHaveLength(1);
        expect(result.data.planets![0].planet_id).toBe(40009077);
      }
    });

    it('should parse valid CharacterPortrait data successfully', () => {
      const data = {
        px64x64: 'https://images.evetech.net/characters/1/portrait?size=64',
        px128x128: 'https://images.evetech.net/characters/1/portrait?size=128',
        px256x256: 'https://images.evetech.net/characters/1/portrait?size=256',
        px512x512: 'https://images.evetech.net/characters/1/portrait?size=512',
      };

      const result = CharacterPortraitSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.px64x64).toContain('size=64');
      }
    });

    it('should parse valid CharacterAttributes data successfully', () => {
      const data = {
        charisma: 20,
        intelligence: 24,
        memory: 22,
        perception: 23,
        willpower: 21,
        bonus_remaps: 2,
        last_remap_date: '2023-01-01T00:00:00Z',
      };

      const result = CharacterAttributesSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.intelligence).toBe(24);
      }
    });

    it('should parse valid MarketHistory data successfully', () => {
      const data = {
        date: '2023-01-15',
        order_count: 1500,
        volume: 50000000,
        highest: 6.0,
        average: 5.5,
        lowest: 5.0,
      };

      const result = MarketHistorySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.average).toBe(5.5);
      }
    });
  });

  describe('Invalid data rejection - field type mismatches', () => {
    it('should reject CharacterInfo when character_id is a string instead of number', () => {
      const data = {
        character_id: 'not-a-number',
        name: 'Test',
        corporation_id: 123,
        bloodline_id: 4,
        race_id: 1,
        gender: 'male',
        birthday: '2003-05-06T00:00:00Z',
      };

      const result = CharacterInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject AllianceInfo when name is a number instead of string', () => {
      const data = {
        alliance_id: 99005338,
        name: 12345,
        ticker: 'CONDI',
        creator_id: 1689391488,
        creator_corporation_id: 1344654522,
        date_founded: '2010-06-01T00:00:00Z',
      };

      const result = AllianceInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject MarketOrder when is_buy_order is a string instead of boolean', () => {
      const data = {
        order_id: 5000001,
        type_id: 34,
        location_id: 60003760,
        volume_total: 10000,
        volume_remain: 5000,
        min_volume: 1,
        price: 5.5,
        is_buy_order: 'true',
        system_id: 30000142,
        duration: 90,
        issued: '2023-01-15T12:00:00Z',
        range: 'region',
      };

      const result = MarketOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject SolarSystemInfo when security_status is a string instead of number', () => {
      const data = {
        system_id: 30000142,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 'high',
      };

      const result = SolarSystemInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject CharacterAttributes when charisma is a boolean instead of number', () => {
      const data = {
        charisma: true,
        intelligence: 24,
        memory: 22,
        perception: 23,
        willpower: 21,
      };

      const result = CharacterAttributesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Missing required fields rejection', () => {
    it('should reject CharacterInfo missing name field', () => {
      const data = {
        character_id: 1689391488,
        corporation_id: 1344654522,
        bloodline_id: 4,
        race_id: 1,
        gender: 'male',
        birthday: '2003-05-06T00:00:00Z',
      };

      const result = CharacterInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject AllianceInfo missing ticker field', () => {
      const data = {
        alliance_id: 99005338,
        name: 'Goonswarm Federation',
        creator_id: 1689391488,
        creator_corporation_id: 1344654522,
        date_founded: '2010-06-01T00:00:00Z',
      };

      const result = AllianceInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject MarketOrder missing price field', () => {
      const data = {
        order_id: 5000001,
        type_id: 34,
        location_id: 60003760,
        volume_total: 10000,
        volume_remain: 5000,
        min_volume: 1,
        is_buy_order: false,
        system_id: 30000142,
        duration: 90,
        issued: '2023-01-15T12:00:00Z',
        range: 'region',
      };

      const result = MarketOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject SolarSystemInfo missing constellation_id field', () => {
      const data = {
        system_id: 30000142,
        name: 'Jita',
        security_status: 0.9459131,
      };

      const result = SolarSystemInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Optional fields can be omitted', () => {
    it('should accept CharacterInfo without optional fields', () => {
      const data = {
        character_id: 1689391488,
        name: 'Test Character',
        corporation_id: 1344654522,
        bloodline_id: 4,
        race_id: 1,
        gender: 'male',
        birthday: '2003-05-06T00:00:00Z',
      };

      const result = CharacterInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
        expect(result.data.alliance_id).toBeUndefined();
        expect(result.data.security_status).toBeUndefined();
        expect(result.data.title).toBeUndefined();
      }
    });

    it('should accept AllianceInfo without optional executor_corporation_id', () => {
      const data = {
        alliance_id: 99005338,
        name: 'Goonswarm Federation',
        ticker: 'CONDI',
        creator_id: 1689391488,
        creator_corporation_id: 1344654522,
        date_founded: '2010-06-01T00:00:00Z',
      };

      const result = AllianceInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.executor_corporation_id).toBeUndefined();
        expect(result.data.faction_id).toBeUndefined();
      }
    });

    it('should accept MarketOrder without optional state field', () => {
      const data = {
        order_id: 5000001,
        type_id: 34,
        location_id: 60003760,
        volume_total: 10000,
        volume_remain: 5000,
        min_volume: 1,
        price: 5.5,
        is_buy_order: false,
        system_id: 30000142,
        duration: 90,
        issued: '2023-01-15T12:00:00Z',
        range: 'region',
      };

      const result = MarketOrderSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.state).toBeUndefined();
      }
    });

    it('should accept SolarSystemInfo without optional planets and stargates', () => {
      const data = {
        system_id: 30000142,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 0.9459131,
      };

      const result = SolarSystemInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.planets).toBeUndefined();
        expect(result.data.stargates).toBeUndefined();
        expect(result.data.stations).toBeUndefined();
      }
    });

    it('should accept CharacterPortrait with no portrait fields', () => {
      const data = {};

      const result = CharacterPortraitSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.px64x64).toBeUndefined();
        expect(result.data.px128x128).toBeUndefined();
        expect(result.data.px256x256).toBeUndefined();
        expect(result.data.px512x512).toBeUndefined();
      }
    });
  });

  describe('Passthrough mode preserves extra fields', () => {
    it('should preserve extra fields on CharacterInfo', () => {
      const data = {
        character_id: 1689391488,
        name: 'Test Character',
        corporation_id: 1344654522,
        bloodline_id: 4,
        race_id: 1,
        gender: 'male',
        birthday: '2003-05-06T00:00:00Z',
        extra_field: 'extra_value',
        another_field: 42,
      };

      const result = CharacterInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = result.data as Record<string, unknown>;
        expect(parsed['extra_field']).toBe('extra_value');
        expect(parsed['another_field']).toBe(42);
      }
    });

    it('should preserve extra fields on AllianceInfo', () => {
      const data = {
        alliance_id: 99005338,
        name: 'Goonswarm Federation',
        ticker: 'CONDI',
        creator_id: 1689391488,
        creator_corporation_id: 1344654522,
        date_founded: '2010-06-01T00:00:00Z',
        new_api_field: true,
      };

      const result = AllianceInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = result.data as Record<string, unknown>;
        expect(parsed['new_api_field']).toBe(true);
      }
    });

    it('should preserve extra fields on MarketOrder', () => {
      const data = {
        order_id: 5000001,
        type_id: 34,
        location_id: 60003760,
        volume_total: 10000,
        volume_remain: 5000,
        min_volume: 1,
        price: 5.5,
        is_buy_order: false,
        system_id: 30000142,
        duration: 90,
        issued: '2023-01-15T12:00:00Z',
        range: 'region',
        undocumented_field: 'surprise',
      };

      const result = MarketOrderSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = result.data as Record<string, unknown>;
        expect(parsed['undocumented_field']).toBe('surprise');
      }
    });
  });

  describe('Round-trip idempotency', () => {
    it('should produce identical results for CharacterInfo when parsed twice', () => {
      const data = {
        character_id: 1689391488,
        name: 'Test Character',
        corporation_id: 1344654522,
        bloodline_id: 4,
        race_id: 1,
        gender: 'male',
        birthday: '2003-05-06T00:00:00Z',
        description: 'A test character',
      };

      const firstParse = CharacterInfoSchema.parse(data);
      const secondParse = CharacterInfoSchema.parse(firstParse);
      expect(secondParse).toEqual(firstParse);
    });

    it('should produce identical results for AllianceInfo when parsed twice', () => {
      const data = {
        alliance_id: 99005338,
        name: 'Goonswarm Federation',
        ticker: 'CONDI',
        creator_id: 1689391488,
        creator_corporation_id: 1344654522,
        date_founded: '2010-06-01T00:00:00Z',
        executor_corporation_id: 1344654522,
      };

      const firstParse = AllianceInfoSchema.parse(data);
      const secondParse = AllianceInfoSchema.parse(firstParse);
      expect(secondParse).toEqual(firstParse);
    });

    it('should produce identical results for MarketOrder when parsed twice', () => {
      const data = {
        order_id: 5000001,
        type_id: 34,
        location_id: 60003760,
        volume_total: 10000,
        volume_remain: 5000,
        min_volume: 1,
        price: 5.5,
        is_buy_order: false,
        system_id: 30000142,
        duration: 90,
        issued: '2023-01-15T12:00:00Z',
        range: 'region',
        state: 'open',
      };

      const firstParse = MarketOrderSchema.parse(data);
      const secondParse = MarketOrderSchema.parse(firstParse);
      expect(secondParse).toEqual(firstParse);
    });

    it('should produce identical results for SolarSystemInfo when parsed twice', () => {
      const data = {
        system_id: 30000142,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 0.9459131,
        planets: [
          {
            planet_id: 40009077,
            asteroid_belts: [40009078],
            moons: [40009079],
          },
        ],
      };

      const firstParse = SolarSystemInfoSchema.parse(data);
      const secondParse = SolarSystemInfoSchema.parse(firstParse);
      expect(secondParse).toEqual(firstParse);
    });
  });

  describe('String enum validation', () => {
    it('should accept valid gender values', () => {
      const maleData = {
        character_id: 1,
        name: 'Test',
        corporation_id: 1,
        bloodline_id: 1,
        race_id: 1,
        gender: 'male',
        birthday: '2003-01-01T00:00:00Z',
      };
      const femaleData = { ...maleData, gender: 'female' };

      expect(CharacterInfoSchema.safeParse(maleData).success).toBe(true);
      expect(CharacterInfoSchema.safeParse(femaleData).success).toBe(true);
    });

    it('should reject invalid gender values', () => {
      const data = {
        character_id: 1,
        name: 'Test',
        corporation_id: 1,
        bloodline_id: 1,
        race_id: 1,
        gender: 'other',
        birthday: '2003-01-01T00:00:00Z',
      };

      const result = CharacterInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid MarketOrder state enum values', () => {
      const baseOrder = {
        order_id: 1,
        type_id: 34,
        location_id: 60003760,
        volume_total: 100,
        volume_remain: 50,
        min_volume: 1,
        price: 5.0,
        is_buy_order: false,
        system_id: 30000142,
        duration: 90,
        issued: '2023-01-15T12:00:00Z',
        range: 'region',
      };

      const validStates = ['open', 'closed', 'expired', 'cancelled'];
      for (const state of validStates) {
        const result = MarketOrderSchema.safeParse({ ...baseOrder, state });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid MarketOrder state enum values', () => {
      const data = {
        order_id: 1,
        type_id: 34,
        location_id: 60003760,
        volume_total: 100,
        volume_remain: 50,
        min_volume: 1,
        price: 5.0,
        is_buy_order: false,
        system_id: 30000142,
        duration: 90,
        issued: '2023-01-15T12:00:00Z',
        range: 'region',
        state: 'pending',
      };

      const result = MarketOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid AllianceContact contact_type enum values', () => {
      const baseContact = {
        contact_id: 1,
        standing: 10.0,
      };

      const validTypes = ['character', 'corporation', 'alliance'];
      for (const contact_type of validTypes) {
        const result = AllianceContactSchema.safeParse({
          ...baseContact,
          contact_type,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid AllianceContact contact_type enum values', () => {
      const data = {
        contact_id: 1,
        contact_type: 'npc',
        standing: 10.0,
      };

      const result = AllianceContactSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid Notification sender_type enum values', () => {
      const baseNotification = {
        notification_id: 1,
        type: 'WarDeclared',
        sender_id: 1,
        timestamp: '2023-01-01T00:00:00Z',
      };

      const validSenderTypes = [
        'character',
        'corporation',
        'alliance',
        'faction',
        'other',
      ];
      for (const sender_type of validSenderTypes) {
        const result = NotificationSchema.safeParse({
          ...baseNotification,
          sender_type,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should accept valid Standing from_type enum values', () => {
      const baseStanding = {
        from_id: 1,
        standing: 5.0,
      };

      const validFromTypes = ['agent', 'npc_corp', 'faction'];
      for (const from_type of validFromTypes) {
        const result = StandingSchema.safeParse({
          ...baseStanding,
          from_type,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Nullable fields accept null values', () => {
    it('should accept null for AllianceContact optional label_ids when absent', () => {
      const data = {
        contact_id: 1,
        contact_type: 'character',
        standing: 10.0,
      };

      const result = AllianceContactSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.label_ids).toBeUndefined();
      }
    });

    it('should accept CorporationHistory with is_deleted omitted', () => {
      const data = {
        corporation_id: 1344654522,
        record_id: 1,
        start_date: '2015-01-01T00:00:00Z',
      };

      const result = CorporationHistorySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_deleted).toBeUndefined();
      }
    });

    it('should accept CharacterRole with all optional arrays omitted', () => {
      const data = {};

      const result = CharacterRoleSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roles).toBeUndefined();
        expect(result.data.roles_at_hq).toBeUndefined();
        expect(result.data.roles_at_base).toBeUndefined();
        expect(result.data.roles_at_other).toBeUndefined();
      }
    });
  });

  describe('Nested object validation', () => {
    it('should validate Medal with nested graphics array', () => {
      const data = {
        medal_id: 1,
        title: 'Test Medal',
        description: 'A test medal',
        date: '2023-01-01T00:00:00Z',
        issuer_id: 1689391488,
        corporation_id: 1344654522,
        reason: 'Bravery',
        status: 'public',
        graphics: [
          { part: 1, layer: 0, graphic: 'caldari.1_1', color: 16777215 },
          { part: 2, layer: 1, graphic: 'caldari.1_2' },
        ],
      };

      const result = MedalSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.graphics).toHaveLength(2);
        expect(result.data.graphics[0].part).toBe(1);
        expect(result.data.graphics[0].color).toBe(16777215);
        expect(result.data.graphics[1].color).toBeUndefined();
      }
    });

    it('should reject Medal with invalid graphics array element', () => {
      const data = {
        medal_id: 1,
        title: 'Test Medal',
        description: 'A test medal',
        date: '2023-01-01T00:00:00Z',
        issuer_id: 1689391488,
        corporation_id: 1344654522,
        reason: 'Bravery',
        status: 'public',
        graphics: [{ part: 'not-a-number', layer: 0, graphic: 'caldari.1_1' }],
      };

      const result = MedalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate SolarSystemInfo with nested planets array', () => {
      const data = {
        system_id: 30000142,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 0.9459131,
        planets: [
          {
            planet_id: 40009077,
            asteroid_belts: [40009078],
            moons: [40009079, 40009080],
          },
          {
            planet_id: 40009082,
          },
        ],
      };

      const result = SolarSystemInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.planets).toHaveLength(2);
        expect(result.data.planets![0].moons).toEqual([40009079, 40009080]);
        expect(result.data.planets![1].asteroid_belts).toBeUndefined();
      }
    });

    it('should reject SolarSystemInfo with invalid nested planet data', () => {
      const data = {
        system_id: 30000142,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 0.9459131,
        planets: [
          {
            planet_id: 'not-a-number',
          },
        ],
      };

      const result = SolarSystemInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate ConstellationInfo with nested position object', () => {
      const data = {
        constellation_id: 20000020,
        name: 'Kimotoro',
        region_id: 10000002,
        systems: [30000142, 30000143, 30000144],
        position: {
          x: -128947482560.0,
          y: 42989952000.0,
          z: 117962072064.0,
        },
      };

      const result = ConstellationInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.position.x).toBe(-128947482560.0);
      }
    });

    it('should validate TypeInfo with nested dogma_attributes array', () => {
      const data = {
        type_id: 34,
        name: 'Tritanium',
        description: 'The most common ore mineral',
        published: true,
        group_id: 18,
        volume: 0.01,
        dogma_attributes: [
          { attribute_id: 161, value: 0.01 },
          { attribute_id: 162, value: 500 },
        ],
        dogma_effects: [{ effect_id: 1, is_default: true }],
      };

      const result = TypeInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dogma_attributes).toHaveLength(2);
        expect(result.data.dogma_effects).toHaveLength(1);
      }
    });
  });

  describe('Array schema element type validation', () => {
    it('should accept ConstellationInfo with valid systems array of numbers', () => {
      const data = {
        constellation_id: 20000020,
        name: 'Kimotoro',
        region_id: 10000002,
        systems: [30000142, 30000143, 30000144],
        position: { x: 0, y: 0, z: 0 },
      };

      const result = ConstellationInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.systems).toEqual([30000142, 30000143, 30000144]);
      }
    });

    it('should reject ConstellationInfo when systems array contains strings', () => {
      const data = {
        constellation_id: 20000020,
        name: 'Kimotoro',
        region_id: 10000002,
        systems: ['not', 'numbers'],
        position: { x: 0, y: 0, z: 0 },
      };

      const result = ConstellationInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept RegionInfo with valid constellations array', () => {
      const data = {
        region_id: 10000002,
        name: 'The Forge',
        constellations: [20000020, 20000021, 20000022],
      };

      const result = RegionInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.constellations).toHaveLength(3);
      }
    });

    it('should reject RegionInfo when constellations array contains wrong types', () => {
      const data = {
        region_id: 10000002,
        name: 'The Forge',
        constellations: [true, false],
      };

      const result = RegionInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept CharacterAffiliation with valid data', () => {
      const data = {
        character_id: 1689391488,
        corporation_id: 1344654522,
        alliance_id: 99005338,
      };

      const result = CharacterAffiliationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept AllianceIcon with valid icon URLs', () => {
      const data = {
        px64x64: 'https://images.evetech.net/alliances/99005338/logo?size=64',
        px128x128:
          'https://images.evetech.net/alliances/99005338/logo?size=128',
      };

      const result = AllianceIconSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.px64x64).toContain('size=64');
      }
    });

    it('should accept AllianceContactLabel with valid data', () => {
      const data = {
        label_id: 1,
        label_name: 'Friendly',
      };

      const result = AllianceContactLabelSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
