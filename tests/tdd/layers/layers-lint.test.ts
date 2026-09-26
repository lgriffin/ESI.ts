import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const layers = require('../../../eslint.layers.rules.cjs');

function linter(baseline?: Record<string, string>): ESLint {
  return new ESLint({
    cwd: process.cwd(),
    overrideConfigFile: true,
    allowInlineConfig: false,
    overrideConfig: layers.layersConfig(tseslint.parser, { baseline }),
  });
}

const RULE = 'layers/inward-imports';
const eslint = linter();

async function violations(filePath: string, specifier: string) {
  const [result] = await eslint.lintText(
    `import { x } from '${specifier}';\nexport { x };\n`,
    { filePath },
  );
  return result.messages
    .filter((m) => m.ruleId === RULE)
    .map((m) => /\[layers:([a-z]+)\]/.exec(m.message)?.[1]);
}

describe('layer lint rule', () => {
  it.each([
    ['src/core/ApiClient.ts', '../clients/MarketClient', 'core'],
    ['src/core/ApiClient.ts', '../EsiClient', 'core'],
    ['src/core/ApiClient.ts', '../EsiClientBuilder', 'core'],
    ['src/core/ApiClient.ts', '../index', 'core'],
    ['src/core/ApiClient.ts', '../generated/operations.generated', 'core'],
    ['src/core/ApiClient.ts', '../auth/EveSsoClient', 'core'],
    ['src/core/ApiClient.ts', '../testing', 'core'],
    ['src/core/ApiClient.ts', '../client/builder', 'core'],
    ['src/core/ApiClient.ts', '../adapters/PipelineTransport', 'core'],
    ['src/core/cache/Cache.ts', '../../clients/MarketClient', 'core'],
    ['src/core/requestPipeline/x/y.ts', '../../../sde/index', 'core'],
    ['src/core/ports/Clock.ts', '../ApiClient', 'ports'],
    ['src/core/ports/Clock.ts', 'zod', 'ports'],
    ['src/generated/operations.generated.ts', '../core/ApiClient', 'generated'],
    ['src/generated/operations.generated.ts', '../schemas', 'generated'],
    ['src/generated/operations.generated.ts', 'zod', 'generated'],
    ['src/client/Esi.ts', '../clients/MarketClient', 'legacy'],
    ['src/client/presets/public.ts', '../../EsiClient', 'legacy'],
    ['src/adapters/PipelineTransport.ts', '../index', 'legacy'],
    // Judged by where the specifier lands, not how it is spelled.
    ['src/core/ApiClient.ts', '.././clients/MarketClient', 'core'],
    ['src/core/ApiClient.ts', '../clients/../EsiClient', 'core'],
    ['src/core/ApiClient.ts', '../EsiClient.js', 'core'],
    ['src/core/ports/Clock.ts', './../ApiClient', 'ports'],
    ['src/core/ports/nested/Port.ts', '../../ApiClient', 'ports'],
    [
      'src/generated/operations.generated.ts',
      '../core/ports/../../clients/MarketClient',
      'generated',
    ],
    [
      'src/generated/nested/ops.generated.ts',
      '../../core/ApiClient',
      'generated',
    ],
    // No depth limit.
    [
      'src/core/a/b/c/d/e/f/g/h.ts',
      '../../../../../../../../clients/X',
      'core',
    ],
    [
      'src/client/a/b/c/d/e/f/g/h.ts',
      '../../../../../../../../index',
      'legacy',
    ],
  ])('%s may not import %s', async (file, specifier, layer) => {
    expect(await violations(file, specifier)).toEqual([layer]);
  });

  it.each([
    ['src/core/ApiClient.ts', './cache/ETagCacheManager'],
    ['src/core/ApiClient.ts', '../types/api-responses'],
    ['src/core/ApiClient.ts', '../schemas'],
    ['src/core/ApiClient.ts', '../errors'],
    ['src/core/ApiClient.ts', 'pino'],
    ['src/core/cache/Cache.ts', '../ports/OperationTransport'],
    ['src/core/requestPipeline/stages.ts', './index'],
    ['src/core/ports/Clock.ts', './OperationTransport'],
    [
      'src/generated/operations.generated.ts',
      '../core/ports/OperationTransport',
    ],
    ['src/client/Esi.ts', '../core/ports/OperationTransport'],
    ['src/client/Esi.ts', '../generated/operations.generated'],
    ['src/adapters/PipelineTransport.ts', '../core/ApiClient'],
    ['src/clients/MarketClient.ts', '../core/ApiClient'],
    ['src/core/ports/nested/Port.ts', '../OperationTransport'],
    [
      'src/generated/nested/ops.generated.ts',
      '../../core/ports/OperationTransport',
    ],
    ['src/core/ApiClient.ts', '../clientsLike/helper'],
    ['src/EsiClient.ts', './clients/MarketClient'],
  ])('%s may import %s', async (file, specifier) => {
    expect(await violations(file, specifier)).toEqual([]);
  });

  it.each([
    ["import type { A } from '../EsiClient';\nexport type { A };"],
    ["export * from '../EsiClient';"],
    ["export { A } from '../EsiClient';"],
    ["export let a: import('../EsiClient').EsiClient;"],
    ["export const a = import('../EsiClient');"],
    ["export const a = require('../EsiClient');"],
    ["import a = require('../EsiClient');\nexport { a };"],
  ])('reads the specifier of %s', async (code) => {
    const [result] = await eslint.lintText(`${code}\n`, {
      filePath: 'src/core/ApiClient.ts',
    });
    expect(result.messages.map((m) => m.ruleId)).toEqual([RULE]);
  });

  // The baseline only shrinks: an entry whose file no longer breaks the rule
  // must be deleted, so the exemption cannot outlive the violation.
  it.each(Object.keys(layers.BASELINE))(
    'baseline entry %s still breaks the rule',
    async (file) => {
      const [result] = await linter({}).lintFiles([file]);
      expect(result.messages.filter((m) => m.ruleId === RULE)).not.toHaveLength(
        0,
      );
    },
  );
});
