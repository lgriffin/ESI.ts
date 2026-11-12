import { SERVER_VERSION, START_TIME } from '../../support/status';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'each check shall return valid data with consistent server version',
  function () {
    expect(sentRequests()).toHaveLength(3);
    expect(this.result.map((r: any) => r.players)).toEqual([
      30000, 31000, 32500,
    ]);
    for (const result of this.result) {
      expect(result.server_version).toBe(SERVER_VERSION);
      expect(result.start_time).toBe(START_TIME);
    }
  },
);
