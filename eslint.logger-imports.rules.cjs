/**
 * The pipeline logs through the per-client logger (CHARTER ARCH-09, #265).
 *
 * Files under src/core/requestPipeline and src/clients log with the helpers in
 * src/core/logger/clientLog.ts, which resolve the client's own logger first,
 * fall back to the global one, and redact URLs at that boundary (#296). The
 * global helpers in src/core/logger/loggerUtil.ts skip the client's logger, so
 * those directories may not import that module, by any relative path.
 *
 * The block is part of the main config (`npm run lint`) and of the layers
 * config, which runs with --no-inline-config (`npm run lint:layers`), so an
 * eslint-disable comment cannot get round it. tests/tdd/layers/
 * logger-imports-lint.test.ts proves it fires.
 */

/** Where the rule applies. */
const FILES = ['src/core/requestPipeline/**/*.ts', 'src/clients/**/*.ts'];

const MESSAGE =
  'Log through the per-client helpers in core/logger/clientLog (logInfo(client, ...)), not the global loggerUtil: a client logger set with EsiClientConfig.logger would never see the line.';

/** Any specifier whose last two segments are logger/loggerUtil, with or without an extension. */
const LOGGER_UTIL = '(^|/)logger/loggerUtil(\\.[cm]?[jt]s)?$';

function loggerImportsConfig() {
  return [
    {
      files: FILES,
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [{ regex: LOGGER_UTIL, message: MESSAGE }] },
        ],
      },
    },
  ];
}

module.exports = { FILES, LOGGER_UTIL, loggerImportsConfig };
