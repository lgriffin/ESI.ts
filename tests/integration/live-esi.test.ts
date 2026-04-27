const LIVE_TESTS_ENABLED = process.env.ESI_LIVE_TESTS === 'true';
const describeIfLive = LIVE_TESTS_ENABLED ? describe : describe.skip;

describeIfLive('Live ESI: Server Status', () => {
  it('should return a valid server status response', async () => {
    const response = await fetch('https://esi.evetech.net/latest/status/');
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toHaveProperty('players');
    expect(data).toHaveProperty('server_version');
    expect(data).toHaveProperty('start_time');
    expect(typeof data.players).toBe('number');
    expect(typeof data.server_version).toBe('string');
  });
});

describeIfLive('Live ESI: Market Prices', () => {
  it('should return an array of market prices with type_id fields', async () => {
    const response = await fetch(
      'https://esi.evetech.net/latest/markets/prices/',
    );
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('type_id');
    expect(typeof first.type_id).toBe('number');
  });
});

describeIfLive('Live ESI: Universe Types (Pagination)', () => {
  it('should return paginated response with x-pages header', async () => {
    const response = await fetch(
      'https://esi.evetech.net/latest/universe/types/',
    );
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

describeIfLive('Live ESI: Rate Limit Headers', () => {
  it('should include rate limit headers in response', async () => {
    const response = await fetch('https://esi.evetech.net/latest/status/');
    expect(response.ok).toBe(true);

    const remaining = response.headers.get('x-esi-error-limit-remain');
    const reset = response.headers.get('x-esi-error-limit-reset');

    expect(remaining).not.toBeNull();
    expect(reset).not.toBeNull();
    expect(parseInt(remaining!, 10)).toBeGreaterThanOrEqual(0);
  });
});

describeIfLive('Live ESI: Response Type Validation', () => {
  it('should return alliance list as array of numbers', async () => {
    const response = await fetch('https://esi.evetech.net/latest/alliances/');
    expect(response.ok).toBe(true);

    const data = (await response.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(typeof data[0]).toBe('number');
    }
  });

  it('should return valid alliance info for a known alliance', async () => {
    const response = await fetch(
      'https://esi.evetech.net/latest/alliances/99000006/',
    );
    expect(response.ok).toBe(true);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('ticker');
    expect(data).toHaveProperty('date_founded');
    expect(typeof data.name).toBe('string');
    expect(typeof data.ticker).toBe('string');
  });

  it('should return market history as array of daily records', async () => {
    const response = await fetch(
      'https://esi.evetech.net/latest/markets/10000002/history/?type_id=34',
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
});
