/**
 * Self-tests for the scope tree emitter (scripts/spec/spec-scope-tree.ts): the
 * naming rules, and the shapes it refuses because the tree could not hold
 * them without two operations fighting over one name.
 */
import type { GeneratedOperation } from '../../../scripts/spec/spec-generate-core';
import {
  buildScopeTree,
  camelCase,
  ScopeTreeError,
  scopeTreeSource,
  singular,
} from '../../../scripts/spec/spec-scope-tree';

function op(
  method: GeneratedOperation['method'],
  path: string,
  over: Partial<GeneratedOperation> = {},
): GeneratedOperation {
  const pathParams = [...path.matchAll(/\{(\w+)\}/g)].map((m) => ({
    name: m[1]!,
    type: 'number',
  }));
  const id = `${method}${path.replace(/[^A-Za-z]/g, '')}`;
  return {
    operationId: id,
    functionName: id.charAt(0).toLowerCase() + id.slice(1),
    method,
    path,
    scopes: [],
    pagination: 'none',
    deprecated: false,
    headers: [],
    pathParams,
    query: 'none',
    paramsType: pathParams.length > 0 ? `${id}Params` : undefined,
    ...over,
  };
}

describe('camelCase and singular', () => {
  it.each([
    ['paragon-hub', 'paragonHub'],
    ['agents_research', 'agentsResearch'],
    ['status', 'status'],
  ])('camelCase(%s) is %s', (input, output) => {
    expect(camelCase(input)).toBe(output);
  });

  it.each([
    ['characters', 'character'],
    ['categories', 'category'],
    ['freelanceJobs', 'freelanceJob'],
    ['route', 'route'],
  ])('singular(%s) is %s', (input, output) => {
    expect(singular(input)).toBe(output);
  });
});

describe('buildScopeTree', () => {
  it('makes a root collection with a parameter a singular call, apart from its namespace', () => {
    const root = buildScopeTree([
      op('GET', '/characters/{character_id}/wallet'),
      op('POST', '/characters/affiliation'),
    ]);
    expect([...root.children.keys()].sort()).toEqual([
      'character',
      'characters',
    ]);
    expect(root.children.get('character')?.call?.params).toEqual([
      { name: 'character_id', type: 'number' },
    ]);
    expect(root.children.get('characters')?.call).toBeUndefined();
  });

  it('merges /corporation/{id} and /corporations/{id} into one call', () => {
    const root = buildScopeTree([
      op('GET', '/corporation/{corporation_id}/mining/observers'),
      op('GET', '/corporations/{corporation_id}'),
    ]);
    const call = root.children.get('corporation')?.call;
    expect(call?.node.leaves.has('get')).toBe(true);
    expect(call?.node.children.has('mining')).toBe(true);
  });

  it('takes consecutive parameters in one call, in path order', () => {
    const root = buildScopeTree([
      op('GET', '/killmails/{killmail_id}/{killmail_hash}'),
    ]);
    expect(
      root.children.get('killmail')?.call?.params.map((p) => p.name),
    ).toEqual(['killmail_id', 'killmail_hash']);
  });

  it('keeps a nested collection a namespace and a call at once', () => {
    const root = buildScopeTree([
      op('GET', '/characters/{character_id}/mail'),
      op('GET', '/characters/{character_id}/mail/{mail_id}'),
    ]);
    const mail = root.children
      .get('character')
      ?.call?.node.children.get('mail');
    expect(mail?.leaves.has('get')).toBe(true);
    expect(mail?.call?.node.leaves.has('get')).toBe(true);
  });

  it('refuses two operations on one verb', () => {
    expect(() =>
      buildScopeTree([
        op('GET', '/corporation/{corporation_id}'),
        op('GET', '/corporations/{corporation_id}', { operationId: 'Other' }),
      ]),
    ).toThrow(/land on the same get\(\)/);
  });

  it('refuses one call reached with different parameters', () => {
    expect(() =>
      buildScopeTree([
        op('GET', '/corporation/{corporation_id}'),
        op('GET', '/corporations/{id}/x'),
      ]),
    ).toThrow(/clashes with/);
  });

  it('refuses a segment named like an operation beside it', () => {
    expect(() =>
      buildScopeTree([op('GET', '/things'), op('GET', '/things/get')]),
    ).toThrow(/both an operation and a segment/);
  });

  it('refuses a callable node carrying a property every function has', () => {
    expect(() =>
      buildScopeTree([
        op('GET', '/things/{thing_id}/x'),
        op('GET', '/a/things/{thing_id}'),
        op('GET', '/a/things/name'),
      ]),
    ).toThrow(ScopeTreeError);
  });

  it('refuses a path that opens with a parameter', () => {
    expect(() => buildScopeTree([op('GET', '/{x}')])).toThrow(
      /no segment before it/,
    );
  });
});

describe('scopeTreeSource', () => {
  const source = scopeTreeSource([
    op('GET', '/status'),
    op('GET', '/characters/{character_id}/wallet', {
      scopes: ['esi-wallet.read_character_wallet.v1'],
    }),
    op('GET', '/characters/{character_id}/search', {
      scopes: ['esi-search.search_structures.v1'],
      query: 'required',
    }),
    op('POST', '/characters/{character_id}/mail', {
      scopes: ['esi-mail.send_mail.v1'],
      body: { type: 'MailBody', optional: false },
    }),
    op('GET', '/characters/{character_id}/portrait'),
  ]);
  const publicTree = source.slice(
    source.indexOf('export interface PublicScopeTree'),
    source.indexOf('export function createScopeTree'),
  );

  it('passes the leftover query parameters as one object, required when any is', () => {
    expect(source).toContain(
      'get(params: Omit<GETcharacterscharacteridsearchParams, "character_id">)',
    );
    expect(source).toContain('...params, character_id: characterId');
  });

  it('takes the body as the first argument', () => {
    expect(source).toContain('post(body: MailBody)');
    expect(source).toContain(
      'pOSTcharacterscharacteridmail(transport, { character_id: characterId }, body)',
    );
  });

  it('keeps only scope-less operations, and the nodes above them, in the public tree', () => {
    expect(publicTree).toContain('status');
    expect(publicTree).toContain('portrait');
    expect(publicTree).not.toContain('wallet');
    expect(publicTree).not.toContain('mail');
  });
});
