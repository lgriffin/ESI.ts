import { toPinoLogger } from '../../../../src/core/logger/DefaultLogger';
import type { LoggerLevel } from '../../../../src/core/logger/ILogger';
import { pinoSink, useGlobalLogger } from '../../support/logging';
import { Given } from '../../support/steps';

Given(
  'the global logger adapts a pino-compatible sink with level values that reports {string} disabled with toPinoLogger',
  function (level: LoggerLevel) {
    const sink = pinoSink({ levelValues: true, disabled: [level] });
    this.values.sink = sink;
    useGlobalLogger(this, toPinoLogger(sink));
  },
);
