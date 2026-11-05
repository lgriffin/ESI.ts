import { guardsSatisfiedBy } from '../../support/error-guards';
import { When } from '../../support/steps';

When(
  'an application classifies its own Error with every error type guard',
  function () {
    this.result = guardsSatisfiedBy(new Error('the application failed'));
  },
);
