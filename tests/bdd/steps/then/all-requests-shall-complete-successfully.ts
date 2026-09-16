import { CONCURRENT_SYSTEM_IDS } from '../../support/universe';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('all requests shall complete successfully', function () {
  expect(sentRequests()).toHaveLength(3);
  expect(this.result.map((r: any) => r.system_id)).toEqual(
    CONCURRENT_SYSTEM_IDS,
  );
  expect(this.result.map((r: any) => r.name)).toEqual(
    CONCURRENT_SYSTEM_IDS.map((id) => `System ${id}`),
  );
});
