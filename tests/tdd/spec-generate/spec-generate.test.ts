/**
 * Self-tests for the operation emitter (scripts/spec-generate-core.ts) and the
 * coverage gate (scripts/spec-coverage-core.ts).
 *
 * The fixture below is a small OpenAPI document with one operation per shape
 * the emitter has to handle. The snapshot pins the whole output; the named
 * cases say why each shape matters, so a snapshot update that breaks one of
 * them still fails with a readable message.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

import {
  functionNameFor,
  generateOperations,
  SPEC_PATH,
  SpecGenerateError,
  type OpenApiDocument,
} from '../../../scripts/spec-generate-core';
import {
  checkCoverage,
  metasOf,
  type MetaLike,
} from '../../../scripts/spec-coverage-core';
import type {
  OperationMeta,
  OperationRequest,
  OperationTransport,
} from '../../../src/core/ports/OperationTransport';
import * as committed from '../../../src/generated/operations.generated';

const ROOT = path.resolve(__dirname, '../../..');

const header = { $ref: '#/components/parameters/CompatibilityDate' };

const fixture: OpenApiDocument = {
  info: { version: '2026-01-01' },
  components: {
    parameters: {
      CompatibilityDate: {
        in: 'header',
        name: 'X-Compatibility-Date',
        schema: { type: 'string' },
      },
    },
    schemas: {
      CharacterID: { type: 'integer', format: 'int64' },
      Order: {
        type: 'object',
        description: 'A market order */ with a comment terminator',
        required: ['order_id', 'is_buy_order'],
        properties: {
          order_id: { type: 'integer' },
          is_buy_order: { type: 'boolean' },
          range: { type: 'string', enum: ['station', 'region'] },
          'odd-key': { type: 'string' },
        },
      },
      Orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
      Node: {
        type: 'object',
        properties: {
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/Node' },
          },
        },
      },
    },
  },
  paths: {
    '/status': {
      get: {
        operationId: 'GetStatus',
        summary: 'Server status',
        parameters: [header],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['players'],
                  properties: {
                    players: { type: 'integer' },
                    labels: {
                      type: 'object',
                      additionalProperties: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/markets/{region_id}/orders': {
      get: {
        operationId: 'GetMarketsRegionIdOrders',
        summary: 'Orders in a region',
        parameters: [
          {
            in: 'path',
            name: 'region_id',
            required: true,
            schema: { type: 'integer' },
          },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          {
            in: 'query',
            name: 'order_type',
            required: true,
            schema: { type: 'string', enum: ['buy', 'sell', 'all'] },
          },
          header,
        ],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Orders' },
              },
            },
          },
        },
      },
    },
    '/corporations/{corporation_id}/projects': {
      get: {
        operationId: 'GetCorporationsCorporationIdProjects',
        parameters: [
          {
            in: 'path',
            name: 'corporation_id',
            required: true,
            schema: { type: 'integer' },
          },
          { in: 'query', name: 'after', schema: { type: 'string' } },
          { in: 'query', name: 'before', schema: { type: 'string' } },
        ],
        security: [{ OAuth2: ['esi-corporations.read_projects.v1'] }],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Node' },
              },
            },
          },
        },
      },
    },
    '/characters/{character_id}/contacts': {
      post: {
        operationId: 'PostCharactersCharacterIdContacts',
        deprecated: true,
        parameters: [
          {
            in: 'path',
            name: 'character_id',
            required: true,
            schema: { $ref: '#/components/schemas/CharacterID' },
          },
          {
            in: 'query',
            name: 'label_ids',
            schema: { type: 'array', items: { type: 'integer' } },
          },
        ],
        security: [
          { OAuth2: ['esi-characters.write_contacts.v1'] },
          { OAuth2: ['esi-characters.write_contacts.v1'] },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'array', items: { type: 'integer' } },
            },
          },
        },
        responses: {
          '201': {
            content: {
              'application/json': {
                schema: { type: 'array', items: { type: 'integer' } },
              },
            },
          },
          default: {},
        },
      },
      delete: {
        operationId: 'DeleteCharactersCharacterIdContacts',
        parameters: [
          {
            in: 'path',
            name: 'character_id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: { '204': { description: 'Deleted' } },
      },
    },
  },
};

const options = { specPath: 'fixture.json', transportImport: './transport' };

/**
 * Prettier 3 is ESM-only inside Jest's CommonJS sandbox, so the output is
 * formatted by the CLI in a child process, as `npm run spec:generate` does.
 */
function emit(doc: OpenApiDocument = fixture): string {
  return execFileSync(
    process.execPath,
    [
      require.resolve('prettier/bin/prettier.cjs'),
      '--stdin-filepath',
      path.join(ROOT, 'src/generated/fixture.ts'),
    ],
    { input: generateOperations(doc, options).source, encoding: 'utf8' },
  );
}

