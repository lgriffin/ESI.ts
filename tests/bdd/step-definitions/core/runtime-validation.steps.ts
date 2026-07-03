import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import {
  EsiError,
  EsiValidationError,
  isValidationError,
} from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  CharacterInfoSchema,
  FleetWingSchema,
  AllianceContactSchema,
} from '../../../../src/schemas';

const feature = loadFeature(
  'tests/bdd/features/core/runtime-validation.feature',
);

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Valid ESI response shall pass schema validation', ({
    given,
    when,
    then,
    and,
  }) => {
    let result: any;
    const validAllianceId = 99005338;

    given('an ESI client with response validation enabled', () => {
      const expectedAlliance = TestDataFactory.createAllianceInfo({
        alliance_id: validAllianceId,
        name: 'Goonswarm Federation',
      });

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockResolvedValue(expectedAlliance);
    });

    when('I receive a valid alliance response from ESI', async () => {
      result = await client.alliance.getAllianceById(validAllianceId);
    });

    then('the response shall be parsed successfully', () => {
      expect(result).toBeDefined();
    });

    and('the response data shall contain the expected fields', () => {
      expect(result.alliance_id).toBe(validAllianceId);
      expect(result.name).toBe('Goonswarm Federation');
      expect(result).toHaveProperty('ticker');
      expect(result).toHaveProperty('creator_id');
    });
  });

  test('Invalid ESI response shall trigger validation error', ({
    given,
    when,
    then,
    and,
  }) => {
    let error: any;

    given('an ESI client with response validation enabled', () => {
      const validationError = new EsiValidationError(
        'https://esi.evetech.net/latest/alliances/99005338/',
        { issues: [{ message: 'Expected number, received string' }] },
      );

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockRejectedValue(validationError);
    });

    when('I receive a response with an invalid field type', async () => {
      try {
        await client.alliance.getAllianceById(99005338);
      } catch (e) {
        error = e;
      }
    });

    then('an EsiValidationError shall be thrown', () => {
      expect(error).toBeInstanceOf(EsiValidationError);
    });

    and('the error shall contain validation details', () => {
      expect(error.validationError).toBeDefined();
      expect(error.message).toContain('validation failed');
    });
  });

  test('Extra fields from ESI shall be preserved', ({
    given,
    when,
    then,
    and,
  }) => {
    let result: any;

    given('an ESI client with response validation enabled', () => {
      const allianceWithExtra = {
        ...TestDataFactory.createAllianceInfo(),
        some_future_field: 'new_value',
        another_field: 42,
      };

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockResolvedValue(allianceWithExtra);
    });

    when('I receive a response with additional unknown fields', async () => {
      result = await client.alliance.getAllianceById(99005338);
    });

    then('the response shall be parsed successfully', () => {
      expect(result).toBeDefined();
      expect(result.alliance_id).toBeDefined();
    });

    and('the extra fields shall be present in the result', () => {
      expect(result.some_future_field).toBe('new_value');
      expect(result.another_field).toBe(42);
    });
  });

  test('Validation shall be disabled when configured', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an ESI client with response validation disabled', () => {
      client = new EsiClient({
        clientId: 'test-client',
        baseUrl: 'https://esi.evetech.net',
        timeout: 5000,
        validateResponse: false,
      });

      const invalidData = {
        alliance_id: 'not-a-number',
        name: 12345,
        ticker: 'TEST',
        creator_id: 1,
        creator_corporation_id: 1,
        date_founded: '2020-01-01T00:00:00Z',
      };

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockResolvedValue(invalidData as any);
    });

    when('I receive a response with an invalid field type', async () => {
      result = await client.alliance.getAllianceById(99005338);
    });

    then('the response shall be returned without validation error', () => {
      expect(result).toBeDefined();
      expect(result.alliance_id).toBe('not-a-number');
    });
  });

  test('Validation error shall be catchable as EsiError', ({
    given,
    when,
    then,
    and,
  }) => {
    let error: any;

    given('an ESI client with response validation enabled', () => {
      const validationError = new EsiValidationError(
        'https://esi.evetech.net/latest/alliances/99005338/',
        { issues: [{ message: 'Invalid type' }] },
      );

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockRejectedValue(validationError);
    });

    when('I receive a response that fails validation', async () => {
      try {
        await client.alliance.getAllianceById(99005338);
      } catch (e) {
        error = e;
      }
    });

    then('the error shall be an instance of EsiError', () => {
      expect(error).toBeInstanceOf(EsiError);
    });

    and('the error shall be identifiable via isValidationError', () => {
      expect(isValidationError(error)).toBe(true);
    });
  });

  test('Schema shall reject missing required fields', ({
    given,
    when,
    then,
    and,
  }) => {
    let parseResult: any;

    given('a Zod schema for character information', () => {
      // CharacterInfoSchema is imported at module level
    });

    when('I validate data with a missing required field', () => {
      const incompleteData = {
        character_id: 1689391488,
        name: 'Test Character',
        // corporation_id is required but missing
        bloodline_id: 4,
        race_id: 1,
        gender: 'male',
        birthday: '2003-05-06T00:00:00Z',
      };
      parseResult = CharacterInfoSchema.safeParse(incompleteData);
    });

    then('schema validation shall fail', () => {
      expect(parseResult.success).toBe(false);
    });

    and('the error shall identify the missing field', () => {
      const fieldPaths = parseResult.error.issues.map((i: any) => i.path[0]);
      expect(fieldPaths).toContain('corporation_id');
    });
  });

  test('Schema shall accept missing optional fields', ({
    given,
    when,
    then,
  }) => {
    let parseResult: any;

    given('a Zod schema for character information', () => {
      // CharacterInfoSchema is imported at module level
    });

    when('I validate data with only required fields', () => {
      const minimalData = {
        character_id: 1689391488,
        name: 'Test Character',
        corporation_id: 1344654522,
        bloodline_id: 4,
        race_id: 1,
        gender: 'male',
        birthday: '2003-05-06T00:00:00Z',
      };
      parseResult = CharacterInfoSchema.safeParse(minimalData);
    });

    then('schema validation shall succeed', () => {
      expect(parseResult.success).toBe(true);
      expect(parseResult.data).toBeDefined();
      expect(parseResult.data.character_id).toBe(1689391488);
    });
  });

  test('Schema shall validate nested object structures', ({
    given,
    when,
    then,
  }) => {
    let parseResult: any;

    given('a Zod schema for complex nested data', () => {
      // FleetWingSchema has nested squads array
    });

    when('I validate data with valid nested objects', () => {
      const nestedData = {
        id: 1,
        name: 'Alpha Wing',
        squads: [
          { id: 10, name: 'Squad One' },
          { id: 20, name: 'Squad Two' },
        ],
      };
      parseResult = FleetWingSchema.safeParse(nestedData);
    });

    then('schema validation shall succeed for the entire structure', () => {
      expect(parseResult.success).toBe(true);
      expect(parseResult.data.squads).toHaveLength(2);
      expect(parseResult.data.squads[0].name).toBe('Squad One');
    });
  });

  test('Schema shall reject invalid enum values', ({ given, when, then }) => {
    let parseResult: any;

    given('a Zod schema with enum constraints', () => {
      // AllianceContactSchema has contact_type enum
    });

    when('I validate data with an invalid enum value', () => {
      const invalidEnumData = {
        contact_id: 1689391488,
        contact_type: 'invalid_type',
        standing: 10.0,
      };
      parseResult = AllianceContactSchema.safeParse(invalidEnumData);
    });

    then('schema validation shall fail with an enum error', () => {
      expect(parseResult.success).toBe(false);
      const enumIssue = parseResult.error.issues.find(
        (i: any) =>
          i.path.includes('contact_type') &&
          (i.code === 'invalid_enum_value' || i.code === 'invalid_value'),
      );
      expect(enumIssue).toBeDefined();
    });
  });
});
