import { PILOT_CHARACTER_ID } from '../../support/killmails';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the full kill chain', function () {
  const { summaries, detail } = this.values;
  const requests = sentRequests();
  expect(requests).toHaveLength(2);
  // The detail request is addressed by the pair the summary carried.
  expect(requests[1].url.pathname).toMatch(
    /\/killmails\/300001\/chain_hash_001\/?$/,
  );
  // The public detail endpoint does not need the character's token.
  expect(requests[1].headers['authorization']).toBeUndefined();
  expect(summaries.map((s: any) => s.killmail_id)).toEqual([300001, 300002]);
  expect(detail.killmail_id).toBe(summaries[0].killmail_id);
  expect(detail.victim.ship_type_id).toBe(11393);
  expect(detail.attackers).toHaveLength(1);
  expect(detail.attackers[0].character_id).toBe(PILOT_CHARACTER_ID);
});
