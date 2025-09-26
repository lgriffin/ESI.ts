/**
 * Flexible API Usage Examples
 * 
 * This demonstrates the different ways to use ESI.ts APIs:
 * 1. Full ESI Client
 * 2. Custom lightweight client
 * 3. Individual API clients
 * 4. Direct API instantiation
 */

import { 
  EsiClient, 
  CustomEsiClient, 
  EsiClientBuilder, 
  EsiApiFactory,
  CharacterClient,
  ApiClientBuilder 
} from '../src/index';

const DEMO_CHARACTER_ID = 1689391488;

async function demonstrateFlexibleUsage() {
  console.log('🚀 ESI.ts Flexible API Usage Examples');
  console.log('=====================================\n');

  // 1. Full ESI Client (All APIs)
  console.log('1️⃣  Full ESI Client (All APIs)');
  console.log('--------------------------------');
  const fullClient = new EsiClient({
    clientId: 'full-client-demo'
  });

  const character1 = await fullClient.characters.getCharacterPublicInfo(DEMO_CHARACTER_ID);
  console.log(`✅ Character: ${character1.body.name} (using full client)`);
  await fullClient.shutdown();

  // 2. Custom Lightweight Client (Selected APIs)
  console.log('\n2️⃣  Custom Lightweight Client (Selected APIs)');
  console.log('----------------------------------------------');
  const customClient = new CustomEsiClient({
    clientId: 'custom-client-demo',
    clients: ['characters', 'corporations'] // Only load what we need
  });

  const character2 = await customClient.characters?.getCharacterPublicInfo(DEMO_CHARACTER_ID);
  console.log(`✅ Character: ${character2?.body.name} (using custom client)`);
  console.log(`📊 Enabled clients: ${customClient.getEnabledClients().join(', ')}`);
  await customClient.shutdown();

  // 3. Builder Pattern
  console.log('\n3️⃣  Builder Pattern');
  console.log('-------------------');
  const builtClient = new EsiClientBuilder()
    .addClient('characters')
    .addClient('universe')
    .withClientId('builder-demo')
    .build();

  const character3 = await builtClient.characters?.getCharacterPublicInfo(DEMO_CHARACTER_ID);
  console.log(`✅ Character: ${character3?.body.name} (using builder pattern)`);
  await builtClient.shutdown();

  // 4. Individual API Client (Ultra Lightweight)
  console.log('\n4️⃣  Individual API Client (Ultra Lightweight)');
  console.log('----------------------------------------------');
  const characterClient = EsiApiFactory.createCharacterClient({
    clientId: 'standalone-character-client'
  });

  const character4 = await characterClient.getCharacterPublicInfo(DEMO_CHARACTER_ID);
  console.log(`✅ Character: ${character4.body.name} (using standalone client)`);

  // 5. Direct API Class Instantiation
  console.log('\n5️⃣  Direct API Class Instantiation');
  console.log('----------------------------------');
  const apiClient = new ApiClientBuilder()
    .setClientId('direct-api-demo')
    .setLink('https://esi.evetech.net')
    .build();

  const directCharacterClient = new CharacterClient(apiClient);
  const character5 = await directCharacterClient.getCharacterPublicInfo(DEMO_CHARACTER_ID);
  console.log(`✅ Character: ${character5.body.name} (using direct instantiation)`);

  console.log('\n🎯 Performance Comparison');
  console.log('=========================');
  
  // Measure startup times
  console.log('⏱️  Startup time comparison:');
  
  // Full client startup
  const fullStart = Date.now();
  const fullTestClient = new EsiClient({ clientId: 'perf-test-full' });
  const fullEnd = Date.now();
  console.log(`   Full Client: ${fullEnd - fullStart}ms`);
  await fullTestClient.shutdown();

  // Custom client startup
  const customStart = Date.now();
  const customTestClient = new CustomEsiClient({ 
    clientId: 'perf-test-custom', 
    clients: ['characters'] 
  });
  const customEnd = Date.now();
  console.log(`   Custom Client (1 API): ${customEnd - customStart}ms`);
  await customTestClient.shutdown();

  // Individual client startup
  const individualStart = Date.now();
  const individualTestClient = EsiApiFactory.createCharacterClient({ 
    clientId: 'perf-test-individual' 
  });
  const individualEnd = Date.now();
  console.log(`   Individual Client: ${individualEnd - individualStart}ms`);

  console.log('\n✨ All examples completed successfully!');
}

// Microservice example
async function priceServiceExample() {
  console.log('\n💰 Microservice Example: Price Service');
  console.log('======================================');

  class PriceService {
    private marketClient;

    constructor() {
      // Only load the market API
      this.marketClient = EsiApiFactory.createMarketClient({
        clientId: 'price-service-v1'
      });
    }

    async getCurrentPrice(typeId: number): Promise<number> {
      try {
        const prices = await this.marketClient.getMarketPrices();
        const price = prices.body.find((p: any) => p.type_id === typeId);
        return price?.average_price || 0;
      } catch (error) {
        console.error('Failed to get price:', error);
        return 0;
      }
    }
  }

  const priceService = new PriceService();
  const tritaniumPrice = await priceService.getCurrentPrice(34); // Tritanium
  console.log(`💎 Tritanium average price: ${tritaniumPrice.toFixed(2)} ISK`);
}

// Run all examples
async function runAllExamples() {
  try {
    await demonstrateFlexibleUsage();
    await priceServiceExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export { demonstrateFlexibleUsage, priceServiceExample };
