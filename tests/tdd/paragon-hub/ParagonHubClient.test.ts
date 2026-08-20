import { ParagonHubClient } from '../../../src/clients/ParagonHubClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

const config = getConfig();

const rateLimiter = new RateLimiter();
rateLimiter.setTestMode(true);

const authClient = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
  .setRateLimiter(rateLimiter)
  .build();

const unauthClient = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setRateLimiter(rateLimiter)
  .build();

const authParagonHubClient = new ParagonHubClient(authClient);
const unauthParagonHubClient = new ParagonHubClient(unauthClient);

const mockPublicListingsResponse = {
  cursor: { after: 'cursor-abc', before: 'cursor-xyz' },
  listings: [
    {
      id: '3868eaed-8278-4cb7-9709-7d7de9c20dc7',
      state: 'listed',
      last_modified: '2026-08-18T10:00:00Z',
      seller_id: 90000001,
      skinr_id: 'skinr-design-001',
      created: '2026-08-17T08:00:00Z',
      expires: '2026-09-17T08:00:00Z',
      quantity: 5,
      price: { isk: 500000000 },
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
      state: 'listed',
      last_modified: '2026-08-18T11:00:00Z',
      seller_id: 90000002,
      skinr_id: 'skinr-design-002',
      created: '2026-08-16T14:00:00Z',
      expires: '2026-09-16T14:00:00Z',
      quantity: 1,
      price: { plex: 100 },
    },
  ],
};

const mockCharacterListingsResponse = {
  cursor: { after: 'cursor-char-abc' },
  listings: [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      state: 'listed',
      last_modified: '2026-08-18T10:00:00Z',
      seller_id: 123456,
      skinr_id: 'skinr-design-003',
      created: '2026-08-15T12:00:00Z',
      expires: '2026-09-15T12:00:00Z',
      quantity: 10,
      price: { isk: 250000000 },
      target: { public: true },
    },
  ],
};

describe('ParagonHubClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should get public listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPublicListingsResponse));

    const result = await getBody(() =>
      unauthParagonHubClient.getPublicListings(),
    );
    expect(result).toHaveProperty('listings');
    expect(result).toHaveProperty('cursor');
    expect(Array.isArray(result.listings)).toBe(true);
    expect(result.listings).toHaveLength(2);
    expect(result.listings[0].id).toBe('3868eaed-8278-4cb7-9709-7d7de9c20dc7');
    expect(result.listings[0].state).toBe('listed');
    expect(result.listings[0].price).toEqual({ isk: 500000000 });
    expect(result.listings[1].price).toEqual({ plex: 100 });
    expect(result.cursor.after).toBe('cursor-abc');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/paragon-hub/skinr',
    );
  });

  it('should pass cursor query params for public listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPublicListingsResponse));

    await getBody(() =>
      unauthParagonHubClient.getPublicListings('cursor-abc', undefined, 50),
    );
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('after=cursor-abc');
    expect(url).toContain('limit=50');
  });

  it('should not send auth headers for public listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPublicListingsResponse));

    await getBody(() => unauthParagonHubClient.getPublicListings());

    const requestInit = fetchMock.mock.calls[0][1];
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('should get character listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockCharacterListingsResponse));

    const result = await getBody(() =>
      authParagonHubClient.getCharacterListings(123456),
    );
    expect(result).toHaveProperty('listings');
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].target).toEqual({ public: true });
    expect(result.listings[0].seller_id).toBe(123456);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456/paragon-hub/skinr',
    );
  });

  it('should send auth headers for character listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockCharacterListingsResponse));

    await getBody(() => authParagonHubClient.getCharacterListings(123456));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should get alliance-targeted listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPublicListingsResponse));

    const result = await getBody(() =>
      authParagonHubClient.getAllianceListings(99000006),
    );
    expect(result).toHaveProperty('listings');
    expect(Array.isArray(result.listings)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/paragon-hub/skinr/alliances/99000006',
    );
  });

  it('should send auth headers for alliance listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPublicListingsResponse));

    await getBody(() => authParagonHubClient.getAllianceListings(99000006));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should get character-targeted listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPublicListingsResponse));

    const result = await getBody(() =>
      authParagonHubClient.getCharacterTargetedListings(90000001),
    );
    expect(result).toHaveProperty('listings');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/paragon-hub/skinr/characters/90000001',
    );
  });

  it('should send auth headers for character-targeted listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPublicListingsResponse));

    await getBody(() =>
      authParagonHubClient.getCharacterTargetedListings(90000001),
    );

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should get corporation-targeted listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPublicListingsResponse));

    const result = await getBody(() =>
      authParagonHubClient.getCorporationListings(98000002),
    );
    expect(result).toHaveProperty('listings');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/paragon-hub/skinr/corporations/98000002',
    );
  });

  it('should send auth headers for corporation listings', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPublicListingsResponse));

    await getBody(() => authParagonHubClient.getCorporationListings(98000002));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  describeClientErrors('ParagonHubClient', () =>
    authParagonHubClient.getPublicListings(),
  );
});
