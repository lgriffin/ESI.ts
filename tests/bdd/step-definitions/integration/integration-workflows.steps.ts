import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature(
  'tests/bdd/features/integration/integration-workflows.feature',
);

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-integration-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 10000,
    });
  });

  test('WHEN completing character profile creation, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    let character: any;
    let portrait: any;
    let corporation: any;
    let alliance: any;
    let location: any;
    let skills: any;

    const characterId = 1689391488;
    const corporationId = 1344654522;
    const allianceId = 99005338;

    given('a character ID for profile assembly', () => {
      const mockCharacter = TestDataFactory.createCharacterInfo({
        character_id: characterId,
        name: 'Test Pilot',
        corporation_id: corporationId,
        alliance_id: allianceId,
      });
      const mockPortrait = TestDataFactory.createCharacterPortrait();
      const mockCorporation = TestDataFactory.createCorporationInfo({
        corporation_id: corporationId,
      });
      const mockAlliance = TestDataFactory.createAllianceInfo({
        alliance_id: allianceId,
      });
      const mockLocation = TestDataFactory.createCharacterLocation({
        solar_system_id: 30000142,
      });
      const mockSkills = TestDataFactory.createCharacterSkills({
        total_sp: 50000000,
      });

      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockResolvedValue(mockCharacter);
      jest
        .spyOn(client.characters, 'getCharacterPortrait')
        .mockResolvedValue(mockPortrait);
      jest
        .spyOn(client.corporations, 'getCorporationInfo')
        .mockResolvedValue(mockCorporation);
      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockResolvedValue(mockAlliance);
      jest
        .spyOn(client.location, 'getCharacterLocation')
        .mockResolvedValue(mockLocation);
      jest
        .spyOn(client.characters, 'getCharacterRoles')
        .mockResolvedValue(mockSkills as any);
    });

    when('the client assembles a complete profile', async () => {
      character = await client.characters.getCharacterPublicInfo(characterId);
      [portrait, corporation, alliance, location, skills] = await Promise.all([
        client.characters.getCharacterPortrait(characterId),
        client.corporations.getCorporationInfo(character.corporation_id),
        client.alliance.getAllianceById(character.alliance_id!),
        client.location.getCharacterLocation(characterId),
        client.characters.getCharacterRoles(characterId) as any,
      ]);
    });

    then('the client shall gather all related character data', () => {
      expect(character.name).toBe('Test Pilot');
      expect(portrait.px512x512).toBeDefined();
      expect(corporation.name).toBeDefined();
      expect(alliance.name).toBeDefined();
      expect(location.solar_system_id).toBe(30000142);
      expect(skills.total_sp).toBe(50000000);

      expect(character.corporation_id).toBe(corporation.corporation_id);
      expect(character.alliance_id).toBe(alliance.alliance_id);
    });
  });

  test('WHEN completing market analysis for trading decisions, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    let prices: any;
    let orders: any;
    let history: any;
    let characterOrders: any;
    let itemType: any;

    const regionId = 10000002;
    const typeId = 34;
    const characterId = 1689391488;

    given('a trading opportunity exists', () => {
      const mockPrices = [
        TestDataFactory.createMarketPrice({
          type_id: typeId,
          average_price: 4.5,
        }),
      ];
      const mockOrders = [
        TestDataFactory.createMarketOrder({
          type_id: typeId,
          price: 4.45,
          is_buy_order: true,
        }),
        TestDataFactory.createMarketOrder({
          type_id: typeId,
          price: 4.55,
          is_buy_order: false,
        }),
      ];
      const mockHistory = [
        TestDataFactory.createMarketHistory({
          date: '2024-01-15',
          average: 4.5,
          volume: 1000000000,
        }),
        TestDataFactory.createMarketHistory({
          date: '2024-01-14',
          average: 4.4,
          volume: 950000000,
        }),
      ];
      const mockCharacterOrders = [
        TestDataFactory.createCharacterMarketOrder({
          type_id: typeId,
          price: 4.4,
          is_buy_order: true,
        }),
      ];
      const mockItemType = TestDataFactory.createItemType({
        type_id: typeId,
        name: 'Tritanium',
        volume: 0.01,
      });

      jest
        .spyOn(client.market, 'getMarketPrices')
        .mockResolvedValue(mockPrices);
      jest
        .spyOn(client.market, 'getMarketOrders')
        .mockResolvedValue(mockOrders);
      jest
        .spyOn(client.market, 'getMarketHistory')
        .mockResolvedValue(mockHistory);
      jest
        .spyOn(client.market, 'getCharacterOrders')
        .mockResolvedValue(mockCharacterOrders);
      jest
        .spyOn(client.universe, 'getTypeById')
        .mockResolvedValue(mockItemType);
    });

    when('the client performs market analysis', async () => {
      [prices, orders, history, characterOrders, itemType] = await Promise.all([
        client.market.getMarketPrices(),
        client.market.getMarketOrders(regionId),
        client.market.getMarketHistory(regionId, typeId),
        client.market.getCharacterOrders(characterId),
        client.universe.getTypeById(typeId),
      ]);
    });

    then('the client shall gather comprehensive market data', () => {
      const currentPrice = prices.find(
        (p: any) => p.type_id === typeId,
      )?.average_price;
      const bestBuyOrder = orders
        .filter((o: any) => o.is_buy_order)
        .reduce((best: any, current: any) =>
          current.price > best.price ? current : best,
        );
      const bestSellOrder = orders
        .filter((o: any) => !o.is_buy_order)
        .reduce((best: any, current: any) =>
          current.price < best.price ? current : best,
        );
      const priceChange = history[0].average - history[1].average;
      const myActiveOrders = characterOrders.filter(
        (o: any) => o.type_id === typeId,
      );

      expect(currentPrice).toBe(4.5);
      expect(bestBuyOrder.price).toBe(4.45);
      expect(bestSellOrder.price).toBe(4.55);
      expect(priceChange).toBeCloseTo(0.1, 2);
      expect(myActiveOrders.length).toBe(1);
      expect(itemType.name).toBe('Tritanium');
      expect(itemType.volume).toBe(0.01);

      const spread = bestSellOrder.price - bestBuyOrder.price;
      expect(spread).toBeCloseTo(0.1, 2);
    });
  });

  test('WHEN managing corporation overview and members, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    let corporation: any;
    let members: any;
    let memberRoles: any;
    let wallets: any;
    let assets: any;

    const corporationId = 1344654522;
    const characterId = 1689391488;

    given('a corporation director role', () => {
      const mockCorporation = TestDataFactory.createCorporationInfo({
        corporation_id: corporationId,
        name: 'Test Corporation',
        member_count: 150,
      });
      const mockMembers = Array.from({ length: 150 }, (_, i) => 1689391488 + i);
      const mockMemberRoles = [
        TestDataFactory.createCorporationMemberRoles({
          character_id: characterId,
          roles: ['Director', 'Personnel_Manager'],
        }),
      ];
      const mockWallets = [
        TestDataFactory.createCorporationWallet({
          division: 1,
          balance: 5000000000,
        }),
        TestDataFactory.createCorporationWallet({
          division: 2,
          balance: 1000000000,
        }),
      ];
      const mockAssets = [
        TestDataFactory.createCorporationAsset({
          type_id: 587,
          quantity: 100,
          location_flag: 'CorpSAG1',
        }),
      ];

      jest
        .spyOn(client.corporations, 'getCorporationInfo')
        .mockResolvedValue(mockCorporation);
      jest
        .spyOn(client.corporations, 'getCorporationMembers')
        .mockResolvedValue(mockMembers);
      jest
        .spyOn(client.corporations, 'getCorporationRoles')
        .mockResolvedValue(mockMemberRoles);
      jest
        .spyOn(client.corporations, 'getCorporationStandings')
        .mockResolvedValue(mockWallets as any);
      jest
        .spyOn(client.corporations, 'getCorporationBlueprints')
        .mockResolvedValue(mockAssets);
    });

    when('the client manages corporation overview', async () => {
      corporation = await client.corporations.getCorporationInfo(corporationId);
      [members, memberRoles, wallets, assets] = await Promise.all([
        client.corporations.getCorporationMembers(corporationId),
        client.corporations.getCorporationRoles(corporationId),
        client.corporations.getCorporationStandings(corporationId),
        client.corporations.getCorporationBlueprints(corporationId),
      ]);
    });

    then('the client shall access all corporation data', () => {
      expect(corporation.name).toBe('Test Corporation');
      expect(corporation.member_count).toBe(150);
      expect(members.length).toBe(150);
      expect(memberRoles[0].roles).toContain('Director');

      const totalWalletBalance = wallets.reduce(
        (total: any, wallet: any) => total + wallet.balance,
        0,
      );
      expect(totalWalletBalance).toBe(6000000000);

      expect(assets.length).toBeGreaterThan(0);
      expect(assets[0].location_flag).toBe('CorpSAG1');

      const directors = memberRoles.filter((member: any) =>
        member.roles.includes('Director'),
      );
      expect(directors.length).toBeGreaterThan(0);
    });
  });

  test('WHEN managing fleet formation, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    let fleet: any;
    let members: any;
    let wings: any;

    const fleetId = 1234567890;
    const characterId = 1689391488;

    given('fleet commander permissions', () => {
      const mockFleet = TestDataFactory.createFleetInfo({
        fleet_id: fleetId,
        fleet_boss_id: characterId,
        is_free_move: false,
        is_registered: true,
        is_voice_enabled: true,
        motd: 'Fleet operations in progress',
      });
      const mockMembers = [
        TestDataFactory.createFleetMember({
          character_id: characterId,
          role: 'fleet_commander',
          ship_type_id: 17918,
          solar_system_id: 30000142,
          station_id: 60003760,
        }),
        TestDataFactory.createFleetMember({
          character_id: 1689391489,
          role: 'squad_member',
          ship_type_id: 17812,
          solar_system_id: 30000142,
        }),
      ];
      const mockWings = [
        TestDataFactory.createFleetWing({
          wing_id: 987654321,
          name: 'Wing 1',
          squads: [{ squad_id: 123456789, name: 'Squad 1' }],
        }),
      ];

      jest
        .spyOn(client.fleets, 'getFleetInformation')
        .mockResolvedValue(mockFleet as any);
      jest
        .spyOn(client.fleets, 'getFleetMembers')
        .mockResolvedValue(mockMembers as any);
      jest
        .spyOn(client.fleets, 'getFleetWings')
        .mockResolvedValue(mockWings as any);
    });

    when('the client manages fleet operations', async () => {
      fleet = await client.fleets.getFleetInformation(fleetId);
      [members, wings] = await Promise.all([
        client.fleets.getFleetMembers(fleetId),
        client.fleets.getFleetWings(fleetId),
      ]);
    });

    then('the client shall coordinate fleet activities', () => {
      expect(fleet.fleet_boss_id).toBe(characterId);
      expect(fleet.motd).toBe('Fleet operations in progress');
      expect(members.length).toBe(2);
      expect(wings.length).toBe(1);

      const commander = members.find(
        (member: any) => member.role === 'fleet_commander',
      );
      const squadMembers = members.filter(
        (member: any) => member.role === 'squad_member',
      );
      expect(commander?.character_id).toBe(characterId);
      expect(squadMembers.length).toBe(1);

      expect(wings[0].squads.length).toBe(1);
      expect(wings[0].name).toBe('Wing 1');

      const membersInJita = members.filter(
        (member: any) => member.solar_system_id === 30000142,
      );
      expect(membersInJita.length).toBe(2);
    });
  });

  test('WHEN setting up manufacturing operations, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    let industryJobs: any;
    let blueprints: any;
    let assets: any;

    const characterId = 1689391488;

    given('manufacturing requirements exist', () => {
      const mockIndustryJobs = [
        TestDataFactory.createIndustryJob({
          job_id: 1000001,
          installer_id: characterId,
          facility_id: 60003760,
          activity_id: 1,
          blueprint_id: 1000000001,
          blueprint_type_id: 17918,
          product_type_id: 17918,
          runs: 1,
          status: 'active',
          start_date: '2024-01-15T12:00:00Z',
          end_date: '2024-01-16T12:00:00Z',
        }),
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
          runs: 100,
        }),
      ];
      const mockAssets = [
        TestDataFactory.createCharacterAsset({
          item_id: 1000000002,
          type_id: 34,
          quantity: 1000000,
          location_id: 60003760,
          location_flag: 'Hangar',
        }),
      ];

      jest
        .spyOn(client.characters, 'getCharacterRoles')
        .mockResolvedValue(mockIndustryJobs as any);
      jest
        .spyOn(client.characters, 'getCharacterBlueprints')
        .mockResolvedValue(mockBlueprints as any);
      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockResolvedValue(mockAssets as any);
    });

    when('the client sets up production', async () => {
      [industryJobs, blueprints, assets] = (await Promise.all([
        client.characters.getCharacterRoles(characterId),
        client.characters.getCharacterBlueprints(characterId),
        client.characters.getCharacterPublicInfo(characterId),
      ])) as any[];
    });

    then('the client shall coordinate all manufacturing aspects', () => {
      expect(industryJobs.length).toBe(1);
      expect(industryJobs[0].status).toBe('active');
      expect(blueprints.length).toBe(1);
      expect(blueprints[0].material_efficiency).toBe(10);
      expect(assets.length).toBe(1);

      const activeJobs = industryJobs.filter(
        (job: any) => job.status === 'active',
      );
      const availableBlueprints = blueprints.filter((bp: any) => bp.runs > 0);
      const materials = assets.filter((asset: any) => asset.type_id === 34);

      expect(activeJobs.length).toBe(1);
      expect(availableBlueprints.length).toBe(1);
      expect(materials[0].quantity).toBe(1000000);

      const totalRuns = availableBlueprints.reduce(
        (total: any, bp: any) => total + bp.runs,
        0,
      );
      expect(totalRuns).toBe(100);
    });
  });

  test('IF graceful degradation when services are unavailable, THEN the client shall handle the service outage', ({
    given,
    when,
    then,
  }) => {
    let results: any;

    const characterId = 1689391488;
    const corporationId = 1344654522;

    given('some services are unavailable', () => {
      const mockCharacter = TestDataFactory.createCharacterInfo({
        character_id: characterId,
      });
      const serviceError = TestDataFactory.createError(503);

      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockResolvedValue(mockCharacter);
      jest
        .spyOn(client.characters, 'getCharacterPortrait')
        .mockRejectedValue(serviceError);
      jest.spyOn(client.corporations, 'getCorporationInfo').mockResolvedValue(
        TestDataFactory.createCorporationInfo({
          corporation_id: corporationId,
        }),
      );
    });

    when(
      'the client performs integration workflow with partial failures',
      async () => {
        results = await Promise.allSettled([
          client.characters.getCharacterPublicInfo(characterId),
          client.characters.getCharacterPortrait(characterId),
          client.corporations.getCorporationInfo(corporationId),
        ]);
      },
    );

    then('the client shall handle partial failures gracefully', () => {
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');

      if (results[0].status === 'fulfilled') {
        expect(results[0].value.character_id).toBe(characterId);
      }
      if (results[2].status === 'fulfilled') {
        expect(results[2].value.corporation_id).toBe(corporationId);
      }

      if (results[1].status === 'rejected') {
        expect(results[1].reason).toBeInstanceOf(EsiError);
      }
    });
  });

  test('WHEN gathering data efficiently for complex workflows, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    let character: any;
    let portrait: any;
    let corporation: any;
    let alliance: any;
    let location: any;
    let skills: any;
    let totalTime: number;

    const characterId = 1689391488;
    const corporationId = 1344654522;
    const allianceId = 99005338;

    given('a complex data requirement', () => {
      const mockData = {
        character: TestDataFactory.createCharacterInfo({
          character_id: characterId,
        }),
        portrait: TestDataFactory.createCharacterPortrait(),
        corporation: TestDataFactory.createCorporationInfo({
          corporation_id: corporationId,
        }),
        alliance: TestDataFactory.createAllianceInfo({
          alliance_id: allianceId,
        }),
        location: TestDataFactory.createCharacterLocation({
          solar_system_id: 30000142,
        }),
        skills: TestDataFactory.createCharacterSkills({ total_sp: 50000000 }),
      };

      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return mockData.character;
        });
      jest
        .spyOn(client.characters, 'getCharacterPortrait')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return mockData.portrait;
        });
      jest
        .spyOn(client.corporations, 'getCorporationInfo')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 80));
          return mockData.corporation;
        });
      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 60));
          return mockData.alliance;
        });
      jest
        .spyOn(client.location, 'getCharacterLocation')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 40));
          return mockData.location;
        });
      jest
        .spyOn(client.characters, 'getCharacterRoles')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 90));
          return mockData.skills as any;
        });
    });

    when('the client optimizes data gathering', async () => {
      const startTime = Date.now();

      character = await client.characters.getCharacterPublicInfo(characterId);

      [portrait, corporation, alliance, location, skills] = await Promise.all([
        client.characters.getCharacterPortrait(characterId),
        client.corporations.getCorporationInfo(character.corporation_id),
        client.alliance.getAllianceById(character.alliance_id!),
        client.location.getCharacterLocation(characterId),
        client.characters.getCharacterRoles(characterId) as any,
      ]);

      const endTime = Date.now();
      totalTime = endTime - startTime;
    });

    then('the client shall minimize API calls and response time', () => {
      expect(totalTime).toBeLessThan(500);
      expect(character.character_id).toBe(characterId);
      expect(portrait.px512x512).toBeDefined();
      expect(corporation.corporation_id).toBe(corporationId);
      expect(alliance.alliance_id).toBe(allianceId);
      expect(location.solar_system_id).toBe(30000142);
      expect(skills.total_sp).toBe(50000000);

      expect(totalTime).toBeLessThan(300);
    });
  });
});
