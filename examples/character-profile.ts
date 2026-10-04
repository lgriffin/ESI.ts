/**
 * ESI.ts - Working Example: Complete Character Profile
 *
 * This demonstrates how to use the ESI.ts library to gather comprehensive
 * character information by combining multiple API calls efficiently.
 *
 * Public endpoints are used for character info, portrait, corporation, and alliance.
 * The location endpoint is authenticated and will gracefully degrade without a token.
 *
 * ESI Scopes Required (optional, for full output):
 *   - esi-location.read_location.v1  (character location — degrades gracefully without token)
 *
 * @author lgriffin
 * @license GPL-3.0-or-later
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

// Demo character ID - a well-known EVE Online character (the author of this tool)
const DEMO_CHARACTER_ID = 1689391488;

/**
 * Complete Character Profile Assembly
 * This function demonstrates how to gather comprehensive character data
 * by making multiple parallel API calls for maximum efficiency.
 */
async function getCompleteCharacterProfile(
  client: EsiClient,
  characterId: number,
) {
  log.info(`\nGathering complete profile for character ID: ${characterId}`);

  try {
    // First, get basic character info to obtain corporation ID
    log.info('Fetching basic character information...');
    const character =
      await client.characters.getCharacterPublicInfo(characterId);

    // Now fetch all related data in parallel for maximum efficiency
    log.info('Fetching detailed profile data in parallel...');

    // Build parallel requests array based on what's available
    const requests: Promise<any>[] = [
      client.characters.getCharacterPortrait(characterId),
    ];

    // Only fetch corporation if we have a valid corporation_id
    if (character.corporation_id) {
      requests.push(
        client.corporations.getCorporationInfo(character.corporation_id),
      );
    } else {
      requests.push(Promise.resolve(null));
    }

    // Only fetch alliance if character has one
    if (character.alliance_id) {
      requests.push(client.alliance.getAllianceById(character.alliance_id));
    } else {
      requests.push(Promise.resolve(null));
    }

    // Location is often restricted, so handle gracefully
    requests.push(
      client.location.getCharacterLocation(characterId).catch(() => {
        log.info(
          'Character location unavailable (may be offline or restricted)',
        );
        return null;
      }),
    );

    const [portrait, corporation, alliance, location] =
      await Promise.all(requests);

    return {
      character: { ...character, character_id: characterId },
      portrait,
      corporation,
      alliance,
      location,
    };
  } catch (error) {
    if (error instanceof EsiError) {
      if (error.statusCode === 404) {
        throw new Error(`Character ${characterId} not found`);
      } else if (error.statusCode === 420) {
        throw new Error(`Rate limited - please try again later`);
      } else if (error.statusCode >= 500) {
        throw new Error(
          `ESI server error (${error.statusCode}): ${error.message}`,
        );
      } else if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error(
          `Authentication required - some data may not be available`,
        );
      } else {
        throw new Error(`API error: ${error.message}`);
      }
    }
    throw error;
  }
}

/**
 * Format and display the character profile data
 */
function displayCharacterProfile(profile: any) {
  log.info('\n' + '='.repeat(60));
  log.info('CHARACTER PROFILE SUMMARY');
  log.info('='.repeat(60));

  log.info(`Name: ${profile.character.name}`);
  log.info(`Character ID: ${profile.character.character_id}`);
  log.info(
    `Birthday: ${new Date(profile.character.birthday).toLocaleDateString()}`,
  );
  log.info(
    `Security Status: ${profile.character.security_status?.toFixed(2) || 'Unknown'}`,
  );

  if (profile.corporation) {
    log.info(
      `\nCorporation: ${profile.corporation.name} [${profile.corporation.ticker}]`,
    );
    log.info(
      `Members: ${profile.corporation.member_count?.toLocaleString() || 'Unknown'}`,
    );
  } else {
    log.info(`\nCorporation: Information unavailable`);
  }

  if (profile.alliance) {
    log.info(`Alliance: ${profile.alliance.name} [${profile.alliance.ticker}]`);
    log.info(
      `Founded: ${new Date(profile.alliance.date_founded).toLocaleDateString()}`,
    );
  } else {
    log.info(`Alliance: None`);
  }

  log.info(`\nPortrait URLs:`);
  log.info(`  64x64: ${profile.portrait.px64x64}`);
  log.info(`  128x128: ${profile.portrait.px128x128}`);
  log.info(`  256x256: ${profile.portrait.px256x256}`);
  log.info(`  512x512: ${profile.portrait.px512x512}`);

  if (profile.location) {
    log.info(`\nCurrent Location:`);
    log.info(`  Solar System ID: ${profile.location.solar_system_id}`);
    log.info(`  Ship Type ID: ${profile.location.ship_type_id || 'Unknown'}`);
    log.info(`  Station ID: ${profile.location.station_id || 'In space'}`);
  } else {
    log.info(`\nCurrent Location: Unavailable (character may be offline)`);
  }

  log.info('\n' + '='.repeat(60));
}

/**
 * Main example function
 */
async function runCharacterProfileExample() {
  log.info('ESI.ts Character Profile Example');
  log.info('=====================================');

  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-example',
    timeout: 30000,
    retryAttempts: 3,
  });

  try {
    const startTime = Date.now();
    const profile = await getCompleteCharacterProfile(
      client,
      DEMO_CHARACTER_ID,
    );
    const endTime = Date.now();

    displayCharacterProfile(profile);

    log.info(`\nTotal execution time: ${endTime - startTime}ms`);
    log.info('Character profile retrieved successfully!');
  } catch (error) {
    log.error('Error retrieving character profile', { error: error });
    process.exit(1);
  } finally {
    log.info('\nCleaning up resources...');
    await client.shutdown();
    log.info('Done!');
  }
}

if (require.main === module) {
  runCharacterProfileExample().catch((error) => {
    log.error('Fatal error', { error: error });
    process.exit(1);
  });
}
