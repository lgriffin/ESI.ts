import { toPinoLogger } from '../../../../src/core/logger/DefaultLogger';
import { pinoSink, useGlobalLogger } from '../../support/logging';
import { Given } from '../../support/steps';

Given(
  'the global logger adapts a pino-compatible sink with toPinoLogger',
  function () {
    const sink = pinoSink();
    this.values.sink = sink;
    useGlobalLogger(this, toPinoLogger(sink));
  },
);
