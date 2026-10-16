/**
 * Every recorded ESI response (tests/contract/fixtures/recorded) passes the
 * generated schema of the operation that served it, so turning validation on
 * for the generated operations rejects no body ESI actually sends.
 */
import * as fs from 'fs';
import * as path from 'path';
import { responseSchemas } from '../../../src/adapters/responseSchemas.generated';

const ROOT = path.resolve(__dirname, '../../..');
const RECORDED = path.join(ROOT, 'tests/contract/fixtures/recorded');
const SPEC = path.join(
  ROOT,
  'tests/contract/snapshots/esi-openapi.snapshot.json',
);

interface RecordedPage {
  readonly url: string;
  readonly status: number | string;
  readonly body: unknown;
}

const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8')) as {
  paths: Record<string, { get?: { operationId: string } }>;
};

/** GET routes as a matcher per template, most literal segments first. */
const routes = Object.entries(spec.paths)
  .filter(([, item]) => item.get)
  .map(([template, item]) => ({
    operationId: item.get!.operationId,
    literals: template.split('/').filter((s) => s && !s.startsWith('{')).length,
    pattern: new RegExp(
      `^${template.replace(/^\//, '').replace(/\{\w+\}/g, '[^/]+')}/?$`,
    ),
  }))
  .sort((a, b) => b.literals - a.literals);

function operationFor(url: string): string | undefined {
  const pathOnly = url.split('?')[0]!.replace(/^\//, '');
  return routes.find((r) => r.pattern.test(pathOnly))?.operationId;
}

/** Recorded routes the OpenAPI document does not describe: no schema to check. */
const NOT_IN_SPEC = new Set(['meta/openapi.json', 'meta/openapi.yaml']);

const pages = fs
  .readdirSync(RECORDED)
  .filter((f) => f.endsWith('.json'))
  .flatMap((file) => {
    const fixture = JSON.parse(
      fs.readFileSync(path.join(RECORDED, file), 'utf8'),
    ) as { pages: RecordedPage[] };
    return fixture.pages
      .filter(
        (p) =>
          String(p.status).startsWith('2') &&
          p.body !== undefined &&
          !NOT_IN_SPEC.has(p.url.split('?')[0]!),
      )
      .map((p, i) => ({ name: `${file} page ${i + 1}`, ...p }));
  });

describe('DES-02: generated response schemas against recorded ESI responses', () => {
  it('finds recorded pages to check', () => {
    expect(pages.length).toBeGreaterThan(50);
  });

  it.each(pages)('$name ($url) passes its generated schema', (page) => {
    const operationId = operationFor(page.url);
    expect(operationId).toBeDefined();
    const schema = responseSchemas[operationId!];
    expect(schema).toBeDefined();
    const result = schema!.safeParse(page.body);
    expect(result.success ? 'ok' : result.error.issues).toBe('ok');
  });
});
