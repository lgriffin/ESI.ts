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
      console.log(`  ${label}: not available to this token — skipped`);
      return null;
    }
    throw err;
  }
}

async function main() {
  const client = new EsiClient();

  try {
    console.log('Military Campaigns\n');

    // --- Public: List All Campaigns ---
    console.log('All Military Campaigns');
    console.log('-'.repeat(50));
    const { campaigns } = await client.militaryCampaigns.getMilitaryCampaigns();

    console.log(`  Campaigns found: ${campaigns.length}`);

    for (const campaign of campaigns.slice(0, 5)) {
      console.log(`    ${campaign.id} (${campaign.state})`);
      console.log(`      Progress: ${campaign.progress}`);
      if (campaign.started) console.log(`      Started: ${campaign.started}`);
      if (campaign.finished) {
        console.log(`      Finished: ${campaign.finished}`);
      }
    }
    if (campaigns.length > 5) {
      console.log(`    ... and ${campaigns.length - 5} more`);
    }

    // --- Public: Get Campaign Details ---
    const firstCampaign = campaigns[0];
    if (firstCampaign) {
      console.log(`\n  Campaign Detail: ${firstCampaign.id}`);
      const campaignDetail = await client.militaryCampaigns.getMilitaryCampaign(
        firstCampaign.id,
      );
      console.log(`    State: ${campaignDetail.state}`);
      console.log(`    Progress: ${campaignDetail.progress}`);

      // --- Public: Get Objectives (first page of up to 50) ---
      console.log(`\n  Objectives for campaign: ${firstCampaign.id}`);
      const { objectives, cursor } =
        await client.militaryCampaigns.getMilitaryCampaignObjectives(
          firstCampaign.id,
          undefined,
          undefined,
          50,
        );

      console.log(`    Objectives on this page: ${objectives.length}`);
      for (const obj of objectives.slice(0, 5)) {
        console.log(`    ${obj.id} (${obj.state})`);
        console.log(`      Progress: ${obj.progress}`);
        console.log(
          `      Participants: ${obj.participants.total} total, ${obj.participants.committed} committed, ${obj.participants.contributors} contributors`,
        );
      }
      if (cursor?.after) {
        console.log(`    More objectives follow (cursor ${cursor.after})`);
      }

      // --- Public: Get One Objective ---
      const firstObjective = objectives[0];
      if (firstObjective) {
        const objective =
          await client.militaryCampaigns.getMilitaryCampaignObjective(
            firstCampaign.id,
            firstObjective.id,
          );
        console.log(
          `\n  Objective ${objective.id}: ${objective.state}, progress ${objective.progress}`,
        );
      }
    }

    // --- Authenticated: Character Participation ---
    console.log('\nCharacter Campaign Participation');
    console.log('-'.repeat(50));
    if (!process.env.ESI_ACCESS_TOKEN) {
      console.log('  Needs ESI_ACCESS_TOKEN — skipped');
      return;
    }
    const charObjectives = await tryOrSkip('Character objectives', () =>
      client.militaryCampaigns.getCharacterMilitaryCampaignObjectives(
        CHARACTER_ID,
      ),
    );

    if (charObjectives) {
      const participated = charObjectives.objectives;
      console.log(`  Participated objectives: ${participated.length}`);
      for (const obj of participated.slice(0, 5)) {
        console.log(`    Objective: ${obj.id}`);
        console.log(`      Campaign: ${obj.campaign_id}`);
        console.log(`      Committed: ${obj.is_committed}`);
        console.log(`      Contributed: ${obj.contributed}`);
      }
      if (participated.length > 5) {
        console.log(`    ... and ${participated.length - 5} more`);
      }

      // Get detail on first objective
      const firstObj = participated[0];
      if (firstObj) {
        console.log(`\n  Detail for objective: ${firstObj.id}`);
        const detail = await tryOrSkip('Objective detail', () =>
          client.militaryCampaigns.getCharacterMilitaryCampaignObjective(
            CHARACTER_ID,
            firstObj.id,
          ),
        );
        if (detail) {
          console.log(`    Committed: ${detail.is_committed}`);
          console.log(`    Contributed: ${detail.contributed}`);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
