/**
 * ESI.ts - Working Example: Complete Character Profile
 *
 * This demonstrates how to use the ESI.ts library to gather comprehensive
 * character information by combining multiple API calls efficiently.
 *
 * @author lgriffin
 * @license GPL-3.0-or-later
 */

import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

// Demo character ID - a well-known EVE Online character (the author of this tool)
const DEMO_CHARACTER_ID = 1689391488;

/**
 * Complete Character Profile Assembly
 * This function demonstrates how to gather comprehensive character data
 * by making multiple parallel API calls for maximum efficiency.
 */
async function getCompleteCharacterProfile(client: EsiClient, characterId: number) {
  console.log(`\nGathering complete profile for character ID: ${characterId}`);

  try {
    // First, get basic character info to obtain corporation ID
    console.log('Fetching basic character information...');
    const character = await client.characters.getCharacterPublicInfo(characterId);

    // Now fetch all related data in parallel for maximum efficiency
    console.log('Fetching detailed profile data in parallel...');

    // Build parallel requests array based on what's available
    const requests: Promise<any>[] = [
      client.characters.getCharacterPortrait(characterId)
    ];

    // Only fetch corporation if we have a valid corporation_id
    if (character.corporation_id) {
      requests.push(client.corporations.getCorporationInfo(character.corporation_id));
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
        console.log('Character location unavailable (may be offline or restricted)');
        return null;
      })
    );

    const [portrait, corporation, alliance, location] = await Promise.all(requests);

    return {
      character: { ...character, character_id: characterId },
      portrait,
      corporation,
      alliance,
      location
    };
  } catch (error) {
    if (error instanceof EsiError) {
      if (error.statusCode === 404) {
        throw new Error(`Character ${characterId} not found`);
      } else if (error.statusCode === 420) {
        throw new Error(`Rate limited - please try again later`);
      } else if (error.statusCode >= 500) {
        throw new Error(`ESI server error (${error.statusCode}): ${error.message}`);
      } else if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error(`Authentication required - some data may not be available`);
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
  console.log('\n' + '='.repeat(60));
  console.log('CHARACTER PROFILE SUMMARY');
  console.log('='.repeat(60));

  console.log(`Name: ${profile.character.name}`);
  console.log(`Character ID: ${profile.character.character_id}`);
  console.log(`Birthday: ${new Date(profile.character.birthday).toLocaleDateString()}`);
  console.log(`Security Status: ${profile.character.security_status?.toFixed(2) || 'Unknown'}`);

  if (profile.corporation) {
    console.log(`\nCorporation: ${profile.corporation.name} [${profile.corporation.ticker}]`);
    console.log(`Members: ${profile.corporation.member_count?.toLocaleString() || 'Unknown'}`);
  } else {
    console.log(`\nCorporation: Information unavailable`);
  }

  if (profile.alliance) {
    console.log(`Alliance: ${profile.alliance.name} [${profile.alliance.ticker}]`);
    console.log(`Founded: ${new Date(profile.alliance.date_founded).toLocaleDateString()}`);
  } else {
    console.log(`Alliance: None`);
  }

  console.log(`\nPortrait URLs:`);
  console.log(`  64x64: ${profile.portrait.px64x64}`);
  console.log(`  128x128: ${profile.portrait.px128x128}`);
  console.log(`  256x256: ${profile.portrait.px256x256}`);
  console.log(`  512x512: ${profile.portrait.px512x512}`);

  if (profile.location) {
    console.log(`\nCurrent Location:`);
    console.log(`  Solar System ID: ${profile.location.solar_system_id}`);
    console.log(`  Ship Type ID: ${profile.location.ship_type_id || 'Unknown'}`);
    console.log(`  Station ID: ${profile.location.station_id || 'In space'}`);
  } else {
    console.log(`\nCurrent Location: Unavailable (character may be offline)`);
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main example function
 */
async function runCharacterProfileExample() {
  console.log('ESI.ts Character Profile Example');
  console.log('=====================================');

  const client = new EsiClient({
    clientId: 'esi-ts-example',
    timeout: 30000,
    retryAttempts: 3
  });

  try {
    const startTime = Date.now();
    const profile = await getCompleteCharacterProfile(client, DEMO_CHARACTER_ID);
    const endTime = Date.now();

    displayCharacterProfile(profile);

    console.log(`\nTotal execution time: ${endTime - startTime}ms`);
    console.log('Character profile retrieved successfully!');

  } catch (error) {
    console.error('\nError retrieving character profile:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    console.log('\nCleaning up resources...');
    await client.shutdown();
    console.log('Done!');
  }
}

if (require.main === module) {
  runCharacterProfileExample().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
