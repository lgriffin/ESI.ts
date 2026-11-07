import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import { Given } from '../../support/steps';

Given(
  'the EsiClient adds a response interceptor counting responses',
  function () {
    this.values.responses = 0;
    (surfaceOf(this).built as EsiClient).addResponseInterceptor((context) => {
      this.values.responses += 1;
      return context;
    });
  },
);
