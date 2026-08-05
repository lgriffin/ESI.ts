import { expectType } from 'tsd';
import { z } from 'zod';
import type { InferEndpointResult, CursorResult } from '../../src';

// --- Plain object schema endpoint infers the object type ---

type ObjectEndpoint = {
  path: 'alliances/{allianceId}/';
  method: 'GET';
  requiresAuth: false;
  pathParams: readonly ['allianceId'];
  responseSchema: z.ZodObject<{
    name: z.ZodString;
    ticker: z.ZodString;
  }>;
};

expectType<{ name: string; ticker: string }>(
  null as unknown as InferEndpointResult<ObjectEndpoint>,
);

// --- Array schema endpoint infers the array type ---

type ArrayEndpoint = {
  path: 'markets/prices/';
  method: 'GET';
  requiresAuth: false;
  responseSchema: z.ZodArray<
    z.ZodObject<{
      type_id: z.ZodNumber;
      average_price: z.ZodNumber;
    }>
  >;
};

expectType<{ type_id: number; average_price: number }[]>(
  null as unknown as InferEndpointResult<ArrayEndpoint>,
);

// --- Cursor-paginated endpoint infers CursorResult wrapped type ---

type CursorEndpoint = {
  path: 'latest/items/';
  method: 'GET';
  requiresAuth: false;
  cursorPagination: true;
  responseSchema: z.ZodArray<z.ZodNumber>;
};

expectType<CursorResult<number>>(
  null as unknown as InferEndpointResult<CursorEndpoint>,
);

// --- No responseSchema infers unknown ---

type NoSchemaEndpoint = {
  path: 'characters/{characterId}/mail/';
  method: 'POST';
  requiresAuth: true;
  pathParams: readonly ['characterId'];
  hasBody: true;
};

expectType<unknown>(null as unknown as InferEndpointResult<NoSchemaEndpoint>);

// --- Cursor-paginated endpoint without responseSchema infers CursorResult<unknown> ---

type CursorNoSchemaEndpoint = {
  path: 'items/';
  method: 'GET';
  requiresAuth: false;
  cursorPagination: true;
};

expectType<CursorResult<unknown>>(
  null as unknown as InferEndpointResult<CursorNoSchemaEndpoint>,
);
