import { expectType, expectAssignable } from 'tsd';
import type {
  EsiResponse,
  EsiResponseMeta,
  AllianceInfo,
  AllianceIcon,
  CharacterInfo,
  CharacterPortrait,
  MarketOrder,
  MarketHistory,
  ServerStatus,
  Killmail,
  InsurancePrice,
  Incursion,
  SovereigntyCampaign,
  MilitaryCampaign,
  MilitaryCampaignObjective,
  CharacterMilitaryCampaignObjective,
  CorporationProject,
  CorporationProjectContribution,
  CorporationProjectContributor,
  CorporationProjectContributorsListing,
  CorporationProjectsListing,
  FactionWarfareCharacterLeaderboard,
  FactionWarfareCorporationLeaderboard,
  FactionWarfareFactionLeaderboard,
  FactionWarfareLeaderboard,
  Contract,
  PublicContract,
  PublicContractBid,
  ContractBid,
} from '../../src';

// --- EsiResponse shape ---

declare const response: EsiResponse<AllianceInfo>;
expectType<AllianceInfo>(response.data);
expectType<EsiResponseMeta>(response.meta);

// --- EsiResponseMeta fields ---

declare const meta: EsiResponseMeta;
expectType<Record<string, string>>(meta.headers);
expectType<boolean>(meta.fromCache);
expectType<boolean>(meta.stale);

// --- Domain response types have expected fields ---

declare const alliance: AllianceInfo;
expectType<string>(alliance.name);
expectType<string>(alliance.ticker);
expectType<number>(alliance.creator_id);
expectType<number>(alliance.creator_corporation_id);
expectType<string>(alliance.date_founded);

declare const icon: AllianceIcon;
expectAssignable<string | undefined>(icon.px64x64);
expectAssignable<string | undefined>(icon.px128x128);

declare const character: CharacterInfo;
expectType<string>(character.name);
expectType<number>(character.corporation_id);
expectType<number>(character.bloodline_id);
expectType<number>(character.race_id);
expectType<string>(character.birthday);

declare const portrait: CharacterPortrait;
expectAssignable<string | undefined>(portrait.px64x64);
expectAssignable<string | undefined>(portrait.px128x128);

declare const order: MarketOrder;
expectType<number>(order.order_id);
expectType<number>(order.type_id);
expectType<number>(order.location_id);
expectType<number>(order.price);
expectType<boolean>(order.is_buy_order);
expectType<number>(order.duration);
expectType<string>(order.issued);
expectType<string>(order.range);

declare const history: MarketHistory;
expectType<string>(history.date);
expectType<number>(history.order_count);
expectType<number>(history.volume);
expectType<number>(history.highest);
expectType<number>(history.lowest);
expectType<number>(history.average);

declare const status: ServerStatus;
expectType<number>(status.players);
expectType<string>(status.server_version);
expectType<string>(status.start_time);
expectType<boolean>(status.vip);

declare const killmail: Killmail;
expectType<number>(killmail.killmail_id);
expectType<string>(killmail.killmail_time);
expectType<number>(killmail.solar_system_id);

declare const campaign: SovereigntyCampaign;
expectType<number>(campaign.campaign_id);
expectType<number>(campaign.structure_id);
expectType<number>(campaign.solar_system_id);

// --- Military Campaigns ---

declare const milCampaign: MilitaryCampaign;
expectType<string>(milCampaign.campaign_id);
expectType<string>(milCampaign.state);
expectType<number>(milCampaign.progress);
expectType<string>(milCampaign.start_time);

declare const milObjective: MilitaryCampaignObjective;
expectType<string>(milObjective.objective_id);
expectType<string>(milObjective.campaign_id);
expectType<number>(milObjective.progress);

declare const charObjective: CharacterMilitaryCampaignObjective;
expectType<string>(charObjective.objective_id);
expectType<boolean>(charObjective.committed);
expectType<number>(charObjective.contribution);

// --- Corporation Projects ---

declare const corpProjects: CorporationProjectsListing;
expectType<string>(corpProjects.projects[0]!.id);
expectType<number>(corpProjects.projects[0]!.progress.desired);
expectType<string | undefined>(corpProjects.cursor?.after);

declare const corpProject: CorporationProject;
expectType<string>(corpProject.id);
expectAssignable<string>(corpProject.state);
expectType<number>(corpProject.progress.current);
expectType<number>(corpProject.creator.id);
expectType<string>(corpProject.details.created);

declare const corpContribution: CorporationProjectContribution;
expectType<number>(corpContribution.contributed);
expectType<string | undefined>(corpContribution.last_modified);

declare const corpContributors: CorporationProjectContributorsListing;
declare const corpContributor: CorporationProjectContributor;
expectType<CorporationProjectContributor[]>(corpContributors.contributors);
expectType<number>(corpContributor.id);
expectType<string>(corpContributor.name);
expectType<number>(corpContributor.contributed);

// --- Faction Warfare leaderboards ---

declare const factionBoard: FactionWarfareFactionLeaderboard;
expectType<number | undefined>(factionBoard.kills.yesterday[0]!.faction_id);
expectType<number | undefined>(factionBoard.kills.yesterday[0]!.amount);

declare const characterBoard: FactionWarfareCharacterLeaderboard;
expectType<number | undefined>(
  characterBoard.victory_points.active_total[0]!.character_id,
);

declare const corporationBoard: FactionWarfareCorporationLeaderboard;
expectType<number | undefined>(
  corporationBoard.kills.last_week[0]!.corporation_id,
);

// Each board still satisfies the deprecated shared type.
expectAssignable<FactionWarfareLeaderboard>(factionBoard);
expectAssignable<FactionWarfareLeaderboard>(characterBoard);
expectAssignable<FactionWarfareLeaderboard>(corporationBoard);

// --- Contracts ---

declare const characterContract: Contract;
expectAssignable<string>(characterContract.status);
expectAssignable<string>(characterContract.availability);
expectType<number>(characterContract.acceptor_id);
expectType<number>(characterContract.assignee_id);
expectType<boolean>(characterContract.for_corporation);

declare const characterBid: ContractBid;
expectType<number>(characterBid.bidder_id);

declare const publicBid: PublicContractBid;
expectType<number>(publicBid.amount);

declare const publicContract: PublicContract;
expectType<number>(publicContract.contract_id);
expectAssignable<string>(publicContract.type);
