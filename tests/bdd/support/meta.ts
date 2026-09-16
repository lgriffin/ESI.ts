/**
 * What ESI's specification endpoints send back in 0025-meta.feature, and
 * where. Step files queue these; they do not build payloads or URLs
 * themselves.
 */

export const metaPaths = {
  json: '/meta/openapi.json',
  yaml: '/meta/openapi.yaml',
};

export const YAML_CONTENT_TYPE = { 'content-type': 'application/yaml' };

export const metaFixtures = {
  jsonSpec: () => ({
    openapi: '3.1.0',
    info: {
      title: 'EVE Stable Infrastructure (ESI) - tranquility',
      version: '2025-12-16',
    },
    paths: {
      '/alliances': { get: { operationId: 'GetAlliances' } },
      '/status': { get: { operationId: 'GetStatus' } },
    },
    components: {
      schemas: {
        AlliancesGet: { type: 'array', items: { type: 'integer' } },
      },
    },
  }),

  yamlSpec: () => `openapi: 3.1.0
info:
  title: EVE Stable Infrastructure (ESI) - tranquility
  version: 2025-12-16
paths: {}
components: {}
`,

  /** The alliances path, as JSON; `alliancesYamlSpec` is the same document. */
  alliancesJsonSpec: () => ({
    openapi: '3.1.0',
    info: {
      title: 'EVE Stable Infrastructure (ESI) - tranquility',
      version: '2025-12-16',
    },
    paths: { '/alliances': { get: { summary: 'List alliances' } } },
  }),

  alliancesYamlSpec: () => `openapi: 3.1.0
info:
  title: EVE Stable Infrastructure (ESI) - tranquility
  version: 2025-12-16
paths:
  /alliances:
    get:
      summary: List alliances
`,
};
