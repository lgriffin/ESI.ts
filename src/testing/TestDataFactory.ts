import { 
  AllianceInfo, 
  CharacterInfo, 
  CorporationInfo,
  AllianceContact,
  AllianceContactLabel,
  CharacterPortrait,
  CharacterAttributes,
  CharacterSkill,
  MarketOrder,
  MarketHistory,
  WalletTransaction,
  Contract
} from '../types/api-responses';
import { ApiError, ApiErrorType } from '../core/errors/ApiError';

export class TestDataFactory {
  // Alliance test data
  static createAllianceInfo(overrides: Partial<AllianceInfo> = {}): AllianceInfo {
    return {
      alliance_id: 99005338,
      name: 'Goonswarm Federation',
      ticker: 'CONDI',
      creator_id: 1689391488,
      creator_corporation_id: 1344654522,
      executor_corporation_id: 1344654522,
      date_founded: '2010-06-01T00:00:00Z',
      faction_id: 500001,
      ...overrides
    };
  }

  static createAllianceContact(overrides: Partial<AllianceContact> = {}): AllianceContact {
    return {
      contact_id: 1689391488,
      contact_type: 'character',
      standing: 10.0,
      label_ids: [1, 2],
      ...overrides
    };
  }

  static createAllianceContactLabel(overrides: Partial<AllianceContactLabel> = {}): AllianceContactLabel {
    return {
      label_id: 1,
      label_name: 'Friendly',
      ...overrides
    };
  }

  // Character test data
  static createCharacterInfo(overrides: Partial<CharacterInfo> = {}): CharacterInfo {
    return {
      character_id: 1689391488,
      name: 'Test Character',
      corporation_id: 1344654522,
      alliance_id: 99005338,
      bloodline_id: 4,
      race_id: 1,
      gender: 'male',
      birthday: '2003-05-06T00:00:00Z',
      description: 'A test character for BDD scenarios',
      security_status: 5.0,
      title: 'Test Pilot',
      ...overrides
    };
  }

  static createCharacterPortrait(characterId: number = 1689391488): CharacterPortrait {
    return {
      px64x64: `https://images.evetech.net/characters/${characterId}/portrait?size=64`,
      px128x128: `https://images.evetech.net/characters/${characterId}/portrait?size=128`,
      px256x256: `https://images.evetech.net/characters/${characterId}/portrait?size=256`,
      px512x512: `https://images.evetech.net/characters/${characterId}/portrait?size=512`
    };
  }

  static createCharacterAttributes(overrides: Partial<CharacterAttributes> = {}): CharacterAttributes {
    return {
      charisma: 20,
      intelligence: 24,
      memory: 21,
      perception: 23,
      willpower: 22,
      bonus_remaps: 2,
      last_remap_date: '2023-01-01T00:00:00Z',
      accrued_remap_cooldown_date: '2024-01-01T00:00:00Z',
      ...overrides
    };
  }

  static createCharacterSkill(overrides: Partial<CharacterSkill> = {}): CharacterSkill {
    return {
      skill_id: 3300,
      skillpoints_in_skill: 256000,
      trained_skill_level: 5,
      active_skill_level: 5,
      ...overrides
    };
  }

  static createCharacterRoles(overrides: any = {}): any {
    return {
      roles: ['Director'],
      roles_at_base: [],
      roles_at_hq: ['Director'],
      roles_at_other: [],
      ...overrides
    };
  }

  static createCorporationHistoryEntry(overrides: any = {}): any {
    return {
      corporation_id: 1344654522,
      is_deleted: false,
      record_id: 1,
      start_date: '2020-01-01T00:00:00Z',
      ...overrides
    };
  }

  static createCharacterMedal(overrides: any = {}): any {
    return {
      medal_id: 1,
      title: 'Test Medal',
      description: 'A test medal for demonstration',
      corporation_id: 1344654522,
      date: '2023-01-01T00:00:00Z',
      issuer_id: 1689391489,
      reason: 'Outstanding service',
      ...overrides
    };
  }

  static createCharacterNotification(overrides: any = {}): any {
    return {
      notification_id: 1000001,
      sender_id: 1689391489,
      sender_type: 'character',
      text: 'Test notification',
      timestamp: '2024-01-15T12:00:00Z',
      type: 'AllWarDeclaredMsg',
      is_read: false,
      ...overrides
    };
  }

  // Market test data
  static createMarketPrice(overrides: any = {}): any {
    return {
      type_id: 34,
      average_price: 4.50,
      adjusted_price: 4.55,
      ...overrides
    };
  }

