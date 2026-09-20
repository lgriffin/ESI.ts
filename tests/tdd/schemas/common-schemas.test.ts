import { z } from 'zod';
import {
  RateLimitMetaSchema,
  EsiResponseMetaSchema,
  esiResponse,
} from '../../../src/schemas/common';

describe('Common Schemas', () => {
  describe('RateLimitMetaSchema', () => {
    it('should validate a complete rate limit meta object', () => {
      const data = {
        remaining: 95,
        limit: 100,
        used: 5,
        group: 'esi-global',
      };

      const result = RateLimitMetaSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.remaining).toBe(95);
        expect(result.data.limit).toBe(100);
        expect(result.data.used).toBe(5);
        expect(result.data.group).toBe('esi-global');
      }
    });

    it('should accept null for group field', () => {
      const data = {
        remaining: 100,
        limit: 100,
        used: 0,
        group: null,
      };

      const result = RateLimitMetaSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.group).toBeNull();
      }
    });

    it('should reject when remaining is a string', () => {
      const data = {
        remaining: '95',
        limit: 100,
        used: 5,
        group: 'esi-global',
      };

      const result = RateLimitMetaSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject when limit is missing', () => {
      const data = {
        remaining: 95,
        used: 5,
        group: 'esi-global',
      };

      const result = RateLimitMetaSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject when group is undefined instead of null', () => {
      const data = {
        remaining: 95,
        limit: 100,
        used: 5,
      };

      const result = RateLimitMetaSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('EsiResponseMetaSchema', () => {
    it('should validate with all fields present', () => {
      const data = {
        headers: {
          'content-type': 'application/json',
          'x-esi-request-id': 'abc-123',
        },
        fromCache: false,
        stale: false,
        cacheHitType: 'etag-304' as const,
        warning: {
          code: 199,
          message: 'Deprecated endpoint',
        },
        requestId: 'abc-123',
        date: '2023-01-15T12:00:00Z',
        contentLanguage: 'en',
        rateLimit: {
          remaining: 95,
          limit: 100,
          used: 5,
          group: 'esi-global',
        },
        responseTimeMs: 150,
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headers['content-type']).toBe('application/json');
        expect(result.data.fromCache).toBe(false);
        expect(result.data.stale).toBe(false);
        expect(result.data.cacheHitType).toBe('etag-304');
        expect(result.data.warning).toEqual({
          code: 199,
          message: 'Deprecated endpoint',
        });
        expect(result.data.requestId).toBe('abc-123');
        expect(result.data.date).toBe('2023-01-15T12:00:00Z');
        expect(result.data.contentLanguage).toBe('en');
        expect(result.data.rateLimit!.remaining).toBe(95);
        expect(result.data.responseTimeMs).toBe(150);
      }
    });

    it('should validate with only required fields', () => {
      const data = {
        headers: {},
        fromCache: true,
        stale: false,
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headers).toEqual({});
        expect(result.data.fromCache).toBe(true);
        expect(result.data.stale).toBe(false);
        expect(result.data.cacheHitType).toBeUndefined();
        expect(result.data.warning).toBeUndefined();
        expect(result.data.requestId).toBeUndefined();
        expect(result.data.date).toBeUndefined();
        expect(result.data.contentLanguage).toBeUndefined();
        expect(result.data.rateLimit).toBeUndefined();
        expect(result.data.responseTimeMs).toBeUndefined();
      }
    });

    it('should reject when headers is missing', () => {
      const data = {
        fromCache: false,
        stale: false,
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject when fromCache is missing', () => {
      const data = {
        headers: {},
        stale: false,
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject when stale is missing', () => {
      const data = {
        headers: {},
        fromCache: false,
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should preserve extra fields via passthrough', () => {
      const data = {
        headers: { 'x-custom': 'value' },
        fromCache: false,
        stale: false,
        customMetaField: 'custom-value',
        anotherExtra: 42,
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = result.data as Record<string, unknown>;
        expect(parsed['customMetaField']).toBe('custom-value');
        expect(parsed['anotherExtra']).toBe(42);
      }
    });
  });

  describe('cacheHitType enum validation', () => {
    it('should accept spec-ttl', () => {
      const data = {
        headers: {},
        fromCache: true,
        stale: false,
        cacheHitType: 'spec-ttl',
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cacheHitType).toBe('spec-ttl');
      }
    });

    it('should accept etag-304', () => {
      const data = {
        headers: {},
        fromCache: true,
        stale: false,
        cacheHitType: 'etag-304',
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cacheHitType).toBe('etag-304');
      }
    });

    it('should accept stale-on-error', () => {
      const data = {
        headers: {},
        fromCache: true,
        stale: true,
        cacheHitType: 'stale-on-error',
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cacheHitType).toBe('stale-on-error');
      }
    });

    it('should reject invalid cacheHitType values', () => {
      const data = {
        headers: {},
        fromCache: true,
        stale: false,
        cacheHitType: 'memory-hit',
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept omitted cacheHitType (optional)', () => {
      const data = {
        headers: {},
        fromCache: false,
        stale: false,
      };

      const result = EsiResponseMetaSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cacheHitType).toBeUndefined();
      }
    });
  });

  describe('esiResponse helper', () => {
    it('should create a composite schema with data and meta', () => {
      const dataSchema = z.object({ id: z.number(), name: z.string() });
      const responseSchema = esiResponse(dataSchema);

      const data = {
        data: { id: 1, name: 'Test' },
        meta: {
          headers: {},
          fromCache: false,
          stale: false,
        },
      };

      const result = responseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.id).toBe(1);
        expect(result.data.data.name).toBe('Test');
        expect(result.data.meta.fromCache).toBe(false);
      }
    });

    it('should reject when data does not match the provided schema', () => {
      const dataSchema = z.object({ id: z.number(), name: z.string() });
      const responseSchema = esiResponse(dataSchema);

      const data = {
        data: { id: 'not-a-number', name: 'Test' },
        meta: {
          headers: {},
          fromCache: false,
          stale: false,
        },
      };

      const result = responseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject when meta is missing', () => {
      const dataSchema = z.object({ id: z.number() });
      const responseSchema = esiResponse(dataSchema);

      const data = {
        data: { id: 1 },
      };

      const result = responseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject when data is missing', () => {
      const dataSchema = z.object({ id: z.number() });
      const responseSchema = esiResponse(dataSchema);

      const data = {
        meta: {
          headers: {},
          fromCache: false,
          stale: false,
        },
      };

      const result = responseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should work with array data schemas', () => {
      const dataSchema = z.array(z.number());
      const responseSchema = esiResponse(dataSchema);

      const data = {
        data: [1, 2, 3, 4, 5],
        meta: {
          headers: {},
          fromCache: false,
          stale: false,
        },
      };

      const result = responseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it('should work with a full meta object including optional fields', () => {
      const dataSchema = z.object({ value: z.string() });
      const responseSchema = esiResponse(dataSchema);

      const data = {
        data: { value: 'hello' },
        meta: {
          headers: { 'content-type': 'application/json' },
          fromCache: true,
          stale: false,
          cacheHitType: 'spec-ttl',
          responseTimeMs: 42,
          rateLimit: {
            remaining: 99,
            limit: 100,
            used: 1,
            group: null,
          },
        },
      };

      const result = responseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.value).toBe('hello');
        expect(result.data.meta.cacheHitType).toBe('spec-ttl');
        expect(result.data.meta.rateLimit!.remaining).toBe(99);
      }
    });
  });
});
