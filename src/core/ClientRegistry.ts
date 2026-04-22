import { ApiClient } from './ApiClient';
import { AllianceClient } from '../clients/AllianceClient';
import { AssetsClient } from '../clients/AssetsClient';
import { CalendarClient } from '../clients/CalendarClient';
import { CharacterClient } from '../clients/CharacterClient';
import { ClonesClient } from '../clients/ClonesClient';
import { ContactsClient } from '../clients/ContactsClient';
import { ContractsClient } from '../clients/ContractsClient';
import { CorporationsClient } from '../clients/CorporationsClient';
import { DogmaClient } from '../clients/DogmaClient';
import { FactionClient } from '../clients/FactionClient';
import { FittingsClient } from '../clients/FittingsClient';
import { FleetClient } from '../clients/FleetClient';
import { IncursionsClient } from '../clients/IncursionsClient';
import { IndustryClient } from '../clients/IndustryClient';
import { InsuranceClient } from '../clients/InsuranceClient';
import { KillmailsClient } from '../clients/KillmailsClient';
import { LocationClient } from '../clients/LocationClient';
import { LoyaltyClient } from '../clients/LoyaltyClient';
import { MailClient } from '../clients/MailClient';
import { MarketClient } from '../clients/MarketClient';
import { PiClient } from '../clients/PiClient';
import { RouteClient } from '../clients/RouteClient';
import { SearchClient } from '../clients/SearchClient';
import { CharacterSkillsClient } from '../clients/SkillsClient';
import { SovereigntyClient } from '../clients/SovereigntyClient';
import { StatusClient } from '../clients/StatusClient';
import { UiClient } from '../clients/UiClient';
import { UniverseClient } from '../clients/UniverseClient';
import { WalletClient } from '../clients/WalletClient';
import { WarsClient } from '../clients/WarsClient';
import { MetaClient } from '../clients/MetaClient';
import { FreelanceJobsClient } from '../clients/FreelanceJobsClient';

export type ApiClientType =
  | 'alliance'
  | 'assets'
  | 'calendar'
  | 'characters'
  | 'clones'
  | 'contacts'
  | 'contracts'
  | 'corporations'
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
  | 'freelanceJobs';

export type ClientInstance =
  | AllianceClient
  | AssetsClient
  | CalendarClient
  | CharacterClient
  | ClonesClient
  | ContactsClient
  | ContractsClient
  | CorporationsClient
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
  | FreelanceJobsClient;

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
};

export function createClientInstance(
  name: ApiClientType,
  apiClient: ApiClient,
): ClientInstance {
  // eslint-disable-next-line security/detect-object-injection
  return new clientFactories[name](apiClient);
}

export const allClientTypes: ApiClientType[] = Object.keys(
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
};
