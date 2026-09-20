import {
  esiEndpointScopes,
  EsiScope,
} from '../../../src/core/endpoints/esi-scopes.generated';

describe('ESI Scope Metadata', () => {
  it('should have entries for authenticated endpoints', () => {
    const keys = Object.keys(esiEndpointScopes);
    expect(keys.length).toBeGreaterThan(50);
  });

  it('should map wallet endpoint to wallet scope', () => {
    const scopes = esiEndpointScopes['GET:characters/{character_id}/wallet'];
    expect(scopes).toBeDefined();
    expect(scopes).toContain('esi-wallet.read_character_wallet.v1' as EsiScope);
  });

  it('should map assets endpoint to assets scope', () => {
    const scopes = esiEndpointScopes['GET:characters/{character_id}/assets'];
    expect(scopes).toBeDefined();
    expect(scopes).toContain('esi-assets.read_assets.v1' as EsiScope);
  });

  it('should map mail endpoint to mail scope', () => {
    const scopes = esiEndpointScopes['GET:characters/{character_id}/mail'];
    expect(scopes).toBeDefined();
    expect(scopes).toContain('esi-mail.read_mail.v1' as EsiScope);
  });

  it('should not include public endpoints', () => {
    expect(esiEndpointScopes['GET:status']).toBeUndefined();
    expect(esiEndpointScopes['GET:alliances']).toBeUndefined();
    expect(esiEndpointScopes['GET:universe/types/{type_id}']).toBeUndefined();
  });

  it('should use METHOD:path key format', () => {
    const keys = Object.keys(esiEndpointScopes);
    for (const key of keys) {
      expect(key).toMatch(/^(GET|POST|PUT|DELETE):/);
    }
  });

  it('should have non-empty scope arrays for all entries', () => {
    for (const [key, scopes] of Object.entries(esiEndpointScopes)) {
      expect(scopes.length).toBeGreaterThan(0);
      for (const scope of scopes) {
        expect(scope).toMatch(/^esi-/);
      }
    }
  });

  it('should use snake_case path params', () => {
    const keys = Object.keys(esiEndpointScopes);
    const withParams = keys.filter((k) => k.includes('{'));
    expect(withParams.length).toBeGreaterThan(0);
    for (const key of withParams) {
      const params = key.match(/\{(\w+)\}/g) ?? [];
      for (const param of params) {
        expect(param).not.toMatch(/[A-Z]/);
      }
    }
  });
});
