 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CharactersAffiliationPostSchema = z.looseObject({
  alliance_id: z.number().optional(),
  character_id: z.number(),
  corporation_id: z.number(),
  faction_id: z.number().optional(),
});

export const CharactersCharacterIdAgentsResearchGetSchema = z.looseObject({
  agent_id: z.number(),
  points_per_day: z.number(),
  remainder_points: z.number(),
  skill_type_id: z.number(),
  started_at: z.string(),
});

export const CharactersCharacterIdBlueprintsGetSchema = z.looseObject({
  item_id: z.number(),
  location_flag: z.enum(['AutoFit', 'Cargo', 'CorpseBay', 'DroneBay', 'FleetHangar', 'Deliveries', 'HiddenModifiers', 'Hangar', 'HangarAll', 'LoSlot0', 'LoSlot1', 'LoSlot2', 'LoSlot3', 'LoSlot4', 'LoSlot5', 'LoSlot6', 'LoSlot7', 'MedSlot0', 'MedSlot1', 'MedSlot2', 'MedSlot3', 'MedSlot4', 'MedSlot5', 'MedSlot6', 'MedSlot7', 'HiSlot0', 'HiSlot1', 'HiSlot2', 'HiSlot3', 'HiSlot4', 'HiSlot5', 'HiSlot6', 'HiSlot7', 'AssetSafety', 'Locked', 'Unlocked', 'Implant', 'QuafeBay', 'RigSlot0', 'RigSlot1', 'RigSlot2', 'RigSlot3', 'RigSlot4', 'RigSlot5', 'RigSlot6', 'RigSlot7', 'ShipHangar', 'SpecializedFuelBay', 'SpecializedOreHold', 'SpecializedGasHold', 'SpecializedMineralHold', 'SpecializedSalvageHold', 'SpecializedShipHold', 'SpecializedSmallShipHold', 'SpecializedMediumShipHold', 'SpecializedLargeShipHold', 'SpecializedIndustrialShipHold', 'SpecializedAmmoHold', 'SpecializedCommandCenterHold', 'SpecializedPlanetaryCommoditiesHold', 'SpecializedMaterialBay', 'SubSystemSlot0', 'SubSystemSlot1', 'SubSystemSlot2', 'SubSystemSlot3', 'SubSystemSlot4', 'SubSystemSlot5', 'SubSystemSlot6', 'SubSystemSlot7', 'FighterBay', 'FighterTube0', 'FighterTube1', 'FighterTube2', 'FighterTube3', 'FighterTube4', 'Module']),
  location_id: z.number(),
  material_efficiency: z.number(),
  quantity: z.number(),
  runs: z.number(),
  time_efficiency: z.number(),
  type_id: z.number(),
});

export const CharactersCharacterIdCorporationhistoryGetSchema = z.looseObject({
  corporation_id: z.number(),
  is_deleted: z.boolean().optional(),
  record_id: z.number(),
  start_date: z.string(),
});

export const CharactersCharacterIdFatigueGetSchema = z.looseObject({
  jump_fatigue_expire_date: z.string().optional(),
  last_jump_date: z.string().optional(),
  last_update_date: z.string().optional(),
});

export const CharactersCharacterIdMedalsGetSchema = z.looseObject({
  corporation_id: z.number(),
  date: z.string(),
  description: z.string(),
  graphics: z.array(z.looseObject({
    color: z.number().optional(),
    graphic: z.string(),
    layer: z.number(),
    part: z.number(),
  })),
  issuer_id: z.number(),
  medal_id: z.number(),
  reason: z.string(),
  status: z.enum(['public', 'private']),
  title: z.string(),
});

export const CharactersCharacterIdNotificationsContactsGetSchema = z.looseObject({
  message: z.string(),
  notification_id: z.number(),
  send_date: z.string(),
  sender_character_id: z.number(),
  standing_level: z.number(),
});

