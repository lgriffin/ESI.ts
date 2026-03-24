// Main client
export { EsiClient, EsiClientConfig } from './EsiClient';
export { getDefaultClient } from './EsiClient';

// Builder & factory
export { CustomEsiClient, EsiClientBuilder, EsiApiFactory } from './EsiClientBuilder';
export { ApiClientType } from './core/ClientRegistry';

// Core (for direct instantiation)
export { ApiClient } from './core/ApiClient';
export { ApiClientBuilder } from './core/ApiClientBuilder';

// Domain clients
export { AllianceClient } from './clients/AllianceClient';
export { AssetsClient } from './clients/AssetsClient';
export { CalendarClient } from './clients/CalendarClient';
export { CharacterClient } from './clients/CharacterClient';
export { ClonesClient } from './clients/ClonesClient';
export { ContactsClient } from './clients/ContactsClient';
export { ContractsClient } from './clients/ContractsClient';
export { CorporationsClient } from './clients/CorporationsClient';
export { DogmaClient } from './clients/DogmaClient';
export { FactionClient } from './clients/FactionClient';
export { FittingsClient } from './clients/FittingsClient';
export { FleetClient } from './clients/FleetClient';
export { IncursionsClient } from './clients/IncursionsClient';
export { IndustryClient } from './clients/IndustryClient';
export { InsuranceClient } from './clients/InsuranceClient';
export { KillmailsClient } from './clients/KillmailsClient';
export { LocationClient } from './clients/LocationClient';
export { LoyaltyClient } from './clients/LoyaltyClient';
export { MailClient } from './clients/MailClient';
export { MarketClient } from './clients/MarketClient';
export { PiClient } from './clients/PiClient';
export { RouteClient, RouteOptions } from './clients/RouteClient';
export { SearchClient } from './clients/SearchClient';
export { CharacterSkillsClient } from './clients/SkillsClient';
export { SovereigntyClient } from './clients/SovereigntyClient';
export { StatusClient } from './clients/StatusClient';
export { UiClient } from './clients/UiClient';
export { UniverseClient } from './clients/UniverseClient';
export { WalletClient } from './clients/WalletClient';
export { WarsClient } from './clients/WarsClient';
export { MetaClient } from './clients/MetaClient';
export { FreelanceJobsClient } from './clients/FreelanceJobsClient';

// Cursor pagination
export { CursorOptions, CursorResult, fetchAllCursorPages } from './core/endpoints/createClient';
export { CursorTokens } from './core/pagination/CursorPaginationHandler';

// Error class
export { EsiError } from './core/util/error';

// Types
export * from './types/api-responses';
