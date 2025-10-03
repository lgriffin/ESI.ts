import { EsiApiFactory } from '../src/EsiClientBuilder';
import { getConfig } from '../src/config/configManager';

async function demonstrateUniverseRoutes() {
    try {
        // Get configuration
        const config = getConfig();
        
        // Build the Universe client using the factory
        const universeClient = EsiApiFactory.createUniverseClient({
            clientId: config.projectName,
            baseUrl: config.link,
            accessToken: config.authToken
        });

        console.log('🚀 Starting Universe Routes Demo...\n');

        // Step 1: Get all regions
        console.log('📋 Fetching all regions...');
        const regions = await universeClient.getRegions();
        console.log(`✅ Found ${regions?.length || 0} regions\n`);

        // Step 2: Get details for each region (limit to first 5 for demo)
        if (!regions || !Array.isArray(regions)) {
            console.log('❌ Regions response is not an array:', regions);
            return;
        }
        
        const regionsToProcess = regions.slice(0, 5);
        console.log(`🔍 Fetching details for first ${regionsToProcess.length} regions...\n`);

        for (let i = 0; i < regionsToProcess.length; i++) {
            const regionId = regionsToProcess[i];
            console.log(`[${i + 1}/${regionsToProcess.length}] Processing Region ID: ${regionId}`);
            
            try {
                const regionDetails = await universeClient.getRegionById(regionId);
                
                console.log(`   📍 Name: ${regionDetails.name}`);
                console.log(`   🆔 ID: ${regionDetails.region_id}`);
                console.log(`   📝 Description: ${regionDetails.description || 'No description'}`);
                console.log(`   🌌 Constellations: ${regionDetails.constellations?.length || 0}`);
                console.log(`   ⭐ Systems: ${regionDetails.systems?.length || 0}`);
                console.log('');
                
            } catch (error) {
                console.error(`   ❌ Error fetching region ${regionId}:`, error);
                console.log('');
            }
        }

        console.log('🎉 Universe routes demo completed!');
        
        // Bonus: Show a schematic example
        console.log('\n🔧 Bonus: Fetching a schematic example...');
        try {
            const schematic = await universeClient.getSchematicById(1);
            console.log(`   📋 Schematic: ${schematic.name}`);
            console.log(`   ⏱️  Cycle Time: ${schematic.cycle_time} seconds`);
            console.log(`   📦 Materials: ${schematic.materials?.length || 0} items`);
            console.log(`   🎯 Products: ${schematic.products?.length || 0} items`);
        } catch (error) {
            console.log(`   ⚠️  Schematic 1 not found (this is normal)`);
        }

    } catch (error) {
        console.error('❌ Error in universe demo:', error);
    }
}

// Run the demo
demonstrateUniverseRoutes();