export const CharactersCharacterIdNotificationsGetSchema = z.looseObject({
  is_read: z.boolean().optional(),
  notification_id: z.number(),
  sender_id: z.number(),
  sender_type: z.enum(['character', 'corporation', 'alliance', 'faction', 'other']),
  text: z.string().optional(),
  timestamp: z.string(),
  type: z.enum(['AcceptedAlly', 'AcceptedSurrender', 'AgentRetiredTrigravian', 'AllAnchoringMsg', 'AllMaintenanceBillMsg', 'AllStrucInvulnerableMsg', 'AllStructVulnerableMsg', 'AllWarCorpJoinedAllianceMsg', 'AllWarDeclaredMsg', 'AllWarInvalidatedMsg', 'AllWarRetractedMsg', 'AllWarSurrenderMsg', 'AllianceCapitalChanged', 'AllianceWarDeclaredV2', 'AllyContractCancelled', 'AllyJoinedWarAggressorMsg', 'AllyJoinedWarAllyMsg', 'AllyJoinedWarDefenderMsg', 'BattlePunishFriendlyFire', 'BillOutOfMoneyMsg', 'BillPaidCorpAllMsg', 'BountyClaimMsg', 'BountyESSShared', 'BountyESSTaken', 'BountyPlacedAlliance', 'BountyPlacedChar', 'BountyPlacedCorp', 'BountyYourBountyClaimed', 'BuddyConnectContactAdd', 'CharAppAcceptMsg', 'CharAppRejectMsg', 'CharAppWithdrawMsg', 'CharLeftCorpMsg', 'CharMedalMsg', 'CharTerminationMsg', 'CloneActivationMsg', 'CloneActivationMsg2', 'CloneMovedMsg', 'CloneRevokedMsg1', 'CloneRevokedMsg2', 'CombatOperationFinished', 'ContactAdd', 'ContactEdit', 'ContainerPasswordMsg', 'ContractRegionChangedToPochven', 'CorpAllBillMsg', 'CorpAppAcceptMsg', 'CorpAppInvitedMsg', 'CorpAppNewMsg', 'CorpAppRejectCustomMsg', 'CorpAppRejectMsg', 'CorpBecameWarEligible', 'CorpDividendMsg', 'CorpFriendlyFireDisableTimerCompleted', 'CorpFriendlyFireDisableTimerStarted', 'CorpFriendlyFireEnableTimerCompleted', 'CorpFriendlyFireEnableTimerStarted', 'CorpKicked', 'CorpLiquidationMsg', 'CorpNewCEOMsg', 'CorpNewsMsg', 'CorpNoLongerWarEligible', 'CorpOfficeExpirationMsg', 'CorpStructLostMsg', 'CorpTaxChangeMsg', 'CorpVoteCEORevokedMsg', 'CorpVoteMsg', 'CorpWarDeclaredMsg', 'CorpWarDeclaredV2', 'CorpWarFightingLegalMsg', 'CorpWarInvalidatedMsg', 'CorpWarRetractedMsg', 'CorpWarSurrenderMsg', 'CorporationGoalClosed', 'CorporationGoalCompleted', 'CorporationGoalCreated', 'CorporationGoalExpired', 'CorporationGoalLimitReached', 'CorporationGoalNameChange', 'CorporationLeft', 'CustomsMsg', 'DailyItemRewardAutoClaimed', 'DeclareWar', 'DistrictAttacked', 'DustAppAcceptedMsg', 'ESSMainBankLink', 'EntosisCaptureStarted', 'ExpertSystemExpired', 'ExpertSystemExpiryImminent', 'FWAllianceKickCeoIndividualStandingWarning', 'FWAllianceKickMsg', 'FWAllianceKickedCeoIndividualStanding', 'FWAllianceWarningMsg', 'FWCharKickMsg', 'FWCharRankGainMsg', 'FWCharRankLossMsg', 'FWCharWarningMsg', 'FWCharacterKickFromCorpIndividualStandingWarning', 'FWCharacterKickedFromCorpIndividualStanding', 'FWCorpJoinMsg', 'FWCorpKickMsg', 'FWCorpLeaveMsg', 'FWCorpWarningMsg', 'FWCorporationKickCeoIndividualStandingWarning', 'FWCorporationKickedCeoIndividualStanding', 'FacWarCorpJoinRequestMsg', 'FacWarCorpJoinWithdrawMsg', 'FacWarCorpLeaveRequestMsg', 'FacWarCorpLeaveWithdrawMsg', 'FacWarDirectEnlistmentRevoked', 'FacWarLPDisqualifiedEvent', 'FacWarLPDisqualifiedKill', 'FacWarLPPayoutEvent', 'FacWarLPPayoutKill', 'FreelanceProjectACLDeleted', 'FreelanceProjectClosed', 'FreelanceProjectCompleted', 'FreelanceProjectCreated', 'FreelanceProjectExpired', 'FreelanceProjectLimitReached', 'FreelanceProjectParticipantKicked', 'GameTimeAdded', 'GameTimeReceived', 'GameTimeSent', 'GiftReceived', 'IHubDestroyedByBillFailure', 'IncursionCompletedMsg', 'IndustryOperationFinished', 'IndustryTeamAuctionLost', 'IndustryTeamAuctionWon', 'InfrastructureHubBillAboutToExpire', 'InsuranceExpirationMsg', 'InsuranceFirstShipMsg', 'InsuranceInvalidatedMsg', 'InsuranceIssuedMsg', 'InsurancePayoutMsg', 'InvasionCompletedMsg', 'InvasionSystemLogin', 'InvasionSystemStart', 'JumpCloneDeletedMsg1', 'JumpCloneDeletedMsg2', 'KillReportFinalBlow', 'KillReportVictim', 'KillRightAvailable', 'KillRightAvailableOpen', 'KillRightEarned', 'KillRightUnavailable', 'KillRightUnavailableOpen', 'KillRightUsed', 'LPAutoRedeemed', 'LocateCharMsg', 'MadeWarMutual', 'MercOfferRetractedMsg', 'MercOfferedNegotiationMsg', 'MercenaryDenAttacked', 'MercenaryDenNewMTO', 'MercenaryDenReinforced', 'MissionCanceledTriglavian', 'MissionOfferExpirationMsg', 'MissionTimeoutMsg', 'MoonminingAutomaticFracture', 'MoonminingExtractionCancelled', 'MoonminingExtractionFinished', 'MoonminingExtractionStarted', 'MoonminingLaserFired', 'MutualWarExpired', 'MutualWarInviteAccepted', 'MutualWarInviteRejected', 'MutualWarInviteSent', 'NPCStandingsGained', 'NPCStandingsLost', 'OfferToAllyRetracted', 'OfferedSurrender', 'OfferedToAlly', 'OfficeLeaseCanceledInsufficientStandings', 'OldLscMessages', 'OperationFinished', 'OrbitalAttacked', 'OrbitalReinforced', 'OwnershipTransferred', 'RaffleCreated', 'RaffleExpired', 'RaffleFinished', 'ReimbursementMsg', 'ResearchMissionAvailableMsg', 'RetractsWar', 'SPAutoRedeemed', 'SeasonalChallengeCompleted', 'SkinSequencingCompleted', 'SkyhookDeployed', 'SkyhookDestroyed', 'SkyhookLostShields', 'SkyhookOnline', 'SkyhookUnderAttack', 'SovAllClaimAquiredMsg', 'SovAllClaimLostMsg', 'SovCommandNodeEventStarted', 'SovCorpBillLateMsg', 'SovCorpClaimFailMsg', 'SovDisruptorMsg', 'SovStationEnteredFreeport', 'SovStructureDestroyed', 'SovStructureReinforced', 'SovStructureSelfDestructCancel', 'SovStructureSelfDestructFinished', 'SovStructureSelfDestructRequested', 'SovereigntyIHDamageMsg', 'SovereigntySBUDamageMsg', 'SovereigntyTCUDamageMsg', 'StationAggressionMsg1', 'StationAggressionMsg2', 'StationConquerMsg', 'StationServiceDisabled', 'StationServiceEnabled', 'StationStateChangeMsg', 'StoryLineMissionAvailableMsg', 'StructureAnchoring', 'StructureCourierContractChanged', 'StructureDestroyed', 'StructureFuelAlert', 'StructureImpendingAbandonmentAssetsAtRisk', 'StructureItemsDelivered', 'StructureItemsMovedToSafety', 'StructureLostArmor', 'StructureLostShields', 'StructureLowReagentsAlert', 'StructureNoReagentsAlert', 'StructureOnline', 'StructurePaintPurchased', 'StructureServicesOffline', 'StructureUnanchoring', 'StructureUnderAttack', 'StructureWentHighPower', 'StructureWentLowPower', 'StructuresJobsCancelled', 'StructuresJobsPaused', 'StructuresReinforcementChanged', 'TowerAlertMsg', 'TowerResourceAlertMsg', 'TransactionReversalMsg', 'TutorialMsg', 'WarAdopted ', 'WarAllyInherited', 'WarAllyOfferDeclinedMsg', 'WarConcordInvalidates', 'WarDeclared', 'WarEndedHqSecurityDrop', 'WarHQRemovedFromSpace', 'WarInherited', 'WarInvalid', 'WarRetracted', 'WarRetractedByConcord', 'WarSurrenderDeclinedMsg', 'WarSurrenderOfferMsg']),
});

