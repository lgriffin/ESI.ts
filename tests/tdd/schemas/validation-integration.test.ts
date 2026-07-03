import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { AllianceClient } from '../../../src/clients/AllianceClient';
import { getConfig } from '../../../src/config/configManager';
import { getBody } from '../../../src/core/util/testHelpers';
import {
  EsiValidationError,
  EsiError,
  isValidationError,
} from '../../../src/core/util/error';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('Validation Integration', () => {
  let config: ReturnType<typeof getConfig>;

  beforeEach(() => {
    fetchMock.resetMocks();
    config = getConfig();
  });

  describe('Validation enabled (default)', () => {
    let allianceClient: AllianceClient;

    beforeEach(() => {
      const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken('test-token')
        .build();

      allianceClient = new AllianceClient(client);
    });

    it('should pass through valid responses when validation is enabled', async () => {
      const mockResponse = {
        alliance_id: 99005338,
        name: 'Goonswarm Federation',
        ticker: 'CONDI',
        creator_id: 1689391488,
        creator_corporation_id: 1344654522,
        date_founded: '2010-06-01T00:00:00Z',
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await getBody(() =>
        allianceClient.getAllianceById(99005338),
      );

      expect(result.alliance_id).toBe(99005338);
      expect(result.name).toBe('Goonswarm Federation');
      expect(result.ticker).toBe('CONDI');
    });

    it('should throw EsiValidationError when response has invalid types', async () => {
      const invalidResponse = {
        alliance_id: 'not-a-number',
        name: 'Goonswarm Federation',
        ticker: 'CONDI',
        creator_id: 1689391488,
        creator_corporation_id: 1344654522,
        date_founded: '2010-06-01T00:00:00Z',
      };

      fetchMock.mockResponseOnce(JSON.stringify(invalidResponse));

      await expect(allianceClient.getAllianceById(99005338)).rejects.toThrow(
        EsiValidationError,
      );
    });

    it('should throw EsiValidationError when response is missing required fields', async () => {
      const invalidResponse = {
        alliance_id: 99005338,
        // missing name, ticker, creator_id, creator_corporation_id, date_founded
      };

      fetchMock.mockResponseOnce(JSON.stringify(invalidResponse));

      await expect(allianceClient.getAllianceById(99005338)).rejects.toThrow(
        EsiValidationError,
      );
    });

    it('should preserve extra fields through validation (passthrough)', async () => {
      const responseWithExtra = {
        alliance_id: 99005338,
        name: 'Goonswarm Federation',
        ticker: 'CONDI',
        creator_id: 1689391488,
        creator_corporation_id: 1344654522,
        date_founded: '2010-06-01T00:00:00Z',
        some_future_field: 'new-data',
      };

      fetchMock.mockResponseOnce(JSON.stringify(responseWithExtra));

      const result = await getBody(() =>
        allianceClient.getAllianceById(99005338),
      );

      expect(result.alliance_id).toBe(99005338);
      expect((result as Record<string, unknown>)['some_future_field']).toBe(
        'new-data',
      );
    });
  });

  describe('Validation disabled', () => {
    let allianceClient: AllianceClient;

    beforeEach(() => {
      const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken('test-token')
        .build();

      client.setValidateResponse(false);
      allianceClient = new AllianceClient(client);
    });

    it('should pass through invalid responses without throwing when validation is disabled', async () => {
      const invalidResponse = {
        alliance_id: 'not-a-number',
        name: 12345,
        // missing required fields
      };

      fetchMock.mockResponseOnce(JSON.stringify(invalidResponse));

      const result = await getBody(() =>
        allianceClient.getAllianceById(99005338),
      );

      expect(result.alliance_id).toBe('not-a-number');
      expect(result.name).toBe(12345);
    });

    it('should not throw when response has wrong types and validation is off', async () => {
      const invalidResponse = {
        alliance_id: true,
        name: null,
        ticker: [1, 2, 3],
        creator_id: 'abc',
        creator_corporation_id: {},
        date_founded: 42,
      };

      fetchMock.mockResponseOnce(JSON.stringify(invalidResponse));

      await expect(
        getBody(() => allianceClient.getAllianceById(99005338)),
      ).resolves.toBeDefined();
    });
  });

  describe('EsiValidationError properties', () => {
    it('should have correct url property', () => {
      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/alliances/99005338/',
        { issues: [] },
      );

      expect(error.url).toBe(
        'https://esi.evetech.net/latest/alliances/99005338/',
      );
    });

    it('should have correct validationError property', () => {
      const zodError = {
        issues: [
          {
            code: 'invalid_type',
            expected: 'number',
            received: 'string',
            path: ['alliance_id'],
            message: 'Expected number, received string',
          },
        ],
      };

      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/alliances/99005338/',
        zodError,
      );

      expect(error.validationError).toEqual(zodError);
    });

    it('should have statusCode of 0', () => {
      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/alliances/99005338/',
        { issues: [] },
      );

      expect(error.statusCode).toBe(0);
    });

    it('should have name set to EsiValidationError', () => {
      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/alliances/99005338/',
        { issues: [] },
      );

      expect(error.name).toBe('EsiValidationError');
    });

    it('should include the url in the error message', () => {
      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/alliances/99005338/',
        { issues: [] },
      );

      expect(error.message).toContain(
        'https://esi.evetech.net/latest/alliances/99005338/',
      );
      expect(error.message).toContain('validation failed');
    });

    it('should accept an optional requestId', () => {
      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/alliances/99005338/',
        { issues: [] },
        'req-abc-123',
      );

      expect(error.requestId).toBe('req-abc-123');
    });
  });

  describe('isValidationError type guard', () => {
    it('should return true for EsiValidationError instances', () => {
      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/test',
        { issues: [] },
      );

      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for regular EsiError instances', () => {
      const error = new EsiError(404, 'Not found', 'https://esi.evetech.net/');

      expect(isValidationError(error)).toBe(false);
    });

    it('should return false for plain Error instances', () => {
      const error = new Error('Something went wrong');

      expect(isValidationError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isValidationError(null)).toBe(false);
      expect(isValidationError(undefined)).toBe(false);
      expect(isValidationError('error string')).toBe(false);
      expect(isValidationError(42)).toBe(false);
      expect(isValidationError({})).toBe(false);
    });
  });

  describe('EsiValidationError inheritance', () => {
    it('should be caught by instanceof EsiError', () => {
      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/test',
        { issues: [] },
      );

      expect(error instanceof EsiError).toBe(true);
    });

    it('should be caught by instanceof Error', () => {
      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/test',
        { issues: [] },
      );

      expect(error instanceof Error).toBe(true);
    });

    it('should be catchable in a try-catch targeting EsiError', () => {
      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/test',
        { issues: [] },
      );

      let caught = false;
      try {
        throw error;
      } catch (e) {
        if (e instanceof EsiError) {
          caught = true;
          expect(e.statusCode).toBe(0);
        }
      }

      expect(caught).toBe(true);
    });

    it('should maintain EsiError helper methods', () => {
      const error = new EsiValidationError(
        'https://esi.evetech.net/latest/test',
        { issues: [] },
      );

      expect(error.isTimeout()).toBe(true);
      expect(error.isNotFound()).toBe(false);
      expect(error.isRateLimited()).toBe(false);
      expect(error.isUnauthorized()).toBe(false);
      expect(error.isForbidden()).toBe(false);
      expect(error.isServerError()).toBe(false);
    });
  });
});
