import { EsiError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the rejection shall name the unanswered request {string}',
  function (request: string) {
    expect(this.error).toBeInstanceOf(EsiError);
    expect((this.error as EsiError).message).toContain(request);
  },
);
