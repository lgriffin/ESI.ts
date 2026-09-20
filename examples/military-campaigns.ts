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
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 90439768;

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
      console.log(`  ${label}: endpoint not available — skipped`);
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
    const campaigns = await tryOrSkip('Campaigns', () =>
      client.militaryCampaigns.getMilitaryCampaigns(),
    );

    if (campaigns) {
      console.log(`  Campaigns found: ${campaigns.length}`);

      for (const campaign of campaigns.slice(0, 5)) {
        console.log(`    ${campaign.campaign_id} (${campaign.state})`);
        console.log(
          `      Progress: ${(campaign.progress * 100).toFixed(1)}%`,
        );
        console.log(`      Started: ${campaign.start_time}`);
        if (campaign.finish_time) {
          console.log(`      Finished: ${campaign.finish_time}`);
        }
      }
      if (campaigns.length > 5) {
        console.log(`    ... and ${campaigns.length - 5} more`);
      }

      // --- Public: Get Campaign Details ---
      if (campaigns.length > 0) {
        const firstCampaign = campaigns[0]!;
        console.log(`\n  Campaign Detail: ${firstCampaign.campaign_id}`);
        const campaignDetail = await tryOrSkip('Campaign detail', () =>
          client.militaryCampaigns.getMilitaryCampaign(
            firstCampaign.campaign_id,
          ),
        );
        if (campaignDetail) {
          console.log(`    State: ${campaignDetail.state}`);
          console.log(
            `    Progress: ${(campaignDetail.progress * 100).toFixed(1)}%`,
          );
        }

        // --- Public: Get Objectives ---
        console.log(`\n  Objectives for campaign: ${firstCampaign.campaign_id}`);
        const objectives = await tryOrSkip('Objectives', () =>
          client.militaryCampaigns.getMilitaryCampaignObjectives(
            firstCampaign.campaign_id,
          ),
        );

        if (objectives) {
          console.log(`    Objectives found: ${objectives.length}`);
          for (const obj of objectives.slice(0, 5)) {
            console.log(`    ${obj.objective_id} (${obj.state})`);
            console.log(
              `      Progress: ${(obj.progress * 100).toFixed(1)}%`,
            );
            console.log(
              `      Participants: ${obj.participants.total} total, ${obj.participants.committed} committed, ${obj.participants.contributors} contributors`,
            );
          }
          if (objectives.length > 5) {
            console.log(`    ... and ${objectives.length - 5} more`);
          }
        }
      }
    }

    // --- Authenticated: Character Participation ---
    console.log('\nCharacter Campaign Participation');
    console.log('-'.repeat(50));
    const charObjectives = await tryOrSkip('Character objectives', () =>
      client.militaryCampaigns.getCharacterMilitaryCampaignObjectives(
        CHARACTER_ID,
      ),
    );

    if (charObjectives) {
      console.log(`  Participated objectives: ${charObjectives.length}`);
      for (const obj of charObjectives.slice(0, 5)) {
        console.log(`    Objective: ${obj.objective_id}`);
        console.log(`      Campaign: ${obj.campaign_id}`);
        console.log(`      Committed: ${obj.committed}`);
        console.log(`      Contribution: ${obj.contribution}`);
      }
      if (charObjectives.length > 5) {
        console.log(`    ... and ${charObjectives.length - 5} more`);
      }

      // Get detail on first objective
      if (charObjectives.length > 0) {
        const firstObj = charObjectives[0]!;
        console.log(`\n  Detail for objective: ${firstObj.objective_id}`);
        const detail = await tryOrSkip('Objective detail', () =>
          client.militaryCampaigns.getCharacterMilitaryCampaignObjective(
            CHARACTER_ID,
            firstObj.objective_id,
          ),
        );
        if (detail) {
          console.log(`    Committed: ${detail.committed}`);
          console.log(`    Contribution: ${detail.contribution}`);
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
