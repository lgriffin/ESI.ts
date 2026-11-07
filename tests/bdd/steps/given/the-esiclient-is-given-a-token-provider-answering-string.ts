import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import { Given } from '../../support/steps';

Given(
  'the EsiClient is given a token provider answering {string}',
  function (token: string) {
    (surfaceOf(this).built as EsiClient).setTokenProvider(() =>
      Promise.resolve(token),
    );
  },
);
