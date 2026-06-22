import {
  createClientInstance,
  ApiClientType,
  AllianceClient,
  AssetsClient,
  CalendarClient,
  CharacterClient,
  ClonesClient,
  ContactsClient,
  ContractsClient,
  CorporationsClient,
  DogmaClient,
  FactionClient,
  FittingsClient,
  FleetClient,
  IncursionsClient,
  IndustryClient,
  InsuranceClient,
  KillmailsClient,
  LocationClient,
  LoyaltyClient,
  MailClient,
  MarketClient,
  PiClient,
  RouteClient,
  SearchClient,
  CharacterSkillsClient,
  SovereigntyClient,
  StatusClient,
  UiClient,
  UniverseClient,
  WalletClient,
  WarsClient,
  MetaClient,
  FreelanceJobsClient,
  SkyhooksClient,
  MercenaryClient,
  AccessListsClient,
} from '../../../src/core/ClientRegistry';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();
const apiClient = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
  .build();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expectedClasses: Record<ApiClientType, new (...args: any[]) => unknown> =
  {
    alliance: AllianceClient,
    assets: AssetsClient,
    calendar: CalendarClient,
    characters: CharacterClient,
    clones: ClonesClient,
    contacts: ContactsClient,
    contracts: ContractsClient,
    corporations: CorporationsClient,
    dogma: DogmaClient,
    factions: FactionClient,
    fittings: FittingsClient,
    fleets: FleetClient,
    incursions: IncursionsClient,
    industry: IndustryClient,
    insurance: InsuranceClient,
    killmails: KillmailsClient,
    location: LocationClient,
    loyalty: LoyaltyClient,
    mail: MailClient,
    market: MarketClient,
    pi: PiClient,
    route: RouteClient,
    search: SearchClient,
    skills: CharacterSkillsClient,
    sovereignty: SovereigntyClient,
    status: StatusClient,
    ui: UiClient,
    universe: UniverseClient,
    wallet: WalletClient,
    wars: WarsClient,
    meta: MetaClient,
    freelanceJobs: FreelanceJobsClient,
    skyhooks: SkyhooksClient,
    mercenary: MercenaryClient,
    accessLists: AccessListsClient,
  };

const allClientTypes: ApiClientType[] = [
  'alliance',
  'assets',
  'calendar',
  'characters',
  'clones',
  'contacts',
  'contracts',
  'corporations',
  'dogma',
  'factions',
  'fittings',
  'fleets',
  'incursions',
  'industry',
  'insurance',
  'killmails',
  'location',
  'loyalty',
  'mail',
  'market',
  'pi',
  'route',
  'search',
  'skills',
  'sovereignty',
  'status',
  'ui',
  'universe',
  'wallet',
  'wars',
  'meta',
  'freelanceJobs',
  'skyhooks',
  'mercenary',
  'accessLists',
];

describe('ClientRegistry', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it.each(allClientTypes)(
    'should create a valid client instance for type "%s"',
    (clientType) => {
      const instance = createClientInstance(clientType, apiClient);
      expect(instance).toBeDefined();
      expect(instance).toBeInstanceOf(expectedClasses[clientType]);
    },
  );

  it('should cover all ApiClientType values', () => {
    expect(allClientTypes).toHaveLength(35);
  });
});
