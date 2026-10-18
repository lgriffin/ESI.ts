/**
 * Self-tests for the response-schema emitter (scripts/spec/spec-zod.ts): the
 * module it writes is evaluated with the real zod, so each case checks what a
 * schema accepts and rejects rather than the text it is spelled with.
 */
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

import {
  generateResponseSchemas,
  type SchemaOverrides,
} from '../../../scripts/spec/spec-zod';
import type { OpenApiDocument } from '../../../scripts/spec/spec-generate-core';

const ok = (schema: Record<string, unknown>) => ({
  '200': { content: { 'application/json': { schema } } },
});

let loads = 0;

const fixture: OpenApiDocument = {
  info: { version: '2026-01-01' },
  components: {
    schemas: {
      Thing: {
        type: 'object',
        required: ['id', 'kind'],
        properties: {
          id: { type: 'integer' },
          kind: { type: 'string', enum: ['a', 'b'] },
          note: { type: ['string', 'null'] },
          parent: { $ref: '#/components/schemas/Thing' },
          ship_type_id: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/things/{id}': {
      get: {
        operationId: 'GetThing',
        responses: ok({ $ref: '#/components/schemas/Thing' }),
      },
      delete: { operationId: 'DeleteThing', responses: { '204': {} } },
    },
    '/things': {
      get: {
        operationId: 'GetThings',
        responses: ok({ type: 'array', items: { type: 'integer' } }),
      },
    },
    '/tags': {
      get: {
        operationId: 'GetTags',
        responses: ok({
          type: 'object',
          additionalProperties: { type: 'boolean' },
        }),
      },
    },
  },
};

/**
 * Writes the emitted module beside this test so Jest compiles it and resolves
 * its `zod` import like any other source file, then removes it.
 */
function load(
  overrides: SchemaOverrides = {},
  doc: OpenApiDocument = fixture,
): Record<string, z.ZodType> {
  const { source } = generateResponseSchemas(doc, 'fixture.json', overrides);
  const file = path.join(
    __dirname,
    `.zod-fixture-${process.pid}-${++loads}.ts`,
  );
  fs.writeFileSync(file, source);
  try {
    return (require(file) as { responseSchemas: Record<string, z.ZodType> })
      .responseSchemas;
  } finally {
    fs.rmSync(file);
  }
}

describe('generateResponseSchemas', () => {
  const schemas = load();
  const thing = { id: 1, kind: 'a' };

  it('emits a schema per operation with a JSON success body, and none for a 204', () => {
    expect(Object.keys(schemas).sort()).toEqual([
      'GetTags',
      'GetThing',
      'GetThings',
    ]);
  });

  it('requires the required fields and allows the others to be missing', () => {
    expect(schemas.GetThing!.safeParse(thing).success).toBe(true);
    expect(schemas.GetThing!.safeParse({ kind: 'a' }).success).toBe(false);
  });

  it('keeps fields the document does not name', () => {
    const parsed = schemas.GetThing!.safeParse({ ...thing, extra: 1 });
    expect(parsed.success && parsed.data).toEqual({ ...thing, extra: 1 });
  });

  it('accepts a string enum member the document does not list yet', () => {
    expect(schemas.GetThing!.safeParse({ ...thing, kind: 'c' }).success).toBe(
      true,
    );
  });

  it('follows a type list and a self-reference', () => {
    expect(
      schemas.GetThing!.safeParse({ ...thing, note: null, parent: thing })
        .success,
    ).toBe(true);
    expect(
      schemas.GetThing!.safeParse({ ...thing, parent: { id: 'x', kind: 'a' } })
        .success,
    ).toBe(false);
  });

  it('checks array items and record values', () => {
    expect(schemas.GetThings!.safeParse([1, 2]).success).toBe(true);
    expect(schemas.GetThings!.safeParse(['1']).success).toBe(false);
    expect(schemas.GetTags!.safeParse({ a: true }).success).toBe(true);
    expect(schemas.GetTags!.safeParse({ a: 1 }).success).toBe(false);
  });

  it('accepts null only where an override names the field', () => {
    const body = { ...thing, ship_type_id: null };
    expect(schemas.GetThing!.safeParse(body).success).toBe(false);
    const overridden = load({ Thing: { nullable: ['ship_type_id'] } });
    expect(overridden.GetThing!.safeParse(body).success).toBe(true);
  });

  it('applies an override inside its own component, not to a component it references', () => {
    // Outer is emitted first (paths sort) and reaches Shared for the first
    // time: Shared is memoised, so a leaked override would widen GetShared too.
    const doc: OpenApiDocument = {
      info: { version: '2026-01-01' },
      components: {
        schemas: {
          Shared: {
            type: 'object',
            required: ['ship_type_id'],
            properties: { ship_type_id: { type: 'integer' } },
          },
          Outer: {
            type: 'object',
            required: ['ship_type_id', 'inline', 'shared'],
            properties: {
              ship_type_id: { type: 'integer' },
              inline: {
                type: 'object',
                required: ['ship_type_id'],
                properties: { ship_type_id: { type: 'integer' } },
              },
              shared: { $ref: '#/components/schemas/Shared' },
            },
          },
        },
      },
      paths: {
        '/a-outer': {
          get: {
            operationId: 'GetOuter',
            responses: ok({ $ref: '#/components/schemas/Outer' }),
          },
        },
        '/b-shared': {
          get: {
            operationId: 'GetShared',
            responses: ok({ $ref: '#/components/schemas/Shared' }),
          },
        },
      },
    };
    const out = load({ Outer: { nullable: ['ship_type_id'] } }, doc);
    const shared = { ship_type_id: 1 };
    expect(
      out.GetOuter!.safeParse({
        ship_type_id: null,
        inline: { ship_type_id: null },
        shared,
      }).success,
    ).toBe(true);
    expect(
      out.GetOuter!.safeParse({
        ship_type_id: 1,
        inline: { ship_type_id: 1 },
        shared: { ship_type_id: null },
      }).success,
    ).toBe(false);
    expect(out.GetShared!.safeParse({ ship_type_id: null }).success).toBe(
      false,
    );
  });

  it('fails when an override names a component the document lacks', () => {
    expect(() =>
      generateResponseSchemas(fixture, 'fixture.json', {
        Missing: { nullable: ['ship_type_id'] },
      }),
    ).toThrow(/override names missing schema "Missing"/);
  });

  it('exports each baseline as <operationId>Schema, so a reserved-word operationId still declares', () => {
    const doc: OpenApiDocument = {
      info: { version: '2026-01-01' },
      paths: {
        '/default': {
          get: { operationId: 'default', responses: ok({ type: 'integer' }) },
        },
      },
    };
    const { baselineSource } = generateResponseSchemas(doc, 'fixture.json');
    expect(baselineSource).toContain('export const defaultSchema: z.ZodType');
    expect(baselineSource).not.toMatch(/export const default\b/);
  });

  it('fails when a baseline name collides with a component schema', () => {
    const doc: OpenApiDocument = {
      info: { version: '2026-01-01' },
      components: { schemas: { GetThing: { type: 'integer' } } },
      paths: {
        '/thing': {
          get: {
            operationId: 'GetThing',
            responses: ok({ $ref: '#/components/schemas/GetThing' }),
          },
        },
      },
    };
    expect(() => generateResponseSchemas(doc, 'fixture.json')).toThrow(
      /baseline GetThingSchema for operationId "GetThing" collides/,
    );
  });
});
