import { MemorySdeProvider } from '../../../src/sde/MemorySdeProvider';
import { SdeTestDataFactory } from '../../../src/sde/SdeTestDataFactory';
import { runProviderContractTests } from './IStaticDataProvider.contract.test';

describe('MemorySdeProvider', () => {
  runProviderContractTests(
    'MemorySdeProvider',
    () =>
      new MemorySdeProvider(SdeTestDataFactory.createHierarchicalTestData()),
  );

  describe('empty state', () => {
    it('should return null for all single lookups when empty', () => {
      const provider = new MemorySdeProvider();
      expect(provider.getType(34)).toBeNull();
      expect(provider.getGroup(18)).toBeNull();
      expect(provider.getCategory(4)).toBeNull();
      expect(provider.getRegion(10000002)).toBeNull();
      expect(provider.getConstellation(20000020)).toBeNull();
      expect(provider.getSolarSystem(30000142)).toBeNull();
      expect(provider.getStargate(50001248)).toBeNull();
      expect(provider.getStar(40009082)).toBeNull();
      expect(provider.getStarBySystem(30000142)).toBeNull();
      expect(provider.getPlanet(40009077)).toBeNull();
      expect(provider.getMoon(40009078)).toBeNull();
      expect(provider.getAsteroidBelt(40009079)).toBeNull();
      expect(provider.getFaction(500001)).toBeNull();
      expect(provider.getRace(1)).toBeNull();
      expect(provider.getBloodline(1)).toBeNull();
      expect(provider.getAncestry(1)).toBeNull();
      expect(provider.getNpcCorporation(1000035)).toBeNull();
      expect(provider.getNpcStation(60003760)).toBeNull();
      expect(provider.getMarketGroup(1857)).toBeNull();
      expect(provider.getMetaGroup(1)).toBeNull();
      expect(provider.getIcon(22)).toBeNull();
      expect(provider.getGraphic(20)).toBeNull();
      expect(provider.getDogmaAttribute(9)).toBeNull();
      expect(provider.getDogmaEffect(11)).toBeNull();
      expect(provider.getBlueprint(787)).toBeNull();
      expect(provider.getPlanetSchematic(65)).toBeNull();
    });

    it('should return empty arrays for collection lookups when empty', () => {
      const provider = new MemorySdeProvider();
      expect(provider.getTypesByGroup(18)).toEqual([]);
      expect(provider.getGroupsByCategory(4)).toEqual([]);
      expect(provider.getAllCategories()).toEqual([]);
      expect(provider.getAllRegions()).toEqual([]);
      expect(provider.getConstellationsByRegion(10000002)).toEqual([]);
      expect(provider.getSolarSystemsByConstellation(20000020)).toEqual([]);
      expect(provider.getStargatesBySystem(30000142)).toEqual([]);
      expect(provider.getPlanetsBySystem(30000142)).toEqual([]);
      expect(provider.getMoonsBySystem(30000142)).toEqual([]);
      expect(provider.getAsteroidBeltsBySystem(30000142)).toEqual([]);
      expect(provider.getAllFactions()).toEqual([]);
      expect(provider.getAllRaces()).toEqual([]);
      expect(provider.getBloodlinesByRace(1)).toEqual([]);
      expect(provider.getAncestriesByBloodline(1)).toEqual([]);
      expect(provider.getNpcCorporationsByFaction(500001)).toEqual([]);
      expect(provider.getNpcStationsBySystem(30000142)).toEqual([]);
      expect(provider.getNpcStationsByOwner(1000035)).toEqual([]);
      expect(provider.getMarketGroupsByParent(1031)).toEqual([]);
      expect(provider.getRootMarketGroups()).toEqual([]);
      expect(provider.getTypesByMarketGroup(1857)).toEqual([]);
      expect(provider.getAllMetaGroups()).toEqual([]);
      expect(provider.getAllPlanetSchematics()).toEqual([]);
    });

    it('should return empty search results when empty', () => {
      const provider = new MemorySdeProvider();
      expect(provider.searchTypesByName('Trit')).toEqual([]);
      expect(provider.searchSolarSystemsByName('Jita')).toEqual([]);
      expect(provider.searchMarketGroupsByName('Minerals')).toEqual([]);
      expect(provider.searchDogmaAttributesByName('hp')).toEqual([]);
      expect(provider.searchDogmaEffectsByName('low')).toEqual([]);
    });

    it('should return default version info when empty', () => {
      const provider = new MemorySdeProvider();
      const version = provider.getVersion();
      expect(version.version).toBe('1.0.0-test');
    });
  });

  describe('close', () => {
    it('should clear all data after close', () => {
      const provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
      expect(provider.getType(34)).not.toBeNull();
      provider.close();
      expect(provider.getType(34)).toBeNull();
    });
  });

  describe('version info', () => {
    it('should return a copy of version info', () => {
      const provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
      const v1 = provider.getVersion();
      const v2 = provider.getVersion();
      expect(v1).toEqual(v2);
      expect(v1).not.toBe(v2);
    });
  });

  describe('extended lookups', () => {
    const extendedData = {
      ...SdeTestDataFactory.createHierarchicalTestData(),
      dogmaAttributeCategories: [
        { attributeCategoryId: 1, description: 'Fitting', name: 'Fitting' },
        { attributeCategoryId: 2, description: 'Shield', name: 'Shield' },
      ],
      dogmaUnits: [
        {
          unitId: 1,
          description: 'Duration in ms',
          displayName: 'ms',
          name: 'Milliseconds',
        },
        {
          unitId: 2,
          description: 'Modifier percent',
          displayName: '%',
          name: 'Percentage',
        },
      ],
      industryActivities: [
        {
          industryActivityId: 1,
          description: 'Manufacturing',
          name: 'Manufacturing',
        },
        { industryActivityId: 8, description: 'Invention', name: 'Invention' },
      ],
      agentTypes: [
        { agentTypeId: 1, name: 'NonAgent' },
        { agentTypeId: 2, name: 'BasicAgent' },
      ],
      agentsInSpace: [
        {
          characterId: 3019000,
          dungeonId: 100,
          solarSystemId: 30000142,
          spawnPointId: 1,
          typeId: 3856,
        },
        {
          characterId: 3019001,
          dungeonId: 101,
          solarSystemId: 30000144,
          spawnPointId: 2,
          typeId: 3857,
        },
      ],
      certificates: [
        {
          certificateId: 1,
          description: 'Basic Spaceship',
          groupId: 18,
          name: 'Spaceship Command Basic',
          recommendedFor: null,
          skillTypes: null,
        },
      ],
      characterAttributes: [
        {
          attributeId: 164,
          description: 'Charisma',
          iconId: 1383,
          name: 'Charisma',
          notes: 'Social attribute',
          shortDescription: 'Cha',
        },
      ],
      npcCharacters: [
        {
          characterId: 3004451,
          bloodlineId: 1,
          ceo: true,
          corporationId: 1000035,
          gender: 1,
          locationId: 60003760,
          name: 'Caldari Navy Commander',
          raceId: 1,
          startDate: '2003-01-01',
          uniqueName: true,
          skills: null,
          ancestryId: null,
          careerId: null,
          schoolId: null,
          specialityId: null,
        },
        {
          characterId: 3004452,
          bloodlineId: 2,
          ceo: false,
          corporationId: 1000035,
          gender: 0,
          locationId: 60003761,
          name: 'Navy Recruiter',
          raceId: 1,
          startDate: '2003-06-01',
          uniqueName: false,
          skills: null,
          ancestryId: 1,
          careerId: null,
          schoolId: null,
          specialityId: null,
        },
      ],
      cloneGrades: [
        { cloneGradeId: 1, name: 'Alpha', skills: null },
        { cloneGradeId: 2, name: 'Omega', skills: null },
      ],
      corporationActivities: [
        { corporationActivityId: 1, name: 'Manufacturing' },
        { corporationActivityId: 2, name: 'Warrior' },
      ],
      npcCorporationDivisions: [
        {
          npcCorporationDivisionId: 1,
          displayName: 'Accounting',
          internalName: 'accounting',
          leaderTypeName: 'CFO',
          name: 'Accounting',
          description: null,
        },
        {
          npcCorporationDivisionId: 2,
          displayName: 'Security',
          internalName: 'security',
          leaderTypeName: 'CSO',
          name: 'Security',
          description: 'Corp security',
        },
      ],
      landmarks: [
        {
          landmarkId: 1,
          description: 'The Eve Gate',
          name: 'Eve Gate',
          position: { x: 1e16, y: 0, z: 0 },
          iconId: 10,
          locationId: 30000001,
        },
      ],
      notificationTypes: [
        {
          notificationTypeId: 1,
          displayName: 'War Declared',
          internalName: 'AllWarDeclaredMsg',
        },
      ],
      schools: [
        {
          schoolId: 1,
          careerAgents: null,
          careerId: 1,
          characterDescription: 'Test desc',
          corporationId: 1000035,
          description: 'Science Academy',
          iconId: 100,
          name: 'Science and Trade Institute',
          raceId: 1,
          startingStations: null,
          title: 'School of Science',
          isStarterSpaceSchool: null,
        },
      ],
      secondarySuns: [
        {
          secondarySunId: 40100001,
          effectBeaconTypeId: 100,
          position: { x: 1e12, y: 2e12, z: 3e12 },
          solarSystemId: 30000142,
          typeId: 995,
        },
        {
          secondarySunId: 40100002,
          effectBeaconTypeId: 101,
          position: { x: 4e12, y: 5e12, z: 6e12 },
          solarSystemId: 30000144,
          typeId: 996,
        },
      ],
      skins: [
        {
          skinId: 100,
          allowCCPDevs: false,
          internalName: 'TestSkin',
          skinMaterialId: 200,
          types: null,
          visibleSerenity: true,
          visibleTranquility: true,
          isStructureSkin: null,
        },
      ],
      skinLicenses: [
        { duration: 0, licenseTypeId: 5001, skinId: 100 },
        { duration: 30, licenseTypeId: 5002, skinId: 100 },
        { duration: 0, licenseTypeId: 5003, skinId: 999 },
      ],
      stationOperations: [
        {
          stationOperationId: 1,
          activityId: 1,
          border: 1,
          corridor: 1,
          description: 'Manufacturing Hub',
          fringe: 0,
          hub: 1,
          manufacturingFactor: 1.0,
          operationName: 'Manufacturing',
          ratio: 1,
          researchFactor: 1.0,
          services: null,
          stationTypes: null,
        },
      ],
      stationServices: [
        {
          stationServiceId: 1,
          serviceName: 'Market',
          description: 'Trade goods',
        },
        {
          stationServiceId: 2,
          serviceName: 'Reprocessing',
          description: null,
        },
      ],
      typeDogma: [
        { typeId: 34, dogmaAttributes: [{ attributeId: 9 }], dogmaEffects: [] },
      ],
      typeMaterials: [
        { typeId: 34, materials: [{ typeId: 35, quantity: 100 }] },
      ],
      typeBonuses: [
        { typeId: 17918, roleBonuses: [{ bonus: 5 }], types: null },
      ],
      missions: [
        {
          missionId: 1,
          hasStandingRewards: true,
          killMission: null,
          messages: null,
          name: 'Worlds Collide',
          expirationTime: null,
          factionId: 500001,
        },
      ],
      dungeons: [
        {
          dungeonId: 100,
          allowedShipsList: null,
          archetypeId: 1,
          description: 'A combat site',
          factionId: 500001,
          name: 'Serpentis Hideaway',
        },
      ],
      epicArcs: [
        {
          epicArcId: 1,
          arcRestartInterval: 90,
          factionId: 500001,
          iconId: 10,
          missions: null,
          name: 'The Blood-Stained Stars',
        },
        {
          epicArcId: 2,
          arcRestartInterval: 90,
          factionId: 500002,
          iconId: 11,
          missions: null,
          name: 'Penumbra',
        },
      ],
    };

    let provider: MemorySdeProvider;

    beforeEach(() => {
      provider = new MemorySdeProvider(extendedData);
    });

    afterEach(() => {
      provider.close();
    });

    describe('dogma extended', () => {
      it('should look up dogma attribute category by ID', () => {
        const cat = provider.getDogmaAttributeCategory(1);
        expect(cat).not.toBeNull();
        expect(cat!.name).toBe('Fitting');
      });

      it('should return null for unknown dogma attribute category', () => {
        expect(provider.getDogmaAttributeCategory(999)).toBeNull();
      });

      it('should list all dogma attribute categories', () => {
        const cats = provider.getAllDogmaAttributeCategories();
        expect(cats).toHaveLength(2);
      });

      it('should look up dogma unit by ID', () => {
        const unit = provider.getDogmaUnit(1);
        expect(unit).not.toBeNull();
        expect(unit!.name).toBe('Milliseconds');
      });

      it('should return null for unknown dogma unit', () => {
        expect(provider.getDogmaUnit(999)).toBeNull();
      });

      it('should list all dogma units', () => {
        expect(provider.getAllDogmaUnits()).toHaveLength(2);
      });
    });

    describe('industry extended', () => {
      it('should look up industry activity by ID', () => {
        const act = provider.getIndustryActivity(1);
        expect(act).not.toBeNull();
        expect(act!.name).toBe('Manufacturing');
      });

      it('should return null for unknown industry activity', () => {
        expect(provider.getIndustryActivity(999)).toBeNull();
      });

      it('should list all industry activities', () => {
        expect(provider.getAllIndustryActivities()).toHaveLength(2);
      });
    });

    describe('agent system', () => {
      it('should look up agent type by ID', () => {
        const at = provider.getAgentType(1);
        expect(at).not.toBeNull();
        expect(at!.name).toBe('NonAgent');
      });

      it('should return null for unknown agent type', () => {
        expect(provider.getAgentType(999)).toBeNull();
      });

      it('should list all agent types', () => {
        expect(provider.getAllAgentTypes()).toHaveLength(2);
      });

      it('should look up agent in space by character ID', () => {
        const agent = provider.getAgentInSpace(3019000);
        expect(agent).not.toBeNull();
        expect(agent!.solarSystemId).toBe(30000142);
      });

      it('should return null for unknown agent in space', () => {
        expect(provider.getAgentInSpace(999)).toBeNull();
      });

      it('should find agents in space by system', () => {
        const agents = provider.getAgentsInSpaceBySystem(30000142);
        expect(agents).toHaveLength(1);
        expect(agents[0]!.characterId).toBe(3019000);
      });

      it('should return empty for agents in unknown system', () => {
        expect(provider.getAgentsInSpaceBySystem(999)).toEqual([]);
      });
    });

    describe('certificates', () => {
      it('should look up certificate by ID', () => {
        const cert = provider.getCertificate(1);
        expect(cert).not.toBeNull();
        expect(cert!.name).toBe('Spaceship Command Basic');
      });

      it('should return null for unknown certificate', () => {
        expect(provider.getCertificate(999)).toBeNull();
      });

      it('should list all certificates', () => {
        expect(provider.getAllCertificates()).toHaveLength(1);
      });
    });

    describe('character attributes', () => {
      it('should look up character attribute by ID', () => {
        const attr = provider.getCharacterAttribute(164);
        expect(attr).not.toBeNull();
        expect(attr!.name).toBe('Charisma');
      });

      it('should return null for unknown character attribute', () => {
        expect(provider.getCharacterAttribute(999)).toBeNull();
      });

      it('should list all character attributes', () => {
        expect(provider.getAllCharacterAttributes()).toHaveLength(1);
      });
    });

    describe('NPC characters', () => {
      it('should look up NPC character by ID', () => {
        const npc = provider.getNpcCharacter(3004451);
        expect(npc).not.toBeNull();
        expect(npc!.name).toBe('Caldari Navy Commander');
      });

      it('should return null for unknown NPC character', () => {
        expect(provider.getNpcCharacter(999)).toBeNull();
      });

      it('should find NPC characters by corporation', () => {
        const npcs = provider.getNpcCharactersByCorporation(1000035);
        expect(npcs).toHaveLength(2);
      });

      it('should return empty for NPCs in unknown corporation', () => {
        expect(provider.getNpcCharactersByCorporation(999)).toEqual([]);
      });

      it('should search NPC characters by name', () => {
        const results = provider.searchNpcCharactersByName('Commander');
        expect(results).toHaveLength(1);
        expect(results[0]!.characterId).toBe(3004451);
      });

      it('should return empty for non-matching NPC name search', () => {
        expect(provider.searchNpcCharactersByName('zzzzz')).toEqual([]);
      });

      it('should respect search limit for NPC characters', () => {
        const results = provider.searchNpcCharactersByName('', 1);
        expect(results).toHaveLength(1);
      });
    });

    describe('clone grades', () => {
      it('should look up clone grade by ID', () => {
        const grade = provider.getCloneGrade(1);
        expect(grade).not.toBeNull();
        expect(grade!.name).toBe('Alpha');
      });

      it('should return null for unknown clone grade', () => {
        expect(provider.getCloneGrade(999)).toBeNull();
      });

      it('should list all clone grades', () => {
        expect(provider.getAllCloneGrades()).toHaveLength(2);
      });
    });

    describe('corporation reference', () => {
      it('should look up corporation activity by ID', () => {
        const act = provider.getCorporationActivity(1);
        expect(act).not.toBeNull();
        expect(act!.name).toBe('Manufacturing');
      });

      it('should return null for unknown corporation activity', () => {
        expect(provider.getCorporationActivity(999)).toBeNull();
      });

      it('should list all corporation activities', () => {
        expect(provider.getAllCorporationActivities()).toHaveLength(2);
      });

      it('should look up NPC corporation division by ID', () => {
        const div = provider.getNpcCorporationDivision(1);
        expect(div).not.toBeNull();
        expect(div!.name).toBe('Accounting');
      });

      it('should return null for unknown NPC corporation division', () => {
        expect(provider.getNpcCorporationDivision(999)).toBeNull();
      });

      it('should list all NPC corporation divisions', () => {
        expect(provider.getAllNpcCorporationDivisions()).toHaveLength(2);
      });
    });

    describe('landmarks', () => {
      it('should look up landmark by ID', () => {
        const lm = provider.getLandmark(1);
        expect(lm).not.toBeNull();
        expect(lm!.name).toBe('Eve Gate');
      });

      it('should return null for unknown landmark', () => {
        expect(provider.getLandmark(999)).toBeNull();
      });

      it('should list all landmarks', () => {
        expect(provider.getAllLandmarks()).toHaveLength(1);
      });
    });

    describe('notifications', () => {
      it('should look up notification type by ID', () => {
        const nt = provider.getNotificationType(1);
        expect(nt).not.toBeNull();
        expect(nt!.displayName).toBe('War Declared');
      });

      it('should return null for unknown notification type', () => {
        expect(provider.getNotificationType(999)).toBeNull();
      });
    });

    describe('schools', () => {
      it('should look up school by ID', () => {
        const school = provider.getSchool(1);
        expect(school).not.toBeNull();
        expect(school!.name).toBe('Science and Trade Institute');
      });

      it('should return null for unknown school', () => {
        expect(provider.getSchool(999)).toBeNull();
      });

      it('should list all schools', () => {
        expect(provider.getAllSchools()).toHaveLength(1);
      });
    });

    describe('secondary suns', () => {
      it('should look up secondary sun by ID', () => {
        const sun = provider.getSecondarySun(40100001);
        expect(sun).not.toBeNull();
        expect(sun!.solarSystemId).toBe(30000142);
      });

      it('should return null for unknown secondary sun', () => {
        expect(provider.getSecondarySun(999)).toBeNull();
      });

      it('should find secondary suns by system', () => {
        const suns = provider.getSecondarySunsBySystem(30000142);
        expect(suns).toHaveLength(1);
        expect(suns[0]!.secondarySunId).toBe(40100001);
      });

      it('should return empty for suns in unknown system', () => {
        expect(provider.getSecondarySunsBySystem(999)).toEqual([]);
      });
    });

    describe('skins', () => {
      it('should look up skin by ID', () => {
        const skin = provider.getSkin(100);
        expect(skin).not.toBeNull();
        expect(skin!.internalName).toBe('TestSkin');
      });

      it('should return null for unknown skin', () => {
        expect(provider.getSkin(999)).toBeNull();
      });

      it('should look up skin license by license type ID', () => {
        const lic = provider.getSkinLicense(5001);
        expect(lic).not.toBeNull();
        expect(lic!.skinId).toBe(100);
      });

      it('should return null for unknown skin license', () => {
        expect(provider.getSkinLicense(999)).toBeNull();
      });

      it('should find skin licenses by skin ID', () => {
        const licenses = provider.getSkinLicensesBySkin(100);
        expect(licenses).toHaveLength(2);
      });

      it('should return empty for licenses of unknown skin', () => {
        expect(provider.getSkinLicensesBySkin(888)).toEqual([]);
      });
    });

    describe('station operations and services', () => {
      it('should look up station operation by ID', () => {
        const op = provider.getStationOperation(1);
        expect(op).not.toBeNull();
        expect(op!.operationName).toBe('Manufacturing');
      });

      it('should return null for unknown station operation', () => {
        expect(provider.getStationOperation(999)).toBeNull();
      });

      it('should list all station operations', () => {
        expect(provider.getAllStationOperations()).toHaveLength(1);
      });

      it('should look up station service by ID', () => {
        const svc = provider.getStationService(1);
        expect(svc).not.toBeNull();
        expect(svc!.serviceName).toBe('Market');
      });

      it('should return null for unknown station service', () => {
        expect(provider.getStationService(999)).toBeNull();
      });

      it('should list all station services', () => {
        expect(provider.getAllStationServices()).toHaveLength(2);
      });
    });

    describe('type extensions', () => {
      it('should look up type dogma by type ID', () => {
        const td = provider.getTypeDogma(34);
        expect(td).not.toBeNull();
        expect(td!.dogmaAttributes).toEqual([{ attributeId: 9 }]);
      });

      it('should return null for unknown type dogma', () => {
        expect(provider.getTypeDogma(999)).toBeNull();
      });

      it('should look up type material by type ID', () => {
        const tm = provider.getTypeMaterial(34);
        expect(tm).not.toBeNull();
        expect(tm!.materials).toEqual([{ typeId: 35, quantity: 100 }]);
      });

      it('should return null for unknown type material', () => {
        expect(provider.getTypeMaterial(999)).toBeNull();
      });

      it('should look up type bonus by type ID', () => {
        const tb = provider.getTypeBonus(17918);
        expect(tb).not.toBeNull();
        expect(tb!.roleBonuses).toEqual([{ bonus: 5 }]);
      });

      it('should return null for unknown type bonus', () => {
        expect(provider.getTypeBonus(999)).toBeNull();
      });
    });

    describe('missions and content', () => {
      it('should look up mission by ID', () => {
        const m = provider.getMission(1);
        expect(m).not.toBeNull();
        expect(m!.name).toBe('Worlds Collide');
      });

      it('should return null for unknown mission', () => {
        expect(provider.getMission(999)).toBeNull();
      });

      it('should look up dungeon by ID', () => {
        const d = provider.getDungeon(100);
        expect(d).not.toBeNull();
        expect(d!.name).toBe('Serpentis Hideaway');
      });

      it('should return null for unknown dungeon', () => {
        expect(provider.getDungeon(999)).toBeNull();
      });

      it('should look up epic arc by ID', () => {
        const ea = provider.getEpicArc(1);
        expect(ea).not.toBeNull();
        expect(ea!.name).toBe('The Blood-Stained Stars');
      });

      it('should return null for unknown epic arc', () => {
        expect(provider.getEpicArc(999)).toBeNull();
      });

      it('should list all epic arcs', () => {
        expect(provider.getAllEpicArcs()).toHaveLength(2);
      });
    });

    describe('generic accessors', () => {
      it('should get entity by table name and ID', () => {
        const type = provider.getEntity('eve_types', 34);
        expect(type).not.toBeNull();
        expect((type as { name: string }).name).toBe('Tritanium');
      });

      it('should return null for unknown entity', () => {
        expect(provider.getEntity('eve_types', 999999)).toBeNull();
      });

      it('should return null for unknown table', () => {
        expect(provider.getEntity('nonexistent_table', 1)).toBeNull();
      });

      it('should get all entities from a table', () => {
        const allTypes = provider.getAllEntities('eve_types');
        expect(allTypes.length).toBeGreaterThanOrEqual(3);
      });

      it('should return empty for unknown table in getAllEntities', () => {
        expect(provider.getAllEntities('nonexistent_table')).toEqual([]);
      });
    });
  });
});