  static createMarketHistory(overrides: any = {}): any {
    return {
      date: '2024-01-15',
      volume: 1000000000,
      order_count: 2500,
      lowest: 4.20,
      highest: 4.80,
      average: 4.50,
      ...overrides
    };
  }

  static createCharacterMarketOrder(overrides: any = {}): any {
    return {
      order_id: 5000000001,
      type_id: 34,
      region_id: 10000002,
      location_id: 60003760,
      range: 'region',
      volume_total: 1000000,
      volume_remain: 750000,
      min_volume: 1,
      price: 4.50,
      is_buy_order: true,
      duration: 90,
      issued: '2024-01-15T12:00:00Z',
      state: 'open',
      ...overrides
    };
  }

  static createCharacterOrderHistory(overrides: any = {}): any {
    return {
      order_id: 5000000001,
      type_id: 34,
      region_id: 10000002,
      location_id: 60003760,
      range: 'region',
      volume_total: 1000000,
      volume_remain: 0,
      min_volume: 1,
      price: 4.50,
      is_buy_order: true,
      duration: 90,
      issued: '2024-01-10T12:00:00Z',
      state: 'closed',
      ...overrides
    };
  }

  // Universe test data
  static createSolarSystem(overrides: any = {}): any {
    return {
      system_id: 30000142,
      name: 'Jita',
      constellation_id: 20000020,
      security_status: 0.9459991455078125,
      star_id: 40000001,
      stargates: [50000001, 50000002],
      stations: [60003760, 60003761],
      planets: [
        { planet_id: 40000001, moons: [40000002, 40000003] },
        { planet_id: 40000004, moons: [40000005] }
      ],
      ...overrides
    };
  }

  static createStation(overrides: any = {}): any {
    return {
      station_id: 60003760,
      name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
      owner: 1000035,
      type_id: 52678,
      race_id: 1,
      system_id: 30000142,
      reprocessing_efficiency: 0.5,
      reprocessing_stations_take: 0.05,
      max_dockable_ship_volume: 50000000,
      office_rental_cost: 10000000,
      services: ['bounty-missions', 'courier-missions', 'interbus', 'reprocessing-plant', 'market', 'stock-exchange'],
      ...overrides
    };
  }

  static createStructure(overrides: any = {}): any {
    return {
      structure_id: 1021975535893,
      name: 'Test Citadel',
      owner_id: 1689391488,
      solar_system_id: 30000142,
      type_id: 35832,
      position: { x: 1000000000, y: 2000000000, z: 3000000000 },
      ...overrides
    };
  }

  static createItemType(overrides: any = {}): any {
    return {
      type_id: 34,
      name: 'Tritanium',
      description: 'The most common ore type in the known universe.',
      group_id: 18,
      category_id: 4,
      market_group_id: 1857,
      mass: 1.0,
      volume: 0.01,
      capacity: 0.0,
      portion_size: 1,
      radius: 1.0,
      published: true,
      ...overrides
    };
  }

  static createItemGroup(overrides: any = {}): any {
    return {
      group_id: 18,
      name: 'Mineral',
      category_id: 4,
      published: true,
      types: [34, 35, 36, 37, 38, 39, 40, 11399],
      ...overrides
    };
  }

  static createStar(overrides: any = {}): any {
    return {
      star_id: 40000001,
      name: 'Jita - Star',
      type_id: 3802,
      solar_system_id: 30000142,
      age: 4600000000,
      luminosity: 0.06575,
      radius: 62140000,
      spectral_class: 'K2 V',
      temperature: 4567,
      ...overrides
    };
  }

  static createPlanet(overrides: any = {}): any {
    return {
      planet_id: 40000004,
      name: 'Jita IV',
      type_id: 11,
      system_id: 30000142,
      position: { x: 150000000000, y: 0, z: 0 },
      ...overrides
    };
  }

  static createSearchResults(overrides: any = {}): any {
    return {
      systems: [],
      stations: [],
      structures: [],
      characters: [],
      corporations: [],
      alliances: [],
      ...overrides
    };
  }

  static createEntityName(overrides: any = {}): any {
    return {
      id: 30000142,
      name: 'Jita',
      category: 'solar_system',
      ...overrides
    };
  }

  // Corporation test data
  static createCorporationMemberRoles(overrides: any = {}): any {
    return {
      character_id: 1689391488,
      roles: ['Director', 'Personnel_Manager'],
      grantable_roles: ['Hangar_Take_1', 'Hangar_Take_2'],
      roles_at_hq: ['Director'],
      roles_at_base: [],
      roles_at_other: [],
      ...overrides
    };
  }

