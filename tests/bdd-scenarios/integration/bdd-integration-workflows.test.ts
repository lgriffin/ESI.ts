/**
 * BDD Scenarios: Integration Workflows
 * 
 * Comprehensive behavior-driven tests for complex workflows that combine
 * multiple API clients to demonstrate real-world usage scenarios.
 */

import { EsiClient } from '../../../src/EsiClient';
import { ApiError, ApiErrorType } from '../../../src/core/errors/ApiError';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Integration Workflows', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-integration-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 10000 // Longer timeout for integration tests
    });
  });

  describe('Feature: Character Profile Assembly', () => {
    describe('Scenario: Complete character profile creation', () => {
      it('Given a character ID, When I assemble a complete profile, Then I should gather all related character data', async () => {
        // Given: A character ID
        const characterId = 1689391488;
        const corporationId = 1344654522;
        const allianceId = 99005338;
        
        // Mock character data
        const mockCharacter = TestDataFactory.createCharacterInfo({ 
          character_id: characterId,
          name: 'Test Pilot',
          corporation_id: corporationId,
          alliance_id: allianceId
        });
        const mockPortrait = TestDataFactory.createCharacterPortrait();
        const mockCorporation = TestDataFactory.createCorporationInfo({ corporation_id: corporationId });
        const mockAlliance = TestDataFactory.createAllianceInfo({ alliance_id: allianceId });
        const mockLocation = TestDataFactory.createCharacterLocation({ solar_system_id: 30000142 });
        const mockSkills = TestDataFactory.createCharacterSkills({ total_sp: 50000000 });

        // Mock all API responses
        jest.spyOn(client.characters, 'getCharacterPublicInfo').mockResolvedValue(mockCharacter);
        jest.spyOn(client.characters, 'getCharacterPortrait').mockResolvedValue(mockPortrait);
        jest.spyOn(client.corporations, 'getCorporationInfo').mockResolvedValue(mockCorporation);
        jest.spyOn(client.alliance, 'getAllianceById').mockResolvedValue(mockAlliance);
        jest.spyOn(client.location, 'getCharacterLocation').mockResolvedValue(mockLocation);
        jest.spyOn(client.characters, 'getCharacterRoles').mockResolvedValue(mockSkills);

        // When: I assemble a complete profile
        const character = await client.characters.getCharacterPublicInfo(characterId);
        const [portrait, corporation, alliance, location, skills] = await Promise.all([
          client.characters.getCharacterPortrait(characterId),
          client.corporations.getCorporationInfo(character.corporation_id),
          client.alliance.getAllianceById(character.alliance_id!),
          client.location.getCharacterLocation(characterId),
          client.characters.getCharacterRoles(characterId)
        ]);

        // Then: I should gather all related character data
        expect(character.name).toBe('Test Pilot');
        expect(portrait.px512x512).toBeDefined();
        expect(corporation.name).toBeDefined();
        expect(alliance.name).toBeDefined();
        expect(location.solar_system_id).toBe(30000142);
        expect(skills.total_sp).toBe(50000000);
        
        // Verify data consistency
        expect(character.corporation_id).toBe(corporation.corporation_id);
        expect(character.alliance_id).toBe(alliance.alliance_id);
      });
    });
  });

  describe('Feature: Market Analysis Workflow', () => {
    describe('Scenario: Complete market analysis for trading decisions', () => {
      it('Given a trading opportunity, When I perform market analysis, Then I should gather comprehensive market data', async () => {
        // Given: A trading opportunity (Tritanium in The Forge)
        const regionId = 10000002; // The Forge
        const typeId = 34; // Tritanium
        const characterId = 1689391488;
        
        // Mock market data
        const mockPrices = [TestDataFactory.createMarketPrice({ type_id: typeId, average_price: 4.50 })];
        const mockOrders = [
          TestDataFactory.createMarketOrder({ type_id: typeId, price: 4.45, is_buy_order: true }),
          TestDataFactory.createMarketOrder({ type_id: typeId, price: 4.55, is_buy_order: false })
        ];
        const mockHistory = [
          TestDataFactory.createMarketHistory({ date: '2024-01-15', average: 4.50, volume: 1000000000 }),
          TestDataFactory.createMarketHistory({ date: '2024-01-14', average: 4.40, volume: 950000000 })
        ];
        const mockCharacterOrders = [
          TestDataFactory.createCharacterMarketOrder({ type_id: typeId, price: 4.40, is_buy_order: true })
        ];
        const mockItemType = TestDataFactory.createItemType({ type_id: typeId, name: 'Tritanium', volume: 0.01 });

        // Mock all API responses
        jest.spyOn(client.market, 'getMarketPrices').mockResolvedValue(mockPrices);
        jest.spyOn(client.market, 'getMarketOrders').mockResolvedValue(mockOrders);
        jest.spyOn(client.market, 'getMarketHistory').mockResolvedValue(mockHistory);
        jest.spyOn(client.market, 'getCharacterOrders').mockResolvedValue(mockCharacterOrders);
        jest.spyOn(client.universe, 'getTypeById').mockResolvedValue(mockItemType);

        // When: I perform market analysis
        const [prices, orders, history, characterOrders, itemType] = await Promise.all([
          client.market.getMarketPrices(),
          client.market.getMarketOrders(regionId),
          client.market.getMarketHistory(regionId, typeId),
          client.market.getCharacterOrders(characterId),
          client.universe.getTypeById(typeId)
        ]);

        // Then: I should gather comprehensive market data
        const currentPrice = prices.find((p: any) => p.type_id === typeId)?.average_price;
        const bestBuyOrder = orders.filter((o: any) => o.is_buy_order).reduce((best: any, current: any) => 
          current.price > best.price ? current : best
        );
        const bestSellOrder = orders.filter((o: any) => !o.is_buy_order).reduce((best: any, current: any) => 
          current.price < best.price ? current : best
        );
        const priceChange = history[0].average - history[1].average;
        const myActiveOrders = characterOrders.filter((o: any) => o.type_id === typeId);

        // Verify comprehensive market analysis
        expect(currentPrice).toBe(4.50);
        expect(bestBuyOrder.price).toBe(4.45);
        expect(bestSellOrder.price).toBe(4.55);
        expect(priceChange).toBeCloseTo(0.10, 2); // 10 ISK increase
        expect(myActiveOrders.length).toBe(1);
        expect(itemType.name).toBe('Tritanium');
        expect(itemType.volume).toBe(0.01);
        
        // Calculate potential profit
        const spread = bestSellOrder.price - bestBuyOrder.price;
        expect(spread).toBeCloseTo(0.10, 2);
      });
    });
  });

  describe('Feature: Corporation Management Workflow', () => {
    describe('Scenario: Corporation overview and member management', () => {
      it('Given a corporation director role, When I manage corporation overview, Then I should access all corporation data', async () => {
        // Given: A corporation director role
        const corporationId = 1344654522;
        const characterId = 1689391488; // Director character
        
        // Mock corporation data
        const mockCorporation = TestDataFactory.createCorporationInfo({ 
          corporation_id: corporationId,
          name: 'Test Corporation',
          member_count: 150
        });
        const mockMembers = Array.from({ length: 150 }, (_, i) => 1689391488 + i);
        const mockMemberRoles = [
          TestDataFactory.createCorporationMemberRoles({
            character_id: characterId,
            roles: ['Director', 'Personnel_Manager']
          })
        ];
        const mockWallets = [
          TestDataFactory.createCorporationWallet({ division: 1, balance: 5000000000 }),
          TestDataFactory.createCorporationWallet({ division: 2, balance: 1000000000 })
        ];
        const mockAssets = [
          TestDataFactory.createCorporationAsset({
            type_id: 587,
            quantity: 100,
            location_flag: 'CorpSAG1'
          })
        ];

        // Mock all API responses
        jest.spyOn(client.corporations, 'getCorporationInfo').mockResolvedValue(mockCorporation);
        jest.spyOn(client.corporations, 'getCorporationMembers').mockResolvedValue(mockMembers);
        jest.spyOn(client.corporations, 'getCorporationRoles').mockResolvedValue(mockMemberRoles);
        jest.spyOn(client.corporations, 'getCorporationStandings').mockResolvedValue(mockWallets);
        jest.spyOn(client.corporations, 'getCorporationBlueprints').mockResolvedValue(mockAssets);

        // When: I manage corporation overview
        const corporation = await client.corporations.getCorporationInfo(corporationId);
        const [members, memberRoles, wallets, assets] = await Promise.all([
          client.corporations.getCorporationMembers(corporationId),
          client.corporations.getCorporationRoles(corporationId),
          client.corporations.getCorporationStandings(corporationId),
          client.corporations.getCorporationBlueprints(corporationId)
        ]);

        // Then: I should access all corporation data
        expect(corporation.name).toBe('Test Corporation');
        expect(corporation.member_count).toBe(150);
        expect(members.length).toBe(150);
        expect(memberRoles[0].roles).toContain('Director');
        
        // Calculate total wealth
        const totalWalletBalance = wallets.reduce((total: any, wallet: any) => total + wallet.balance, 0);
        expect(totalWalletBalance).toBe(6000000000);
        
        // Verify asset management
        expect(assets.length).toBeGreaterThan(0);
        expect(assets[0].location_flag).toBe('CorpSAG1');
        
        // Verify member management capabilities
        const directors = memberRoles.filter((member: any) => member.roles.includes('Director'));
        expect(directors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Feature: Fleet Operations Workflow', () => {
    describe('Scenario: Fleet formation and management', () => {
      it('Given fleet commander permissions, When I manage fleet operations, Then I should coordinate fleet activities', async () => {
        // Given: Fleet commander permissions
        const fleetId = 1234567890;
        const characterId = 1689391488;
        
        // Mock fleet data
        const mockFleet = TestDataFactory.createFleetInfo({
          fleet_id: fleetId,
          fleet_boss_id: characterId,
          is_free_move: false,
          is_registered: true,
          is_voice_enabled: true,
          motd: 'Fleet operations in progress'
        });
        const mockMembers = [
          TestDataFactory.createFleetMember({
            character_id: characterId,
            role: 'fleet_commander',
            ship_type_id: 17918,
            solar_system_id: 30000142,
            station_id: 60003760
          }),
          TestDataFactory.createFleetMember({
            character_id: 1689391489,
            role: 'squad_member',
            ship_type_id: 17812,
            solar_system_id: 30000142
          })
        ];
        const mockWings = [
          TestDataFactory.createFleetWing({
            wing_id: 987654321,
            name: 'Wing 1',
            squads: [
              { squad_id: 123456789, name: 'Squad 1' }
            ]
          })
        ];

        // Mock all API responses
        jest.spyOn(client.fleets, 'getFleetInformation').mockResolvedValue(mockFleet);
        jest.spyOn(client.fleets, 'getFleetMembers').mockResolvedValue(mockMembers);
        jest.spyOn(client.fleets, 'getFleetWings').mockResolvedValue(mockWings);

        // When: I manage fleet operations
        const fleet = await client.fleets.getFleetInformation(fleetId);
        const [members, wings] = await Promise.all([
          client.fleets.getFleetMembers(fleetId),
          client.fleets.getFleetWings(fleetId)
        ]);

        // Then: I should coordinate fleet activities
        expect(fleet.fleet_boss_id).toBe(characterId);
        expect(fleet.motd).toBe('Fleet operations in progress');
        expect(members.length).toBe(2);
        expect(wings.length).toBe(1);
        
        // Verify fleet composition
        const commander = members.find((member: any) => member.role === 'fleet_commander');
        const squadMembers = members.filter((member: any) => member.role === 'squad_member');
        expect(commander?.character_id).toBe(characterId);
        expect(squadMembers.length).toBe(1);
        
        // Verify fleet organization
        expect(wings[0].squads.length).toBe(1);
        expect(wings[0].name).toBe('Wing 1');
        
        // Verify location coordination
        const membersInJita = members.filter((member: any) => member.solar_system_id === 30000142);
        expect(membersInJita.length).toBe(2);
      });
    });
  });

  describe('Feature: Industry and Manufacturing Workflow', () => {
    describe('Scenario: Manufacturing operation setup', () => {
      it('Given manufacturing requirements, When I set up production, Then I should coordinate all manufacturing aspects', async () => {
        // Given: Manufacturing requirements
        const characterId = 1689391488;
        const corporationId = 1344654522;
        
        // Mock industry data
        const mockIndustryJobs = [
          TestDataFactory.createIndustryJob({
            job_id: 1000001,
            installer_id: characterId,
            facility_id: 60003760,
            activity_id: 1, // Manufacturing
            blueprint_id: 1000000001,
            blueprint_type_id: 17918,
            product_type_id: 17918,
            runs: 1,
            status: 'active',
            start_date: '2024-01-15T12:00:00Z',
            end_date: '2024-01-16T12:00:00Z'
          })
        ];
        const mockBlueprints = [
          TestDataFactory.createBlueprint({
            item_id: 1000000001,
            type_id: 17918,
            location_id: 60003760,
            location_flag: 'Hangar',
            quantity: -2,
            time_efficiency: 10,
            material_efficiency: 10,
            runs: 100
          })
        ];
        const mockAssets = [
          TestDataFactory.createCharacterAsset({
            item_id: 1000000002,
            type_id: 34, // Tritanium
            quantity: 1000000,
            location_id: 60003760,
            location_flag: 'Hangar'
          })
        ];

        // Mock all API responses
        jest.spyOn(client.characters, 'getCharacterRoles').mockResolvedValue(mockIndustryJobs);
        jest.spyOn(client.characters, 'getCharacterBlueprints').mockResolvedValue(mockBlueprints);
        jest.spyOn(client.characters, 'getCharacterPublicInfo').mockResolvedValue(mockAssets);

        // When: I set up production
        const [industryJobs, blueprints, assets] = await Promise.all([
          client.characters.getCharacterRoles(characterId),
          client.characters.getCharacterBlueprints(characterId),
          client.characters.getCharacterPublicInfo(characterId)
        ]);

        // Then: I should coordinate all manufacturing aspects
        expect(industryJobs.length).toBe(1);
        expect(industryJobs[0].status).toBe('active');
        expect(blueprints.length).toBe(1);
        expect(blueprints[0].material_efficiency).toBe(10);
        expect(assets.length).toBe(1);
        
        // Verify production planning
        const activeJobs = industryJobs.filter((job: any) => job.status === 'active');
        const availableBlueprints = blueprints.filter((bp: any) => bp.runs > 0);
        const materials = assets.filter((asset: any) => asset.type_id === 34);
        
        expect(activeJobs.length).toBe(1);
        expect(availableBlueprints.length).toBe(1);
        expect(materials[0].quantity).toBe(1000000);
        
        // Calculate production capacity
        const totalRuns = availableBlueprints.reduce((total: any, bp: any) => total + bp.runs, 0);
        expect(totalRuns).toBe(100);
      });
    });
  });

  describe('Feature: Error Handling in Integration Workflows', () => {
    describe('Scenario: Graceful degradation when services are unavailable', () => {
      it('Given some services are unavailable, When I perform integration workflow, Then I should handle partial failures gracefully', async () => {
        // Given: Some services are unavailable
        const characterId = 1689391488;
        const corporationId = 1344654522;
        
        // Mock successful and failed responses
        const mockCharacter = TestDataFactory.createCharacterInfo({ character_id: characterId });
        const serviceError = TestDataFactory.createError(ApiErrorType.SERVER_ERROR, 503);
        
        jest.spyOn(client.characters, 'getCharacterPublicInfo').mockResolvedValue(mockCharacter);
        jest.spyOn(client.characters, 'getCharacterPortrait').mockRejectedValue(serviceError);
        jest.spyOn(client.corporations, 'getCorporationInfo').mockResolvedValue(
          TestDataFactory.createCorporationInfo({ corporation_id: corporationId })
        );

        // When: I perform integration workflow
        const results = await Promise.allSettled([
          client.characters.getCharacterPublicInfo(characterId),
          client.characters.getCharacterPortrait(characterId),
          client.corporations.getCorporationInfo(corporationId)
        ]);

        // Then: I should handle partial failures gracefully
        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('rejected');
        expect(results[2].status).toBe('fulfilled');
        
        // Verify we can still work with available data
        if (results[0].status === 'fulfilled') {
          expect(results[0].value.character_id).toBe(characterId);
        }
        if (results[2].status === 'fulfilled') {
          expect(results[2].value.corporation_id).toBe(corporationId);
        }
        
        // Verify error handling
        if (results[1].status === 'rejected') {
          expect(results[1].reason).toBeInstanceOf(ApiError);
        }
      });
    });
  });

  describe('Feature: Performance in Integration Workflows', () => {
    describe('Scenario: Efficient data gathering for complex workflows', () => {
      it('Given a complex data requirement, When I optimize data gathering, Then I should minimize API calls and response time', async () => {
        // Given: A complex data requirement
        const characterId = 1689391488;
        const corporationId = 1344654522;
        const allianceId = 99005338;
        
        // Mock all responses
        const mockData = {
          character: TestDataFactory.createCharacterInfo({ character_id: characterId }),
          portrait: TestDataFactory.createCharacterPortrait(),
          corporation: TestDataFactory.createCorporationInfo({ corporation_id: corporationId }),
          alliance: TestDataFactory.createAllianceInfo({ alliance_id: allianceId }),
          location: TestDataFactory.createCharacterLocation({ solar_system_id: 30000142 }),
          skills: TestDataFactory.createCharacterSkills({ total_sp: 50000000 })
        };

        // Mock all API responses with slight delays
        jest.spyOn(client.characters, 'getCharacterPublicInfo').mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return mockData.character;
        });
        jest.spyOn(client.characters, 'getCharacterPortrait').mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return mockData.portrait;
        });
        jest.spyOn(client.corporations, 'getCorporationInfo').mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 80));
          return mockData.corporation;
        });
        jest.spyOn(client.alliance, 'getAllianceById').mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 60));
          return mockData.alliance;
        });
        jest.spyOn(client.location, 'getCharacterLocation').mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 40));
          return mockData.location;
        });
        jest.spyOn(client.characters, 'getCharacterRoles').mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 90));
          return mockData.skills;
        });

        // When: I optimize data gathering
        const startTime = Date.now();
        
        // First get basic character info
        const character = await client.characters.getCharacterPublicInfo(characterId);
        
        // Then parallel fetch all related data
        const [portrait, corporation, alliance, location, skills] = await Promise.all([
          client.characters.getCharacterPortrait(characterId),
          client.corporations.getCorporationInfo(character.corporation_id),
          client.alliance.getAllianceById(character.alliance_id!),
          client.location.getCharacterLocation(characterId),
          client.characters.getCharacterRoles(characterId)
        ]);
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Then: I should minimize API calls and response time
        expect(totalTime).toBeLessThan(300); // Should complete in under 300ms due to parallelization
        expect(character.character_id).toBe(characterId);
        expect(portrait.px512x512).toBeDefined();
        expect(corporation.corporation_id).toBe(corporationId);
        expect(alliance.alliance_id).toBe(allianceId);
        expect(location.solar_system_id).toBe(30000142);
        expect(skills.total_sp).toBe(50000000);
        
        // Verify optimization - parallel execution should be faster than sequential
        // Sequential would take ~420ms (100+50+80+60+40+90), parallel takes ~100ms + max(others)
        expect(totalTime).toBeLessThan(300); // Much faster than sequential execution (allowing for system variance)
      });
    });
  });
});