describe('generateOperations over the fixture', () => {
  let out: string;
  beforeAll(() => {
    out = emit();
  });

  it('matches the snapshot', () => {
    expect(out).toMatchSnapshot();
  });

  it('emits one function and one Meta per operation, sorted by path, then method', () => {
    const result = generateOperations(fixture, options);
    expect(result.operations.map((o) => o.functionName)).toEqual([
      'postCharactersCharacterIdContacts',
      'deleteCharactersCharacterIdContacts',
      'getCorporationsCorporationIdProjects',
      'getMarketsRegionIdOrders',
      'getStatus',
    ]);
  });

  it('leaves header parameters to the pipeline but names them in the Meta', () => {
    expect(out).not.toMatch(/readonly 'X-Compatibility-Date'/);
    expect(out).not.toMatch(/CompatibilityDate/);
    const status = generateOperations(fixture, options).operations.find(
      (o) => o.operationId === 'GetStatus',
    );
    expect(status?.headers).toEqual(['X-Compatibility-Date']);
    expect(out).toContain("headers: ['X-Compatibility-Date'],");
  });

  it('yields page-paginated items, not pages, and hides the page parameter', () => {
    expect(out).toContain(
      'transport.paginate<Orders[number]>(getMarketsRegionIdOrdersMeta',
    );
    expect(out).toContain('): AsyncIterable<Orders[number]> {');
    expect(out).not.toMatch(/readonly page\??:/);
  });

  it('marks before/after routes as cursor-paginated and keeps their parameters', () => {
    const op = generateOperations(fixture, options).operations.find(
      (o) => o.operationId === 'GetCorporationsCorporationIdProjects',
    );
    expect(op?.pagination).toBe('cursor');
    expect(out).toContain('readonly after?: string;');
  });

  it('reads scopes from security, once each', () => {
    expect(out).toContain("scopes: ['esi-characters.write_contacts.v1'],");
  });

  it('takes the first 2xx body and returns void when there is none', () => {
    expect(out).toContain('Promise<PostCharactersCharacterIdContactsResponse>');
    expect(out).toMatch(
      /deleteCharactersCharacterIdContacts\([^)]*\): Promise<void>/,
    );
  });

  it('carries deprecation into the Meta and the JSDoc', () => {
    expect(out).toContain('deprecated: true,');
    expect(out).toContain('@deprecated ESI marks this operation deprecated.');
  });

  it('keeps component names, quotes odd keys, and escapes comment terminators', () => {
    expect(out).toContain('export type CharacterID = number;');
    expect(out).toContain("readonly 'odd-key'?: string;");
    expect(out).toContain('*\\/ with a comment terminator');
    expect(out).toContain(
      'readonly labels?: Readonly<Record<string, string>>;',
    );
  });

  it('handles a self-referencing schema', () => {
    expect(out).toContain('readonly children?: readonly Node[];');
  });

  it('makes params optional when nothing in them is required', () => {
    const doc: OpenApiDocument = {
      paths: {
        '/x': {
          get: {
            operationId: 'GetX',
            parameters: [
              { in: 'query', name: 'q', schema: { type: 'string' } },
            ],
            responses: { '204': {} },
          },
        },
      },
    };
    expect(emit(doc)).toContain('params: GetXParams = {}');
  });
});

describe('generateOperations refuses documents it cannot represent', () => {
  const one = (op: Record<string, unknown>): OpenApiDocument => ({
    paths: { '/x': { get: { responses: { '200': {} }, ...op } } },
  });

  it.each([
    [
      'a missing operationId',
      one({ operationId: undefined }),
      /no operationId/,
    ],
    [
      'an operationId that is not an identifier',
      one({ operationId: 'Get-X' }),
      /not a valid identifier/,
    ],
    [
      'a $ref to a missing schema',
      one({
        operationId: 'GetX',
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Nope' },
              },
            },
          },
        },
      }),
      /missing schema "Nope"/,
    ],
    [
      'a cookie parameter',
      one({ operationId: 'GetX', parameters: [{ in: 'cookie', name: 'c' }] }),
      /cookie/,
    ],
    [
      'page pagination over a non-array',
      one({
        operationId: 'GetX',
        parameters: [{ in: 'query', name: 'page' }],
        responses: {
          '200': {
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      }),
      /not an array/,
    ],
  ])('%s', (_label, doc, message) => {
    expect(() => generateOperations(doc, options)).toThrow(SpecGenerateError);
    expect(() => generateOperations(doc, options)).toThrow(message);
  });

  it('a repeated operationId', () => {
    const doc: OpenApiDocument = {
      paths: {
        '/a': { get: { operationId: 'GetX', responses: {} } },
        '/b': { get: { operationId: 'GetX', responses: {} } },
      },
    };
    expect(() => generateOperations(doc, options)).toThrow(/repeats/);
  });
});