  static createCorporationAsset(overrides: any = {}): any {
    return {
      item_id: 1000000000001,
      type_id: 587,
      quantity: 100,
      location_id: 60003760,
      location_flag: 'CorpSAG1',
      location_type: 'station',
      ...overrides
    };
  }

  static createCorporationStructure(overrides: any = {}): any {
    return {
      structure_id: 1021975535893,
      type_id: 35832,
      system_id: 30000142,
      profile_id: 101853,
      fuel_expires: '2024-02-01T12:00:00Z',
      state_timer_start: '2024-01-15T12:00:00Z',
      state_timer_end: '2024-01-22T12:00:00Z',
      state: 'shield_vulnerable',
      ...overrides
    };
  }

  static createCorporationWallet(overrides: any = {}): any {
    return {
      division: 1,
      balance: 1000000000.00,
      ...overrides
    };
  }

  static createWalletJournalEntry(overrides: any = {}): any {
    return {
      id: 1000000001,
      date: '2024-01-15T12:00:00Z',
      ref_type: 'market_transaction',
      first_party_id: 1344654522,
      amount: 1000000.00,
      balance: 1000000000.00,
      reason: 'Market transaction',
      description: 'Sold items on market',
      ...overrides
    };
  }

  // Fleet test data
  static createFleetInfo(overrides: any = {}): any {
    return {
      fleet_id: 1234567890,
      fleet_boss_id: 1689391488,
      is_free_move: false,
      is_registered: true,
      is_voice_enabled: true,
      motd: 'Fleet operations in progress',
      ...overrides
    };
  }

  static createFleetMember(overrides: any = {}): any {
    return {
      character_id: 1689391488,
      role: 'fleet_commander',
      ship_type_id: 17918,
      solar_system_id: 30000142,
      station_id: 60003760,
      ...overrides
    };
  }

  static createFleetWing(overrides: any = {}): any {
    return {
      wing_id: 987654321,
      name: 'Wing 1',
      squads: [
        { squad_id: 123456789, name: 'Squad 1' }
      ],
      ...overrides
    };
  }

  // Industry test data
  static createIndustryJob(overrides: any = {}): any {
    return {
      job_id: 1000001,
      installer_id: 1689391488,
      facility_id: 60003760,
      activity_id: 1,
      blueprint_id: 1000000001,
      blueprint_type_id: 17918,
      product_type_id: 17918,
      runs: 1,
      status: 'active',
      start_date: '2024-01-15T12:00:00Z',
      end_date: '2024-01-16T12:00:00Z',
      ...overrides
    };
  }

  static createBlueprint(overrides: any = {}): any {
    return {
      item_id: 1000000001,
      type_id: 17918,
      location_id: 60003760,
      location_flag: 'Hangar',
      quantity: -2,
      time_efficiency: 10,
      material_efficiency: 10,
      runs: 100,
      ...overrides
    };
  }

  static createCharacterAsset(overrides: any = {}): any {
    return {
      item_id: 1000000002,
      type_id: 34,
      quantity: 1000000,
      location_id: 60003760,
      location_flag: 'Hangar',
      location_type: 'station',
      ...overrides
    };
  }

  static createCharacterLocation(overrides: any = {}): any {
    return {
      solar_system_id: 30000142,
      station_id: 60003760,
      structure_id: undefined,
      ...overrides
    };
  }

  static createCharacterSkills(overrides: any = {}): any {
    return {
      skills: [
        { skill_id: 3300, skillpoints_in_skill: 256000, trained_skill_level: 5, active_skill_level: 5 },
        { skill_id: 3301, skillpoints_in_skill: 128000, trained_skill_level: 4, active_skill_level: 4 }
      ],
      total_sp: 384000,
      unallocated_sp: 0,
      ...overrides
    };
  }

  // Corporation test data
  static createCorporationInfo(overrides: Partial<CorporationInfo> = {}): CorporationInfo {
    return {
      corporation_id: 1344654522,
      name: 'GoonWaffe',
      ticker: 'GEWNS',
      ceo_id: 1689391488,
      creator_id: 1689391488,
      member_count: 15000,
      tax_rate: 0.1,
      alliance_id: 99005338,
      date_founded: '2003-05-06T00:00:00Z',
      description: 'The founding corporation of Goonswarm Federation',
      home_station_id: 60003760,
      shares: 1000,
      url: 'http://www.goonfleet.com/',
      faction_id: 500001,
      war_eligible: true,
      ...overrides
    };
  }

