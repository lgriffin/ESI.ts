import {
  // common
  RateLimitMetaSchema,
  EsiResponseMetaSchema,

  // access-lists
  AccessListEntrySchema,
  AccessListSchema,

  // alliance
  AllianceInfoSchema,
  AllianceContactSchema,
  AllianceContactLabelSchema,
  AllianceIconSchema,

  // assets
  CharacterAssetSchema,
  AssetLocationSchema,
  AssetNameSchema,

  // calendar
  CalendarEventSchema,
  CalendarEventDetailSchema,
  CalendarEventAttendeeSchema,

  // character
  CharacterInfoSchema,
  CharacterPortraitSchema,
  CharacterAttributesSchema,
  AgentResearchSchema,
  BlueprintSchema,
  CorporationHistorySchema,
  JumpFatigueSchema,
  MedalSchema,
  NotificationSchema,
  StandingSchema,
  CharacterTitleSchema,
  CharacterAffiliationSchema,
  ContactNotificationSchema,
  CharacterRoleSchema,

  // clones
  CloneInfoSchema,

  // contacts
  ContactSchema,
  ContactLabelSchema,

  // contracts
  ContractSchema,
  ContractItemSchema,
  ContractBidSchema,

  // corporation
  CorporationInfoSchema,
  CorporationAllianceHistorySchema,
  CorporationMedalSchema,
  CorporationStarbaseSchema,
  CorporationDivisionsSchema,
  CorporationFacilitySchema,
  CorporationIssuedMedalSchema,
  CorporationMemberTitleSchema,
  CorporationMemberTrackingSchema,
  CorporationMemberRoleSchema,
  CorporationRoleHistorySchema,
  CorporationShareholderSchema,
  CorporationStarbaseDetailSchema,
  CorporationStructureSchema,
  CorporationTitleSchema,
  CorporationIconSchema,
  CorporationStandingSchema,
  CorporationWalletDivisionSchema,
  ContainerLogSchema,

  // dogma
  DogmaAttributeSchema,
  DogmaEffectSchema,
  DogmaDynamicItemSchema,

  // faction-warfare
  FactionWarfareStatsSchema,
  FactionWarfareCharacterStatsSchema,
  FactionWarfareSystemSchema,
  FactionWarfareWarSchema,
  FactionWarfareLeaderboardSchema,
  FactionWarfareCorporationStatsSchema,

  // fittings
  FittingSchema,

  // fleet
  FleetInfoSchema,
  FleetMemberSchema,
  FleetWingSchema,
  CharacterFleetInfoSchema,

  // freelance-jobs
  EsiCursorSchema,
  FreelanceJobSummarySchema,
  FreelanceJobsListingSchema,
  FreelanceJobDetailSchema,
  CharacterFreelanceJobsListingSchema,
  FreelanceJobParticipationSchema,
  CorporationFreelanceJobsListingSchema,
  FreelanceJobParticipantSchema,

  // incursions
  IncursionSchema,

  // industry
  IndustryJobSchema,
  MiningLedgerEntrySchema,
  IndustryFacilitySchema,
  IndustrySystemSchema,
  MoonExtractionTimerSchema,
  MiningObserverSchema,
  MiningObserverEntrySchema,

  // insurance
  InsurancePriceSchema,

  // killmails
  KillmailSummarySchema,
  KillmailSchema,

  // location
  CharacterLocationSchema,
  CharacterOnlineSchema,
  CharacterShipSchema,

  // loyalty
  LoyaltyPointsSchema,
  LoyaltyStoreOfferSchema,

  // mail
  MailMessageSchema,
  MailLabelSchema,
  MailLabelsResponseSchema,
  MailingListSchema,

  // market
  MarketOrderSchema,
  MarketHistorySchema,
  MarketGroupSchema,
  MarketPriceSchema,

  // mercenary
  MercenaryDenSchema,
  MercenaryTacticalOperationSchema,

  // pi
  PlanetaryColonySchema,
  CustomsOfficeSchema,
  ColonyLayoutSchema,

  // skills
  CharacterSkillSchema,
  CharacterSkillsResponseSchema,
  SkillQueueSchema,

  // skyhooks
  SovereigntyHubSchema,
  OrbitalSkyhookSchema,
  RaidableSkyhookSchema,

  // sovereignty
  SovereigntyCampaignSchema,
  SovereigntySystemStructureSchema,
  SovereigntySystemSchema,

  // status
  ServerStatusSchema,

  // universe
  SolarSystemInfoSchema,
  ConstellationInfoSchema,
  RegionInfoSchema,
  AncestrySchema,
  BloodlineSchema,
  FactionSchema,
  RaceSchema,
  StationInfoSchema,
  TypeInfoSchema,
  AsteroidBeltInfoSchema,
  GraphicInfoSchema,
  ItemCategorySchema,
  ItemGroupSchema,
  MoonInfoSchema,
  PlanetInfoSchema,
  StarInfoSchema,
  StargateInfoSchema,
  StructureInfoSchema,
  SystemJumpSchema,
  SystemKillSchema,
  BulkIdResultSchema,
  NameAndCategorySchema,
  SchematicInfoSchema,
  SearchResultSchema,

  // wallet
  WalletTransactionSchema,
  WalletJournalSchema,

  // wars
  WarSchema,
} from '../../../src/schemas';
import { z } from 'zod';

interface SchemaTestCase {
  name: string;
  schema: z.ZodType;
  validData: Record<string, unknown>;
  invalidData: Record<string, unknown>;
  preservesExtra?: boolean; // defaults to true; false for z.object() schemas
}