describe('functionNameFor', () => {
  it('lower-cases the first letter only', () => {
    expect(functionNameFor('GetCharactersCharacterIdWallet')).toBe(
      'getCharactersCharacterIdWallet',
    );
  });
});

describe('checkCoverage', () => {
  const metas = (): Map<string, MetaLike> =>
    metasOf({
      ...Object.fromEntries(
        generateOperations(fixture, options).operations.map((o) => [
          `${o.functionName}Meta`,
          o,
        ]),
      ),
      notAMeta: 3,
    });

  it('passes when every operation is generated and agrees with the spec', () => {
    const report = checkCoverage(fixture, metas());
    expect(report.problems).toEqual([]);
    expect(report.specOperations).toBe(5);
    expect(report.generatedOperations).toBe(5);
  });

  it('names a spec operation with no generated function', () => {
    const m = metas();
    m.delete('getStatus');
    expect(checkCoverage(fixture, m).problems).toEqual([
      'GET /status (GetStatus) has no generated operation',
    ]);
  });

  it('names a generated function the spec no longer has', () => {
    const m = metas();
    m.set('getGone', { ...m.get('getStatus')!, operationId: 'GetGone' });
    expect(checkCoverage(fixture, m).problems).toEqual([
      'generated getGone is not in the spec',
    ]);
  });

  it('names a Meta whose headers disagree with the spec', () => {
    const m = metas();
    m.set('getStatus', { ...m.get('getStatus')!, headers: [] });
    expect(checkCoverage(fixture, m).problems).toEqual([
      'GET /status: generated headers is [], spec says ["X-Compatibility-Date"]',
    ]);
  });

  it('names a Meta that disagrees with the spec', () => {
    const m = metas();
    m.set('getStatus', { ...m.get('getStatus')!, scopes: ['esi-x.v1'] });
    expect(checkCoverage(fixture, m).problems).toEqual([
      'GET /status: generated scopes is ["esi-x.v1"], spec says []',
    ]);
  });
});

describe('the committed generated module', () => {
  it('covers every operation in the vendored spec', () => {
    const doc = JSON.parse(
      fs.readFileSync(path.join(ROOT, SPEC_PATH), 'utf8'),
    ) as OpenApiDocument;
    const report = checkCoverage(doc, metasOf(committed));
    expect(report.problems).toEqual([]);
    expect(report.generatedOperations).toBeGreaterThan(200);
  });
});

describe('the committed generated module, called as a consumer would', () => {
  type Call = { meta: OperationMeta; req: OperationRequest };
  const recording = (
    pages: readonly unknown[],
  ): { transport: OperationTransport; calls: Call[] } => {
    const calls: Call[] = [];
    return {
      calls,
      transport: {
        request: <T>(meta: OperationMeta, req: OperationRequest) => {
          calls.push({ meta, req });
          return Promise.resolve(42 as T);
        },
        paginate: <T>(meta: OperationMeta, req: OperationRequest) => {
          calls.push({ meta, req });
          return (async function* () {
            for (const item of pages) yield item as T;
          })();
        },
      },
    };
  };

  it('iterates items of a page-paginated route and passes its parameters', async () => {
    const { transport, calls } = recording([{ order_id: 1 }, { order_id: 2 }]);
    const ids: number[] = [];
    for await (const order of committed.getMarketsRegionIdOrders(transport, {
      region_id: 10000002,
      order_type: 'sell',
    })) {
      ids.push(order.order_id);
    }
    expect(ids).toEqual([1, 2]);
    expect(calls[0]?.meta.path).toBe('/markets/{region_id}/orders');
    expect(calls[0]?.req).toEqual({
      path: { region_id: 10000002 },
      query: { order_type: 'sell', type_id: undefined },
    });
  });

  it('routes an authenticated call through request with its scope', async () => {
    const { transport, calls } = recording([]);
    await expect(
      committed.getCharactersCharacterIdWallet(transport, {
        character_id: 90000001,
      }),
    ).resolves.toBe(42);
    expect(calls[0]?.meta.scopes).toEqual([
      'esi-wallet.read_character_wallet.v1',
    ]);
  });

  it('rejects wrong arguments at compile time', () => {
    const { transport } = recording([]);
    const typeErrors = (): void => {
      // @ts-expect-error order_type is required
      void committed.getMarketsRegionIdOrders(transport, { region_id: 1 });
      void committed.getMarketsRegionIdOrders(transport, {
        region_id: 1,
        // @ts-expect-error not one of buy | sell | all
        order_type: 'both',
      });
    };
    expect(typeErrors).toBeInstanceOf(Function);
  });
});
