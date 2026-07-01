const LIVE_TESTS_ENABLED = process.env.ESI_LIVE_TESTS === 'true';
const describeIfLive = LIVE_TESTS_ENABLED ? describe : describe.skip;

const ESI_BASE = 'https://esi.evetech.net/latest';

/** Small delay helper to avoid hammering the API between describe blocks. */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// 1. Server Status (existing)
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Server Status', () => {
  it('should return a valid server status response', async () => {
    const response = await fetch(`${ESI_BASE}/status/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toHaveProperty('players');
    expect(data).toHaveProperty('server_version');
    expect(data).toHaveProperty('start_time');
    expect(typeof data.players).toBe('number');
    expect(typeof data.server_version).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 2. Market Prices (existing)
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Market Prices', () => {
  it('should return an array of market prices with type_id fields', async () => {
    const response = await fetch(`${ESI_BASE}/markets/prices/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('type_id');
    expect(typeof first.type_id).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// 3. Universe Types — Pagination (existing)
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Universe Types (Pagination)', () => {
  it('should return paginated response with x-pages header', async () => {
    const response = await fetch(`${ESI_BASE}/universe/types/`);
    expect(response.ok).toBe(true);

    const xPages = response.headers.get('x-pages');
    expect(xPages).not.toBeNull();
    expect(parseInt(xPages!, 10)).toBeGreaterThan(1);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// 4. Rate Limit Headers (existing)
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Rate Limit Headers', () => {
  it('should include rate limit headers in response', async () => {
    const response = await fetch(`${ESI_BASE}/status/`);
    expect(response.ok).toBe(true);

    const remaining = response.headers.get('x-ratelimit-remaining');
    const limit = response.headers.get('x-ratelimit-limit');
    const group = response.headers.get('x-ratelimit-group');

    expect(remaining).not.toBeNull();
    expect(limit).not.toBeNull();
    expect(group).not.toBeNull();
    expect(parseInt(remaining!, 10)).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Alliances (existing + additions)
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Alliances', () => {
  afterAll(() => delay(200));

  it('should return alliance list as array of numbers', async () => {
    const response = await fetch(`${ESI_BASE}/alliances/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(typeof data[0]).toBe('number');
    }
  });

  it('should return valid alliance info for a known alliance', async () => {
    const response = await fetch(`${ESI_BASE}/alliances/99000006/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('ticker');
    expect(data).toHaveProperty('date_founded');
    expect(typeof data.name).toBe('string');
    expect(typeof data.ticker).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 6. Incursions
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Incursions', () => {
  afterAll(() => delay(200));

  it('should return an array of incursions', async () => {
    const response = await fetch(`${ESI_BASE}/incursions/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    // Incursions may be empty if none are active, so only validate shape when present
    if (data.length > 0) {
      const first = data[0];
      expect(first).toHaveProperty('type');
      expect(first).toHaveProperty('state');
      expect(first).toHaveProperty('constellation_id');
      expect(first).toHaveProperty('staging_solar_system_id');
      expect(typeof first.constellation_id).toBe('number');
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Insurance
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Insurance', () => {
  afterAll(() => delay(200));

  it('should return insurance price levels', async () => {
    const response = await fetch(`${ESI_BASE}/insurance/prices/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('type_id');
    expect(first).toHaveProperty('levels');
    expect(typeof first.type_id).toBe('number');
    expect(Array.isArray(first.levels)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Sovereignty
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Sovereignty', () => {
  afterAll(() => delay(200));

  it('should return sovereignty campaigns', async () => {
    const response = await fetch(`${ESI_BASE}/sovereignty/campaigns/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    // Campaigns may be empty; validate shape if present
    if (data.length > 0) {
      const first = data[0];
      expect(first).toHaveProperty('campaign_id');
      expect(first).toHaveProperty('solar_system_id');
      expect(typeof first.campaign_id).toBe('number');
    }
  });

  it('should return sovereignty map', async () => {
    const response = await fetch(`${ESI_BASE}/sovereignty/map/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('system_id');
    expect(typeof first.system_id).toBe('number');
  });

  it('should return sovereignty structures', async () => {
    const response = await fetch(`${ESI_BASE}/sovereignty/structures/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    // May be empty; validate shape if present
    if (data.length > 0) {
      const first = data[0];
      expect(first).toHaveProperty('alliance_id');
      expect(first).toHaveProperty('solar_system_id');
      expect(first).toHaveProperty('structure_type_id');
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Industry
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Industry', () => {
  afterAll(() => delay(200));

  it('should return industry cost indices per system', async () => {
    const response = await fetch(`${ESI_BASE}/industry/systems/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('solar_system_id');
    expect(first).toHaveProperty('cost_indices');
    expect(typeof first.solar_system_id).toBe('number');
    expect(Array.isArray(first.cost_indices)).toBe(true);
  });

  it('should return industry facilities', async () => {
    const response = await fetch(`${ESI_BASE}/industry/facilities/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('facility_id');
    expect(first).toHaveProperty('solar_system_id');
    expect(first).toHaveProperty('type_id');
  });
});

// ---------------------------------------------------------------------------
// 10. Universe (expanded)
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Universe', () => {
  afterAll(() => delay(200));

  it('should return universe categories', async () => {
    const response = await fetch(`${ESI_BASE}/universe/categories/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });

  it('should return type info for Tritanium (type_id=34)', async () => {
    const response = await fetch(`${ESI_BASE}/universe/types/34/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toHaveProperty('type_id');
    expect(data.type_id).toBe(34);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('group_id');
    expect(typeof data.name).toBe('string');
  });

  it('should return system info for Jita (system_id=30000142)', async () => {
    const response = await fetch(`${ESI_BASE}/universe/systems/30000142/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toHaveProperty('system_id');
    expect(data.system_id).toBe(30000142);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('constellation_id');
    expect(data).toHaveProperty('security_status');
    expect(typeof data.name).toBe('string');
    expect(typeof data.security_status).toBe('number');
  });

  it('should return universe regions', async () => {
    const response = await fetch(`${ESI_BASE}/universe/regions/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });

  it('should return universe constellations', async () => {
    const response = await fetch(`${ESI_BASE}/universe/constellations/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });

  it('should return station info for Jita 4-4 (station_id=60003760)', async () => {
    const response = await fetch(`${ESI_BASE}/universe/stations/60003760/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toHaveProperty('station_id');
    expect(data.station_id).toBe(60003760);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('system_id');
    expect(data).toHaveProperty('type_id');
    expect(typeof data.name).toBe('string');
  });

  it('should return universe groups', async () => {
    const response = await fetch(`${ESI_BASE}/universe/groups/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });

  it('should return universe races', async () => {
    const response = await fetch(`${ESI_BASE}/universe/races/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('race_id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('description');
    expect(typeof first.race_id).toBe('number');
    expect(typeof first.name).toBe('string');
  });

  it('should return universe bloodlines', async () => {
    const response = await fetch(`${ESI_BASE}/universe/bloodlines/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('bloodline_id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('race_id');
    expect(typeof first.bloodline_id).toBe('number');
    expect(typeof first.name).toBe('string');
  });

  it('should return universe ancestries', async () => {
    const response = await fetch(`${ESI_BASE}/universe/ancestries/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('bloodline_id');
    expect(typeof first.id).toBe('number');
    expect(typeof first.name).toBe('string');
  });

  it('should return universe factions', async () => {
    const response = await fetch(`${ESI_BASE}/universe/factions/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('faction_id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('description');
    expect(typeof first.faction_id).toBe('number');
    expect(typeof first.name).toBe('string');
  });

  it('should return universe graphics', async () => {
    const response = await fetch(`${ESI_BASE}/universe/graphics/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// 11. Dogma
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Dogma', () => {
  afterAll(() => delay(200));

  it('should return dogma attributes list', async () => {
    const response = await fetch(`${ESI_BASE}/dogma/attributes/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });

  it('should return dogma effects list', async () => {
    const response = await fetch(`${ESI_BASE}/dogma/effects/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });

  it('should return dogma attribute info for attribute_id=2', async () => {
    const response = await fetch(`${ESI_BASE}/dogma/attributes/2/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toHaveProperty('attribute_id');
    expect(data.attribute_id).toBe(2);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('display_name');
    expect(typeof data.name).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 12. Wars
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Wars', () => {
  afterAll(() => delay(200));

  it('should return a list of war IDs', async () => {
    const response = await fetch(`${ESI_BASE}/wars/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });

  it('should return war details for the most recent war', async () => {
    // Fetch the war list to get a valid, recent war ID
    const listResponse = await fetch(`${ESI_BASE}/wars/`);
    expect(listResponse.ok).toBe(true);
    const warIds = (await listResponse.json()) as number[];
    expect(warIds.length).toBeGreaterThan(0);

    const recentWarId = warIds[0];
    const response = await fetch(`${ESI_BASE}/wars/${recentWarId}/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toHaveProperty('id');
    expect(data.id).toBe(recentWarId);
    expect(data).toHaveProperty('declared');
    expect(data).toHaveProperty('aggressor');
    expect(data).toHaveProperty('defender');
    expect(typeof data.declared).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 13. Market (expanded)
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Market', () => {
  afterAll(() => delay(200));

  it('should return market history as array of daily records', async () => {
    const response = await fetch(
      `${ESI_BASE}/markets/10000002/history/?type_id=34`,
    );
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      const record = data[0];
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('average');
      expect(record).toHaveProperty('highest');
      expect(record).toHaveProperty('lowest');
      expect(record).toHaveProperty('volume');
      expect(record).toHaveProperty('order_count');
    }
  });

  it('should return market groups', async () => {
    const response = await fetch(`${ESI_BASE}/markets/groups/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });

  it('should return market orders for The Forge region (Tritanium)', async () => {
    const response = await fetch(
      `${ESI_BASE}/markets/10000002/orders/?type_id=34`,
    );
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('order_id');
    expect(first).toHaveProperty('type_id');
    expect(first).toHaveProperty('price');
    expect(first).toHaveProperty('volume_remain');
    expect(first).toHaveProperty('is_buy_order');
    expect(first.type_id).toBe(34);
    expect(typeof first.price).toBe('number');
  });

  it('should return market types available in The Forge', async () => {
    const response = await fetch(`${ESI_BASE}/markets/10000002/types/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0]).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// 14. Route
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Route', () => {
  afterAll(() => delay(200));

  it('should return a route from Jita to Amarr', async () => {
    // 30000142 = Jita, 30002187 = Amarr
    const response = await fetch(`${ESI_BASE}/route/30000142/30002187/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as number[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(1);
    expect(data[0]).toBe(30000142);
    expect(data[data.length - 1]).toBe(30002187);
    expect(typeof data[0]).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// 15. Opportunities (removed from ESI — endpoints return 404)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 16. Faction Warfare
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Faction Warfare', () => {
  afterAll(() => delay(200));

  it('should return faction warfare stats', async () => {
    const response = await fetch(`${ESI_BASE}/fw/stats/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('faction_id');
    expect(first).toHaveProperty('kills');
    expect(typeof first.faction_id).toBe('number');
  });

  it('should return faction warfare wars', async () => {
    const response = await fetch(`${ESI_BASE}/fw/wars/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('against_id');
    expect(first).toHaveProperty('faction_id');
    expect(typeof first.faction_id).toBe('number');
  });

  it('should return faction warfare systems', async () => {
    const response = await fetch(`${ESI_BASE}/fw/systems/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('solar_system_id');
    expect(first).toHaveProperty('occupier_faction_id');
    expect(first).toHaveProperty('owner_faction_id');
    expect(typeof first.solar_system_id).toBe('number');
  });

  it('should return faction warfare leaderboards', async () => {
    const response = await fetch(`${ESI_BASE}/fw/leaderboards/`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toHaveProperty('kills');
    expect(data).toHaveProperty('victory_points');
  });
});

// ---------------------------------------------------------------------------
// 17. Killmails (known public killmail)
// ---------------------------------------------------------------------------
describeIfLive('Live ESI: Killmails', () => {
  it('should return killmail details for a known public killmail', async () => {
    // This is a well-known public killmail; if it 404s the endpoint still works
    // but the specific killmail may have been purged — so we guard gracefully.
    const killmailId = 56733821;
    const killmailHash = '42b0981c3089220ce83502e8fa7b4f432069be84';
    const response = await fetch(
      `${ESI_BASE}/killmails/${killmailId}/${killmailHash}/`,
    );

    if (response.ok) {
      const data = (await response.json()) as Record<string, unknown>;
      expect(data).toHaveProperty('killmail_id');
      expect(data.killmail_id).toBe(killmailId);
      expect(data).toHaveProperty('killmail_time');
      expect(data).toHaveProperty('victim');
      expect(typeof data.killmail_time).toBe('string');
    } else {
      // Killmail may no longer be available — that is acceptable
      expect([404, 422, 500, 502, 503]).toContain(response.status);
    }
  });
});
