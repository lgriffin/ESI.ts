import { POWER_OUTPUT_ATTRIBUTE_ID } from '../../support/dogma';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return complete attribute information', function () {
  expect(lastRequest().url.pathname).toMatch(
    new RegExp(`/dogma/attributes/${POWER_OUTPUT_ATTRIBUTE_ID}/?$`),
  );
  expect(this.result.attribute_id).toBe(POWER_OUTPUT_ATTRIBUTE_ID);
  expect(this.result.name).toBe('powerOutput');
  expect(this.result.description).toBe('The amount of power available.');
  expect(this.result.published).toBe(true);
});
