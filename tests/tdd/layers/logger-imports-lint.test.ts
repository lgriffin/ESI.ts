import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loggerImports = require('../../../eslint.logger-imports.rules.cjs');

const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfigFile: true,
  allowInlineConfig: false,
  overrideConfig: [
    { files: ['src/**/*.ts'], languageOptions: { parser: tseslint.parser } },
    ...loggerImports.loggerImportsConfig(),
  ],
});

async function restricted(filePath: string, source: string) {
  const [result] = await eslint.lintText(source, { filePath });
  return result.messages
    .filter((m) => m.ruleId === 'no-restricted-imports')
    .map((m) => m.line);
}

const importing = (specifier: string) =>
  `import { logInfo } from '${specifier}';\nexport { logInfo };\n`;

describe('logger-import lint rule (#265)', () => {
  it.each([
    ['src/core/requestPipeline/headers.ts', '../logger/loggerUtil'],
    ['src/core/requestPipeline/headers.ts', '../logger/loggerUtil.js'],
    ['src/core/requestPipeline/deep/x.ts', '../../logger/loggerUtil'],
    ['src/core/requestPipeline/headers.ts', '.././logger/loggerUtil'],
    ['src/clients/MarketClient.ts', '../core/logger/loggerUtil'],
    ['src/clients/MarketClient.ts', '../core/logger/loggerUtil.ts'],
  ])('fires in %s on an import of %s', async (file, specifier) => {
    expect(await restricted(file, importing(specifier))).toEqual([1]);
  });

  it('fires on a re-export and a type-only import too', async () => {
    expect(
      await restricted(
        'src/clients/MarketClient.ts',
        "export { logWarn } from '../core/logger/loggerUtil';\n" +
          "import type { ILogger } from '../core/logger/loggerUtil';\n" +
          'export type { ILogger };\n',
      ),
    ).toEqual([1, 2]);
  });

  it.each([
    // The per-client helpers are the sanctioned route.
    ['src/core/requestPipeline/headers.ts', '../logger/clientLog'],
    ['src/clients/MarketClient.ts', '../core/logger/clientLog'],
    ['src/clients/MarketClient.ts', '../core/logger/resolveLogger'],
    // A name that merely ends the same way is not the module.
    ['src/clients/MarketClient.ts', '../core/logger/loggerUtilities'],
    ['src/clients/MarketClient.ts', '../core/mylogger/loggerUtil'],
  ])('stays quiet in %s on an import of %s', async (file, specifier) => {
    expect(await restricted(file, importing(specifier))).toEqual([]);
  });

  it.each([
    'src/core/logger/resolveLogger.ts',
    'src/core/ApiRequestHandler.ts',
    'src/EsiClient.ts',
    'src/auth/EsiTokenManager.ts',
  ])(
    'does not apply outside the pipeline and the clients: %s',
    async (file) => {
      expect(await restricted(file, importing('./logger/loggerUtil'))).toEqual(
        [],
      );
    },
  );
});

const ESLINT_BIN = join(
  process.cwd(),
  'node_modules',
  'eslint',
  'bin',
  'eslint.js',
);

/**
 * The rule the real ESLint CLI resolves for a file under a config. Jest cannot
 * load the .mjs configs in-process, so this asks the CLI, as npm run lint does.
 */
function printedRule(file: string, ...args: string[]): unknown {
  const out = execFileSync(
    process.execPath,
    [ESLINT_BIN, ...args, '--print-config', file],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  return (JSON.parse(out) as { rules: Record<string, unknown> }).rules[
    'no-restricted-imports'
  ];
}

describe('logger-import lint rule wiring', () => {
  const expected = [
    2,
    {
      patterns: [expect.objectContaining({ regex: loggerImports.LOGGER_UTIL })],
    },
  ];

  it('is part of the main config that npm run lint uses', () => {
    expect(printedRule('src/core/requestPipeline/headers.ts')).toEqual(
      expected,
    );
  });

  it('is part of the layers config that runs with --no-inline-config', () => {
    expect(
      printedRule(
        'src/clients/MarketClient.ts',
        '--config',
        'eslint.layers.config.mjs',
      ),
    ).toEqual(expected);
  });
});