const schemaCases: SchemaTestCase[] = [
  // ── common ────────────────────────────────────────────────────────────────
  {
    name: 'RateLimitMetaSchema',
    schema: RateLimitMetaSchema,
    validData: { remaining: 100, limit: 150, used: 50, group: 'esi-global' },
    invalidData: {
      remaining: 'bad',
      limit: 150,
      used: 50,
      group: 'esi-global',
    },
    preservesExtra: false, // uses z.object()
  },
  {
    name: 'EsiResponseMetaSchema',
    schema: EsiResponseMetaSchema,
    validData: {
      headers: { 'content-type': 'application/json' },
      fromCache: false,
      stale: false,
    },
    invalidData: {
      headers: 'not-a-record',
      fromCache: false,
      stale: false,
    },
  },

  // ── access-lists ──────────────────────────────────────────────────────────
  {
    name: 'AccessListEntrySchema',
    schema: AccessListEntrySchema,
    validData: {
      entity_id: 123,
      entity_type: 'character',
      access_type: 'allowed',
    },
    invalidData: {
      entity_id: 'bad',
      entity_type: 'character',
      access_type: 'allowed',
    },
  },
  {
    name: 'AccessListSchema',
    schema: AccessListSchema,
    validData: {
      access_list_id: 1,
      name: 'Test List',
      entries: [
        { entity_id: 123, entity_type: 'corporation', access_type: 'blocked' },
      ],
    },
    invalidData: {
      access_list_id: 'bad',
      name: 'Test List',
      entries: [],
    },
  },

  // ── alliance ──────────────────────────────────────────────────────────────
  {
    name: 'AllianceInfoSchema',
    schema: AllianceInfoSchema,
    validData: {
      name: 'Test Alliance',
      ticker: 'TST',
      creator_id: 1001,
      creator_corporation_id: 2001,
      date_founded: '2020-01-01T00:00:00Z',
    },
    invalidData: {
      name: 'Test Alliance',
      ticker: 'TST',
      creator_id: 'bad',
      creator_corporation_id: 2001,
      date_founded: '2020-01-01T00:00:00Z',
    },
  },
  {
    name: 'AllianceContactSchema',
    schema: AllianceContactSchema,
    validData: {
      contact_id: 100,
      contact_type: 'character',
      standing: 5.0,
    },
    invalidData: {
      contact_id: 100,
      contact_type: 'invalid_type',
      standing: 5.0,
    },
  },
  {
    name: 'AllianceContactLabelSchema',
    schema: AllianceContactLabelSchema,
    validData: { label_id: 1, label_name: 'Friendly' },
    invalidData: { label_id: 'bad', label_name: 'Friendly' },
  },
  {
    name: 'AllianceIconSchema',
    schema: AllianceIconSchema,
    validData: { px64x64: 'https://img.example.com/64.png' },
    invalidData: { px64x64: 12345 },
  },

  // ── assets ────────────────────────────────────────────────────────────────
  {
    name: 'CharacterAssetSchema',
    schema: CharacterAssetSchema,
    validData: {
      item_id: 1000,
      type_id: 587,
      quantity: 1,
      location_id: 60003760,
      location_type: 'station',
      location_flag: 'Hangar',
      is_singleton: false,
    },
    invalidData: {
      item_id: 1000,
      type_id: 587,
      quantity: 1,
      location_id: 60003760,
      location_type: 'bad_type',
      location_flag: 'Hangar',
      is_singleton: false,
    },
  },
  {
    name: 'AssetLocationSchema',
    schema: AssetLocationSchema,
    validData: {
      item_id: 1000,
      position: { x: 1.0, y: 2.0, z: 3.0 },
    },
    invalidData: {
      item_id: 'bad',
      position: { x: 1.0, y: 2.0, z: 3.0 },
    },
  },
  {
    name: 'AssetNameSchema',
    schema: AssetNameSchema,
    validData: { item_id: 1000, name: 'My Ship' },
    invalidData: { item_id: 'bad', name: 'My Ship' },
  },

  // ── calendar ──────────────────────────────────────────────────────────────
  {
    name: 'CalendarEventSchema',
    schema: CalendarEventSchema,
    validData: {
      event_id: 1,
      event_date: '2024-01-01T00:00:00Z',
      title: 'Fleet Op',
      importance: 0,
      event_response: 'accepted',
    },
    invalidData: {
      event_id: 1,
      event_date: '2024-01-01T00:00:00Z',
      title: 'Fleet Op',
      importance: 'bad',
      event_response: 'accepted',
    },
  },
  {
    name: 'CalendarEventDetailSchema',
    schema: CalendarEventDetailSchema,
    validData: {
      event_id: 1,
      date: '2024-01-01T00:00:00Z',
      title: 'Fleet Op',
      text: 'Details here',
      owner_id: 100,
      owner_name: 'FC',
      owner_type: 'character',
      duration: 60,
      importance: 0,
      response: 'accepted',
    },
    invalidData: {
      event_id: 1,
      date: '2024-01-01T00:00:00Z',
      title: 'Fleet Op',
      text: 'Details here',
      owner_id: 100,
      owner_name: 'FC',
      owner_type: 'bad_type',
      duration: 60,
      importance: 0,
      response: 'accepted',
    },
  },
  {
    name: 'CalendarEventAttendeeSchema',
    schema: CalendarEventAttendeeSchema,
    validData: { character_id: 100, event_response: 'tentative' },
    invalidData: { character_id: 'bad', event_response: 'tentative' },
  },

  // ── character ─────────────────────────────────────────────────────────────
  {
    name: 'CharacterInfoSchema',
    schema: CharacterInfoSchema,
    validData: {
      name: 'Test Char',
      corporation_id: 1001,
      bloodline_id: 4,
      race_id: 1,
      gender: 'male',
      birthday: '2003-05-06T00:00:00Z',
    },
    invalidData: {
      name: 'Test Char',
      corporation_id: 'bad',
      bloodline_id: 4,
      race_id: 1,
      gender: 'male',
      birthday: '2003-05-06T00:00:00Z',
    },
  },
  {
    name: 'CharacterPortraitSchema',
    schema: CharacterPortraitSchema,
    validData: { px64x64: 'https://img.example.com/64.png' },
    invalidData: { px64x64: 12345 },
  },
  {
    name: 'CharacterAttributesSchema',
    schema: CharacterAttributesSchema,
    validData: {
      charisma: 20,
      intelligence: 25,
      memory: 22,
      perception: 21,
      willpower: 23,
    },
    invalidData: {
      charisma: 'bad',
      intelligence: 25,
      memory: 22,
      perception: 21,
      willpower: 23,
    },
  },
  {
    name: 'AgentResearchSchema',
    schema: AgentResearchSchema,
    validData: {
      agent_id: 3009841,
      skill_type_id: 11450,
      started_at: '2017-03-01T00:00:00Z',
      points_per_day: 53.5346,
      remainder_points: 53604.0634,
    },
    invalidData: {
      agent_id: 'bad',
      skill_type_id: 11450,
      started_at: '2017-03-01T00:00:00Z',
      points_per_day: 53.5346,
      remainder_points: 53604.0634,
    },
  },
  {
    name: 'BlueprintSchema',
    schema: BlueprintSchema,
    validData: {
      item_id: 1000,
      type_id: 691,
      location_id: 60003760,
      location_flag: 'Hangar',
      quantity: -1,
      time_efficiency: 20,
      material_efficiency: 10,
      runs: -1,
    },
    invalidData: {
      item_id: 1000,
      type_id: 691,
      location_id: 60003760,
      location_flag: 'Hangar',
      quantity: 'bad',
      time_efficiency: 20,
      material_efficiency: 10,
      runs: -1,
    },
  },
  {
    name: 'CorporationHistorySchema',
    schema: CorporationHistorySchema,
    validData: {
      corporation_id: 1001,
      record_id: 500,
      start_date: '2016-06-26T20:00:00Z',
    },
    invalidData: {
      corporation_id: 'bad',
      record_id: 500,
      start_date: '2016-06-26T20:00:00Z',
    },
  },
  {
    name: 'JumpFatigueSchema',
    schema: JumpFatigueSchema,
    validData: {
      jump_fatigue_expire_date: '2024-01-01T00:00:00Z',
      last_jump_date: '2024-01-01T00:00:00Z',
      last_update_date: '2024-01-01T00:00:00Z',
    },
    invalidData: {
      jump_fatigue_expire_date: 12345,
    },
  },
  {
    name: 'MedalSchema',
    schema: MedalSchema,
    validData: {
      medal_id: 1,
      title: 'Bravery',
      description: 'For bravery',
      date: '2024-01-01T00:00:00Z',
      issuer_id: 100,
      corporation_id: 200,
      reason: 'Heroic act',
      status: 'public',
      graphics: [{ part: 1, layer: 0, graphic: 'caldari.1_1' }],
    },
    invalidData: {
      medal_id: 'bad',
      title: 'Bravery',
      description: 'For bravery',
      date: '2024-01-01T00:00:00Z',
      issuer_id: 100,
      corporation_id: 200,
      reason: 'Heroic act',
      status: 'public',
      graphics: [],
    },
  },
  {
    name: 'NotificationSchema',
    schema: NotificationSchema,
    validData: {
      notification_id: 1,
      type: 'AllWarDeclaredMsg',
      sender_id: 100,
      sender_type: 'corporation',
      timestamp: '2024-01-01T00:00:00Z',
    },
    invalidData: {
      notification_id: 1,
      type: 'AllWarDeclaredMsg',
      sender_id: 100,
      sender_type: 'bad_type',
      timestamp: '2024-01-01T00:00:00Z',
    },
  },
  {
    name: 'StandingSchema',
    schema: StandingSchema,
    validData: {
      from_id: 500,
      from_type: 'agent',
      standing: 7.5,
    },
    invalidData: {
      from_id: 500,
      from_type: 'bad_type',
      standing: 7.5,
    },
  },
  {
    name: 'CharacterTitleSchema',
    schema: CharacterTitleSchema,
    validData: { title_id: 1, name: 'Director' },
    invalidData: { title_id: 'bad', name: 'Director' },
  },
  {
    name: 'CharacterAffiliationSchema',
    schema: CharacterAffiliationSchema,
    validData: { character_id: 100, corporation_id: 200 },
    invalidData: { character_id: 'bad', corporation_id: 200 },
  },
  {
    name: 'ContactNotificationSchema',
    schema: ContactNotificationSchema,
    validData: {
      notification_id: 1,
      sender_character_id: 100,
      message: 'Hello',
      send_date: '2024-01-01T00:00:00Z',
      standing_level: 5.0,
    },
    invalidData: {
      notification_id: 'bad',
      sender_character_id: 100,
      message: 'Hello',
      send_date: '2024-01-01T00:00:00Z',
      standing_level: 5.0,
    },
  },
  {
    name: 'CharacterRoleSchema',
    schema: CharacterRoleSchema,
    validData: {
      roles: ['Director'],
      roles_at_hq: ['Hangar_Take_1'],
    },
    invalidData: {
      roles: 'bad',
    },
  },

  // ── clones ────────────────────────────────────────────────────────────────
  {
    name: 'CloneInfoSchema',
    schema: CloneInfoSchema,
    validData: {
      jump_clones: [
        {
          jump_clone_id: 1,
          location_id: 60003760,
          location_type: 'station',
          implants: [22118],
        },
      ],
    },
    invalidData: {
      jump_clones: 'bad',
    },
  },

  // ── contacts ──────────────────────────────────────────────────────────────
  {
    name: 'ContactSchema',
    schema: ContactSchema,
    validData: {
      contact_id: 100,
      contact_type: 'character',
      standing: 10.0,
    },
    invalidData: {
      contact_id: 100,
      contact_type: 'bad_type',
      standing: 10.0,
    },
  },
  {
    name: 'ContactLabelSchema',
    schema: ContactLabelSchema,
    validData: { label_id: 1, label_name: 'Friends' },
    invalidData: { label_id: 'bad', label_name: 'Friends' },
  },

  // ── contracts ─────────────────────────────────────────────────────────────
  {
    name: 'ContractSchema',
    schema: ContractSchema,
    validData: {
      contract_id: 1,
      issuer_id: 100,
      issuer_corporation_id: 200,
      type: 'item_exchange',
      date_issued: '2024-01-01T00:00:00Z',
      date_expired: '2024-02-01T00:00:00Z',
    },
    invalidData: {
      contract_id: 'bad',
      issuer_id: 100,
      issuer_corporation_id: 200,
      type: 'item_exchange',
      date_issued: '2024-01-01T00:00:00Z',
      date_expired: '2024-02-01T00:00:00Z',
    },
  },
  {
    name: 'ContractItemSchema',
    schema: ContractItemSchema,
    validData: {
      record_id: 1,
      type_id: 587,
      quantity: 10,
      is_singleton: false,
      is_included: true,
    },
    invalidData: {
      record_id: 'bad',
      type_id: 587,
      quantity: 10,
      is_singleton: false,
      is_included: true,
    },
  },
  {
    name: 'ContractBidSchema',
    schema: ContractBidSchema,
    validData: {
      bid_id: 1,
      bidder_id: 100,
      date_bid: '2024-01-01T00:00:00Z',
      amount: 1000000.0,
    },
    invalidData: {
      bid_id: 'bad',
      bidder_id: 100,
      date_bid: '2024-01-01T00:00:00Z',
      amount: 1000000.0,
    },
  },

  // ── corporation ───────────────────────────────────────────────────────────
  {
    name: 'CorporationInfoSchema',
    schema: CorporationInfoSchema,
    validData: {
      name: 'Test Corp',
      ticker: 'TC',
      ceo_id: 100,
      creator_id: 100,
      member_count: 50,
      tax_rate: 0.1,
    },
    invalidData: {
      name: 'Test Corp',
      ticker: 'TC',
      ceo_id: 'bad',
      creator_id: 100,
      member_count: 50,
      tax_rate: 0.1,
    },
  },
  {
    name: 'CorporationAllianceHistorySchema',
    schema: CorporationAllianceHistorySchema,
    validData: {
      record_id: 1,
      start_date: '2020-01-01T00:00:00Z',
    },
    invalidData: {
      record_id: 'bad',
      start_date: '2020-01-01T00:00:00Z',
    },
  },
  {
    name: 'CorporationMedalSchema',
    schema: CorporationMedalSchema,
    validData: {
      medal_id: 1,
      title: 'Service Medal',
      description: 'For service',
      creator_id: 100,
      date: '2024-01-01T00:00:00Z',
    },
    invalidData: {
      medal_id: 'bad',
      title: 'Service Medal',
      description: 'For service',
      creator_id: 100,
      date: '2024-01-01T00:00:00Z',
    },
  },
  {
    name: 'CorporationStarbaseSchema',
    schema: CorporationStarbaseSchema,
    validData: {
      starbase_id: 1,
      type_id: 16213,
      system_id: 30000142,
      state: 'online',
    },
    invalidData: {
      starbase_id: 1,
      type_id: 16213,
      system_id: 30000142,
      state: 'bad_state',
    },
  },
  {
    name: 'CorporationDivisionsSchema',
    schema: CorporationDivisionsSchema,
    validData: {
      hangar: [{ division: 1, name: 'Hangar 1' }],
      wallet: [{ division: 1, name: 'Wallet 1' }],
    },
    invalidData: {
      hangar: 'bad',
    },
  },
  {
    name: 'CorporationFacilitySchema',
    schema: CorporationFacilitySchema,
    validData: {
      facility_id: 1,
      type_id: 35825,
      system_id: 30000142,
    },
    invalidData: {
      facility_id: 'bad',
      type_id: 35825,
      system_id: 30000142,
    },
  },
  {
    name: 'CorporationIssuedMedalSchema',
    schema: CorporationIssuedMedalSchema,
    validData: {
      medal_id: 1,
      title: 'Bravery',
      description: 'For bravery',
      character_id: 100,
      issued_at: '2024-01-01T00:00:00Z',
      issuer_id: 200,
      reason: 'Heroic act',
      status: 'public',
    },
    invalidData: {
      medal_id: 1,
      title: 'Bravery',
      description: 'For bravery',
      character_id: 100,
      issued_at: '2024-01-01T00:00:00Z',
      issuer_id: 200,
      reason: 'Heroic act',
      status: 'bad_status',
    },
  },
  {
    name: 'CorporationMemberTitleSchema',
    schema: CorporationMemberTitleSchema,
    validData: {
      character_id: 100,
      titles: [1, 2, 3],
    },
    invalidData: {
      character_id: 'bad',
      titles: [1, 2, 3],
    },
  },
  {
    name: 'CorporationMemberTrackingSchema',
    schema: CorporationMemberTrackingSchema,
    validData: {
      character_id: 100,
      start_date: '2020-01-01T00:00:00Z',
    },
    invalidData: {
      character_id: 'bad',
      start_date: '2020-01-01T00:00:00Z',
    },
  },
  {
    name: 'CorporationMemberRoleSchema',
    schema: CorporationMemberRoleSchema,
    validData: {
      character_id: 100,
      roles: ['Director'],
    },
    invalidData: {
      character_id: 'bad',
    },
  },
  {
    name: 'CorporationRoleHistorySchema',
    schema: CorporationRoleHistorySchema,
    validData: {
      character_id: 100,
      changed_at: '2024-01-01T00:00:00Z',
      issuer_id: 200,
      role_type: 'roles',
      before: ['Director'],
      after: [],
    },
    invalidData: {
      character_id: 'bad',
      changed_at: '2024-01-01T00:00:00Z',
      issuer_id: 200,
      role_type: 'roles',
      before: ['Director'],
      after: [],
    },
  },
  {
    name: 'CorporationShareholderSchema',
    schema: CorporationShareholderSchema,
    validData: {
      shareholder_id: 100,
      shareholder_type: 'character',
      share_count: 1000,
    },
    invalidData: {
      shareholder_id: 100,
      shareholder_type: 'bad_type',
      share_count: 1000,
    },
  },
  {
    name: 'CorporationStarbaseDetailSchema',
    schema: CorporationStarbaseDetailSchema,
    validData: {
      state: 'online',
      fuels: [{ type_id: 4246, quantity: 1000 }],
    },
    invalidData: {
      state: 'bad_state',
    },
  },
  {
    name: 'CorporationStructureSchema',
    schema: CorporationStructureSchema,
    validData: {
      structure_id: 1,
      corporation_id: 200,
      type_id: 35825,
      system_id: 30000142,
      profile_id: 1,
      state: 'shield_vulnerable',
    },
    invalidData: {
      structure_id: 'bad',
      corporation_id: 200,
      type_id: 35825,
      system_id: 30000142,
      profile_id: 1,
      state: 'shield_vulnerable',
    },
  },
  {
    name: 'CorporationTitleSchema',
    schema: CorporationTitleSchema,
    validData: {
      title_id: 1,
      name: 'CEO',
    },
    invalidData: {
      title_id: 'bad',
    },
  },
  {
    name: 'CorporationIconSchema',
    schema: CorporationIconSchema,
    validData: {
      px64x64: 'https://img.example.com/64.png',
      px128x128: 'https://img.example.com/128.png',
    },
    invalidData: {
      px64x64: 12345,
    },
  },
  {
    name: 'CorporationStandingSchema',
    schema: CorporationStandingSchema,
    validData: {
      from_id: 500,
      from_type: 'agent',
      standing: 5.0,
    },
    invalidData: {
      from_id: 500,
      from_type: 'bad_type',
      standing: 5.0,
    },
  },
  {
    name: 'CorporationWalletDivisionSchema',
    schema: CorporationWalletDivisionSchema,
    validData: { division: 1, balance: 50000000.0 },
    invalidData: { division: 'bad', balance: 50000000.0 },
  },
  {
    name: 'ContainerLogSchema',
    schema: ContainerLogSchema,
    validData: {
      logged_at: '2024-01-01T00:00:00Z',
      container_id: 1,
      container_type_id: 17368,
      character_id: 100,
      location_id: 60003760,
      location_flag: 'CorpSAG1',
      action: 'add',
    },
    invalidData: {
      logged_at: '2024-01-01T00:00:00Z',
      container_id: 'bad',
      container_type_id: 17368,
      character_id: 100,
      location_id: 60003760,
      location_flag: 'CorpSAG1',
      action: 'add',
    },
  },

  // ── dogma ─────────────────────────────────────────────────────────────────
  {
    name: 'DogmaAttributeSchema',
    schema: DogmaAttributeSchema,
    validData: {
      attribute_id: 1,
      name: 'charisma',
    },
    invalidData: {
      attribute_id: 'bad',
      name: 'charisma',
    },
  },
  {
    name: 'DogmaEffectSchema',
    schema: DogmaEffectSchema,
    validData: {
      effect_id: 1,
      name: 'hiPower',
    },
    invalidData: {
      effect_id: 'bad',
      name: 'hiPower',
    },
  },
  {
    name: 'DogmaDynamicItemSchema',
    schema: DogmaDynamicItemSchema,
    validData: {
      created_by: 100,
      dogma_attributes: [{ attribute_id: 1, value: 5.0 }],
      dogma_effects: [{ effect_id: 1, is_default: true }],
      mutator_type_id: 1000,
      source_type_id: 2000,
    },
    invalidData: {
      created_by: 'bad',
      dogma_attributes: [{ attribute_id: 1, value: 5.0 }],
      dogma_effects: [{ effect_id: 1, is_default: true }],
      mutator_type_id: 1000,
      source_type_id: 2000,
    },
  },

  // ── faction-warfare ───────────────────────────────────────────────────────
  {
    name: 'FactionWarfareStatsSchema',
    schema: FactionWarfareStatsSchema,
    validData: {
      faction_id: 500001,
      pilots: 1000,
      systems_controlled: 20,
      kills: { yesterday: 10, last_week: 50, total: 5000 },
      victory_points: { yesterday: 100, last_week: 500, total: 50000 },
    },
    invalidData: {
      faction_id: 'bad',
      pilots: 1000,
      systems_controlled: 20,
      kills: { yesterday: 10, last_week: 50, total: 5000 },
      victory_points: { yesterday: 100, last_week: 500, total: 50000 },
    },
  },
  {
    name: 'FactionWarfareCharacterStatsSchema',
    schema: FactionWarfareCharacterStatsSchema,
    validData: {
      kills: { yesterday: 1, last_week: 5, total: 100 },
      victory_points: { yesterday: 10, last_week: 50, total: 1000 },
    },
    invalidData: {
      kills: 'bad',
      victory_points: { yesterday: 10, last_week: 50, total: 1000 },
    },
  },
  {
    name: 'FactionWarfareSystemSchema',
    schema: FactionWarfareSystemSchema,
    validData: {
      solar_system_id: 30000142,
      owner_faction_id: 500001,
      occupier_faction_id: 500001,
      contested: 'uncontested',
      victory_points: 0,
      victory_points_threshold: 3000,
    },
    invalidData: {
      solar_system_id: 30000142,
      owner_faction_id: 500001,
      occupier_faction_id: 500001,
      contested: 'bad_status',
      victory_points: 0,
      victory_points_threshold: 3000,
    },
  },
  {
    name: 'FactionWarfareWarSchema',
    schema: FactionWarfareWarSchema,
    validData: { faction_id: 500001, against_id: 500002 },
    invalidData: { faction_id: 'bad', against_id: 500002 },
  },
  {
    name: 'FactionWarfareLeaderboardSchema',
    schema: FactionWarfareLeaderboardSchema,
    validData: {
      kills: {
        yesterday: [{ amount: 10 }],
        last_week: [{ amount: 50 }],
        active_total: [{ amount: 500 }],
      },
      victory_points: {
        yesterday: [{ amount: 100 }],
        last_week: [{ amount: 500 }],
        active_total: [{ amount: 5000 }],
      },
    },
    invalidData: {
      kills: 'bad',
      victory_points: {
        yesterday: [{ amount: 100 }],
        last_week: [{ amount: 500 }],
        active_total: [{ amount: 5000 }],
      },
    },
  },
  {
    name: 'FactionWarfareCorporationStatsSchema',
    schema: FactionWarfareCorporationStatsSchema,
    validData: {
      kills: { yesterday: 5, last_week: 20, total: 500 },
      victory_points: { yesterday: 50, last_week: 200, total: 5000 },
    },
    invalidData: {
      kills: 'bad',
      victory_points: { yesterday: 50, last_week: 200, total: 5000 },
    },
  },

  // ── fittings ──────────────────────────────────────────────────────────────
  {
    name: 'FittingSchema',
    schema: FittingSchema,
    validData: {
      fitting_id: 1,
      name: 'PvP Raven',
      description: 'Standard raven fit',
      ship_type_id: 638,
      items: [{ type_id: 3170, flag: 11, quantity: 1 }],
    },
    invalidData: {
      fitting_id: 'bad',
      name: 'PvP Raven',
      description: 'Standard raven fit',
      ship_type_id: 638,
      items: [],
    },
  },

  // ── fleet ─────────────────────────────────────────────────────────────────
  {
    name: 'FleetInfoSchema',
    schema: FleetInfoSchema,
    validData: {
      is_free_move: false,
      is_registered: true,
      is_voice_enabled: false,
      motd: 'Welcome to fleet',
    },
    invalidData: {
      is_free_move: 'bad',
      is_registered: true,
      is_voice_enabled: false,
      motd: 'Welcome to fleet',
    },
  },
  {
    name: 'FleetMemberSchema',
    schema: FleetMemberSchema,
    validData: {
      character_id: 100,
      ship_type_id: 638,
      wing_id: 1,
      squad_id: 1,
      role: 'squad_member',
      role_name: 'Squad Member',
      join_time: '2024-01-01T00:00:00Z',
      takes_fleet_warp: true,
      solar_system_id: 30000142,
    },
    invalidData: {
      character_id: 100,
      ship_type_id: 638,
      wing_id: 1,
      squad_id: 1,
      role: 'bad_role',
      role_name: 'Squad Member',
      join_time: '2024-01-01T00:00:00Z',
      takes_fleet_warp: true,
      solar_system_id: 30000142,
    },
  },
  {
    name: 'FleetWingSchema',
    schema: FleetWingSchema,
    validData: {
      id: 1,
      name: 'Wing 1',
      squads: [{ id: 1, name: 'Squad 1' }],
    },
    invalidData: {
      id: 'bad',
      name: 'Wing 1',
      squads: [{ id: 1, name: 'Squad 1' }],
    },
  },
  {
    name: 'CharacterFleetInfoSchema',
    schema: CharacterFleetInfoSchema,
    validData: {
      fleet_id: 1,
      role: 'fleet_commander',
      squad_id: -1,
      wing_id: -1,
    },
    invalidData: {
      fleet_id: 1,
      role: 'bad_role',
      squad_id: -1,
      wing_id: -1,
    },
  },

  // ── freelance-jobs ────────────────────────────────────────────────────────
  {
    name: 'EsiCursorSchema',
    schema: EsiCursorSchema,
    validData: { before: null, after: null },
    invalidData: { before: 123, after: null },
  },
  {
    name: 'FreelanceJobSummarySchema',
    schema: FreelanceJobSummarySchema,
    validData: {
      id: 'job-1',
      name: 'Mining Op',
      state: 'active',
      last_modified: '2024-01-01T00:00:00Z',
      progress: { current: 50, desired: 100 },
    },
    invalidData: {
      id: 123,
      name: 'Mining Op',
      state: 'active',
      last_modified: '2024-01-01T00:00:00Z',
      progress: { current: 50, desired: 100 },
    },
  },
  {
    name: 'FreelanceJobsListingSchema',
    schema: FreelanceJobsListingSchema,
    validData: {
      freelance_jobs: [
        {
          id: 'job-1',
          name: 'Mining Op',
          state: 'active',
          last_modified: '2024-01-01T00:00:00Z',
          progress: { current: 50, desired: 100 },
        },
      ],
    },
    invalidData: {
      freelance_jobs: 'bad',
    },
  },
  {
    name: 'FreelanceJobDetailSchema',
    schema: FreelanceJobDetailSchema,
    validData: {
      id: 'job-1',
      name: 'Mining Op',
      state: 'active',
      last_modified: '2024-01-01T00:00:00Z',
      progress: { current: 50, desired: 100 },
      details: {
        description: 'A mining operation',
        career: 'mining',
        created: '2024-01-01T00:00:00Z',
        expires: '2024-02-01T00:00:00Z',
        creator: {
          character: { id: 100, name: 'Creator Char' },
          corporation: { id: 200, name: 'Creator Corp' },
        },
      },
      configuration: {
        version: 1,
        parameters: { ore_type: 'veldspar' },
        method: 'mining',
      },
      contribution: {
        max_committed_participants: 10,
      },
      access_and_visibility: {
        acl_protected: false,
        broadcast_locations: [{ id: 30000142, name: 'Jita' }],
      },
    },
    invalidData: {
      id: 123,
      name: 'Mining Op',
      state: 'active',
      last_modified: '2024-01-01T00:00:00Z',
      progress: { current: 50, desired: 100 },
      details: {
        description: 'A mining operation',
        career: 'mining',
        created: '2024-01-01T00:00:00Z',
        expires: '2024-02-01T00:00:00Z',
        creator: {
          character: { id: 100, name: 'Creator Char' },
          corporation: { id: 200, name: 'Creator Corp' },
        },
      },
      configuration: {
        version: 1,
        parameters: {},
        method: 'mining',
      },
      contribution: {
        max_committed_participants: 10,
      },
      access_and_visibility: {
        acl_protected: false,
        broadcast_locations: [],
      },
    },
  },
  {
    name: 'CharacterFreelanceJobsListingSchema',
    schema: CharacterFreelanceJobsListingSchema,
    validData: {
      freelance_jobs: [
        {
          id: 'job-2',
          name: 'Hauling',
          state: 'completed',
          last_modified: '2024-01-02T00:00:00Z',
          progress: { current: 100, desired: 100 },
        },
      ],
    },
    invalidData: {
      freelance_jobs: 'bad',
    },
  },
  {
    name: 'FreelanceJobParticipationSchema',
    schema: FreelanceJobParticipationSchema,
    validData: {
      job_id: 'job-1',
      character_id: 100,
      status: 'active',
      contributions: 5,
    },
    invalidData: {
      job_id: 123,
      character_id: 100,
      status: 'active',
      contributions: 5,
    },
  },
  {
    name: 'CorporationFreelanceJobsListingSchema',
    schema: CorporationFreelanceJobsListingSchema,
    validData: {
      freelance_jobs: [
        {
          id: 'job-3',
          name: 'Defense',
          state: 'active',
          last_modified: '2024-01-03T00:00:00Z',
          progress: { current: 0, desired: 50 },
        },
      ],
    },
    invalidData: {
      freelance_jobs: 'bad',
    },
  },
  {
    name: 'FreelanceJobParticipantSchema',
    schema: FreelanceJobParticipantSchema,
    validData: {
      character_id: 100,
      corporation_id: 200,
      status: 'committed',
      contributions: 10,
    },
    invalidData: {
      character_id: 'bad',
      corporation_id: 200,
      status: 'committed',
      contributions: 10,
    },
  },

  // ── incursions ────────────────────────────────────────────────────────────
  {
    name: 'IncursionSchema',
    schema: IncursionSchema,
    validData: {
      type: 'Incursion',
      state: 'established',
      staging_solar_system_id: 30000142,
      constellation_id: 20000020,
      infested_solar_systems: [30000142, 30000143],
      has_boss: true,
      faction_id: 500019,
      influence: 0.5,
    },
    invalidData: {
      type: 'Incursion',
      state: 'bad_state',
      staging_solar_system_id: 30000142,
      constellation_id: 20000020,
      infested_solar_systems: [30000142],
      has_boss: true,
      faction_id: 500019,
      influence: 0.5,
    },
  },

  // ── industry ──────────────────────────────────────────────────────────────
  {
    name: 'IndustryJobSchema',
    schema: IndustryJobSchema,
    validData: {
      job_id: 1,
      installer_id: 100,
      facility_id: 200,
      station_id: 60003760,
      activity_id: 1,
      blueprint_id: 1000,
      blueprint_type_id: 691,
      blueprint_location_id: 60003760,
      output_location_id: 60003760,
      runs: 1,
      status: 'active',
      duration: 3600,
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2024-01-02T00:00:00Z',
    },
    invalidData: {
      job_id: 1,
      installer_id: 100,
      facility_id: 200,
      station_id: 60003760,
      activity_id: 1,
      blueprint_id: 1000,
      blueprint_type_id: 691,
      blueprint_location_id: 60003760,
      output_location_id: 60003760,
      runs: 1,
      status: 'bad_status',
      duration: 3600,
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2024-01-02T00:00:00Z',
    },
  },
  {
    name: 'MiningLedgerEntrySchema',
    schema: MiningLedgerEntrySchema,
    validData: {
      date: '2024-01-01',
      solar_system_id: 30000142,
      type_id: 1230,
      quantity: 1000,
    },
    invalidData: {
      date: '2024-01-01',
      solar_system_id: 'bad',
      type_id: 1230,
      quantity: 1000,
    },
  },
  {
    name: 'IndustryFacilitySchema',
    schema: IndustryFacilitySchema,
    validData: {
      facility_id: 1,
      owner_id: 100,
      region_id: 10000002,
      solar_system_id: 30000142,
      type_id: 35825,
    },
    invalidData: {
      facility_id: 'bad',
      owner_id: 100,
      region_id: 10000002,
      solar_system_id: 30000142,
      type_id: 35825,
    },
  },
  {
    name: 'IndustrySystemSchema',
    schema: IndustrySystemSchema,
    validData: {
      solar_system_id: 30000142,
      cost_indices: [{ activity: 'manufacturing', cost_index: 0.01 }],
    },
    invalidData: {
      solar_system_id: 'bad',
      cost_indices: [{ activity: 'manufacturing', cost_index: 0.01 }],
    },
  },
  {
    name: 'MoonExtractionTimerSchema',
    schema: MoonExtractionTimerSchema,
    validData: {
      structure_id: 1,
      moon_id: 40000001,
      extraction_start_time: '2024-01-01T00:00:00Z',
      chunk_arrival_time: '2024-01-15T00:00:00Z',
      natural_decay_time: '2024-01-20T00:00:00Z',
    },
    invalidData: {
      structure_id: 'bad',
      moon_id: 40000001,
      extraction_start_time: '2024-01-01T00:00:00Z',
      chunk_arrival_time: '2024-01-15T00:00:00Z',
      natural_decay_time: '2024-01-20T00:00:00Z',
    },
  },
  {
    name: 'MiningObserverSchema',
    schema: MiningObserverSchema,
    validData: {
      observer_id: 1,
      observer_type: 'structure',
      last_updated: '2024-01-01',
    },
    invalidData: {
      observer_id: 'bad',
      observer_type: 'structure',
      last_updated: '2024-01-01',
    },
  },
  {
    name: 'MiningObserverEntrySchema',
    schema: MiningObserverEntrySchema,
    validData: {
      character_id: 100,
      recorded_corporation_id: 200,
      type_id: 1230,
      quantity: 5000,
      last_updated: '2024-01-01',
    },
    invalidData: {
      character_id: 'bad',
      recorded_corporation_id: 200,
      type_id: 1230,
      quantity: 5000,
      last_updated: '2024-01-01',
    },
  },

  // ── insurance ─────────────────────────────────────────────────────────────
  {
    name: 'InsurancePriceSchema',
    schema: InsurancePriceSchema,
    validData: {
      type_id: 587,
      levels: [{ cost: 10000, payout: 50000, name: 'Basic' }],
    },
    invalidData: {
      type_id: 'bad',
      levels: [{ cost: 10000, payout: 50000, name: 'Basic' }],
    },
  },

  // ── killmails ─────────────────────────────────────────────────────────────
  {
    name: 'KillmailSummarySchema',
    schema: KillmailSummarySchema,
    validData: {
      killmail_id: 1,
      killmail_hash: 'abc123def456',
    },
    invalidData: {
      killmail_id: 'bad',
      killmail_hash: 'abc123def456',
    },
  },
  {
    name: 'KillmailSchema',
    schema: KillmailSchema,
    validData: {
      killmail_id: 1,
      killmail_time: '2024-01-01T00:00:00Z',
      solar_system_id: 30000142,
      victim: {
        ship_type_id: 587,
        damage_taken: 5000,
      },
      attackers: [
        {
          damage_done: 5000,
          final_blow: true,
          security_status: -2.5,
        },
      ],
    },
    invalidData: {
      killmail_id: 'bad',
      killmail_time: '2024-01-01T00:00:00Z',
      solar_system_id: 30000142,
      victim: {
        ship_type_id: 587,
        damage_taken: 5000,
      },
      attackers: [],
    },
  },

  // ── location ──────────────────────────────────────────────────────────────
  {
    name: 'CharacterLocationSchema',
    schema: CharacterLocationSchema,
    validData: { solar_system_id: 30000142 },
    invalidData: { solar_system_id: 'bad' },
  },
  {
    name: 'CharacterOnlineSchema',
    schema: CharacterOnlineSchema,
    validData: { online: true },
    invalidData: { online: 'bad' },
  },
  {
    name: 'CharacterShipSchema',
    schema: CharacterShipSchema,
    validData: {
      ship_item_id: 1000,
      ship_name: 'My Raven',
      ship_type_id: 638,
    },
    invalidData: {
      ship_item_id: 'bad',
      ship_name: 'My Raven',
      ship_type_id: 638,
    },
  },

  // ── loyalty ───────────────────────────────────────────────────────────────
  {
    name: 'LoyaltyPointsSchema',
    schema: LoyaltyPointsSchema,
    validData: { corporation_id: 1000125, loyalty_points: 5000 },
    invalidData: { corporation_id: 'bad', loyalty_points: 5000 },
  },
  {
    name: 'LoyaltyStoreOfferSchema',
    schema: LoyaltyStoreOfferSchema,
    validData: {
      offer_id: 1,
      type_id: 587,
      quantity: 1,
      lp_cost: 500,
      isk_cost: 1000000,
      required_items: [{ type_id: 34, quantity: 100 }],
    },
    invalidData: {
      offer_id: 'bad',
      type_id: 587,
      quantity: 1,
      lp_cost: 500,
      isk_cost: 1000000,
      required_items: [],
    },
  },

  // ── mail ──────────────────────────────────────────────────────────────────
  {
    name: 'MailMessageSchema',
    schema: MailMessageSchema,
    validData: {
      mail_id: 1,
      subject: 'Hello',
      from: 100,
      timestamp: '2024-01-01T00:00:00Z',
    },
    invalidData: {
      mail_id: 'bad',
    },
  },
  {
    name: 'MailLabelSchema',
    schema: MailLabelSchema,
    validData: { label_id: 1, name: 'Inbox' },
    invalidData: { label_id: 'bad', name: 'Inbox' },
  },
  {
    name: 'MailLabelsResponseSchema',
    schema: MailLabelsResponseSchema,
    validData: {
      labels: [{ label_id: 1, name: 'Inbox' }],
      total_unread_count: 5,
    },
    invalidData: {
      labels: 'bad',
    },
  },
  {
    name: 'MailingListSchema',
    schema: MailingListSchema,
    validData: { mailing_list_id: 1, name: 'Corp Mail' },
    invalidData: { mailing_list_id: 'bad', name: 'Corp Mail' },
  },

  // ── market ────────────────────────────────────────────────────────────────
  {
    name: 'MarketOrderSchema',
    schema: MarketOrderSchema,
    validData: {
      order_id: 1,
      type_id: 587,
      location_id: 60003760,
      system_id: 30000142,
      volume_total: 100,
      volume_remain: 50,
      min_volume: 1,
      price: 1000000.0,
      is_buy_order: false,
      duration: 90,
      issued: '2024-01-01T00:00:00Z',
      range: 'region',
    },
    invalidData: {
      order_id: 'bad',
      type_id: 587,
      location_id: 60003760,
      volume_total: 100,
      volume_remain: 50,
      min_volume: 1,
      price: 1000000.0,
      is_buy_order: false,
      duration: 90,
      issued: '2024-01-01T00:00:00Z',
      range: 'region',
    },
  },
  {
    name: 'MarketHistorySchema',
    schema: MarketHistorySchema,
    validData: {
      date: '2024-01-01',
      order_count: 500,
      volume: 10000,
      highest: 1100.0,
      average: 1050.0,
      lowest: 1000.0,
    },
    invalidData: {
      date: '2024-01-01',
      order_count: 'bad',
      volume: 10000,
      highest: 1100.0,
      average: 1050.0,
      lowest: 1000.0,
    },
  },
  {
    name: 'MarketGroupSchema',
    schema: MarketGroupSchema,
    validData: {
      market_group_id: 4,
      name: 'Ships',
      description: 'Spaceships',
      types: [587, 638],
    },
    invalidData: {
      market_group_id: 'bad',
      name: 'Ships',
      description: 'Spaceships',
      types: [587, 638],
    },
  },
  {
    name: 'MarketPriceSchema',
    schema: MarketPriceSchema,
    validData: { type_id: 587 },
    invalidData: { type_id: 'bad' },
  },

  // ── mercenary ─────────────────────────────────────────────────────────────
  {
    name: 'MercenaryDenSchema',
    schema: MercenaryDenSchema,
    validData: {
      den_id: 1,
      system_id: 30000142,
      constellation_id: 20000020,
      region_id: 10000002,
    },
    invalidData: {
      den_id: 'bad',
      system_id: 30000142,
      constellation_id: 20000020,
      region_id: 10000002,
    },
  },
  {
    name: 'MercenaryTacticalOperationSchema',
    schema: MercenaryTacticalOperationSchema,
    validData: {
      operation_id: 1,
      den_id: 1,
      system_id: 30000142,
      site_type: 'combat',
      status: 'active',
    },
    invalidData: {
      operation_id: 1,
      den_id: 1,
      system_id: 30000142,
      site_type: 'combat',
      status: 'bad_status',
    },
  },

  // ── pi ────────────────────────────────────────────────────────────────────
  {
    name: 'PlanetaryColonySchema',
    schema: PlanetaryColonySchema,
    validData: {
      solar_system_id: 30000142,
      planet_id: 40000001,
      planet_type: 'temperate',
      owner_id: 100,
      last_update: '2024-01-01T00:00:00Z',
      upgrade_level: 3,
      num_pins: 5,
    },
    invalidData: {
      solar_system_id: 30000142,
      planet_id: 40000001,
      planet_type: 'bad_type',
      owner_id: 100,
      last_update: '2024-01-01T00:00:00Z',
      upgrade_level: 3,
      num_pins: 5,
    },
  },
  {
    name: 'CustomsOfficeSchema',
    schema: CustomsOfficeSchema,
    validData: {
      office_id: 1,
      system_id: 30000142,
      reinforce_exit_start: 0,
      reinforce_exit_end: 23,
    },
    invalidData: {
      office_id: 'bad',
      system_id: 30000142,
      reinforce_exit_start: 0,
      reinforce_exit_end: 23,
    },
  },
  {
    name: 'ColonyLayoutSchema',
    schema: ColonyLayoutSchema,
    validData: {
      links: [{ source_pin_id: 1, destination_pin_id: 2, link_level: 0 }],
      pins: [{ pin_id: 1, type_id: 2254, latitude: 0.5, longitude: 0.5 }],
      routes: [
        {
          route_id: 1,
          source_pin_id: 1,
          destination_pin_id: 2,
          content_type_id: 2393,
          quantity: 100,
        },
      ],
    },
    invalidData: {
      links: 'bad',
      pins: [],
      routes: [],
    },
  },

  // ── skills ────────────────────────────────────────────────────────────────
  {
    name: 'CharacterSkillSchema',
    schema: CharacterSkillSchema,
    validData: {
      skill_id: 3300,
      skillpoints_in_skill: 500000,
      trained_skill_level: 5,
      active_skill_level: 5,
    },
    invalidData: {
      skill_id: 'bad',
      skillpoints_in_skill: 500000,
      trained_skill_level: 5,
      active_skill_level: 5,
    },
  },
  {
    name: 'CharacterSkillsResponseSchema',
    schema: CharacterSkillsResponseSchema,
    validData: {
      skills: [
        {
          skill_id: 3300,
          skillpoints_in_skill: 500000,
          trained_skill_level: 5,
          active_skill_level: 5,
        },
      ],
      total_sp: 50000000,
    },
    invalidData: {
      skills: 'bad',
      total_sp: 50000000,
    },
  },
  {
    name: 'SkillQueueSchema',
    schema: SkillQueueSchema,
    validData: {
      skill_id: 3300,
      finished_level: 5,
      queue_position: 0,
    },
    invalidData: {
      skill_id: 'bad',
      finished_level: 5,
      queue_position: 0,
    },
  },

  // ── skyhooks ──────────────────────────────────────────────────────────────
  {
    name: 'SovereigntyHubSchema',
    schema: SovereigntyHubSchema,
    validData: {
      structure_id: 1,
      system_id: 30000142,
      corporation_id: 200,
      online: true,
    },
    invalidData: {
      structure_id: 'bad',
      system_id: 30000142,
      corporation_id: 200,
      online: true,
    },
  },
  {
    name: 'OrbitalSkyhookSchema',
    schema: OrbitalSkyhookSchema,
    validData: {
      structure_id: 1,
      system_id: 30000142,
      corporation_id: 200,
      online: true,
    },
    invalidData: {
      structure_id: 'bad',
      system_id: 30000142,
      corporation_id: 200,
      online: true,
    },
  },
  {
    name: 'RaidableSkyhookSchema',
    schema: RaidableSkyhookSchema,
    validData: {
      structure_id: 1,
      system_id: 30000142,
      corporation_id: 200,
      is_raidable: false,
    },
    invalidData: {
      structure_id: 'bad',
      system_id: 30000142,
      corporation_id: 200,
      is_raidable: false,
    },
  },

  // ── sovereignty ───────────────────────────────────────────────────────────
  {
    name: 'SovereigntyCampaignSchema',
    schema: SovereigntyCampaignSchema,
    validData: {
      campaign_id: 1,
      structure_id: 1000,
      solar_system_id: 30000142,
      constellation_id: 20000020,
      event_type: 'tcu_defense',
      start_time: '2024-01-01T00:00:00Z',
    },
    invalidData: {
      campaign_id: 1,
      structure_id: 1000,
      solar_system_id: 30000142,
      constellation_id: 20000020,
      event_type: 'bad_type',
      start_time: '2024-01-01T00:00:00Z',
    },
  },
  {
    name: 'SovereigntySystemStructureSchema',
    schema: SovereigntySystemStructureSchema,
    validData: {
      structure_id: 1,
      structure_type_id: 32226,
    },
    invalidData: {
      structure_id: 'bad',
      structure_type_id: 32226,
    },
  },
  {
    name: 'SovereigntySystemSchema',
    schema: SovereigntySystemSchema,
    validData: {
      solar_systems: [
        {
          solar_system_id: 30000142,
          claim: { unclaimed: true },
        },
      ],
    },
    invalidData: {
      solar_systems: 'bad',
    },
  },

  // ── status ────────────────────────────────────────────────────────────────
  {
    name: 'ServerStatusSchema',
    schema: ServerStatusSchema,
    validData: {
      players: 25000,
      server_version: '2024.1.1',
      start_time: '2024-01-01T11:05:00Z',
    },
    invalidData: {
      players: 'bad',
      server_version: '2024.1.1',
      start_time: '2024-01-01T11:05:00Z',
    },
  },

  // ── universe ──────────────────────────────────────────────────────────────
  {
    name: 'SolarSystemInfoSchema',
    schema: SolarSystemInfoSchema,
    validData: {
      system_id: 30000142,
      name: 'Jita',
      constellation_id: 20000020,
      security_status: 0.9459,
    },
    invalidData: {
      system_id: 'bad',
      name: 'Jita',
      constellation_id: 20000020,
      security_status: 0.9459,
    },
  },
  {
    name: 'ConstellationInfoSchema',
    schema: ConstellationInfoSchema,
    validData: {
      constellation_id: 20000020,
      name: 'Kimotoro',
      region_id: 10000002,
      systems: [30000142],
      position: { x: 1.0, y: 2.0, z: 3.0 },
    },
    invalidData: {
      constellation_id: 'bad',
      name: 'Kimotoro',
      region_id: 10000002,
      systems: [30000142],
      position: { x: 1.0, y: 2.0, z: 3.0 },
    },
  },
  {
    name: 'RegionInfoSchema',
    schema: RegionInfoSchema,
    validData: {
      region_id: 10000002,
      name: 'The Forge',
      constellations: [20000020],
    },
    invalidData: {
      region_id: 'bad',
      name: 'The Forge',
      constellations: [20000020],
    },
  },
  {
    name: 'AncestrySchema',
    schema: AncestrySchema,
    validData: {
      id: 1,
      name: 'Liberal Holders',
      bloodline_id: 5,
      description: 'A liberal ancestry',
    },
    invalidData: {
      id: 'bad',
      name: 'Liberal Holders',
      bloodline_id: 5,
      description: 'A liberal ancestry',
    },
  },
  {
    name: 'BloodlineSchema',
    schema: BloodlineSchema,
    validData: {
      bloodline_id: 1,
      name: 'Deteis',
      description: 'The Deteis',
      race_id: 1,
      corporation_id: 1000006,
      ship_type_id: 601,
      charisma: 3,
      intelligence: 7,
      memory: 7,
      perception: 5,
      willpower: 5,
    },
    invalidData: {
      bloodline_id: 'bad',
      name: 'Deteis',
      description: 'The Deteis',
      race_id: 1,
      corporation_id: 1000006,
      ship_type_id: 601,
      charisma: 3,
      intelligence: 7,
      memory: 7,
      perception: 5,
      willpower: 5,
    },
  },
  {
    name: 'FactionSchema',
    schema: FactionSchema,
    validData: {
      faction_id: 500001,
      name: 'Caldari State',
      description: 'The Caldari',
      size_factor: 5.0,
      station_count: 1503,
      station_system_count: 503,
      is_unique: true,
    },
    invalidData: {
      faction_id: 'bad',
      name: 'Caldari State',
      description: 'The Caldari',
      size_factor: 5.0,
      station_count: 1503,
      station_system_count: 503,
      is_unique: true,
    },
  },
  {
    name: 'RaceSchema',
    schema: RaceSchema,
    validData: {
      race_id: 1,
      name: 'Caldari',
      description: 'The Caldari',
      alliance_id: 500001,
    },
    invalidData: {
      race_id: 'bad',
      name: 'Caldari',
      description: 'The Caldari',
      alliance_id: 500001,
    },
  },
  {
    name: 'StationInfoSchema',
    schema: StationInfoSchema,
    validData: {
      station_id: 60003760,
      name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
      system_id: 30000142,
      type_id: 52678,
      reprocessing_efficiency: 0.5,
      reprocessing_stations_take: 0.05,
      max_dockable_ship_volume: 50000000,
      office_rental_cost: 10000,
      services: ['reprocessing', 'market'],
      position: { x: 1.0, y: 2.0, z: 3.0 },
    },
    invalidData: {
      station_id: 'bad',
      name: 'Jita IV',
      system_id: 30000142,
      type_id: 52678,
      reprocessing_efficiency: 0.5,
      reprocessing_stations_take: 0.05,
      max_dockable_ship_volume: 50000000,
      office_rental_cost: 10000,
      services: [],
      position: { x: 1.0, y: 2.0, z: 3.0 },
    },
  },
  {
    name: 'TypeInfoSchema',
    schema: TypeInfoSchema,
    validData: {
      type_id: 587,
      name: 'Rifter',
      description: 'A Minmatar frigate',
      published: true,
      group_id: 25,
    },
    invalidData: {
      type_id: 'bad',
      name: 'Rifter',
      description: 'A Minmatar frigate',
      published: true,
      group_id: 25,
    },
  },
  {
    name: 'AsteroidBeltInfoSchema',
    schema: AsteroidBeltInfoSchema,
    validData: {
      name: 'Jita IV - Asteroid Belt 1',
      position: { x: 1.0, y: 2.0, z: 3.0 },
      system_id: 30000142,
    },
    invalidData: {
      name: 12345,
      position: { x: 1.0, y: 2.0, z: 3.0 },
      system_id: 30000142,
    },
  },
  {
    name: 'GraphicInfoSchema',
    schema: GraphicInfoSchema,
    validData: { graphic_id: 1 },
    invalidData: { graphic_id: 'bad' },
  },
  {
    name: 'ItemCategorySchema',
    schema: ItemCategorySchema,
    validData: {
      category_id: 6,
      name: 'Ship',
      groups: [25, 26, 27],
      published: true,
    },
    invalidData: {
      category_id: 'bad',
      name: 'Ship',
      groups: [25, 26, 27],
      published: true,
    },
  },
  {
    name: 'ItemGroupSchema',
    schema: ItemGroupSchema,
    validData: {
      group_id: 25,
      name: 'Frigate',
      category_id: 6,
      types: [587, 585],
      published: true,
    },
    invalidData: {
      group_id: 'bad',
      name: 'Frigate',
      category_id: 6,
      types: [587],
      published: true,
    },
  },
  {
    name: 'MoonInfoSchema',
    schema: MoonInfoSchema,
    validData: {
      moon_id: 40000001,
      name: 'Jita IV - Moon 1',
      system_id: 30000142,
      position: { x: 1.0, y: 2.0, z: 3.0 },
    },
    invalidData: {
      moon_id: 'bad',
      name: 'Jita IV - Moon 1',
      system_id: 30000142,
      position: { x: 1.0, y: 2.0, z: 3.0 },
    },
  },
  {
    name: 'PlanetInfoSchema',
    schema: PlanetInfoSchema,
    validData: {
      planet_id: 40000001,
      name: 'Jita IV',
      system_id: 30000142,
      type_id: 2016,
      position: { x: 1.0, y: 2.0, z: 3.0 },
    },
    invalidData: {
      planet_id: 'bad',
      name: 'Jita IV',
      system_id: 30000142,
      type_id: 2016,
      position: { x: 1.0, y: 2.0, z: 3.0 },
    },
  },
  {
    name: 'StarInfoSchema',
    schema: StarInfoSchema,
    validData: {
      solar_system_id: 30000142,
      name: 'Jita',
      type_id: 6,
      age: 3000000000,
      luminosity: 0.01,
      radius: 100000000,
      spectral_class: 'K2 V',
      temperature: 4567,
    },
    invalidData: {
      solar_system_id: 'bad',
      name: 'Jita',
      type_id: 6,
      age: 3000000000,
      luminosity: 0.01,
      radius: 100000000,
      spectral_class: 'K2 V',
      temperature: 4567,
    },
  },
  {
    name: 'StargateInfoSchema',
    schema: StargateInfoSchema,
    validData: {
      stargate_id: 50000001,
      name: 'Jita Stargate',
      system_id: 30000142,
      type_id: 29624,
      position: { x: 1.0, y: 2.0, z: 3.0 },
      destination: { system_id: 30000144, stargate_id: 50000002 },
    },
    invalidData: {
      stargate_id: 'bad',
      name: 'Jita Stargate',
      system_id: 30000142,
      type_id: 29624,
      position: { x: 1.0, y: 2.0, z: 3.0 },
      destination: { system_id: 30000144, stargate_id: 50000002 },
    },
  },
  {
    name: 'StructureInfoSchema',
    schema: StructureInfoSchema,
    validData: {
      name: 'Keepstar',
      owner_id: 100,
      solar_system_id: 30000142,
    },
    invalidData: {
      name: 12345,
      owner_id: 100,
      solar_system_id: 30000142,
    },
  },
  {
    name: 'SystemJumpSchema',
    schema: SystemJumpSchema,
    validData: { system_id: 30000142, ship_jumps: 1500 },
    invalidData: { system_id: 'bad', ship_jumps: 1500 },
  },
  {
    name: 'SystemKillSchema',
    schema: SystemKillSchema,
    validData: {
      system_id: 30000142,
      npc_kills: 100,
      pod_kills: 5,
      ship_kills: 10,
    },
    invalidData: {
      system_id: 'bad',
      npc_kills: 100,
      pod_kills: 5,
      ship_kills: 10,
    },
  },
  {
    name: 'BulkIdResultSchema',
    schema: BulkIdResultSchema,
    validData: {
      characters: [{ id: 100, name: 'Test Char' }],
      corporations: [{ id: 200, name: 'Test Corp' }],
    },
    invalidData: {
      characters: 'bad',
    },
  },
  {
    name: 'NameAndCategorySchema',
    schema: NameAndCategorySchema,
    validData: {
      id: 100,
      name: 'Test Char',
      category: 'character',
    },
    invalidData: {
      id: 100,
      name: 'Test Char',
      category: 'bad_category',
    },
  },
  {
    name: 'SchematicInfoSchema',
    schema: SchematicInfoSchema,
    validData: { schematic_name: 'Water', cycle_time: 3600 },
    invalidData: { schematic_name: 12345, cycle_time: 3600 },
  },
  {
    name: 'SearchResultSchema',
    schema: SearchResultSchema,
    validData: {
      character: [100, 101],
      corporation: [200],
    },
    invalidData: {
      character: 'bad',
    },
  },

  // ── wallet ────────────────────────────────────────────────────────────────
  {
    name: 'WalletTransactionSchema',
    schema: WalletTransactionSchema,
    validData: {
      transaction_id: 1,
      date: '2024-01-01T00:00:00Z',
      type_id: 587,
      location_id: 60003760,
      unit_price: 1000000.0,
      quantity: 1,
      client_id: 100,
      is_buy: true,
      is_personal: true,
      journal_ref_id: 500,
    },
    invalidData: {
      transaction_id: 'bad',
      date: '2024-01-01T00:00:00Z',
      type_id: 587,
      location_id: 60003760,
      unit_price: 1000000.0,
      quantity: 1,
      client_id: 100,
      is_buy: true,
      is_personal: true,
      journal_ref_id: 500,
    },
  },
  {
    name: 'WalletJournalSchema',
    schema: WalletJournalSchema,
    validData: {
      id: 1,
      date: '2024-01-01T00:00:00Z',
      ref_type: 'market_escrow',
      description: 'Market buy',
    },
    invalidData: {
      id: 'bad',
      date: '2024-01-01T00:00:00Z',
      ref_type: 'market_escrow',
      description: 'Market buy',
    },
  },

  // ── wars ──────────────────────────────────────────────────────────────────
  {
    name: 'WarSchema',
    schema: WarSchema,
    validData: {
      id: 1,
      declared: '2024-01-01T00:00:00Z',
      mutual: false,
      open_for_allies: true,
      aggressor: { isk_destroyed: 100000, ships_killed: 5 },
      defender: { isk_destroyed: 50000, ships_killed: 2 },
    },
    invalidData: {
      id: 'bad',
      declared: '2024-01-01T00:00:00Z',
      mutual: false,
      open_for_allies: true,
      aggressor: { isk_destroyed: 100000, ships_killed: 5 },
      defender: { isk_destroyed: 50000, ships_killed: 2 },
    },
  },
];

describe('Schema Rejection Tests', () => {
  describe.each(schemaCases)(
    '$name',
    ({ schema, validData, invalidData, preservesExtra }) => {
      it('should accept valid data', () => {
        const result = schema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject data with wrong type on a required field', () => {
        const result = schema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should accept valid data with extra fields', () => {
        const dataWithExtra = {
          ...validData,
          _extra_test_field: 'should be allowed',
          _extra_number: 42,
        };
        const result = schema.safeParse(dataWithExtra);
        expect(result.success).toBe(true);

        if (result.success && preservesExtra !== false) {
          // looseObject preserves unknown keys
          const data = result.data as Record<string, unknown>;
          expect(data._extra_test_field).toBe('should be allowed');
          expect(data._extra_number).toBe(42);
        }
      });
    },
  );
});
