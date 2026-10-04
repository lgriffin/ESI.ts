/**
 * ESI.ts Example: Military Campaigns
 *
 * Demonstrates the six military campaign endpoints:
 *  - getMilitaryCampaigns (list all campaigns)
 *  - getMilitaryCampaign (specific campaign details)
 *  - getMilitaryCampaignObjectives (objectives for a campaign)
 *  - getMilitaryCampaignObjective (specific objective details)
 *  - getCharacterMilitaryCampaignObjectives (character's participated objectives)
 *  - getCharacterMilitaryCampaignObjective (character's participation in a specific objective)
 *
 * Public endpoints require no authentication.
 * Character endpoints REQUIRE AUTHENTICATION with scope:
 *  - esi.activity.char:read
 *
 * Usage: npm run example:military-campaigns
 *
 * @nightly mixed
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const CHARACTER_ID = 90439768;

/** Skips an authenticated call the token cannot make (no token, or wrong scope). */
async function tryOrSkip<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (
      err instanceof EsiError &&
      [401, 403, 404].includes(err.statusCode ?? 0)
    ) {
      log.info(`  ${label}: not available to this token — skipped`);
      return null;
    }
    throw err;
  }
}

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Military Campaigns\n');

    // --- Public: List All Campaigns ---
    log.info('All Military Campaigns');
    log.info('-'.repeat(50));
    const { campaigns } = await client.militaryCampaigns.getMilitaryCampaigns();

    log.info(`  Campaigns found: ${campaigns.length}`);

    for (const campaign of campaigns.slice(0, 5)) {
      log.info(`    ${campaign.id} (${campaign.state})`);
      log.info(`      Progress: ${campaign.progress}`);
      if (campaign.started) log.info(`      Started: ${campaign.started}`);
      if (campaign.finished) {
        log.info(`      Finished: ${campaign.finished}`);
      }
    }
    if (campaigns.length > 5) {
      log.info(`    ... and ${campaigns.length - 5} more`);
    }

    // --- Public: Get Campaign Details ---
    const firstCampaign = campaigns[0];
    if (firstCampaign) {
      log.info(`\n  Campaign Detail: ${firstCampaign.id}`);
      const campaignDetail = await client.militaryCampaigns.getMilitaryCampaign(
        firstCampaign.id,
      );
      log.info(`    State: ${campaignDetail.state}`);
      log.info(`    Progress: ${campaignDetail.progress}`);

      // --- Public: Get Objectives (first page of up to 50) ---
      log.info(`\n  Objectives for campaign: ${firstCampaign.id}`);
      const { objectives, cursor } =
        await client.militaryCampaigns.getMilitaryCampaignObjectives(
          firstCampaign.id,
          undefined,
          undefined,
          50,
        );

      log.info(`    Objectives on this page: ${objectives.length}`);
      for (const obj of objectives.slice(0, 5)) {
        log.info(`    ${obj.id} (${obj.state})`);
        log.info(`      Progress: ${obj.progress}`);
        log.info(
          `      Participants: ${obj.participants.total} total, ${obj.participants.committed} committed, ${obj.participants.contributors} contributors`,
        );
      }
      if (cursor?.after) {
        log.info(`    More objectives follow (cursor ${cursor.after})`);
      }

      // --- Public: Get One Objective ---
      const firstObjective = objectives[0];
      if (firstObjective) {
        const objective =
          await client.militaryCampaigns.getMilitaryCampaignObjective(
            firstCampaign.id,
            firstObjective.id,
          );
        log.info(
          `\n  Objective ${objective.id}: ${objective.state}, progress ${objective.progress}`,
        );
      }
    }

    // --- Authenticated: Character Participation ---
    log.info('\nCharacter Campaign Participation');
    log.info('-'.repeat(50));
    if (!process.env.ESI_ACCESS_TOKEN) {
      log.info('  Needs ESI_ACCESS_TOKEN — skipped');
      return;
    }
    const charObjectives = await tryOrSkip('Character objectives', () =>
      client.militaryCampaigns.getCharacterMilitaryCampaignObjectives(
        CHARACTER_ID,
      ),
    );

    if (charObjectives) {
      const participated = charObjectives.objectives;
      log.info(`  Participated objectives: ${participated.length}`);
      for (const obj of participated.slice(0, 5)) {
        log.info(`    Objective: ${obj.id}`);
        log.info(`      Campaign: ${obj.campaign_id}`);
        log.info(`      Committed: ${obj.is_committed}`);
        log.info(`      Contributed: ${obj.contributed}`);
      }
      if (participated.length > 5) {
        log.info(`    ... and ${participated.length - 5} more`);
      }

      // Get detail on first objective
      const firstObj = participated[0];
      if (firstObj) {
        log.info(`\n  Detail for objective: ${firstObj.id}`);
        const detail = await tryOrSkip('Objective detail', () =>
          client.militaryCampaigns.getCharacterMilitaryCampaignObjective(
            CHARACTER_ID,
            firstObj.id,
          ),
        );
        if (detail) {
          log.info(`    Committed: ${detail.is_committed}`);
          log.info(`    Contributed: ${detail.contributed}`);
        }
      }
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
