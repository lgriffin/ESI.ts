import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('TestDataFactory', () => {
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
