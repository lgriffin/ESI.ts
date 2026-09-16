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
import {
  createSeamClient,
  lastRequest,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature(
  'tests/bdd/features/core/0053-runtime-validation.feature',
);

const allianceId = 99005338;
const alliancePath = `/alliances/${allianceId}/`;

/**
 * An alliance body whose alliance_id and name contradict AllianceInfoSchema
 * (number and string respectively).
 */
const mistypedAlliance = {
  alliance_id: 'not-a-number',
  name: 12345,
  ticker: 'TEST',
  creator_id: 1,
  creator_corporation_id: 1,
  date_founded: '2020-01-01T00:00:00Z',
};

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Valid alliance response returns the declared fields', ({
    given,
    when,
    then,
    and,
  }) => {
    let result: any;
    const body = TestDataFactory.createAllianceInfo({
      alliance_id: allianceId,
      name: 'Goonswarm Federation',
      ticker: 'CONDI',
      creator_id: 1689391488,
      creator_corporation_id: 1344654522,
      date_founded: '2010-06-01T00:00:00Z',
    });

    given('an ESI client with response validation enabled', () => {
      queueResponse({ match: alliancePath, body });
    });

    when('I receive a valid alliance response from ESI', async () => {
      result = await client.alliance.getAllianceById(allianceId);
    });

    then('the response shall be parsed successfully', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().url.pathname).toContain(alliancePath);
      expect(result).toBeDefined();
    });

    and('the response data shall contain the expected fields', () => {
      expect(result).toEqual(body);
      expect(result.alliance_id).toBe(allianceId);
      expect(result.name).toBe('Goonswarm Federation');
      expect(result.ticker).toBe('CONDI');
      expect(result.creator_id).toBe(1689391488);
      expect(result.creator_corporation_id).toBe(1344654522);
      expect(result.date_founded).toBe('2010-06-01T00:00:00Z');
    });
  });

  test('Response with a mistyped field rejects with the Zod issue list', ({
    given,
    when,
    then,
    and,
  }) => {
    let error: any;

    given('an ESI client with response validation enabled', () => {
      // Parsing happens in createClient after the retry loop has returned, so
      // a body that fails the schema is fetched once and not retried.
      queueResponse({ match: alliancePath, body: mistypedAlliance });
    });

    when('I receive a response with an invalid field type', async () => {
      try {
        await client.alliance.getAllianceById(allianceId);
      } catch (e) {
        error = e;
      }
    });

    then('an EsiValidationError shall be thrown', () => {
      expect(error).toBeInstanceOf(EsiValidationError);
      expect(sentRequests()).toHaveLength(1);
    });

    and('the error shall contain validation details', () => {
      expect(error.message).toContain('validation failed');
      const issues: any[] = error.validationError.issues;
      const paths = issues.map((issue) => issue.path[0]);
      expect(paths).toEqual(expect.arrayContaining(['alliance_id', 'name']));
      expect(issues.every((issue) => issue.code === 'invalid_type')).toBe(true);
    });
  });

  test('Unknown fields added by ESI survive parsing', ({
    given,
    when,
    then,
    and,
  }) => {
    let result: any;

    given('an ESI client with response validation enabled', () => {
      queueResponse({
        match: alliancePath,
        body: {
          ...TestDataFactory.createAllianceInfo({ alliance_id: allianceId }),
          some_future_field: 'new_value',
          another_field: 42,
        },
      });
    });

    when('I receive a response with additional unknown fields', async () => {
      result = await client.alliance.getAllianceById(allianceId);
    });

    then('the response shall be parsed successfully', () => {
      expect(result.alliance_id).toBe(allianceId);
      expect(result.name).toBe('Goonswarm Federation');
    });

    and('the extra fields shall be present in the result', () => {
      expect(result.some_future_field).toBe('new_value');
      expect(result.another_field).toBe(42);
    });
  });

  test('Client with validateResponse disabled returns a mistyped field untouched', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an ESI client with response validation disabled', () => {
      client = createSeamClient({ validateResponse: false });
      queueResponse({ match: alliancePath, body: mistypedAlliance });
    });

    when('I receive a response with an invalid field type', async () => {
      result = await client.alliance.getAllianceById(allianceId);
    });

    then('the response shall be returned without validation error', () => {
      // One request: nothing failed, so nothing was retried.
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual(mistypedAlliance);
    });
  });

  test('Validation error is catchable as EsiError and narrowed by the guard', ({
    given,
    when,
    then,
    and,
  }) => {
    let error: unknown;

    given('an ESI client with response validation enabled', () => {
      queueResponse({ match: alliancePath, body: mistypedAlliance });
    });

    when('I receive a response that fails validation', async () => {
      try {
        await client.alliance.getAllianceById(allianceId);
      } catch (e) {
        error = e;
      }
    });

    then('the error shall be an instance of EsiError', () => {
      expect(error).toBeInstanceOf(EsiError);
    });

    and('the error shall be identifiable via isValidationError', () => {
      expect(isValidationError(error)).toBe(true);
      if (!isValidationError(error)) return;
      expect(error.direction).toBe('response');
      expect(error.statusCode).toBe(0);
    });
  });

  test('Character info missing corporation_id names that field in the issue path', ({
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

  test('Character info with only the required fields parses', ({
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

  test('Fleet wing with two nested squads parses both squads', ({
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

  test('Alliance contact with an unrecognised contact_type keeps the raw value', ({
    given,
    when,
    then,
  }) => {
    let parseResult: any;

    given('a Zod schema with enum constraints', () => {
      // AllianceContactSchema has contact_type enum via esiEnum()
    });

    when('I validate data with an unknown enum value', () => {
      const unknownEnumData = {
        contact_id: 1689391488,
        contact_type: 'future_ccp_type',
        standing: 10.0,
      };
      parseResult = AllianceContactSchema.safeParse(unknownEnumData);
    });

    then(
      'schema validation shall succeed with the unknown value preserved',
      () => {
        expect(parseResult.success).toBe(true);
        expect(parseResult.data.contact_type).toBe('future_ccp_type');
      },
    );
  });
});
