import { EsiApiFactory } from '../src/EsiClientBuilder';

async function demonstrateRateLimitingAndPagination() {
    try {
        console.log('Rate Limiting & Pagination Demo...\n');

        const universeClient = EsiApiFactory.createUniverseClient();

        console.log('Universe client created\n');

        // Test 1: Demonstrate rate limiting awareness
        console.log('Testing rate limiting awareness...');
        try {
            const startTime = Date.now();

            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(universeClient.getRegions());
            }

            const results = await Promise.all(promises);
            const endTime = Date.now();

            console.log(`Made 5 parallel requests in ${endTime - startTime}ms`);
            console.log(`Each request returned ${results[0]?.length || 0} regions`);

        } catch (error) {
            console.error('Rate limiting test failed:', error);
        }

        console.log('\n');

        // Test 2: Demonstrate pagination with a large dataset
        console.log('Testing pagination with universe types...');
        try {
            const startTime = Date.now();

            const types = await universeClient.getTypes();
            const endTime = Date.now();

            console.log(`Fetched ${types?.length || 0} types in ${endTime - startTime}ms`);
            console.log(`Average time per item: ${((endTime - startTime) / (types?.length || 1)).toFixed(2)}ms`);

        } catch (error) {
            console.error('Pagination test failed:', error);
        }

        console.log('\n');

        // Test 3: Demonstrate error handling
        console.log('Testing error handling...');
        try {
            await universeClient.getSchematicById(999999);
            console.log('Unexpected: Got schematic that should not exist');
        } catch (error) {
            console.log('Correctly handled non-existent schematic error');
        }

        console.log('\nRate limiting and pagination demo completed!');

    } catch (error) {
        console.error('Error in demo:', error);
    }
}

if (require.main === module) {
    demonstrateRateLimitingAndPagination();
}