export const CharactersCharacterIdPortraitGetSchema = z.looseObject({
  px128x128: z.string().optional(),
  px256x256: z.string().optional(),
  px512x512: z.string().optional(),
  px64x64: z.string().optional(),
});

export const CharactersCharacterIdRolesGetSchema = z.looseObject({
  roles: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  roles_at_base: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  roles_at_hq: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
  roles_at_other: z.array(z.enum(['Account_Take_1', 'Account_Take_2', 'Account_Take_3', 'Account_Take_4', 'Account_Take_5', 'Account_Take_6', 'Account_Take_7', 'Accountant', 'Auditor', 'Brand_Manager', 'Communications_Officer', 'Config_Equipment', 'Config_Starbase_Equipment', 'Container_Take_1', 'Container_Take_2', 'Container_Take_3', 'Container_Take_4', 'Container_Take_5', 'Container_Take_6', 'Container_Take_7', 'Contract_Manager', 'Deliveries_Container_Take', 'Deliveries_Query', 'Deliveries_Take', 'Diplomat', 'Director', 'Factory_Manager', 'Fitting_Manager', 'Hangar_Query_1', 'Hangar_Query_2', 'Hangar_Query_3', 'Hangar_Query_4', 'Hangar_Query_5', 'Hangar_Query_6', 'Hangar_Query_7', 'Hangar_Take_1', 'Hangar_Take_2', 'Hangar_Take_3', 'Hangar_Take_4', 'Hangar_Take_5', 'Hangar_Take_6', 'Hangar_Take_7', 'Junior_Accountant', 'Personnel_Manager', 'Project_Manager', 'Rent_Factory_Facility', 'Rent_Office', 'Rent_Research_Facility', 'Security_Officer', 'Skill_Plan_Manager', 'Starbase_Defense_Operator', 'Starbase_Fuel_Technician', 'Station_Manager', 'Trader'])).optional(),
});

export const CharactersCharacterIdStandingsGetSchema = z.looseObject({
  from_id: z.number(),
  from_type: z.enum(['agent', 'npc_corp', 'faction']),
  standing: z.number(),
});

export const CharactersCharacterIdTitlesGetSchema = z.looseObject({
  name: z.string().optional(),
  title_id: z.number().optional(),
});

export const CharactersDetailSchema = z.looseObject({
  alliance_id: z.number().optional(),
  birthday: z.string(),
  bloodline_id: z.number(),
  corporation_id: z.number(),
  description: z.string().optional(),
  faction_id: z.number().optional(),
  gender: z.enum(['male', 'female']),
  name: z.string(),
  race_id: z.number(),
  security_status: z.number().optional(),
  title: z.string().optional(),
});