  // Market test data
  static createMarketOrder(overrides: Partial<MarketOrder> = {}): MarketOrder {
    return {
      order_id: 123456789,
      type_id: 34, // Tritanium
      location_id: 60003760, // Jita 4-4
      volume_total: 1000000,
      volume_remain: 500000,
      min_volume: 1,
      price: 5.50,
      is_buy_order: false,
      duration: 90,
      issued: '2023-12-01T12:00:00Z',
      range: 'region',
      ...overrides
    };
  }


  // Wallet test data
  static createWalletTransaction(overrides: Partial<WalletTransaction> = {}): WalletTransaction {
    return {
      transaction_id: 123456789,
      date: '2023-12-01T12:00:00Z',
      type_id: 34,
      location_id: 60003760,
      unit_price: 5.50,
      quantity: 1000,
      client_id: 1689391488,
      is_buy: false,
      is_personal: true,
      journal_ref_id: 987654321,
      ...overrides
    };
  }

  // Contract test data
  static createContract(overrides: Partial<Contract> = {}): Contract {
    return {
      contract_id: 123456789,
      issuer_id: 1689391488,
      issuer_corporation_id: 1344654522,
      assignee_id: 987654321,
      start_location_id: 60003760,
      end_location_id: 60008494,
      type: 'courier',
      status: 'outstanding',
      title: 'Test Courier Contract',
      for_corporation: false,
      availability: 'public',
      date_issued: '2023-12-01T12:00:00Z',
      date_expired: '2023-12-08T12:00:00Z',
      days_to_complete: 3,
      price: 1000000,
      reward: 500000,
      collateral: 10000000,
      volume: 1000,
      ...overrides
    };
  }

