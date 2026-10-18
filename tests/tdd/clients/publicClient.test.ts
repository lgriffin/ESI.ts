import * as fs from 'fs';
import * as path from 'path';
import fetchMock from 'jest-fetch-mock';

import { EsiClientBuilder } from '../../../src/EsiClientBuilder';
import {
  AUTHENTICATED_METHODS_PATH,
  classifyMethods,
} from '../../../scripts/spec/authenticated-methods-core';

fetchMock.enableMocks();

// The generated file, read back as domain -> sorted method names.
function committedMethods(): Record<string, string[]> {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../..', AUTHENTICATED_METHODS_PATH),
    'utf8',
  );
  const body = source.slice(source.indexOf('{') + 1, source.lastIndexOf('}'));
  const out: Record<string, string[]> = {};
  for (const entry of body.split(';')) {
    const name = /readonly (\w+):/.exec(entry)?.[1];
    if (!name) continue;
    out[name] = [...entry.matchAll(/'(\w+)'/g)].map((m) => m[1]!).sort();
  }
  return out;
}

describe('public-only custom client (#675)', () => {
  const savedToken = process.env.ESI_ACCESS_TOKEN;

  beforeEach(() => {
    fetchMock.resetMocks();
    process.env.ESI_ACCESS_TOKEN = 'env-token';
  });

  afterAll(() => {
    if (savedToken === undefined) delete process.env.ESI_ACCESS_TOKEN;
    else process.env.ESI_ACCESS_TOKEN = savedToken;
  });

  it('keeps the generated authenticated-method list in step with the clients', async () => {
    const { authenticated, unknown } = await classifyMethods();
    expect(unknown).toEqual([]);
    expect(committedMethods()).toEqual(authenticated);
  }, 60_000);

  it('sends no Authorization header on a public call, whatever token was configured', async () => {
    fetchMock.mockResponseOnce('[]');
    const pub = new EsiClientBuilder()
      .addClients(['market'])
      .withAccessToken('builder-token')
      .buildPublic();

    await pub.market?.getMarketPrices();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]![1];
    const headers = new Headers(init?.headers);
    expect(headers.has('Authorization')).toBe(false);
    pub.shutdown();
  });

  it('refuses an authenticated method reached by a cast, before any request', async () => {
    const pub = new EsiClientBuilder()
      .addClients(['wallet'])
      .withAccessToken('builder-token')
      .buildPublic();
    const wallet = pub.wallet as unknown as {
      getCharacterWallet(id: number): Promise<unknown>;
    };

    await expect(wallet.getCharacterWallet(1)).rejects.toThrow(
      /NO_AUTH_TOKEN|token/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    pub.shutdown();
  });

  it('leaves out domains it was not built with', () => {
    const pub = new EsiClientBuilder().addClients(['market']).buildPublic();
    expect(pub.market).toBeDefined();
    expect(pub.wallet).toBeUndefined();
    expect(pub.getEnabledClients()).toEqual(['market']);
    pub.shutdown();
  });

  it('needs at least one domain', () => {
    expect(() => new EsiClientBuilder().buildPublic()).toThrow(
      'At least one client type must be specified',
    );
  });
});
