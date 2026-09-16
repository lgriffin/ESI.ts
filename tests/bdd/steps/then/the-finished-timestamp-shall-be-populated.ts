import { FINISHED_WAR_ID, warPaths } from '../../support/wars';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the finished timestamp shall be populated', function () {
  expect(lastRequest().url.pathname).toBe(warPaths.war(FINISHED_WAR_ID));
  expect(this.result.id).toBe(700002);
  expect(this.result.finished).toBe('2024-01-01T00:00:00Z');

  const declared = new Date(this.result.declared).getTime();
  const started = new Date(this.result.started).getTime();
  const finished = new Date(this.result.finished).getTime();
  expect(declared).toBeLessThan(started);
  expect(started).toBeLessThan(finished);
});
