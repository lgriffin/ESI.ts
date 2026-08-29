import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('TestDataFactory', () => {
  describe('Alliance factories', () => {
    it('should create alliance info with defaults', () => {
      const info = TestDataFactory.createAllianceInfo();
      expect(info.alliance_id).toBe(99005338);
      expect(info.name).toBe('Goonswarm Federation');
      expect(info.ticker).toBe('CONDI');
    });

    it('should create alliance info with overrides', () => {
      const info = TestDataFactory.createAllianceInfo({ name: 'Test' });
      expect(info.name).toBe('Test');
      expect(info.alliance_id).toBe(99005338);
    });

    it('should create alliance contact with defaults', () => {
      const contact = TestDataFactory.createAllianceContact();
      expect(contact.contact_id).toBe(1689391488);
      expect(contact.standing).toBe(10.0);
    });

    it('should create alliance contact with overrides', () => {
      const contact = TestDataFactory.createAllianceContact({ standing: -5 });
      expect(contact.standing).toBe(-5);
    });

    it('should create alliance contact label with defaults', () => {
      const label = TestDataFactory.createAllianceContactLabel();
      expect(label.label_id).toBe(1);
      expect(label.label_name).toBe('Friendly');
    });

    it('should create alliance contact label with overrides', () => {
      const label = TestDataFactory.createAllianceContactLabel({
        label_name: 'Hostile',
      });
      expect(label.label_name).toBe('Hostile');
    });
  });

  describe('Character factories', () => {
    it('should create character info with defaults', () => {
      const info = TestDataFactory.createCharacterInfo();
      expect(info.character_id).toBe(1689391488);
      expect(info.name).toBe('Test Character');
    });

    it('should create character info with overrides', () => {
      const info = TestDataFactory.createCharacterInfo({ name: 'Other' });
      expect(info.name).toBe('Other');
    });

    it('should create character portrait with default id', () => {
      const portrait = TestDataFactory.createCharacterPortrait();
      expect(portrait.px64x64).toContain('1689391488');
    });

    it('should create character portrait with custom id', () => {
      const portrait = TestDataFactory.createCharacterPortrait(999);
      expect(portrait.px64x64).toContain('999');
    });

    it('should create character attributes with defaults', () => {
      const attrs = TestDataFactory.createCharacterAttributes();
      expect(attrs.charisma).toBe(20);
      expect(attrs.intelligence).toBe(24);
    });

    it('should create character attributes with overrides', () => {
      const attrs = TestDataFactory.createCharacterAttributes({ charisma: 30 });
      expect(attrs.charisma).toBe(30);
    });

    it('should create character skill with defaults', () => {
      const skill = TestDataFactory.createCharacterSkill();
      expect(skill.skill_id).toBe(3300);
      expect(skill.trained_skill_level).toBe(5);
    });

    it('should create character skill with overrides', () => {
      const skill = TestDataFactory.createCharacterSkill({
        trained_skill_level: 3,
      });
      expect(skill.trained_skill_level).toBe(3);
    });

    it('should create character roles with defaults', () => {
      const roles = TestDataFactory.createCharacterRoles();
      expect(roles.roles).toContain('Director');
    });

    it('should create character roles with overrides', () => {
      const roles = TestDataFactory.createCharacterRoles({
        roles: ['Accountant'],
      });
      expect(roles.roles).toContain('Accountant');
    });

    it('should create corporation history entry with defaults', () => {
      const entry = TestDataFactory.createCorporationHistoryEntry();
      expect(entry.corporation_id).toBe(1344654522);
    });

    it('should create corporation history entry with overrides', () => {
      const entry = TestDataFactory.createCorporationHistoryEntry({
        corporation_id: 999,
      });
      expect(entry.corporation_id).toBe(999);
    });

    it('should create character medal with defaults', () => {
      const medal = TestDataFactory.createCharacterMedal();
      expect(medal.medal_id).toBe(1);
      expect(medal.title).toBe('Test Medal');
    });

    it('should create character medal with overrides', () => {
      const medal = TestDataFactory.createCharacterMedal({ title: 'Custom' });
      expect(medal.title).toBe('Custom');
    });

    it('should create character notification with defaults', () => {
      const notif = TestDataFactory.createCharacterNotification();
      expect(notif.notification_id).toBe(1000001);
      expect(notif.is_read).toBe(false);
    });

    it('should create character notification with overrides', () => {
      const notif = TestDataFactory.createCharacterNotification({
        is_read: true,
      });
      expect(notif.is_read).toBe(true);
    });

    it('should create character location with defaults', () => {
      const loc = TestDataFactory.createCharacterLocation();
      expect(loc.solar_system_id).toBe(30000142);
    });

    it('should create character location with overrides', () => {
      const loc = TestDataFactory.createCharacterLocation({
        solar_system_id: 99,
      });
      expect(loc.solar_system_id).toBe(99);
    });

    it('should create character skills with defaults', () => {
      const skills = TestDataFactory.createCharacterSkills();
      expect(skills.total_sp).toBe(384000);
      expect(skills.skills).toHaveLength(2);
    });

    it('should create character skills with overrides', () => {
      const skills = TestDataFactory.createCharacterSkills({ total_sp: 0 });
      expect(skills.total_sp).toBe(0);
    });

    it('should create character asset with defaults', () => {
      const asset = TestDataFactory.createCharacterAsset();
      expect(asset.type_id).toBe(34);
      expect(asset.quantity).toBe(1000000);
    });

    it('should create character asset with overrides', () => {
      const asset = TestDataFactory.createCharacterAsset({ quantity: 1 });
      expect(asset.quantity).toBe(1);
    });
  });

  describe('Market factories', () => {
    it('should create market price with defaults', () => {
      const price = TestDataFactory.createMarketPrice();
      expect(price.type_id).toBe(34);
      expect(price.average_price).toBe(4.5);
    });

    it('should create market price with overrides', () => {
      const price = TestDataFactory.createMarketPrice({ average_price: 10 });
      expect(price.average_price).toBe(10);
    });

    it('should create market history with defaults', () => {
      const hist = TestDataFactory.createMarketHistory();
      expect(hist.volume).toBe(1000000000);
    });

    it('should create market history with overrides', () => {
      const hist = TestDataFactory.createMarketHistory({ volume: 0 });
      expect(hist.volume).toBe(0);
    });

    it('should create character market order with defaults', () => {
      const order = TestDataFactory.createCharacterMarketOrder();
      expect(order.order_id).toBe(5000000001);
      expect(order.is_buy_order).toBe(true);
    });

    it('should create character market order with overrides', () => {
      const order = TestDataFactory.createCharacterMarketOrder({
        is_buy_order: false,
      });
      expect(order.is_buy_order).toBe(false);
    });

    it('should create character order history with defaults', () => {
      const order = TestDataFactory.createCharacterOrderHistory();
      expect(order.state).toBe('expired');
    });

    it('should create character order history with overrides', () => {
      const order = TestDataFactory.createCharacterOrderHistory({
        state: 'cancelled',
      });
      expect(order.state).toBe('cancelled');
    });

    it('should create market order with defaults', () => {
      const order = TestDataFactory.createMarketOrder();
      expect(order.order_id).toBe(123456789);
      expect(order.type_id).toBe(34);
    });

    it('should create market order with overrides', () => {
      const order = TestDataFactory.createMarketOrder({ price: 99 });
      expect(order.price).toBe(99);
    });
  });

  describe('Universe factories', () => {
    it('should create solar system with defaults', () => {
      const system = TestDataFactory.createSolarSystem();
      expect(system.system_id).toBe(30000142);
      expect(system.name).toBe('Jita');
    });

    it('should create solar system with overrides', () => {
      const system = TestDataFactory.createSolarSystem({ name: 'Amarr' });
      expect(system.name).toBe('Amarr');
    });

    it('should create station with defaults', () => {
      const station = TestDataFactory.createStation();
      expect(station.station_id).toBe(60003760);
    });

    it('should create station with overrides', () => {
      const station = TestDataFactory.createStation({ station_id: 1 });
      expect(station.station_id).toBe(1);
    });

    it('should create structure with defaults', () => {
      const structure = TestDataFactory.createStructure();
      expect(structure.name).toBe('Test Citadel');
    });

    it('should create structure with overrides', () => {
      const structure = TestDataFactory.createStructure({ name: 'Keepstar' });
      expect(structure.name).toBe('Keepstar');
    });

    it('should create item type with defaults', () => {
      const type = TestDataFactory.createItemType();
      expect(type.type_id).toBe(34);
      expect(type.name).toBe('Tritanium');
    });

    it('should create item type with overrides', () => {
      const type = TestDataFactory.createItemType({ name: 'Pyerite' });
      expect(type.name).toBe('Pyerite');
    });

    it('should create item group with defaults', () => {
      const group = TestDataFactory.createItemGroup();
      expect(group.group_id).toBe(18);
      expect(group.name).toBe('Mineral');
    });

    it('should create item group with overrides', () => {
      const group = TestDataFactory.createItemGroup({ name: 'Ship' });
      expect(group.name).toBe('Ship');
    });

    it('should create star with defaults', () => {
      const star = TestDataFactory.createStar();
      expect(star.star_id).toBe(40000001);
    });

    it('should create star with overrides', () => {
      const star = TestDataFactory.createStar({ temperature: 9999 });
      expect(star.temperature).toBe(9999);
    });

    it('should create planet with defaults', () => {
      const planet = TestDataFactory.createPlanet();
      expect(planet.planet_id).toBe(40000004);
    });

    it('should create planet with overrides', () => {
      const planet = TestDataFactory.createPlanet({ name: 'Mars' });
      expect(planet.name).toBe('Mars');
    });

    it('should create search results with defaults', () => {
      const results = TestDataFactory.createSearchResults();
      expect(results.systems).toEqual([]);
      expect(results.characters).toEqual([]);
    });

    it('should create search results with overrides', () => {
      const results = TestDataFactory.createSearchResults({
        systems: [30000142],
      });
      expect(results.systems).toEqual([30000142]);
    });

    it('should create entity name with defaults', () => {
      const name = TestDataFactory.createEntityName();
      expect(name.id).toBe(30000142);
      expect(name.category).toBe('solar_system');
    });

    it('should create entity name with overrides', () => {
      const name = TestDataFactory.createEntityName({ name: 'Amarr' });
      expect(name.name).toBe('Amarr');
    });
  });

  describe('Corporation factories', () => {
    it('should create corporation info with defaults', () => {
      const info = TestDataFactory.createCorporationInfo();
      expect(info.corporation_id).toBe(1344654522);
      expect(info.name).toBe('GoonWaffe');
    });

    it('should create corporation info with overrides', () => {
      const info = TestDataFactory.createCorporationInfo({ name: 'Test' });
      expect(info.name).toBe('Test');
    });

    it('should create corporation member roles with defaults', () => {
      const roles = TestDataFactory.createCorporationMemberRoles();
      expect(roles.character_id).toBe(1689391488);
      expect(roles.roles).toContain('Director');
    });

    it('should create corporation member roles with overrides', () => {
      const roles = TestDataFactory.createCorporationMemberRoles({
        character_id: 999,
      });
      expect(roles.character_id).toBe(999);
    });

    it('should create corporation asset with defaults', () => {
      const asset = TestDataFactory.createCorporationAsset();
      expect(asset.type_id).toBe(587);
    });

    it('should create corporation asset with overrides', () => {
      const asset = TestDataFactory.createCorporationAsset({ type_id: 34 });
      expect(asset.type_id).toBe(34);
    });

    it('should create corporation structure with defaults', () => {
      const structure = TestDataFactory.createCorporationStructure();
      expect(structure.type_id).toBe(35832);
      expect(structure.state).toBe('shield_vulnerable');
    });

    it('should create corporation structure with overrides', () => {
      const structure = TestDataFactory.createCorporationStructure({
        state: 'anchoring',
      });
      expect(structure.state).toBe('anchoring');
    });

    it('should create corporation wallet with defaults', () => {
      const wallet = TestDataFactory.createCorporationWallet();
      expect(wallet.division).toBe(1);
      expect(wallet.balance).toBe(1000000000.0);
    });

    it('should create corporation wallet with overrides', () => {
      const wallet = TestDataFactory.createCorporationWallet({ division: 7 });
      expect(wallet.division).toBe(7);
    });

    it('should create wallet journal entry with defaults', () => {
      const entry = TestDataFactory.createWalletJournalEntry();
      expect(entry.ref_type).toBe('market_transaction');
    });

    it('should create wallet journal entry with overrides', () => {
      const entry = TestDataFactory.createWalletJournalEntry({
        ref_type: 'bounty_prizes',
      });
      expect(entry.ref_type).toBe('bounty_prizes');
    });
  });

  describe('Fleet factories', () => {
    it('should create fleet info with defaults', () => {
      const fleet = TestDataFactory.createFleetInfo();
      expect(fleet.fleet_id).toBe(1234567890);
      expect(fleet.is_free_move).toBe(false);
    });

    it('should create fleet info with overrides', () => {
      const fleet = TestDataFactory.createFleetInfo({ is_free_move: true });
      expect(fleet.is_free_move).toBe(true);
    });

    it('should create fleet member with defaults', () => {
      const member = TestDataFactory.createFleetMember();
      expect(member.role).toBe('fleet_commander');
    });

    it('should create fleet member with overrides', () => {
      const member = TestDataFactory.createFleetMember({
        role: 'squad_member',
      });
      expect(member.role).toBe('squad_member');
    });

    it('should create fleet wing with defaults', () => {
      const wing = TestDataFactory.createFleetWing();
      expect(wing.wing_id).toBe(987654321);
      expect(wing.squads).toHaveLength(1);
    });

    it('should create fleet wing with overrides', () => {
      const wing = TestDataFactory.createFleetWing({ name: 'Wing 2' });
      expect(wing.name).toBe('Wing 2');
    });
  });

  describe('Industry factories', () => {
    it('should create industry job with defaults', () => {
      const job = TestDataFactory.createIndustryJob();
      expect(job.job_id).toBe(1000001);
      expect(job.status).toBe('active');
    });

    it('should create industry job with overrides', () => {
      const job = TestDataFactory.createIndustryJob({ status: 'delivered' });
      expect(job.status).toBe('delivered');
    });

    it('should create blueprint with defaults', () => {
      const bp = TestDataFactory.createBlueprint();
      expect(bp.type_id).toBe(17918);
      expect(bp.runs).toBe(100);
    });

    it('should create blueprint with overrides', () => {
      const bp = TestDataFactory.createBlueprint({ runs: 0 });
      expect(bp.runs).toBe(0);
    });
  });

  describe('Wallet factories', () => {
    it('should create wallet transaction with defaults', () => {
      const tx = TestDataFactory.createWalletTransaction();
      expect(tx.transaction_id).toBe(123456789);
      expect(tx.is_buy).toBe(false);
    });

    it('should create wallet transaction with overrides', () => {
      const tx = TestDataFactory.createWalletTransaction({ is_buy: true });
      expect(tx.is_buy).toBe(true);
    });
  });

  describe('Contract factories', () => {
    it('should create contract with defaults', () => {
      const contract = TestDataFactory.createContract();
      expect(contract.contract_id).toBe(123456789);
      expect(contract.type).toBe('courier');
    });

    it('should create contract with overrides', () => {
      const contract = TestDataFactory.createContract({
        type: 'item_exchange',
      });
      expect(contract.type).toBe('item_exchange');
    });
  });

  describe('Error factories', () => {
    it('should create error with default message for known status', () => {
      const err = TestDataFactory.createError(404);
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Resource not found');
    });

    it('should create error with custom message', () => {
      const err = TestDataFactory.createError(500, 'Custom error');
      expect(err.message).toBe('Custom error');
    });

    it('should create error with fallback message for unknown status', () => {
      const err = TestDataFactory.createError(418);
      expect(err.message).toBe('Unknown error');
    });

    it('should create errors for all known status codes', () => {
      for (const code of [400, 401, 403, 404, 429, 500, 503]) {
        const err = TestDataFactory.createError(code);
        expect(err.statusCode).toBe(code);
        expect(err.message).not.toBe('Unknown error');
      }
    });
  });

  describe('Sovereignty/Equinox factories', () => {
    it('should create a sovereignty system with defaults', () => {
      const system = TestDataFactory.createSovereigntySystem();
      expect(system.solar_systems).toHaveLength(1);
      expect(system.solar_systems[0]!.solar_system_id).toBe(30000142);
      expect(system.solar_systems[0]!.claim.alliance?.alliance_id).toBe(
        99005338,
      );
    });

    it('should create a sovereignty system with overrides', () => {
      const system = TestDataFactory.createSovereigntySystem({
        solar_systems: [
          {
            solar_system_id: 99999,
            claim: {
              alliance: {
                alliance_id: 99005338,
                corporation_id: 1344654522,
                claimed_since: '2020-10-08T00:38:16Z',
                is_capital_system: false,
                development: {
                  activity_defense_multiplier: 10.0,
                  military_level: 5,
                  industrial_level: 3,
                  strategic_level: 1,
                },
              },
            },
          },
        ],
      });
      expect(system.solar_systems[0]!.solar_system_id).toBe(99999);
      expect(
        system.solar_systems[0]!.claim.alliance?.development
          ?.activity_defense_multiplier,
      ).toBe(10.0);
    });

    it('should create a sovereignty hub with defaults', () => {
      const hub = TestDataFactory.createSovereigntyHub();
      expect(hub.structure_id).toBe(100000001);
      expect(hub.online).toBe(true);
      expect(hub.installed_upgrades).toEqual([1, 2, 3]);
    });

    it('should create a sovereignty hub with overrides', () => {
      const hub = TestDataFactory.createSovereigntyHub({ online: false });
      expect(hub.online).toBe(false);
      expect(hub.structure_id).toBe(100000001);
    });

    it('should create an orbital skyhook with defaults', () => {
      const skyhook = TestDataFactory.createOrbitalSkyhook();
      expect(skyhook.structure_id).toBe(200000001);
      expect(skyhook.reagent_silo_capacity).toBe(1000);
      expect(skyhook.reagent_silo_level).toBe(750);
    });

    it('should create an orbital skyhook with overrides', () => {
      const skyhook = TestDataFactory.createOrbitalSkyhook({
        reagent_silo_level: 0,
      });
      expect(skyhook.reagent_silo_level).toBe(0);
    });

    it('should create a raidable skyhook with defaults', () => {
      const skyhook = TestDataFactory.createRaidableSkyhook();
      expect(skyhook.structure_id).toBe(200000001);
      expect(skyhook.is_raidable).toBe(true);
      expect(skyhook.raidable_at).toBe('2026-05-20T12:00:00Z');
    });

    it('should create a raidable skyhook with overrides', () => {
      const skyhook = TestDataFactory.createRaidableSkyhook({
        is_raidable: false,
      });
      expect(skyhook.is_raidable).toBe(false);
    });

    it('should create a mercenary den with defaults', () => {
      const den = TestDataFactory.createMercenaryDen();
      expect(den.den_id).toBe(5001);
      expect(den.development_level).toBe(3);
      expect(den.anarchy_level).toBe(2);
    });

    it('should create a mercenary den with overrides', () => {
      const den = TestDataFactory.createMercenaryDen({
        development_level: 5,
      });
      expect(den.development_level).toBe(5);
    });

    it('should create a mercenary tactical operation with defaults', () => {
      const op = TestDataFactory.createMercenaryTacticalOperation();
      expect(op.operation_id).toBe(7001);
      expect(op.site_type).toBe('assault');
      expect(op.status).toBe('active');
    });

    it('should create a mercenary tactical operation with overrides', () => {
      const op = TestDataFactory.createMercenaryTacticalOperation({
        status: 'completed',
      });
      expect(op.status).toBe('completed');
    });

    it('should create an access list entry with defaults', () => {
      const entry = TestDataFactory.createAccessListEntry();
      expect(entry.entity_id).toBe(1689391488);
      expect(entry.entity_type).toBe('character');
      expect(entry.access_type).toBe('allowed');
    });

    it('should create an access list entry with overrides', () => {
      const entry = TestDataFactory.createAccessListEntry({
        entity_type: 'corporation',
        access_type: 'blocked',
      });
      expect(entry.entity_type).toBe('corporation');
      expect(entry.access_type).toBe('blocked');
    });
  });

  describe('createTestScenarios', () => {
    it('should return all scenario categories', () => {
      const scenarios = TestDataFactory.createTestScenarios();
      expect(scenarios.alliances).toBeDefined();
      expect(scenarios.characters).toBeDefined();
      expect(scenarios.corporations).toBeDefined();
      expect(scenarios.errorScenarios).toBeDefined();
    });

    it('should contain 5 alliances', () => {
      const scenarios = TestDataFactory.createTestScenarios();
      expect(scenarios.alliances).toHaveLength(5);
      expect(scenarios.alliances[0].name).toBe('Goonswarm Federation');
    });

    it('should contain error scenarios with probability', () => {
      const scenarios = TestDataFactory.createTestScenarios();
      expect(scenarios.errorScenarios.length).toBeGreaterThan(0);
      for (const err of scenarios.errorScenarios) {
        expect(err).toHaveProperty('statusCode');
        expect(err).toHaveProperty('label');
        expect(err).toHaveProperty('probability');
      }
    });
  });

  describe('createPerformanceTestData', () => {
    it('should default to medium dataset', () => {
      const data = TestDataFactory.createPerformanceTestData();
      expect(data.alliances).toHaveLength(20);
      expect(data.characters).toHaveLength(100);
      expect(data.corporations).toHaveLength(50);
    });

    it('should generate small dataset', () => {
      const data = TestDataFactory.createPerformanceTestData('small');
      expect(data.alliances).toHaveLength(5);
      expect(data.characters).toHaveLength(20);
      expect(data.corporations).toHaveLength(10);
    });

    it('should generate medium dataset', () => {
      const data = TestDataFactory.createPerformanceTestData('medium');
      expect(data.alliances).toHaveLength(20);
      expect(data.characters).toHaveLength(100);
      expect(data.corporations).toHaveLength(50);
    });

    it('should generate large dataset', () => {
      const data = TestDataFactory.createPerformanceTestData('large');
      expect(data.alliances).toHaveLength(100);
      expect(data.characters).toHaveLength(1000);
      expect(data.corporations).toHaveLength(500);
    });

    it('should assign corporations to alliances', () => {
      const data = TestDataFactory.createPerformanceTestData('small');
      for (const corp of data.corporations) {
        expect(corp.alliance_id).toBeDefined();
      }
    });
  });

  describe('createRealisticTestData', () => {
    it('should create inter-related entities', () => {
      const data = TestDataFactory.createRealisticTestData();
      expect(data.alliances).toHaveLength(1);
      expect(data.corporations).toHaveLength(1);
      expect(data.characters).toHaveLength(1);
    });

    it('should have consistent relationships', () => {
      const data = TestDataFactory.createRealisticTestData();
      const alliance = data.alliances[0];
      const corp = data.corporations[0];
      const char = data.characters[0];

      expect(corp.alliance_id).toBe(alliance.alliance_id);
      expect(char.corporation_id).toBe(corp.corporation_id);
      expect(char.alliance_id).toBe(alliance.alliance_id);
    });

    it('should include relationship metadata', () => {
      const data = TestDataFactory.createRealisticTestData();
      expect(data.relationships).toBeDefined();
      expect(data.relationships.allianceExecutor).toBeDefined();
      expect(data.relationships.corporationCEO).toBeDefined();
      expect(data.relationships.characterMembership).toBeDefined();
    });
  });
});
