import { ApiClient } from '../core/ApiClient';
import { AllianceClient } from './AllianceClient';
import { AssetsClient } from './AssetsClient';
import { CalendarClient } from './CalendarClient';
import { CharacterClient } from './CharacterClient';
import { ClonesClient } from './ClonesClient';
import { ContactsClient } from './ContactsClient';
import { ContractsClient } from './ContractsClient';
import { CorporationsClient } from './CorporationsClient';
import { CorporationProjectsClient } from './CorporationProjectsClient';
import { DogmaClient } from './DogmaClient';
import { FactionClient } from './FactionClient';
import { FittingsClient } from './FittingsClient';
import { FleetClient } from './FleetClient';
import { IncursionsClient } from './IncursionsClient';
import { IndustryClient } from './IndustryClient';
import { InsuranceClient } from './InsuranceClient';
import { KillmailsClient } from './KillmailsClient';
import { LocationClient } from './LocationClient';
import { LoyaltyClient } from './LoyaltyClient';
import { MailClient } from './MailClient';
import { MarketClient } from './MarketClient';
import { PiClient } from './PiClient';
import { RouteClient } from './RouteClient';
import { SearchClient } from './SearchClient';
import { CharacterSkillsClient } from './SkillsClient';
import { SovereigntyClient } from './SovereigntyClient';
import { StatusClient } from './StatusClient';
import { UiClient } from './UiClient';
import { UniverseClient } from './UniverseClient';
import { WalletClient } from './WalletClient';
import { WarsClient } from './WarsClient';
import { MetaClient } from './MetaClient';
import { FreelanceJobsClient } from './FreelanceJobsClient';
import { SkyhooksClient } from './SkyhooksClient';
import { MercenaryClient } from './MercenaryClient';
import { AccessListsClient } from './AccessListsClient';
import { CosmeticsClient } from './CosmeticsClient';
import { ParagonHubClient } from './ParagonHubClient';
import { MilitaryCampaignsClient } from './MilitaryCampaignsClient';

export type ApiClientType =
  | 'alliance'
  | 'assets'
  | 'calendar'
  | 'characters'
  | 'clones'
  | 'contacts'
  | 'contracts'
  | 'corporations'
  | 'corporationProjects'
  | 'dogma'
  | 'factions'
  | 'fittings'
  | 'fleets'
  | 'incursions'
  | 'industry'
  | 'insurance'
  | 'killmails'
  | 'location'
  | 'loyalty'
  | 'mail'
  | 'market'
  | 'pi'
  | 'route'
  | 'search'
  | 'skills'
  | 'sovereignty'
  | 'status'
  | 'ui'
  | 'universe'
  | 'wallet'
  | 'wars'
  | 'meta'
  | 'freelanceJobs'
  | 'skyhooks'
  | 'cosmetics'
  | 'paragonHub'
  | 'mercenary'
  | 'militaryCampaigns'
  | 'accessLists';

export type ClientInstance =
  | AllianceClient
  | AssetsClient
  | CalendarClient
  | CharacterClient
  | ClonesClient
  | ContactsClient
  | ContractsClient
  | CorporationsClient
  | CorporationProjectsClient
  | DogmaClient
  | FactionClient
  | FittingsClient
  | FleetClient
  | IncursionsClient
  | IndustryClient
  | InsuranceClient
  | KillmailsClient
  | LocationClient
  | LoyaltyClient
  | MailClient
  | MarketClient
  | PiClient
  | RouteClient
  | SearchClient
  | CharacterSkillsClient
  | SovereigntyClient
  | StatusClient
  | UiClient
  | UniverseClient
  | WalletClient
  | WarsClient
  | MetaClient
  | FreelanceJobsClient
  | SkyhooksClient
  | CosmeticsClient
  | ParagonHubClient
  | MercenaryClient
  | MilitaryCampaignsClient
  | AccessListsClient;

const clientFactories: Record<
  ApiClientType,
  new (apiClient: ApiClient) => ClientInstance
> = {
  alliance: AllianceClient,
  assets: AssetsClient,
  calendar: CalendarClient,
  characters: CharacterClient,
  clones: ClonesClient,
  contacts: ContactsClient,
  contracts: ContractsClient,
  corporations: CorporationsClient,
  corporationProjects: CorporationProjectsClient,
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
  cosmetics: CosmeticsClient,
  paragonHub: ParagonHubClient,
  mercenary: MercenaryClient,
  militaryCampaigns: MilitaryCampaignsClient,
  accessLists: AccessListsClient,
};

export function createClientInstance(
  name: ApiClientType,
  apiClient: ApiClient,
): ClientInstance {
  // eslint-disable-next-line security/detect-object-injection
  return new clientFactories[name](apiClient);
}

const allClientTypes: ApiClientType[] = Object.keys(
  clientFactories,
) as ApiClientType[];

// Re-export client classes for direct use
export {
  AllianceClient,
  AssetsClient,
  CalendarClient,
  CharacterClient,
  ClonesClient,
  ContactsClient,
  ContractsClient,
  CorporationsClient,
  CorporationProjectsClient,
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
  CosmeticsClient,
  ParagonHubClient,
  MercenaryClient,
  MilitaryCampaignsClient,
  AccessListsClient,
};
