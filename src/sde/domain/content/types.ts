/**
 * SDE domain: missions, dungeons, epic arcs, campaigns and notification types.
 *
 * Types for the tables of this domain; the Zod schemas that validate them
 * are in ./schemas.ts (split out of the former src/sde/types.ts, Track S
 * Run 12).
 */

/** eve_dungeons [1409 rows] */
export interface Dungeon {
  dungeonId: number;
  allowedShipsList: unknown;
  archetypeId: number;
  description: string;
  factionId: number;
  name: string;
  gameplayDescription?: string;
}

/** eve_epic_arcs [21 rows] */
export interface EpicArc {
  epicArcId: number;
  arcRestartInterval: number;
  factionId: number;
  iconId: number;
  missions: unknown;
  name: string;
}

/** eve_freelance_job_schemas [1 row] */
export interface FreelanceJobSchema {
  freelanceJobSchemaGroupId: number;
  BoostShield: unknown;
  CaptureFWComplex: unknown;
  DamageShip: unknown;
  DefendFWComplex: unknown;
  DeliverItem: unknown;
  KillCapsuleer: unknown;
  KillNPC: unknown;
  MineOre: unknown;
  RepairArmor: unknown;
  ShipInsurance: unknown;
}

/** eve_mercenary_tactical_operations [3 rows] */
export interface MercenaryTacticalOperation {
  mercenaryTacticalOperationId: number;
  anarchyImpact: number;
  description: string;
  developmentImpact: number;
  dungeonId: number;
  infomorphBonus: number;
  name: string;
}

/** eve_military_campaign_objectives [116 rows] — string PK */
export interface MilitaryCampaignObjective {
  militaryCampaignObjectiveId: string;
  campaignId: string;
  careerPath: string;
  contentTags: unknown;
  contributionMethodConfiguration: unknown;
  issuer: unknown;
  maxProgressPerParticipant: number;
  presentingCharacterId: number;
  rewards: unknown;
  subtitle: string;
  targetProgress: number;
  title: string;
  annotations: unknown;
}

/** eve_military_campaigns [4 rows] — string PK */
export interface MilitaryCampaign {
  militaryCampaignId: string;
  annotations: unknown;
  issuer: unknown;
  subtitle: string;
  targetProgress: number;
  title: string;
}

/** eve_missions [2892 rows] */
export interface Mission {
  missionId: number;
  hasStandingRewards: boolean;
  killMission: unknown;
  messages: unknown;
  name: string;
  expirationTime: string | null;
  factionId: number | null;
  agentTypeId?: number;
  corporationId?: number;
  /** What a courier mission asks the pilot to carry. */
  courierMission?: {
    objectiveQuantity: number;
    objectiveSingleton: boolean;
    objectiveTypeId: number;
  };
  /** Faction or corporation ID to the standing the mission adds. */
  extraStandings?: Record<string, number>;
  initialAgentGiftQuantity?: number;
  initialAgentGiftTypeId?: number;
  missionRewards?: {
    bonusReward?: { rewardQuantity: number; rewardTypeId: number };
    /** Seconds within which the bonus reward is earned. */
    bonusTimeInterval?: number;
    reward?: { rewardQuantity: number; rewardTypeId: number };
  };
}

/** eve_notification_types [297 rows] */
export interface NotificationType {
  notificationTypeId: number;
  displayName: string;
  internalName: string;
}
