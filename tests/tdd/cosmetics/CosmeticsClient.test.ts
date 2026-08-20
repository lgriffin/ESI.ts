import { CosmeticsClient } from '../../../src/clients/CosmeticsClient';
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

const authCosmeticsClient = new CosmeticsClient(authClient);
const unauthCosmeticsClient = new CosmeticsClient(unauthClient);

describe('CosmeticsClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should get character SKINR licenses', async () => {
    const mockResponse = {
      licenses: [
        {
          skinr_id: 'abc-123',
          activated: true,
          unactivated: 2,
        },
        {
          skinr_id: 'def-456',
          activated: false,
          unactivated: 1,
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      authCosmeticsClient.getCharacterSkinr(123456),
    );
    expect(result).toHaveProperty('licenses');
    expect(Array.isArray(result.licenses)).toBe(true);
    expect(result.licenses).toHaveLength(2);
    result.licenses.forEach((license: any) => {
      expect(license).toHaveProperty('skinr_id');
      expect(typeof license.skinr_id).toBe('string');
      expect(license).toHaveProperty('activated');
      expect(typeof license.activated).toBe('boolean');
      expect(license).toHaveProperty('unactivated');
      expect(typeof license.unactivated).toBe('number');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456/cosmetics/skinr',
    );
  });

  it('should get character SKINR components', async () => {
    const mockResponse = {
      licenses: [
        {
          component_id: 67890,
          type: 'nanocoating',
          runs: { remaining: 5 },
        },
        {
          component_id: 67891,
          type: 'pattern',
          runs: { unlimited: true },
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      authCosmeticsClient.getCharacterSkinrComponents(123456),
    );
    expect(result).toHaveProperty('licenses');
    expect(Array.isArray(result.licenses)).toBe(true);
    expect(result.licenses).toHaveLength(2);
    expect(result.licenses[0].component_id).toBe(67890);
    expect(result.licenses[0].type).toBe('nanocoating');
    expect(result.licenses[0].runs).toHaveProperty('remaining');
    expect(result.licenses[1].type).toBe('pattern');
    expect(result.licenses[1].runs).toHaveProperty('unlimited');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456/cosmetics/skinr/components',
    );
  });

  it('should get public SKINR attributes', async () => {
    const mockResponse = {
      id: 'skinr-abc-123',
      name: 'Crimson Fury',
      creator_id: 90000001,
      ship_type_id: 587,
      line: 'Crimson',
      tier: { level: 3 },
      layout: {
        slots: [{}],
        pattern_blend_mode: 'normal',
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      unauthCosmeticsClient.getSkinr('skinr-abc-123'),
    );
    expect(result).toHaveProperty('id');
    expect(result.id).toBe('skinr-abc-123');
    expect(result).toHaveProperty('name');
    expect(result.name).toBe('Crimson Fury');
    expect(result).toHaveProperty('creator_id');
    expect(typeof result.creator_id).toBe('number');
    expect(result).toHaveProperty('ship_type_id');
    expect(result).toHaveProperty('tier');
    expect(result.tier.level).toBe(3);
    expect(result).toHaveProperty('layout');
    expect(result.layout.pattern_blend_mode).toBe('normal');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/cosmetics/skinr/skinr-abc-123',
    );
  });

  it('should send auth headers for character SKINR', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ licenses: [] }));

    await getBody(() => authCosmeticsClient.getCharacterSkinr(123456));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should send auth headers for character SKINR components', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ licenses: [] }));

    await getBody(() =>
      authCosmeticsClient.getCharacterSkinrComponents(123456),
    );

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should not require auth for public SKINR lookup', async () => {
    const mockResponse = {
      id: 'skinr-abc-123',
      name: 'Test',
      creator_id: 90000001,
      ship_type_id: 587,
      tier: { level: 1 },
      layout: { slots: [], pattern_blend_mode: 'normal' },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      unauthCosmeticsClient.getSkinr('skinr-abc-123'),
    );
    expect(result).toHaveProperty('id');
  });

  describeClientErrors('CosmeticsClient', () =>
    authCosmeticsClient.getCharacterSkinr(123456),
  );
});
