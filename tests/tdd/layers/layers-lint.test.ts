import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

const layers = require('../../../config/eslint/layers.rules.cjs');

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
    .map((m) => /\[layers:([a-zA-Z]+)\]/.exec(m.message)?.[1]);
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
    // The SDE is a side module: it reaches nothing in src/ but the ports...
    [
      'src/sde/providers/yaml/SdeDataProvider.ts',
      '../../../core/ApiClient',
      'sde',
    ],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../../errors', 'sde'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../../schemas', 'sde'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../../index', 'sde'],
    ['src/sde/ingestion/SdeDownloader.ts', '../../clients/MarketClient', 'sde'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', 'pino', 'sde'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', 'fs', 'sde'],
    // ...and nothing in src/ outside it reaches the SDE.
    ['src/index.ts', './sde', 'sideModule'],
    ['src/index.ts', './sde/index', 'sideModule'],
    ['src/clients/UniverseClient.ts', '../sde/memory', 'sideModule'],
    ['src/EsiClient.ts', './sde/providers/yaml/SdeDataProvider', 'sideModule'],
    ['src/client/Esi.ts', '../sde', 'sideModule'],
    [
      'src/adapters/StaticData.ts',
      '../sde/providers/memory/MemorySdeProvider',
      'sideModule',
    ],
    ['src/auth/EveSsoClient.ts', '../sde', 'sideModule'],
    ['src/testing/index.ts', '../sde/testing/SdeTestDataFactory', 'sideModule'],
    ['src/sdeLike/helper.ts', '../sde', 'sideModule'],
    // ...not even through the package's own exports.
    ['src/index.ts', '@lgriffin/esi.ts/sde', 'sideModule'],
    [
      'src/clients/UniverseClient.ts',
      '@lgriffin/esi.ts/sde/memory',
      'sideModule',
    ],
    ['src/adapters/StaticData.ts', '@lgriffin/esi.ts/sde/index', 'sideModule'],
    [
      'src/sde/providers/yaml/SdeDataProvider.ts',
      '@lgriffin/esi.ts/sde',
      'sde',
    ],
    // Inside the SDE the layers point inward too (Track S Run 12).
    [
      'src/sde/domain/universe/schemas.ts',
      '../../ports/IStaticDataProvider',
      'sdeLayer',
    ],
    ['src/sde/domain/universe/types.ts', '../../providers/order', 'sdeLayer'],
    ['src/sde/domain/universe/types.ts', '../../version', 'sdeLayer'],
    ['src/sde/domain/universe/schemas.ts', 'js-yaml', 'sdeLayer'],
    ['src/sde/domain/universe/schemas.ts', 'node:fs', 'sdeLayer'],
    [
      'src/sde/ports/IStaticDataProvider.ts',
      '../providers/yaml/SdeDataProvider',
      'sdeLayer',
    ],
    [
      'src/sde/ports/IStaticDataProvider.ts',
      '../ingestion/constants',
      'sdeLayer',
    ],
    [
      'src/sde/ingestion/SdeExtractor.ts',
      '../ports/IStaticDataProvider',
      'sdeLayer',
    ],
    [
      'src/sde/ingestion/SdeExtractor.ts',
      '../providers/yaml/SdeDataProvider',
      'sdeLayer',
    ],
    ['src/sde/ingestion/SdeExtractor.ts', '../domain/types', 'sdeLayer'],
    [
      'src/sde/ingestion/SdeExtractor.ts',
      '../testing/SdeTestDataFactory',
      'sdeLayer',
    ],
    [
      'src/sde/providers/yaml/SdeDataProvider.ts',
      '../../testing/SdeTestDataFactory',
      'sdeLayer',
    ],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../index', 'sdeLayer'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../memory', 'sdeLayer'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../..', 'sdeLayer'],
    [
      'src/sde/testing/SdeTestDataFactory.ts',
      '../ingestion/transforms',
      'sdeLayer',
    ],
    ['src/sde/testing/SdeTestDataFactory.ts', '../index', 'sdeLayer'],
    ['src/sde/errors.ts', './providers/order', 'sdeLayer'],
    ['src/sde/version.ts', './domain/types', 'sdeLayer'],
    ['src/sde/clock.ts', './ports/IStaticDataProvider', 'sdeLayer'],
    ['src/sde/index.ts', './memory', 'sdeLayer'],
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
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../errors'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../ingestion/transforms'],
    ['src/sde/ingestion/SdeDownloader.ts', '../errors'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../../core/ports/Clock'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../../core/ports'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', 'zod'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', 'js-yaml'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', 'adm-zip'],
    ['src/sde/ingestion/SdeDatabaseBuilder.ts', 'better-sqlite3'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', 'node:fs'],
    ['src/sde/optionalPeers.ts', 'node:module'],
    ['src/sde/optionalPeers.ts', './errors'],
    ['src/sde/domain/corporations/schemas.ts', '../universe/schemas'],
    ['src/sde/domain/schemas.ts', './universe/schemas'],
    ['src/sde/domain/universe/schemas.ts', 'zod'],
    ['src/sde/ports/IStaticDataProvider.ts', '../domain/types'],
    ['src/sde/ports/IStaticDataProvider.ts', '../version'],
    ['src/sde/ingestion/SdeExtractor.ts', '../optionalPeers'],
    ['src/sde/ingestion/SdeExtractor.ts', '../clock'],
    [
      'src/sde/providers/yaml/SdeDataProvider.ts',
      '../../ports/IStaticDataProvider',
    ],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../domain/types'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../order'],
    ['src/sde/providers/yaml/SdeDataProvider.ts', '../../ingestion'],
    ['src/sde/providers/memory/MemorySdeProvider.ts', '../../version'],
    ['src/sde/testing/SdeTestDataFactory.ts', '../domain/types'],
    [
      'src/sde/testing/SdeTestDataFactory.ts',
      '../providers/memory/MemorySdeProvider',
    ],
    ['src/sde/index.ts', './testing/SdeTestDataFactory'],
    ['src/sde/index.ts', './providers/yaml/SdeDataProvider'],
    ['src/sde/memory.ts', './ports/IStaticDataProvider'],
    ['src/sde/ingestion/SdeExtractor.ts', 'node:stream/promises'],
    ['src/index.ts', './sdeLike/helper'],
    ['src/index.ts', '@lgriffin/esi.ts-sde'],
    ['src/clients/UniverseClient.ts', '@lgriffin/esi.ts/schemas'],
    ['src/clients/UniverseClient.ts', '../core/ApiClient'],
  ])('%s may import %s', async (file, specifier) => {
    expect(await violations(file, specifier)).toEqual([]);
  });

  // In both directions and in every import form. The sde direction is
  // spelled out because the side-module check runs before the relative check.
  it.each([
    [
      'src/sde/providers/yaml/SdeDataProvider.ts',
      "import type { A } from '../../../core/ApiClient';\nexport type { A };",
      'sde',
    ],
    [
      'src/sde/providers/yaml/SdeDataProvider.ts',
      "export * from '../../../core/ApiClient';",
      'sde',
    ],
    [
      'src/sde/providers/yaml/SdeDataProvider.ts',
      "export const a = require('../../../core/ApiClient');",
      'sde',
    ],
    [
      'src/sde/providers/yaml/SdeDataProvider.ts',
      "export const a = require('pino');",
      'sde',
    ],
    [
      'src/sde/providers/yaml/SdeDataProvider.ts',
      "export let a: import('../../../core/ApiClient').ApiClient;",
      'sde',
    ],
    ['src/clients/UniverseClient.ts', "export * from '../sde';", 'sideModule'],
    [
      'src/clients/UniverseClient.ts',
      "export const a = import('../sde/memory');",
      'sideModule',
    ],
    [
      'src/clients/UniverseClient.ts',
      "export let a: import('../sde').IStaticDataProvider;",
      'sideModule',
    ],
  ])('%s: %s', async (file, code, layer) => {
    const [result] = await eslint.lintText(`${code}\n`, { filePath: file });
    expect(
      result.messages.map((m) => /\[layers:([a-zA-Z]+)\]/.exec(m.message)?.[1]),
    ).toEqual([layer]);
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

  // The baseline only ever shrank, and Phase 3 emptied it: no file in src is
  // exempt from the rule, and adding an exemption fails here.
  it('has an empty baseline: no file is exempt from the rule', () => {
    expect(layers.BASELINE).toEqual({});
  });
});
