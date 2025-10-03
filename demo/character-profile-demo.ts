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
import { ApiError, ApiErrorType } from '../src/core/errors/ApiError';

// Demo character ID - a well-known EVE Online character (the author of this tool)
const DEMO_CHARACTER_ID = 1689391488;

/**
 * Complete Character Profile Assembly
 * This function demonstrates how to gather comprehensive character data
 * by making multiple parallel API calls for maximum efficiency.
 */
async function getCompleteCharacterProfile(client: EsiClient, characterId: number) {
  console.log(`\n🔍 Gathering complete profile for character ID: ${characterId}`);
  
  try {
    // First, get basic character info to obtain corporation ID
    console.log('📋 Fetching basic character information...');
    const characterResponse = await client.characters.getCharacterPublicInfo(characterId);
    
    // Extract the actual character data from the response
    const character = characterResponse.body || characterResponse;
    
    // Now fetch all related data in parallel for maximum efficiency
    console.log('🚀 Fetching detailed profile data in parallel...');
    
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
      client.location.getCharacterLocation(characterId).catch(error => {
        console.log('⚠️  Character location unavailable (may be offline or restricted)');
        return null;
      })
    );

    const [portraitResponse, corporationResponse, allianceResponse, locationResponse] = await Promise.all(requests);

    return {
      character: { ...character, character_id: characterId }, // Ensure character_id is set
      portrait: portraitResponse?.body || portraitResponse,
      corporation: corporationResponse?.body || corporationResponse,
      alliance: allianceResponse?.body || allianceResponse,
      location: locationResponse?.body || locationResponse
    };
  } catch (error) {
    if (error instanceof ApiError) {
      switch (error.type) {
        case ApiErrorType.NOT_FOUND_ERROR:
          throw new Error(`Character ${characterId} not found`);
        case ApiErrorType.RATE_LIMIT_ERROR:
          throw new Error(`Rate limited - please try again later`);
        case ApiErrorType.SERVER_ERROR:
          throw new Error(`ESI server error (${error.statusCode}): ${error.message}`);
        case ApiErrorType.AUTHENTICATION_ERROR:
          throw new Error(`Authentication required - some data may not be available`);
        default:
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
  console.log('🎯 CHARACTER PROFILE SUMMARY');
  console.log('='.repeat(60));
  
  // Character basic info
  console.log(`👤 Name: ${profile.character.name}`);
  console.log(`🆔 Character ID: ${profile.character.character_id}`);
  console.log(`🎂 Birthday: ${new Date(profile.character.birthday).toLocaleDateString()}`);
  console.log(`⚖️  Security Status: ${profile.character.security_status?.toFixed(2) || 'Unknown'}`);
  
  // Corporation info
  if (profile.corporation) {
    console.log(`\n🏢 Corporation: ${profile.corporation.name} [${profile.corporation.ticker}]`);
    console.log(`👥 Members: ${profile.corporation.member_count?.toLocaleString() || 'Unknown'}`);
  } else {
    console.log(`\n🏢 Corporation: Information unavailable`);
  }
  
  // Alliance info (if available)
  if (profile.alliance) {
    console.log(`🤝 Alliance: ${profile.alliance.name} [${profile.alliance.ticker}]`);
    console.log(`📊 Founded: ${new Date(profile.alliance.date_founded).toLocaleDateString()}`);
  } else {
    console.log(`🤝 Alliance: None`);
  }
  
  // Portrait URLs
  console.log(`\n🖼️  Portrait URLs:`);
  console.log(`   📱 64x64: ${profile.portrait.px64x64}`);
  console.log(`   🖥️  128x128: ${profile.portrait.px128x128}`);
  console.log(`   🖼️  256x256: ${profile.portrait.px256x256}`);
  console.log(`   📺 512x512: ${profile.portrait.px512x512}`);
  
  // Location (if available)
  if (profile.location) {
    console.log(`\n📍 Current Location:`);
    console.log(`   🌌 Solar System ID: ${profile.location.solar_system_id}`);
    console.log(`   🚀 Ship Type ID: ${profile.location.ship_type_id || 'Unknown'}`);
    console.log(`   🏠 Station ID: ${profile.location.station_id || 'In space'}`);
  } else {
    console.log(`\n📍 Current Location: Unavailable (character may be offline)`);
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main example function
 * Demonstrates the complete workflow of using ESI.ts
 */
async function runCharacterProfileExample() {
  console.log('🚀 ESI.ts Character Profile Example');
  console.log('=====================================');
  
  // Initialize the ESI client
  const client = new EsiClient({
    clientId: 'esi-ts-example',
    timeout: 30000,
    retryAttempts: 3
  });

  try {
    // Get the complete character profile
    const startTime = Date.now();
    const profile = await getCompleteCharacterProfile(client, DEMO_CHARACTER_ID);
    const endTime = Date.now();
    
    // Display the results
    displayCharacterProfile(profile);
    
    console.log(`\n⏱️  Total execution time: ${endTime - startTime}ms`);
    console.log('✅ Character profile retrieved successfully!');
    
  } catch (error) {
    console.error('\n❌ Error retrieving character profile:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Always clean up resources
    console.log('\n🧹 Cleaning up resources...');
    await client.shutdown();
    console.log('✨ Done!');
  }
}

// Export the main functionality for library users
export { EsiClient } from '../src/EsiClient';
export { ApiError, ApiErrorType } from '../src/core/errors/ApiError';
export { ApiClient } from '../src/core/ApiClient';
export { ApiClientBuilder } from '../src/core/ApiClientBuilder';
export { getCompleteCharacterProfile, displayCharacterProfile };

// Export flexible client builders
export { 
  CustomEsiClient, 
  EsiApiFactory, 
  EsiClientBuilder,
  ApiClientType,
  ClientInstance 
} from '../src/EsiClientBuilder';

// Export individual client classes for direct use
export { AllianceClient } from '../src/clients/AllianceClient';
export { CharacterClient } from '../src/clients/CharacterClient';
export { CorporationsClient } from '../src/clients/CorporationsClient';
export { MarketClient } from '../src/clients/MarketClient';
export { UniverseClient } from '../src/clients/UniverseClient';
export { FleetClient } from '../src/clients/FleetClient';
export { AssetsClient } from '../src/clients/AssetsClient';
export { WalletClient } from '../src/clients/WalletClient';
export { MailClient } from '../src/clients/MailClient';

// Run the example if this file is executed directly
if (require.main === module) {
  runCharacterProfileExample().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

/**
 * Library Usage Example:
 * 
 * ```typescript
 * import { EsiClient, getCompleteCharacterProfile } from '@lgriffin/esi.ts';
 * 
 * const client = new EsiClient({ clientId: 'my-app' });
 * const profile = await getCompleteCharacterProfile(client, 1689391488);
 * console.log(profile.character.name);
 * await client.shutdown();
 * ```
 */
