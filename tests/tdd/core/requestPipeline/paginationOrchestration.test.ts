import {
  handleCursorPagination,
  handleOffsetPagination,
} from '../../../../src/core/requestPipeline/paginationOrchestration';
import { ApiClient } from '../../../../src/core/ApiClient';
import { RateLimiter } from '../../../../src/core/rateLimiter/RateLimiter';
import { EsiError } from '../../../../src/core/util/error';
import { CircuitOpenError } from '../../../../src/core/circuitBreaker/CircuitBreaker';
import { ParsedHeaders } from '../../../../src/core/util/headersUtil';
import { ICache } from '../../../../src/core/cache/ICache';

const BASE_URL = 'https://esi.evetech.net';

describe('requestPipeline/paginationOrchestration', () => {
  describe('handleCursorPagination', () => {
    it('should return null when no cursor pagination headers present', () => {
      const parsed = {
        raw: {},
        hasCursorPagination: false,
        cursorBefore: null,
        cursorAfter: null,
      } as unknown as ParsedHeaders;

      expect(handleCursorPagination(parsed, [{ id: 1 }])).toBeNull();
    });

    it('should return response with cursors when cursor headers are present', () => {
      const parsed = {
        raw: { 'x-cursor-before': 'b1', 'x-cursor-after': 'a1' },
        hasCursorPagination: true,
        cursorBefore: 'b1',
        cursorAfter: 'a1',
      } as unknown as ParsedHeaders;

      const result = handleCursorPagination(parsed, [{ id: 1 }]);
      expect(result).not.toBeNull();
      expect(result!.status).toBe(200);
      expect(result!.cursors).toEqual({ before: 'b1', after: 'a1' });
      expect(result!.body).toEqual([{ id: 1 }]);
    });
  });

  describe('handleOffsetPagination', () => {
    let client: ApiClient;
    const resolveCache = (_c: ApiClient): ICache | null => null;

    beforeEach(() => {
      const rateLimiter = new RateLimiter();
      rateLimiter.setTestMode(true);
      client = new ApiClient('test', BASE_URL);
      client.setRateLimiter(rateLimiter);
      client.setRetryConfig({ maxRetries: 0, baseDelayMs: 1, maxDelayMs: 10 });
    });

    it('should return data directly when totalPages <= 1', async () => {
      const parsed = {
        raw: {},
        xPages: 1,
      } as unknown as ParsedHeaders;
      const pageFetch = jest.fn();

      const result = await handleOffsetPagination(
        client,
        'alliances',
        'GET',
        false,
        parsed,
        [{ id: 1 }],
        undefined,
        `${BASE_URL}/alliances`,
        true,
        pageFetch,
        resolveCache,
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual([{ id: 1 }]);
      expect(pageFetch).not.toHaveBeenCalled();
    });

    it('should wrap non-array data in an array for first page', async () => {
      const parsed = {
        raw: {},
        xPages: 2,
      } as unknown as ParsedHeaders;
      const pageFetch = jest.fn().mockResolvedValue([{ id: 2 }]);

      const result = await handleOffsetPagination(
        client,
        'alliances',
        'GET',
        false,
        parsed,
        { id: 1 } as unknown,
        undefined,
        `${BASE_URL}/alliances`,
        true,
        pageFetch,
        resolveCache,
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should re-throw EsiError from pagination failure', async () => {
      const parsed = {
        raw: {},
        xPages: 3,
      } as unknown as ParsedHeaders;
      const esiErr = new EsiError(502, 'Bad Gateway');
      const pageFetch = jest.fn().mockRejectedValue(esiErr);

      await expect(
        handleOffsetPagination(
          client,
          'alliances',
          'GET',
          false,
          parsed,
          [{ id: 1 }],
          undefined,
          `${BASE_URL}/alliances`,
          true,
          pageFetch,
          resolveCache,
        ),
      ).rejects.toThrow(esiErr);
    });

    it('should re-throw CircuitOpenError from pagination failure', async () => {
      const parsed = {
        raw: {},
        xPages: 3,
      } as unknown as ParsedHeaders;
      const cbErr = new CircuitOpenError('alliances', 5, 30000);
      const pageFetch = jest.fn().mockRejectedValue(cbErr);

      await expect(
        handleOffsetPagination(
          client,
          'alliances',
          'GET',
          false,
          parsed,
          [{ id: 1 }],
          undefined,
          `${BASE_URL}/alliances`,
          true,
          pageFetch,
          resolveCache,
        ),
      ).rejects.toThrow(CircuitOpenError);
    });

    it('should stringify non-Error pagination failures', async () => {
      const parsed = {
        raw: {},
        xPages: 3,
      } as unknown as ParsedHeaders;
      const pageFetch = jest.fn().mockRejectedValue('string error');

      await expect(
        handleOffsetPagination(
          client,
          'alliances',
          'GET',
          false,
          parsed,
          [{ id: 1 }],
          undefined,
          `${BASE_URL}/alliances`,
          true,
          pageFetch,
          resolveCache,
        ),
      ).rejects.toThrow('Pagination incomplete');
    });

    it('should wrap generic Error as PAGINATION_INCOMPLETE', async () => {
      const parsed = {
        raw: {},
        xPages: 3,
      } as unknown as ParsedHeaders;
      const pageFetch = jest
        .fn()
        .mockRejectedValue(new Error('network failure'));

      await expect(
        handleOffsetPagination(
          client,
          'alliances',
          'GET',
          false,
          parsed,
          [{ id: 1 }],
          undefined,
          `${BASE_URL}/alliances`,
          true,
          pageFetch,
          resolveCache,
        ),
      ).rejects.toThrow('Pagination incomplete');
    });
  });
});
