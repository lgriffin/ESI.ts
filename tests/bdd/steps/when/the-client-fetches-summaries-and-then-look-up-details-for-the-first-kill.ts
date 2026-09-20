import { PILOT_CHARACTER_ID } from '../../support/killmails';
import { When } from '../../support/steps';

When(
  'the client fetches summaries and then look up details for the first kill',
  async function () {
    const summaries =
      await this.client.killmails.getCharacterRecentKillmails(
        PILOT_CHARACTER_ID,
      );
    const firstSummary = summaries[0];
    this.values.summaries = summaries;
    this.values.detail = await this.client.killmails.getKillmail(
      firstSummary.killmail_id,
      firstSummary.killmail_hash,
    );
  },
);
