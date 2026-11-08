import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import { Given } from '../../support/steps';

Given(
  'the EsiClient adds a request interceptor setting the header {string} to {string}',
  function (name: string, value: string) {
    (surfaceOf(this).built as EsiClient).addRequestInterceptor((context) => ({
      ...context,
      headers: { ...context.headers, [name]: value },
    }));
  },
);
