import { ACTIVE_WAR_ID } from '../../support/wars';
import { When } from '../../support/steps';

When(
  'the client gathers full war data including details and killmails',
  async function () {
    const [details, killmails] = await Promise.all([
      this.client.wars.getWarById(ACTIVE_WAR_ID),
      this.client.wars.getWarKillmails(ACTIVE_WAR_ID),
    ]);
    this.values.details = details;
    this.values.killmails = killmails;
  },
);