  // Error test data
  static createError(type: ApiErrorType, statusCode?: number, details?: any): ApiError {
    const messages = {
      [ApiErrorType.NETWORK_ERROR]: 'Network connection failed',
      [ApiErrorType.AUTHENTICATION_ERROR]: 'Authentication failed - invalid or expired token',
      [ApiErrorType.AUTHORIZATION_ERROR]: 'Access denied - insufficient permissions',
      [ApiErrorType.RATE_LIMIT_ERROR]: 'Rate limit exceeded - too many requests',
      [ApiErrorType.SERVER_ERROR]: 'Internal server error',
      [ApiErrorType.CLIENT_ERROR]: 'Bad request - invalid parameters',
      [ApiErrorType.VALIDATION_ERROR]: 'Validation failed - invalid input data',
      [ApiErrorType.NOT_FOUND_ERROR]: 'Resource not found',
      [ApiErrorType.TIMEOUT_ERROR]: 'Request timeout',
      [ApiErrorType.UNKNOWN_ERROR]: 'Unknown error occurred'
    };

    const defaultStatusCodes: Record<ApiErrorType, number | undefined> = {
      [ApiErrorType.AUTHENTICATION_ERROR]: 401,
      [ApiErrorType.AUTHORIZATION_ERROR]: 403,
      [ApiErrorType.NOT_FOUND_ERROR]: 404,
      [ApiErrorType.RATE_LIMIT_ERROR]: 429,
      [ApiErrorType.SERVER_ERROR]: 500,
      [ApiErrorType.CLIENT_ERROR]: 400,
      [ApiErrorType.VALIDATION_ERROR]: 400,
      [ApiErrorType.NETWORK_ERROR]: undefined,
      [ApiErrorType.TIMEOUT_ERROR]: undefined,
      [ApiErrorType.UNKNOWN_ERROR]: undefined
    };

    return new ApiError(
      messages[type],
      type,
      statusCode || defaultStatusCodes[type],
      details,
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
  }

  // Test scenarios
  static createTestScenarios() {
    return {
      alliances: [
        { id: 99005338, name: 'Goonswarm Federation', ticker: 'CONDI' },
        { id: 99000001, name: 'Test Alliance Please Ignore', ticker: 'TEST' },
        { id: 99000002, name: 'Brave Collective', ticker: 'BRAVE' },
        { id: 99000003, name: 'Pandemic Legion', ticker: 'PL' },
        { id: 99000004, name: 'Northern Coalition.', ticker: 'NC.' }
      ],
      characters: [
        { id: 1689391488, name: 'Test Character', corp: 1344654522, alliance: 99005338 },
        { id: 123456789, name: 'Demo Pilot', corp: 987654321, alliance: 99000001 },
        { id: 111111111, name: 'Alpha Tester', corp: 222222222, alliance: 99000002 },
        { id: 333333333, name: 'Beta User', corp: 444444444, alliance: 99000003 },
        { id: 555555555, name: 'Gamma Pilot', corp: 666666666, alliance: 99000004 }
      ],
      corporations: [
        { id: 1344654522, name: 'GoonWaffe', ticker: 'GEWNS', alliance: 99005338 },
        { id: 987654321, name: 'Test Corp Please Ignore', ticker: 'TCPI', alliance: 99000001 },
        { id: 222222222, name: 'Brave Newbies Inc.', ticker: 'BNI', alliance: 99000002 },
        { id: 444444444, name: 'Sniggerdly', ticker: 'SNIGG', alliance: 99000003 },
        { id: 666666666, name: 'Tactical Narcotics Team', ticker: 'TNT', alliance: 99000004 }
      ],
      errorScenarios: [
        { type: ApiErrorType.NETWORK_ERROR, probability: 0.1 },
        { type: ApiErrorType.RATE_LIMIT_ERROR, probability: 0.05 },
        { type: ApiErrorType.SERVER_ERROR, probability: 0.02 },
        { type: ApiErrorType.TIMEOUT_ERROR, probability: 0.03 },
        { type: ApiErrorType.NOT_FOUND_ERROR, probability: 0.01 }
      ]
    };
  }

  // Performance test data
  static createPerformanceTestData(size: 'small' | 'medium' | 'large' = 'medium') {
    const sizes = {
      small: { alliances: 5, characters: 20, corporations: 10 },
      medium: { alliances: 20, characters: 100, corporations: 50 },
      large: { alliances: 100, characters: 1000, corporations: 500 }
    };

    const config = sizes[size];
    const data = {
      alliances: [] as AllianceInfo[],
      characters: [] as CharacterInfo[],
      corporations: [] as CorporationInfo[]
    };

    // Generate alliances
    for (let i = 1; i <= config.alliances; i++) {
      data.alliances.push(this.createAllianceInfo({
        alliance_id: 99000000 + i,
        name: `Test Alliance ${i}`,
        ticker: `TST${i.toString().padStart(2, '0')}`,
        creator_id: 1000000 + i
      }));
    }

    // Generate corporations
    for (let i = 1; i <= config.corporations; i++) {
      const allianceIndex = Math.floor((i - 1) / (config.corporations / config.alliances));
      data.corporations.push(this.createCorporationInfo({
        corporation_id: 2000000 + i,
        name: `Test Corporation ${i}`,
        ticker: `TC${i.toString().padStart(3, '0')}`,
        alliance_id: data.alliances[allianceIndex]?.alliance_id,
        ceo_id: 3000000 + i
      }));
    }

    // Generate characters
    for (let i = 1; i <= config.characters; i++) {
      const corpIndex = Math.floor((i - 1) / (config.characters / config.corporations));
      const corp = data.corporations[corpIndex];
      data.characters.push(this.createCharacterInfo({
        character_id: 3000000 + i,
        name: `Test Character ${i}`,
        corporation_id: corp?.corporation_id || 2000001,
        alliance_id: corp?.alliance_id
      }));
    }

    return data;
  }

  // Realistic test data with relationships
  static createRealisticTestData() {
    const goonswarm = this.createAllianceInfo({
      alliance_id: 99005338,
      name: 'Goonswarm Federation',
      ticker: 'CONDI',
      creator_id: 1689391488,
      creator_corporation_id: 1344654522,
      executor_corporation_id: 1344654522,
      date_founded: '2010-06-01T00:00:00Z'
    });

    const goonwaffe = this.createCorporationInfo({
      corporation_id: 1344654522,
      name: 'GoonWaffe',
      ticker: 'GEWNS',
      alliance_id: 99005338,
      ceo_id: 1689391488,
      creator_id: 1689391488,
      member_count: 15000,
      date_founded: '2003-05-06T00:00:00Z'
    });

    const testCharacter = this.createCharacterInfo({
      character_id: 1689391488,
      name: 'The Mittani',
      corporation_id: 1344654522,
      alliance_id: 99005338,
      birthday: '2003-05-06T00:00:00Z'
    });

    return {
      alliances: [goonswarm],
      corporations: [goonwaffe],
      characters: [testCharacter],
      relationships: {
        allianceExecutor: { alliance: 99005338, corporation: 1344654522 },
        corporationCEO: { corporation: 1344654522, character: 1689391488 },
        characterMembership: { character: 1689391488, corporation: 1344654522, alliance: 99005338 }
      }
    };
  }
}

export default TestDataFactory;
