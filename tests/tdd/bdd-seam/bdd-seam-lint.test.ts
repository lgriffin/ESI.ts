import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const seamRules = require('../../../eslint.bdd-seam.rules.cjs');

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    {
      files: ['**/*.ts'],
      languageOptions: { parser: tseslint.parser },
      rules: seamRules,
    },
  ],
});

async function violations(code: string): Promise<number> {
  const [result] = await eslint.lintText(code, { filePath: 'fixture.ts' });
  return result.messages.filter((m) => m.ruleId === 'no-restricted-syntax')
    .length;
}

describe('BDD transport-seam lint rule (R3)', () => {
  it.each([
    ["jest.spyOn(client.market, 'getMarketPrices')"],
    ["jest.spyOn(esiClient.market, 'getMarketPrices')"],
    ["jest.spyOn(world.client.market, 'getMarketPrices')"],
    ["jest.spyOn(this.client.market, 'getMarketPrices')"],
    ["jest.spyOn(MarketClient.prototype, 'getMarketPrices')"],
    ["jest.spyOn(marketClient, 'getMarketPrices')"],
    ["jest.spyOn(apiClient, 'getRateLimiter')"],
    ['client.market.getMarketPrices = jest.fn()'],
    ['world.client.market.getMarketPrices = jest.fn()'],
  ])('rejects %s', async (code) => {
    expect(await violations(code)).toBe(1);
  });

  it.each([
    ["jest.spyOn(fs.promises, 'readFile')"],
    ["jest.spyOn(Date, 'now')"],
    ["jest.spyOn(console, 'warn')"],
    ['queueResponse({ body: [] })'],
    ['client = createSeamClient()'],
    ['result = await client.market.getMarketPrices()'],
  ])('allows %s', async (code) => {
    expect(await violations(code)).toBe(0);
  });
});
