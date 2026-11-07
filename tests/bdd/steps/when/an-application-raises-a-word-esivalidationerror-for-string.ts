import { EsiValidationError } from '../../../../src/core/util/error';
import { When } from '../../support/steps';

When(
  'an application raises a {word} EsiValidationError for {string}',
  function (direction: string, url: string) {
    this.error = new EsiValidationError(
      url,
      new Error('shape'),
      undefined,
      direction as 'request' | 'response',
    );
  },
);
