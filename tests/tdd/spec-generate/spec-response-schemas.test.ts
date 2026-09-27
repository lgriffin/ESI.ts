import * as fs from 'fs';
import * as path from 'path';

import {
  checkResponseSchemas,
  definitionsOf,
  returnsJsonBody,
  type DefinitionRef,
} from '../../../scripts/spec/spec-response-schemas-core';
import {
  SPEC_PATH,
  type OpenApiDocument,
} from '../../../scripts/spec/spec-generate-core';

const ROOT = path.resolve(__dirname, '../../..');

const doc: OpenApiDocument = {
  paths: {
    '/characters/{character_id}/mail': {
      post: {
        responses: {
          '201': { content: { 'application/json': { schema: {} } } },
        },
      },
    },
    '/fleets/{fleet_id}': {
      put: { responses: { '204': { description: 'updated' } } },
    },
    '/meta/openapi.yaml': {
      get: {
        responses: {
          '200': { content: { 'application/json': { schema: {} } } },
        },
      },
    },
  },
};

const def = (over: Partial<DefinitionRef>): DefinitionRef => ({
  endpoint: 'map.op',
  path: 'characters/{characterId}/mail/',
  method: 'post',
  hasResponseSchema: false,
  textResponse: false,
  ...over,
});

describe('spec:response-schemas (DES-02)', () => {
  it('flags a definition whose operation returns JSON without a schema', () => {
    const report = checkResponseSchemas(doc, [def({ endpoint: 'mail.send' })]);
    expect(report.checked).toBe(1);
    expect(report.problems).toEqual([
      'mail.send (POST characters/{characterId}/mail/) returns a JSON body but declares no responseSchema',
    ]);
  });

  it('accepts the same definition once it declares a schema', () => {
    const report = checkResponseSchemas(doc, [
      def({ hasResponseSchema: true }),
    ]);
    expect(report.problems).toEqual([]);
  });

  it('needs no schema for a 204 operation', () => {
    const report = checkResponseSchemas(doc, [
      def({ path: 'fleets/{fleetId}', method: 'put' }),
    ]);
    expect(report.checked).toBe(1);
    expect(report.problems).toEqual([]);
  });

  it('skips text endpoints and definitions the spec lacks', () => {
    const report = checkResponseSchemas(doc, [
      def({ path: 'meta/openapi.yaml', method: 'get', textResponse: true }),
      def({ path: 'not/in/spec', method: 'get' }),
    ]);
    expect(report.checked).toBe(0);
    expect(report.problems).toEqual([]);
  });

  it('reads definitions out of endpoint map modules', () => {
    const refs = definitionsOf({
      'mailEndpoints.ts': {
        mailEndpoints: {
          sendMail: { path: 'a', method: 'POST', responseSchema: {} },
          noPath: { method: 'GET' },
        },
        notAMap: 3,
      },
    });
    expect(refs).toEqual([
      {
        endpoint: 'mailEndpoints.sendMail',
        path: 'a',
        method: 'post',
        hasResponseSchema: true,
        textResponse: false,
      },
    ]);
  });

  it('treats only 2xx JSON content as a body', () => {
    expect(
      returnsJsonBody({
        responses: { '404': { content: { 'application/json': {} } } },
      }),
    ).toBe(false);
  });

  it('passes over the real endpoint maps and vendored spec', () => {
    const spec = JSON.parse(
      fs.readFileSync(path.join(ROOT, SPEC_PATH), 'utf8'),
    ) as OpenApiDocument;
    const dir = path.join(ROOT, 'src/core/endpoints');
    const modules: Record<string, Record<string, unknown>> = {};
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('Endpoints.ts')) continue;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      modules[file] = require(path.join(dir, file)) as Record<string, unknown>;
    }
    const report = checkResponseSchemas(spec, definitionsOf(modules));
    expect(report.checked).toBeGreaterThan(200);
    expect(report.problems).toEqual([]);
  });
});
