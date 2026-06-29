/* eslint-disable */
// Auto-generated from ESI Swagger spec — do not edit manually
// Spec hash: 24285d0f288e
// Total interfaces: 147

// --- Alliance ---

export interface GetAlliancesAllianceIdIconsOk {
  px128x128?: string;
  px64x64?: string;
}

export interface GetAlliancesAllianceIdOk {
  creator_corporation_id: number;
  creator_id: number;
  date_founded: string;
  executor_corporation_id?: number;
  faction_id?: number;
  name: string;
  ticker: string;
}

// --- Assets ---

export interface GetCharactersCharacterIdAssets200Ok {
  is_blueprint_copy?: boolean;
  is_singleton: boolean;
  item_id: number;
  location_flag: 'AssetSafety' | 'AutoFit' | 'BoosterBay' | 'CapsuleerDeliveries' | 'Cargo' | 'CorporationGoalDeliveries' | 'CorpseBay' | 'Deliveries' | 'DroneBay' | 'FighterBay' | 'FighterTube0' | 'FighterTube1' | 'FighterTube2' | 'FighterTube3' | 'FighterTube4' | 'FleetHangar' | 'FrigateEscapeBay' | 'Hangar' | 'HangarAll' | 'HiSlot0' | 'HiSlot1' | 'HiSlot2' | 'HiSlot3' | 'HiSlot4' | 'HiSlot5' | 'HiSlot6' | 'HiSlot7' | 'HiddenModifiers' | 'Implant' | 'InfrastructureHangar' | 'LoSlot0' | 'LoSlot1' | 'LoSlot2' | 'LoSlot3' | 'LoSlot4' | 'LoSlot5' | 'LoSlot6' | 'LoSlot7' | 'Locked' | 'MedSlot0' | 'MedSlot1' | 'MedSlot2' | 'MedSlot3' | 'MedSlot4' | 'MedSlot5' | 'MedSlot6' | 'MedSlot7' | 'MobileDepotHold' | 'MoonMaterialBay' | 'QuafeBay' | 'RigSlot0' | 'RigSlot1' | 'RigSlot2' | 'RigSlot3' | 'RigSlot4' | 'RigSlot5' | 'RigSlot6' | 'RigSlot7' | 'ShipHangar' | 'Skill' | 'SpecializedAmmoHold' | 'SpecializedAsteroidHold' | 'SpecializedCommandCenterHold' | 'SpecializedFuelBay' | 'SpecializedGasHold' | 'SpecializedIceHold' | 'SpecializedIndustrialShipHold' | 'SpecializedLargeShipHold' | 'SpecializedMaterialBay' | 'SpecializedMediumShipHold' | 'SpecializedMineralHold' | 'SpecializedOreHold' | 'SpecializedPlanetaryCommoditiesHold' | 'SpecializedSalvageHold' | 'SpecializedShipHold' | 'SpecializedSmallShipHold' | 'StructureDeedBay' | 'SubSystemBay' | 'SubSystemSlot0' | 'SubSystemSlot1' | 'SubSystemSlot2' | 'SubSystemSlot3' | 'SubSystemSlot4' | 'SubSystemSlot5' | 'SubSystemSlot6' | 'SubSystemSlot7' | 'Unlocked' | 'Wardrobe';
  location_id: number;
  location_type: 'station' | 'solar_system' | 'item' | 'other';
  quantity: number;
  type_id: number;
}

export interface GetCorporationsCorporationIdAssets200Ok {
  is_blueprint_copy?: boolean;
  is_singleton: boolean;
  item_id: number;
  location_flag: 'AssetSafety' | 'AutoFit' | 'Bonus' | 'Booster' | 'BoosterBay' | 'Capsule' | 'CapsuleerDeliveries' | 'Cargo' | 'CorpDeliveries' | 'CorpSAG1' | 'CorpSAG2' | 'CorpSAG3' | 'CorpSAG4' | 'CorpSAG5' | 'CorpSAG6' | 'CorpSAG7' | 'CorporationGoalDeliveries' | 'CrateLoot' | 'Deliveries' | 'DroneBay' | 'DustBattle' | 'DustDatabank' | 'FighterBay' | 'FighterTube0' | 'FighterTube1' | 'FighterTube2' | 'FighterTube3' | 'FighterTube4' | 'FleetHangar' | 'FrigateEscapeBay' | 'Hangar' | 'HangarAll' | 'HiSlot0' | 'HiSlot1' | 'HiSlot2' | 'HiSlot3' | 'HiSlot4' | 'HiSlot5' | 'HiSlot6' | 'HiSlot7' | 'HiddenModifiers' | 'Implant' | 'Impounded' | 'InfrastructureHangar' | 'JunkyardReprocessed' | 'JunkyardTrashed' | 'LoSlot0' | 'LoSlot1' | 'LoSlot2' | 'LoSlot3' | 'LoSlot4' | 'LoSlot5' | 'LoSlot6' | 'LoSlot7' | 'Locked' | 'MedSlot0' | 'MedSlot1' | 'MedSlot2' | 'MedSlot3' | 'MedSlot4' | 'MedSlot5' | 'MedSlot6' | 'MedSlot7' | 'MobileDepotHold' | 'MoonMaterialBay' | 'OfficeFolder' | 'Pilot' | 'PlanetSurface' | 'QuafeBay' | 'QuantumCoreRoom' | 'Reward' | 'RigSlot0' | 'RigSlot1' | 'RigSlot2' | 'RigSlot3' | 'RigSlot4' | 'RigSlot5' | 'RigSlot6' | 'RigSlot7' | 'SecondaryStorage' | 'ServiceSlot0' | 'ServiceSlot1' | 'ServiceSlot2' | 'ServiceSlot3' | 'ServiceSlot4' | 'ServiceSlot5' | 'ServiceSlot6' | 'ServiceSlot7' | 'ShipHangar' | 'ShipOffline' | 'Skill' | 'SkillInTraining' | 'SpecializedAmmoHold' | 'SpecializedAsteroidHold' | 'SpecializedCommandCenterHold' | 'SpecializedFuelBay' | 'SpecializedGasHold' | 'SpecializedIceHold' | 'SpecializedIndustrialShipHold' | 'SpecializedLargeShipHold' | 'SpecializedMaterialBay' | 'SpecializedMediumShipHold' | 'SpecializedMineralHold' | 'SpecializedOreHold' | 'SpecializedPlanetaryCommoditiesHold' | 'SpecializedSalvageHold' | 'SpecializedShipHold' | 'SpecializedSmallShipHold' | 'StructureActive' | 'StructureFuel' | 'StructureInactive' | 'StructureOffline' | 'SubSystemBay' | 'SubSystemSlot0' | 'SubSystemSlot1' | 'SubSystemSlot2' | 'SubSystemSlot3' | 'SubSystemSlot4' | 'SubSystemSlot5' | 'SubSystemSlot6' | 'SubSystemSlot7' | 'Unlocked' | 'Wallet' | 'Wardrobe';
  location_id: number;
  location_type: 'station' | 'solar_system' | 'item' | 'other';
  quantity: number;
  type_id: number;
}

export interface PostCharactersCharacterIdAssetsLocations200Ok {
  item_id: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface PostCharactersCharacterIdAssetsNames200Ok {
  item_id: number;
  name: string;
}

export interface PostCorporationsCorporationIdAssetsLocations200Ok {
  item_id: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface PostCorporationsCorporationIdAssetsNames200Ok {
  item_id: number;
  name: string;
}

// --- Calendar ---

export interface GetCharactersCharacterIdCalendar200Ok {
  event_date?: string;
  event_id?: number;
  event_response?: 'declined' | 'not_responded' | 'accepted' | 'tentative';
  importance?: number;
  title?: string;
}

export interface GetCharactersCharacterIdCalendarEventIdAttendees200Ok {
  character_id?: number;
  event_response?: 'declined' | 'not_responded' | 'accepted' | 'tentative';
}

export interface GetCharactersCharacterIdCalendarEventIdOk {
  date: string;
  duration: number;
  event_id: number;
  importance: number;
  owner_id: number;
  owner_name: string;
  owner_type: 'eve_server' | 'corporation' | 'faction' | 'character' | 'alliance';
  response: string;
  text: string;
  title: string;
}

// --- Character ---

export interface GetCharactersCharacterIdAgentsResearch200Ok {
  agent_id: number;
  points_per_day: number;
  remainder_points: number;
  skill_type_id: number;
  started_at: string;
}

export interface GetCharactersCharacterIdBlueprints200Ok {
  item_id: number;
  location_flag: 'AutoFit' | 'Cargo' | 'CorpseBay' | 'DroneBay' | 'FleetHangar' | 'Deliveries' | 'HiddenModifiers' | 'Hangar' | 'HangarAll' | 'LoSlot0' | 'LoSlot1' | 'LoSlot2' | 'LoSlot3' | 'LoSlot4' | 'LoSlot5' | 'LoSlot6' | 'LoSlot7' | 'MedSlot0' | 'MedSlot1' | 'MedSlot2' | 'MedSlot3' | 'MedSlot4' | 'MedSlot5' | 'MedSlot6' | 'MedSlot7' | 'HiSlot0' | 'HiSlot1' | 'HiSlot2' | 'HiSlot3' | 'HiSlot4' | 'HiSlot5' | 'HiSlot6' | 'HiSlot7' | 'AssetSafety' | 'Locked' | 'Unlocked' | 'Implant' | 'QuafeBay' | 'RigSlot0' | 'RigSlot1' | 'RigSlot2' | 'RigSlot3' | 'RigSlot4' | 'RigSlot5' | 'RigSlot6' | 'RigSlot7' | 'ShipHangar' | 'SpecializedFuelBay' | 'SpecializedOreHold' | 'SpecializedGasHold' | 'SpecializedMineralHold' | 'SpecializedSalvageHold' | 'SpecializedShipHold' | 'SpecializedSmallShipHold' | 'SpecializedMediumShipHold' | 'SpecializedLargeShipHold' | 'SpecializedIndustrialShipHold' | 'SpecializedAmmoHold' | 'SpecializedCommandCenterHold' | 'SpecializedPlanetaryCommoditiesHold' | 'SpecializedMaterialBay' | 'SubSystemSlot0' | 'SubSystemSlot1' | 'SubSystemSlot2' | 'SubSystemSlot3' | 'SubSystemSlot4' | 'SubSystemSlot5' | 'SubSystemSlot6' | 'SubSystemSlot7' | 'FighterBay' | 'FighterTube0' | 'FighterTube1' | 'FighterTube2' | 'FighterTube3' | 'FighterTube4' | 'Module';
  location_id: number;
  material_efficiency: number;
  quantity: number;
  runs: number;
  time_efficiency: number;
  type_id: number;
}

export interface GetCharactersCharacterIdCorporationhistory200Ok {
  corporation_id: number;
  is_deleted?: boolean;
  record_id: number;
  start_date: string;
}

export interface GetCharactersCharacterIdFatigueOk {
  jump_fatigue_expire_date?: string;
  last_jump_date?: string;
  last_update_date?: string;
}

export interface GetCharactersCharacterIdMedals200Ok {
  corporation_id: number;
  date: string;
  description: string;
  graphics: ({
    color?: number;
    graphic: string;
    layer: number;
    part: number;
  })[];
  issuer_id: number;
  medal_id: number;
  reason: string;
  status: 'public' | 'private';
  title: string;
}

export interface GetCharactersCharacterIdNotifications200Ok {
  is_read?: boolean;
  notification_id: number;
  sender_id: number;
  sender_type: 'character' | 'corporation' | 'alliance' | 'faction' | 'other';
  text?: string;
  timestamp: string;
  type: 'AcceptedAlly' | 'AcceptedSurrender' | 'AgentRetiredTrigravian' | 'AllAnchoringMsg' | 'AllMaintenanceBillMsg' | 'AllStrucInvulnerableMsg' | 'AllStructVulnerableMsg' | 'AllWarCorpJoinedAllianceMsg' | 'AllWarDeclaredMsg' | 'AllWarInvalidatedMsg' | 'AllWarRetractedMsg' | 'AllWarSurrenderMsg' | 'AllianceCapitalChanged' | 'AllianceWarDeclaredV2' | 'AllyContractCancelled' | 'AllyJoinedWarAggressorMsg' | 'AllyJoinedWarAllyMsg' | 'AllyJoinedWarDefenderMsg' | 'BattlePunishFriendlyFire' | 'BillOutOfMoneyMsg' | 'BillPaidCorpAllMsg' | 'BountyClaimMsg' | 'BountyESSShared' | 'BountyESSTaken' | 'BountyPlacedAlliance' | 'BountyPlacedChar' | 'BountyPlacedCorp' | 'BountyYourBountyClaimed' | 'BuddyConnectContactAdd' | 'CharAppAcceptMsg' | 'CharAppRejectMsg' | 'CharAppWithdrawMsg' | 'CharLeftCorpMsg' | 'CharMedalMsg' | 'CharTerminationMsg' | 'CloneActivationMsg' | 'CloneActivationMsg2' | 'CloneMovedMsg' | 'CloneRevokedMsg1' | 'CloneRevokedMsg2' | 'CombatOperationFinished' | 'ContactAdd' | 'ContactEdit' | 'ContainerPasswordMsg' | 'ContractRegionChangedToPochven' | 'CorpAllBillMsg' | 'CorpAppAcceptMsg' | 'CorpAppInvitedMsg' | 'CorpAppNewMsg' | 'CorpAppRejectCustomMsg' | 'CorpAppRejectMsg' | 'CorpBecameWarEligible' | 'CorpDividendMsg' | 'CorpFriendlyFireDisableTimerCompleted' | 'CorpFriendlyFireDisableTimerStarted' | 'CorpFriendlyFireEnableTimerCompleted' | 'CorpFriendlyFireEnableTimerStarted' | 'CorpKicked' | 'CorpLiquidationMsg' | 'CorpNewCEOMsg' | 'CorpNewsMsg' | 'CorpNoLongerWarEligible' | 'CorpOfficeExpirationMsg' | 'CorpStructLostMsg' | 'CorpTaxChangeMsg' | 'CorpVoteCEORevokedMsg' | 'CorpVoteMsg' | 'CorpWarDeclaredMsg' | 'CorpWarDeclaredV2' | 'CorpWarFightingLegalMsg' | 'CorpWarInvalidatedMsg' | 'CorpWarRetractedMsg' | 'CorpWarSurrenderMsg' | 'CorporationGoalClosed' | 'CorporationGoalCompleted' | 'CorporationGoalCreated' | 'CorporationGoalExpired' | 'CorporationGoalLimitReached' | 'CorporationGoalNameChange' | 'CorporationLeft' | 'CustomsMsg' | 'DailyItemRewardAutoClaimed' | 'DeclareWar' | 'DistrictAttacked' | 'DustAppAcceptedMsg' | 'ESSMainBankLink' | 'EntosisCaptureStarted' | 'ExpertSystemExpired' | 'ExpertSystemExpiryImminent' | 'FWAllianceKickMsg' | 'FWAllianceWarningMsg' | 'FWCharKickMsg' | 'FWCharRankGainMsg' | 'FWCharRankLossMsg' | 'FWCharWarningMsg' | 'FWCorpJoinMsg' | 'FWCorpKickMsg' | 'FWCorpLeaveMsg' | 'FWCorpWarningMsg' | 'FacWarCorpJoinRequestMsg' | 'FacWarCorpJoinWithdrawMsg' | 'FacWarCorpLeaveRequestMsg' | 'FacWarCorpLeaveWithdrawMsg' | 'FacWarLPDisqualifiedEvent' | 'FacWarLPDisqualifiedKill' | 'FacWarLPPayoutEvent' | 'FacWarLPPayoutKill' | 'FreelanceProjectClosed' | 'FreelanceProjectCompleted' | 'FreelanceProjectCreated' | 'FreelanceProjectExpired' | 'FreelanceProjectLimitReached' | 'FreelanceProjectParticipantKicked' | 'GameTimeAdded' | 'GameTimeReceived' | 'GameTimeSent' | 'GiftReceived' | 'IHubDestroyedByBillFailure' | 'IncursionCompletedMsg' | 'IndustryOperationFinished' | 'IndustryTeamAuctionLost' | 'IndustryTeamAuctionWon' | 'InfrastructureHubBillAboutToExpire' | 'InsuranceExpirationMsg' | 'InsuranceFirstShipMsg' | 'InsuranceInvalidatedMsg' | 'InsuranceIssuedMsg' | 'InsurancePayoutMsg' | 'InvasionCompletedMsg' | 'InvasionSystemLogin' | 'InvasionSystemStart' | 'JumpCloneDeletedMsg1' | 'JumpCloneDeletedMsg2' | 'KillReportFinalBlow' | 'KillReportVictim' | 'KillRightAvailable' | 'KillRightAvailableOpen' | 'KillRightEarned' | 'KillRightUnavailable' | 'KillRightUnavailableOpen' | 'KillRightUsed' | 'LPAutoRedeemed' | 'LocateCharMsg' | 'MadeWarMutual' | 'MercOfferRetractedMsg' | 'MercOfferedNegotiationMsg' | 'MercenaryDenAttacked' | 'MercenaryDenNewMTO' | 'MercenaryDenReinforced' | 'MissionCanceledTriglavian' | 'MissionOfferExpirationMsg' | 'MissionTimeoutMsg' | 'MoonminingAutomaticFracture' | 'MoonminingExtractionCancelled' | 'MoonminingExtractionFinished' | 'MoonminingExtractionStarted' | 'MoonminingLaserFired' | 'MutualWarExpired' | 'MutualWarInviteAccepted' | 'MutualWarInviteRejected' | 'MutualWarInviteSent' | 'NPCStandingsGained' | 'NPCStandingsLost' | 'OfferToAllyRetracted' | 'OfferedSurrender' | 'OfferedToAlly' | 'OfficeLeaseCanceledInsufficientStandings' | 'OldLscMessages' | 'OperationFinished' | 'OrbitalAttacked' | 'OrbitalReinforced' | 'OwnershipTransferred' | 'RaffleCreated' | 'RaffleExpired' | 'RaffleFinished' | 'ReimbursementMsg' | 'ResearchMissionAvailableMsg' | 'RetractsWar' | 'SPAutoRedeemed' | 'SeasonalChallengeCompleted' | 'SkinSequencingCompleted' | 'SkyhookDeployed' | 'SkyhookDestroyed' | 'SkyhookLostShields' | 'SkyhookOnline' | 'SkyhookUnderAttack' | 'SovAllClaimAquiredMsg' | 'SovAllClaimLostMsg' | 'SovCommandNodeEventStarted' | 'SovCorpBillLateMsg' | 'SovCorpClaimFailMsg' | 'SovDisruptorMsg' | 'SovStationEnteredFreeport' | 'SovStructureDestroyed' | 'SovStructureReinforced' | 'SovStructureSelfDestructCancel' | 'SovStructureSelfDestructFinished' | 'SovStructureSelfDestructRequested' | 'SovereigntyIHDamageMsg' | 'SovereigntySBUDamageMsg' | 'SovereigntyTCUDamageMsg' | 'StationAggressionMsg1' | 'StationAggressionMsg2' | 'StationConquerMsg' | 'StationServiceDisabled' | 'StationServiceEnabled' | 'StationStateChangeMsg' | 'StoryLineMissionAvailableMsg' | 'StructureAnchoring' | 'StructureCourierContractChanged' | 'StructureDestroyed' | 'StructureFuelAlert' | 'StructureImpendingAbandonmentAssetsAtRisk' | 'StructureItemsDelivered' | 'StructureItemsMovedToSafety' | 'StructureLostArmor' | 'StructureLostShields' | 'StructureLowReagentsAlert' | 'StructureNoReagentsAlert' | 'StructureOnline' | 'StructurePaintPurchased' | 'StructureServicesOffline' | 'StructureUnanchoring' | 'StructureUnderAttack' | 'StructureWentHighPower' | 'StructureWentLowPower' | 'StructuresJobsCancelled' | 'StructuresJobsPaused' | 'StructuresReinforcementChanged' | 'TowerAlertMsg' | 'TowerResourceAlertMsg' | 'TransactionReversalMsg' | 'TutorialMsg' | 'WarAdopted ' | 'WarAllyInherited' | 'WarAllyOfferDeclinedMsg' | 'WarConcordInvalidates' | 'WarDeclared' | 'WarEndedHqSecurityDrop' | 'WarHQRemovedFromSpace' | 'WarInherited' | 'WarInvalid' | 'WarRetracted' | 'WarRetractedByConcord' | 'WarSurrenderDeclinedMsg' | 'WarSurrenderOfferMsg';
}

export interface GetCharactersCharacterIdNotificationsContacts200Ok {
  message: string;
  notification_id: number;
  send_date: string;
  sender_character_id: number;
  standing_level: number;
}

export interface GetCharactersCharacterIdOk {
  alliance_id?: number;
  birthday: string;
  bloodline_id: number;
  corporation_id: number;
  description?: string;
  faction_id?: number;
  gender: 'female' | 'male';
  name: string;
  race_id: number;
  security_status?: number;
  title?: string;
}

export interface GetCharactersCharacterIdPortraitOk {
  px128x128?: string;
  px256x256?: string;
  px512x512?: string;
  px64x64?: string;
}

export interface GetCharactersCharacterIdRolesOk {
  roles?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  roles_at_base?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  roles_at_hq?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  roles_at_other?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
}

export interface GetCharactersCharacterIdStandings200Ok {
  from_id: number;
  from_type: 'agent' | 'npc_corp' | 'faction';
  standing: number;
}

export interface GetCharactersCharacterIdTitles200Ok {
  name?: string;
  title_id?: number;
}

export interface PostCharactersAffiliation200Ok {
  alliance_id?: number;
  character_id: number;
  corporation_id: number;
  faction_id?: number;
}

// --- Clones ---

export interface GetCharactersCharacterIdClonesOk {
  home_location?: {
    location_id?: number;
    location_type?: 'station' | 'structure';
  };
  jump_clones: ({
    implants: number[];
    jump_clone_id: number;
    location_id: number;
    location_type: 'station' | 'structure';
    name?: string;
  })[];
  last_clone_jump_date?: string;
  last_station_change_date?: string;
}

// --- Contacts ---

export interface GetAlliancesAllianceIdContacts200Ok {
  contact_id: number;
  contact_type: 'character' | 'corporation' | 'alliance' | 'faction';
  label_ids?: number[];
  standing: number;
}

export interface GetAlliancesAllianceIdContactsLabels200Ok {
  label_id: number;
  label_name: string;
}

export interface GetCharactersCharacterIdContacts200Ok {
  contact_id: number;
  contact_type: 'character' | 'corporation' | 'alliance' | 'faction';
  is_blocked?: boolean;
  is_watched?: boolean;
  label_ids?: number[];
  standing: number;
}

export interface GetCharactersCharacterIdContactsLabels200Ok {
  label_id: number;
  label_name: string;
}

export interface GetCorporationsCorporationIdContacts200Ok {
  contact_id: number;
  contact_type: 'character' | 'corporation' | 'alliance' | 'faction';
  is_watched?: boolean;
  label_ids?: number[];
  standing: number;
}

export interface GetCorporationsCorporationIdContactsLabels200Ok {
  label_id: number;
  label_name: string;
}

// --- Contracts ---

export interface GetCharactersCharacterIdContracts200Ok {
  acceptor_id: number;
  assignee_id: number;
  availability: 'public' | 'personal' | 'corporation' | 'alliance';
  buyout?: number;
  collateral?: number;
  contract_id: number;
  date_accepted?: string;
  date_completed?: string;
  date_expired: string;
  date_issued: string;
  days_to_complete?: number;
  end_location_id?: number;
  for_corporation: boolean;
  issuer_corporation_id: number;
  issuer_id: number;
  price?: number;
  reward?: number;
  start_location_id?: number;
  status: 'outstanding' | 'in_progress' | 'finished_issuer' | 'finished_contractor' | 'finished' | 'cancelled' | 'rejected' | 'failed' | 'deleted' | 'reversed';
  title?: string;
  type: 'unknown' | 'item_exchange' | 'auction' | 'courier' | 'loan';
  volume?: number;
}

export interface GetCharactersCharacterIdContractsContractIdBids200Ok {
  amount: number;
  bid_id: number;
  bidder_id: number;
  date_bid: string;
}

export interface GetCharactersCharacterIdContractsContractIdItems200Ok {
  is_included: boolean;
  is_singleton: boolean;
  quantity: number;
  raw_quantity?: number;
  record_id: number;
  type_id: number;
}

export interface GetContractsPublicBidsContractId200Ok {
  amount: number;
  bid_id: number;
  date_bid: string;
}

export interface GetContractsPublicItemsContractId200Ok {
  is_blueprint_copy?: boolean;
  is_included: boolean;
  item_id?: number;
  material_efficiency?: number;
  quantity: number;
  record_id: number;
  runs?: number;
  time_efficiency?: number;
  type_id: number;
}

export interface GetContractsPublicRegionId200Ok {
  buyout?: number;
  collateral?: number;
  contract_id: number;
  date_expired: string;
  date_issued: string;
  days_to_complete?: number;
  end_location_id?: number;
  for_corporation?: boolean;
  issuer_corporation_id: number;
  issuer_id: number;
  price?: number;
  reward?: number;
  start_location_id?: number;
  title?: string;
  type: 'unknown' | 'item_exchange' | 'auction' | 'courier' | 'loan';
  volume?: number;
}

export interface GetCorporationsCorporationIdContracts200Ok {
  acceptor_id: number;
  assignee_id: number;
  availability: 'public' | 'personal' | 'corporation' | 'alliance';
  buyout?: number;
  collateral?: number;
  contract_id: number;
  date_accepted?: string;
  date_completed?: string;
  date_expired: string;
  date_issued: string;
  days_to_complete?: number;
  end_location_id?: number;
  for_corporation: boolean;
  issuer_corporation_id: number;
  issuer_id: number;
  price?: number;
  reward?: number;
  start_location_id?: number;
  status: 'outstanding' | 'in_progress' | 'finished_issuer' | 'finished_contractor' | 'finished' | 'cancelled' | 'rejected' | 'failed' | 'deleted' | 'reversed';
  title?: string;
  type: 'unknown' | 'item_exchange' | 'auction' | 'courier' | 'loan';
  volume?: number;
}

export interface GetCorporationsCorporationIdContractsContractIdBids200Ok {
  amount: number;
  bid_id: number;
  bidder_id: number;
  date_bid: string;
}

export interface GetCorporationsCorporationIdContractsContractIdItems200Ok {
  is_included: boolean;
  is_singleton: boolean;
  quantity: number;
  raw_quantity?: number;
  record_id: number;
  type_id: number;
}

// --- Corporation ---

export interface GetCorporationsCorporationIdAlliancehistory200Ok {
  alliance_id?: number;
  is_deleted?: boolean;
  record_id: number;
  start_date: string;
}

export interface GetCorporationsCorporationIdBlueprints200Ok {
  item_id: number;
  location_flag: 'AssetSafety' | 'AutoFit' | 'Bonus' | 'Booster' | 'BoosterBay' | 'Capsule' | 'CapsuleerDeliveries' | 'Cargo' | 'CorpDeliveries' | 'CorpSAG1' | 'CorpSAG2' | 'CorpSAG3' | 'CorpSAG4' | 'CorpSAG5' | 'CorpSAG6' | 'CorpSAG7' | 'CorporationGoalDeliveries' | 'CrateLoot' | 'Deliveries' | 'DroneBay' | 'DustBattle' | 'DustDatabank' | 'FighterBay' | 'FighterTube0' | 'FighterTube1' | 'FighterTube2' | 'FighterTube3' | 'FighterTube4' | 'FleetHangar' | 'FrigateEscapeBay' | 'Hangar' | 'HangarAll' | 'HiSlot0' | 'HiSlot1' | 'HiSlot2' | 'HiSlot3' | 'HiSlot4' | 'HiSlot5' | 'HiSlot6' | 'HiSlot7' | 'HiddenModifiers' | 'Implant' | 'Impounded' | 'InfrastructureHangar' | 'JunkyardReprocessed' | 'JunkyardTrashed' | 'LoSlot0' | 'LoSlot1' | 'LoSlot2' | 'LoSlot3' | 'LoSlot4' | 'LoSlot5' | 'LoSlot6' | 'LoSlot7' | 'Locked' | 'MedSlot0' | 'MedSlot1' | 'MedSlot2' | 'MedSlot3' | 'MedSlot4' | 'MedSlot5' | 'MedSlot6' | 'MedSlot7' | 'MobileDepotHold' | 'MoonMaterialBay' | 'OfficeFolder' | 'Pilot' | 'PlanetSurface' | 'QuafeBay' | 'QuantumCoreRoom' | 'Reward' | 'RigSlot0' | 'RigSlot1' | 'RigSlot2' | 'RigSlot3' | 'RigSlot4' | 'RigSlot5' | 'RigSlot6' | 'RigSlot7' | 'SecondaryStorage' | 'ServiceSlot0' | 'ServiceSlot1' | 'ServiceSlot2' | 'ServiceSlot3' | 'ServiceSlot4' | 'ServiceSlot5' | 'ServiceSlot6' | 'ServiceSlot7' | 'ShipHangar' | 'ShipOffline' | 'Skill' | 'SkillInTraining' | 'SpecializedAmmoHold' | 'SpecializedAsteroidHold' | 'SpecializedCommandCenterHold' | 'SpecializedFuelBay' | 'SpecializedGasHold' | 'SpecializedIceHold' | 'SpecializedIndustrialShipHold' | 'SpecializedLargeShipHold' | 'SpecializedMaterialBay' | 'SpecializedMediumShipHold' | 'SpecializedMineralHold' | 'SpecializedOreHold' | 'SpecializedPlanetaryCommoditiesHold' | 'SpecializedSalvageHold' | 'SpecializedShipHold' | 'SpecializedSmallShipHold' | 'StructureActive' | 'StructureFuel' | 'StructureInactive' | 'StructureOffline' | 'SubSystemBay' | 'SubSystemSlot0' | 'SubSystemSlot1' | 'SubSystemSlot2' | 'SubSystemSlot3' | 'SubSystemSlot4' | 'SubSystemSlot5' | 'SubSystemSlot6' | 'SubSystemSlot7' | 'Unlocked' | 'Wallet' | 'Wardrobe';
  location_id: number;
  material_efficiency: number;
  quantity: number;
  runs: number;
  time_efficiency: number;
  type_id: number;
}

export interface GetCorporationsCorporationIdContainersLogs200Ok {
  action: 'add' | 'assemble' | 'configure' | 'enter_password' | 'lock' | 'move' | 'repackage' | 'set_name' | 'set_password' | 'unlock';
  character_id: number;
  container_id: number;
  container_type_id: number;
  location_flag: 'AssetSafety' | 'AutoFit' | 'Bonus' | 'Booster' | 'BoosterBay' | 'Capsule' | 'CapsuleerDeliveries' | 'Cargo' | 'CorpDeliveries' | 'CorpSAG1' | 'CorpSAG2' | 'CorpSAG3' | 'CorpSAG4' | 'CorpSAG5' | 'CorpSAG6' | 'CorpSAG7' | 'CorporationGoalDeliveries' | 'CrateLoot' | 'Deliveries' | 'DroneBay' | 'DustBattle' | 'DustDatabank' | 'FighterBay' | 'FighterTube0' | 'FighterTube1' | 'FighterTube2' | 'FighterTube3' | 'FighterTube4' | 'FleetHangar' | 'FrigateEscapeBay' | 'Hangar' | 'HangarAll' | 'HiSlot0' | 'HiSlot1' | 'HiSlot2' | 'HiSlot3' | 'HiSlot4' | 'HiSlot5' | 'HiSlot6' | 'HiSlot7' | 'HiddenModifiers' | 'Implant' | 'Impounded' | 'InfrastructureHangar' | 'JunkyardReprocessed' | 'JunkyardTrashed' | 'LoSlot0' | 'LoSlot1' | 'LoSlot2' | 'LoSlot3' | 'LoSlot4' | 'LoSlot5' | 'LoSlot6' | 'LoSlot7' | 'Locked' | 'MedSlot0' | 'MedSlot1' | 'MedSlot2' | 'MedSlot3' | 'MedSlot4' | 'MedSlot5' | 'MedSlot6' | 'MedSlot7' | 'MobileDepotHold' | 'MoonMaterialBay' | 'OfficeFolder' | 'Pilot' | 'PlanetSurface' | 'QuafeBay' | 'QuantumCoreRoom' | 'Reward' | 'RigSlot0' | 'RigSlot1' | 'RigSlot2' | 'RigSlot3' | 'RigSlot4' | 'RigSlot5' | 'RigSlot6' | 'RigSlot7' | 'SecondaryStorage' | 'ServiceSlot0' | 'ServiceSlot1' | 'ServiceSlot2' | 'ServiceSlot3' | 'ServiceSlot4' | 'ServiceSlot5' | 'ServiceSlot6' | 'ServiceSlot7' | 'ShipHangar' | 'ShipOffline' | 'Skill' | 'SkillInTraining' | 'SpecializedAmmoHold' | 'SpecializedAsteroidHold' | 'SpecializedCommandCenterHold' | 'SpecializedFuelBay' | 'SpecializedGasHold' | 'SpecializedIceHold' | 'SpecializedIndustrialShipHold' | 'SpecializedLargeShipHold' | 'SpecializedMaterialBay' | 'SpecializedMediumShipHold' | 'SpecializedMineralHold' | 'SpecializedOreHold' | 'SpecializedPlanetaryCommoditiesHold' | 'SpecializedSalvageHold' | 'SpecializedShipHold' | 'SpecializedSmallShipHold' | 'StructureActive' | 'StructureFuel' | 'StructureInactive' | 'StructureOffline' | 'SubSystemBay' | 'SubSystemSlot0' | 'SubSystemSlot1' | 'SubSystemSlot2' | 'SubSystemSlot3' | 'SubSystemSlot4' | 'SubSystemSlot5' | 'SubSystemSlot6' | 'SubSystemSlot7' | 'Unlocked' | 'Wallet' | 'Wardrobe';
  location_id: number;
  logged_at: string;
  new_config_bitmask?: number;
  old_config_bitmask?: number;
  password_type?: 'config' | 'general';
  quantity?: number;
  type_id?: number;
}

export interface GetCorporationsCorporationIdDivisionsOk {
  hangar?: ({
    division?: number;
    name?: string;
  })[];
  wallet?: ({
    division?: number;
    name?: string;
  })[];
}

export interface GetCorporationsCorporationIdFacilities200Ok {
  facility_id: number;
  system_id: number;
  type_id: number;
}

export interface GetCorporationsCorporationIdIconsOk {
  px128x128?: string;
  px256x256?: string;
  px64x64?: string;
}

export interface GetCorporationsCorporationIdMedals200Ok {
  created_at: string;
  creator_id: number;
  description: string;
  medal_id: number;
  title: string;
}

export interface GetCorporationsCorporationIdMedalsIssued200Ok {
  character_id: number;
  issued_at: string;
  issuer_id: number;
  medal_id: number;
  reason: string;
  status: 'private' | 'public';
}

export interface GetCorporationsCorporationIdMembersTitles200Ok {
  character_id: number;
  titles: number[];
}

export interface GetCorporationsCorporationIdMembertracking200Ok {
  base_id?: number;
  character_id: number;
  location_id?: number;
  logoff_date?: string;
  logon_date?: string;
  ship_type_id?: number;
  start_date?: string;
}

export interface GetCorporationsCorporationIdOk {
  alliance_id?: number;
  ceo_id: number;
  creator_id: number;
  date_founded?: string;
  description?: string;
  faction_id?: number;
  home_station_id?: number;
  member_count: number;
  name: string;
  shares?: number;
  tax_rate: number;
  ticker: string;
  url?: string;
  war_eligible?: boolean;
}

export interface GetCorporationsCorporationIdRoles200Ok {
  character_id: number;
  grantable_roles?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  grantable_roles_at_base?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  grantable_roles_at_hq?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  grantable_roles_at_other?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  roles?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  roles_at_base?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  roles_at_hq?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  roles_at_other?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
}

export interface GetCorporationsCorporationIdRolesHistory200Ok {
  changed_at: string;
  character_id: number;
  issuer_id: number;
  new_roles: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  old_roles: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  role_type: 'grantable_roles' | 'grantable_roles_at_base' | 'grantable_roles_at_hq' | 'grantable_roles_at_other' | 'roles' | 'roles_at_base' | 'roles_at_hq' | 'roles_at_other';
}

export interface GetCorporationsCorporationIdShareholders200Ok {
  share_count: number;
  shareholder_id: number;
  shareholder_type: 'character' | 'corporation';
}

export interface GetCorporationsCorporationIdStandings200Ok {
  from_id: number;
  from_type: 'agent' | 'npc_corp' | 'faction';
  standing: number;
}

export interface GetCorporationsCorporationIdStarbases200Ok {
  moon_id?: number;
  onlined_since?: string;
  reinforced_until?: string;
  starbase_id: number;
  state?: 'offline' | 'online' | 'onlining' | 'reinforced' | 'unanchoring';
  system_id: number;
  type_id: number;
  unanchor_at?: string;
}

export interface GetCorporationsCorporationIdStarbasesStarbaseIdOk {
  allow_alliance_members: boolean;
  allow_corporation_members: boolean;
  anchor: 'alliance_member' | 'config_starbase_equipment_role' | 'corporation_member' | 'starbase_fuel_technician_role';
  attack_if_at_war: boolean;
  attack_if_other_security_status_dropping: boolean;
  attack_security_status_threshold?: number;
  attack_standing_threshold?: number;
  fuel_bay_take: 'alliance_member' | 'config_starbase_equipment_role' | 'corporation_member' | 'starbase_fuel_technician_role';
  fuel_bay_view: 'alliance_member' | 'config_starbase_equipment_role' | 'corporation_member' | 'starbase_fuel_technician_role';
  fuels?: ({
    quantity: number;
    type_id: number;
  })[];
  offline: 'alliance_member' | 'config_starbase_equipment_role' | 'corporation_member' | 'starbase_fuel_technician_role';
  online: 'alliance_member' | 'config_starbase_equipment_role' | 'corporation_member' | 'starbase_fuel_technician_role';
  unanchor: 'alliance_member' | 'config_starbase_equipment_role' | 'corporation_member' | 'starbase_fuel_technician_role';
  use_alliance_standings: boolean;
}

export interface GetCorporationsCorporationIdStructures200Ok {
  corporation_id: number;
  fuel_expires?: string;
  name?: string;
  next_reinforce_apply?: string;
  next_reinforce_hour?: number;
  profile_id: number;
  reinforce_hour?: number;
  services?: ({
    name: string;
    state: 'online' | 'offline' | 'cleanup';
  })[];
  state: 'anchor_vulnerable' | 'anchoring' | 'armor_reinforce' | 'armor_vulnerable' | 'deploy_vulnerable' | 'fitting_invulnerable' | 'hull_reinforce' | 'hull_vulnerable' | 'online_deprecated' | 'onlining_vulnerable' | 'shield_vulnerable' | 'unanchored' | 'unknown';
  state_timer_end?: string;
  state_timer_start?: string;
  structure_id: number;
  system_id: number;
  type_id: number;
  unanchors_at?: string;
}

export interface GetCorporationsCorporationIdTitles200Ok {
  grantable_roles?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  grantable_roles_at_base?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  grantable_roles_at_hq?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  grantable_roles_at_other?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  name?: string;
  roles?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  roles_at_base?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  roles_at_hq?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  roles_at_other?: 'Account_Take_1' | 'Account_Take_2' | 'Account_Take_3' | 'Account_Take_4' | 'Account_Take_5' | 'Account_Take_6' | 'Account_Take_7' | 'Accountant' | 'Auditor' | 'Brand_Manager' | 'Communications_Officer' | 'Config_Equipment' | 'Config_Starbase_Equipment' | 'Container_Take_1' | 'Container_Take_2' | 'Container_Take_3' | 'Container_Take_4' | 'Container_Take_5' | 'Container_Take_6' | 'Container_Take_7' | 'Contract_Manager' | 'Deliveries_Container_Take' | 'Deliveries_Query' | 'Deliveries_Take' | 'Diplomat' | 'Director' | 'Factory_Manager' | 'Fitting_Manager' | 'Hangar_Query_1' | 'Hangar_Query_2' | 'Hangar_Query_3' | 'Hangar_Query_4' | 'Hangar_Query_5' | 'Hangar_Query_6' | 'Hangar_Query_7' | 'Hangar_Take_1' | 'Hangar_Take_2' | 'Hangar_Take_3' | 'Hangar_Take_4' | 'Hangar_Take_5' | 'Hangar_Take_6' | 'Hangar_Take_7' | 'Junior_Accountant' | 'Personnel_Manager' | 'Project_Manager' | 'Rent_Factory_Facility' | 'Rent_Office' | 'Rent_Research_Facility' | 'Security_Officer' | 'Skill_Plan_Manager' | 'Starbase_Defense_Operator' | 'Starbase_Fuel_Technician' | 'Station_Manager' | 'Trader'[];
  title_id?: number;
}

// --- Dogma ---

export interface GetDogmaAttributesAttributeIdOk {
  attribute_id: number;
  default_value?: number;
  description?: string;
  display_name?: string;
  high_is_good?: boolean;
  icon_id?: number;
  name?: string;
  published?: boolean;
  stackable?: boolean;
  unit_id?: number;
}

export interface GetDogmaDynamicItemsTypeIdItemIdOk {
  created_by: number;
  dogma_attributes: ({
    attribute_id: number;
    value: number;
  })[];
  dogma_effects: ({
    effect_id: number;
    is_default: boolean;
  })[];
  mutator_type_id: number;
  source_type_id: number;
}

export interface GetDogmaEffectsEffectIdOk {
  description?: string;
  disallow_auto_repeat?: boolean;
  discharge_attribute_id?: number;
  display_name?: string;
  duration_attribute_id?: number;
  effect_category?: number;
  effect_id: number;
  electronic_chance?: boolean;
  falloff_attribute_id?: number;
  icon_id?: number;
  is_assistance?: boolean;
  is_offensive?: boolean;
  is_warp_safe?: boolean;
  modifiers?: ({
    domain?: string;
    effect_id?: number;
    func: string;
    modified_attribute_id?: number;
    modifying_attribute_id?: number;
    operator?: number;
  })[];
  name?: string;
  post_expression?: number;
  pre_expression?: number;
  published?: boolean;
  range_attribute_id?: number;
  range_chance?: boolean;
  tracking_speed_attribute_id?: number;
}

// --- Faction Warfare ---

export interface GetCharactersCharacterIdFwStatsOk {
  current_rank?: number;
  enlisted_on?: string;
  faction_id?: number;
  highest_rank?: number;
  kills: {
    last_week: number;
    total: number;
    yesterday: number;
  };
  victory_points: {
    last_week: number;
    total: number;
    yesterday: number;
  };
}

export interface GetCorporationsCorporationIdFwStatsOk {
  enlisted_on?: string;
  faction_id?: number;
  kills: {
    last_week: number;
    total: number;
    yesterday: number;
  };
  pilots?: number;
  victory_points: {
    last_week: number;
    total: number;
    yesterday: number;
  };
}

export interface GetFwLeaderboardsCharactersOk {
  kills: {
    active_total: ({
      amount?: number;
      character_id?: number;
    })[];
    last_week: ({
      amount?: number;
      character_id?: number;
    })[];
    yesterday: ({
      amount?: number;
      character_id?: number;
    })[];
  };
  victory_points: {
    active_total: ({
      amount?: number;
      character_id?: number;
    })[];
    last_week: ({
      amount?: number;
      character_id?: number;
    })[];
    yesterday: ({
      amount?: number;
      character_id?: number;
    })[];
  };
}

export interface GetFwLeaderboardsCorporationsOk {
  kills: {
    active_total: ({
      amount?: number;
      corporation_id?: number;
    })[];
    last_week: ({
      amount?: number;
      corporation_id?: number;
    })[];
    yesterday: ({
      amount?: number;
      corporation_id?: number;
    })[];
  };
  victory_points: {
    active_total: ({
      amount?: number;
      corporation_id?: number;
    })[];
    last_week: ({
      amount?: number;
      corporation_id?: number;
    })[];
    yesterday: ({
      amount?: number;
      corporation_id?: number;
    })[];
  };
}

export interface GetFwLeaderboardsOk {
  kills: {
    active_total: ({
      amount?: number;
      faction_id?: number;
    })[];
    last_week: ({
      amount?: number;
      faction_id?: number;
    })[];
    yesterday: ({
      amount?: number;
      faction_id?: number;
    })[];
  };
  victory_points: {
    active_total: ({
      amount?: number;
      faction_id?: number;
    })[];
    last_week: ({
      amount?: number;
      faction_id?: number;
    })[];
    yesterday: ({
      amount?: number;
      faction_id?: number;
    })[];
  };
}

export interface GetFwStats200Ok {
  faction_id: number;
  kills: {
    last_week: number;
    total: number;
    yesterday: number;
  };
  pilots: number;
  systems_controlled: number;
  victory_points: {
    last_week: number;
    total: number;
    yesterday: number;
  };
}

export interface GetFwSystems200Ok {
  contested: 'captured' | 'contested' | 'uncontested' | 'vulnerable';
  occupier_faction_id: number;
  owner_faction_id: number;
  solar_system_id: number;
  victory_points: number;
  victory_points_threshold: number;
}

export interface GetFwWars200Ok {
  against_id: number;
  faction_id: number;
}

// --- Fittings ---

export interface GetCharactersCharacterIdFittings200Ok {
  description: string;
  fitting_id: number;
  items: ({
    flag: 'Cargo' | 'DroneBay' | 'FighterBay' | 'HiSlot0' | 'HiSlot1' | 'HiSlot2' | 'HiSlot3' | 'HiSlot4' | 'HiSlot5' | 'HiSlot6' | 'HiSlot7' | 'Invalid' | 'LoSlot0' | 'LoSlot1' | 'LoSlot2' | 'LoSlot3' | 'LoSlot4' | 'LoSlot5' | 'LoSlot6' | 'LoSlot7' | 'MedSlot0' | 'MedSlot1' | 'MedSlot2' | 'MedSlot3' | 'MedSlot4' | 'MedSlot5' | 'MedSlot6' | 'MedSlot7' | 'RigSlot0' | 'RigSlot1' | 'RigSlot2' | 'ServiceSlot0' | 'ServiceSlot1' | 'ServiceSlot2' | 'ServiceSlot3' | 'ServiceSlot4' | 'ServiceSlot5' | 'ServiceSlot6' | 'ServiceSlot7' | 'SubSystemSlot0' | 'SubSystemSlot1' | 'SubSystemSlot2' | 'SubSystemSlot3';
    quantity: number;
    type_id: number;
  })[];
  name: string;
  ship_type_id: number;
}

// --- Fleets ---

export interface GetCharactersCharacterIdFleetOk {
  fleet_boss_id: number;
  fleet_id: number;
  role: 'fleet_commander' | 'squad_commander' | 'squad_member' | 'wing_commander';
  squad_id: number;
  wing_id: number;
}

export interface GetFleetsFleetIdMembers200Ok {
  character_id: number;
  join_time: string;
  role: 'fleet_commander' | 'wing_commander' | 'squad_commander' | 'squad_member';
  role_name: string;
  ship_type_id: number;
  solar_system_id: number;
  squad_id: number;
  station_id?: number;
  takes_fleet_warp: boolean;
  wing_id: number;
}

export interface GetFleetsFleetIdOk {
  is_free_move: boolean;
  is_registered: boolean;
  is_voice_enabled: boolean;
  motd: string;
}

export interface GetFleetsFleetIdWings200Ok {
  id: number;
  name: string;
  squads: ({
    id: number;
    name: string;
  })[];
}

// --- Incursions ---

export interface GetIncursions200Ok {
  constellation_id: number;
  faction_id: number;
  has_boss: boolean;
  infested_solar_systems: number[];
  influence: number;
  staging_solar_system_id: number;
  state: 'withdrawing' | 'mobilizing' | 'established';
  type: string;
}

// --- Industry ---

export interface GetCharactersCharacterIdIndustryJobs200Ok {
  activity_id: number;
  blueprint_id: number;
  blueprint_location_id: number;
  blueprint_type_id: number;
  completed_character_id?: number;
  completed_date?: string;
  cost?: number;
  duration: number;
  end_date: string;
  facility_id: number;
  installer_id: number;
  job_id: number;
  licensed_runs?: number;
  output_location_id: number;
  pause_date?: string;
  probability?: number;
  product_type_id?: number;
  runs: number;
  start_date: string;
  station_id: number;
  status: 'active' | 'cancelled' | 'delivered' | 'paused' | 'ready' | 'reverted';
  successful_runs?: number;
}

export interface GetCharactersCharacterIdMining200Ok {
  date: string;
  quantity: number;
  solar_system_id: number;
  type_id: number;
}

export interface GetCorporationCorporationIdMiningExtractions200Ok {
  chunk_arrival_time: string;
  extraction_start_time: string;
  moon_id: number;
  natural_decay_time: string;
  structure_id: number;
}

export interface GetCorporationCorporationIdMiningObservers200Ok {
  last_updated: string;
  observer_id: number;
  observer_type: 'structure';
}

export interface GetCorporationCorporationIdMiningObserversObserverId200Ok {
  character_id: number;
  last_updated: string;
  quantity: number;
  recorded_corporation_id: number;
  type_id: number;
}

export interface GetCorporationsCorporationIdIndustryJobs200Ok {
  activity_id: number;
  blueprint_id: number;
  blueprint_location_id: number;
  blueprint_type_id: number;
  completed_character_id?: number;
  completed_date?: string;
  cost?: number;
  duration: number;
  end_date: string;
  facility_id: number;
  installer_id: number;
  job_id: number;
  licensed_runs?: number;
  location_id: number;
  output_location_id: number;
  pause_date?: string;
  probability?: number;
  product_type_id?: number;
  runs: number;
  start_date: string;
  status: 'active' | 'cancelled' | 'delivered' | 'paused' | 'ready' | 'reverted';
  successful_runs?: number;
}

export interface GetIndustryFacilities200Ok {
  facility_id: number;
  owner_id: number;
  region_id: number;
  solar_system_id: number;
  tax?: number;
  type_id: number;
}

export interface GetIndustrySystems200Ok {
  cost_indices: ({
    activity: 'copying' | 'duplicating' | 'invention' | 'manufacturing' | 'none' | 'reaction' | 'researching_material_efficiency' | 'researching_technology' | 'researching_time_efficiency' | 'reverse_engineering';
    cost_index: number;
  })[];
  solar_system_id: number;
}

// --- Insurance ---

export interface GetInsurancePrices200Ok {
  levels: ({
    cost: number;
    name: string;
    payout: number;
  })[];
  type_id: number;
}

// --- Killmails ---

export interface GetCharactersCharacterIdKillmailsRecent200Ok {
  killmail_hash: string;
  killmail_id: number;
}

export interface GetCorporationsCorporationIdKillmailsRecent200Ok {
  killmail_hash: string;
  killmail_id: number;
}

export interface GetKillmailsKillmailIdKillmailHashOk {
  attackers: ({
    alliance_id?: number;
    character_id?: number;
    corporation_id?: number;
    damage_done: number;
    faction_id?: number;
    final_blow: boolean;
    security_status: number;
    ship_type_id?: number;
    weapon_type_id?: number;
  })[];
  killmail_id: number;
  killmail_time: string;
  moon_id?: number;
  solar_system_id: number;
  victim: {
    alliance_id?: number;
    character_id?: number;
    corporation_id?: number;
    damage_taken: number;
    faction_id?: number;
    items?: ({
      flag: number;
      item_type_id: number;
      items?: ({
        flag: number;
        item_type_id: number;
        quantity_destroyed?: number;
        quantity_dropped?: number;
        singleton: number;
      })[];
      quantity_destroyed?: number;
      quantity_dropped?: number;
      singleton: number;
    })[];
    position?: {
      x: number;
      y: number;
      z: number;
    };
    ship_type_id: number;
  };
  war_id?: number;
}

// --- Location ---

export interface GetCharactersCharacterIdLocationOk {
  solar_system_id: number;
  station_id?: number;
  structure_id?: number;
}

export interface GetCharactersCharacterIdOnlineOk {
  last_login?: string;
  last_logout?: string;
  logins?: number;
  online: boolean;
}

export interface GetCharactersCharacterIdShipOk {
  ship_item_id: number;
  ship_name: string;
  ship_type_id: number;
}

// --- Loyalty ---

export interface GetCharactersCharacterIdLoyaltyPoints200Ok {
  corporation_id: number;
  loyalty_points: number;
}

export interface GetLoyaltyStoresCorporationIdOffers200Ok {
  ak_cost?: number;
  isk_cost: number;
  lp_cost: number;
  offer_id: number;
  quantity: number;
  required_items: ({
    quantity: number;
    type_id: number;
  })[];
  type_id: number;
}

// --- Mail ---

export interface GetCharactersCharacterIdMail200Ok {
  from?: number;
  is_read?: boolean;
  labels?: number[];
  mail_id?: number;
  recipients?: ({
    recipient_id: number;
    recipient_type: 'alliance' | 'character' | 'corporation' | 'mailing_list';
  })[];
  subject?: string;
  timestamp?: string;
}

export interface GetCharactersCharacterIdMailLabelsOk {
  labels?: ({
    color?: '#0000fe' | '#006634' | '#0099ff' | '#00ff33' | '#01ffff' | '#349800' | '#660066' | '#666666' | '#999999' | '#99ffff' | '#9a0000' | '#ccff9a' | '#e6e6e6' | '#fe0000' | '#ff6600' | '#ffff01' | '#ffffcd' | '#ffffff';
    label_id?: number;
    name?: string;
    unread_count?: number;
  })[];
  total_unread_count?: number;
}

export interface GetCharactersCharacterIdMailLists200Ok {
  mailing_list_id: number;
  name: string;
}

export interface GetCharactersCharacterIdMailMailIdOk {
  body?: string;
  from?: number;
  labels?: number[];
  read?: boolean;
  recipients?: ({
    recipient_id: number;
    recipient_type: 'alliance' | 'character' | 'corporation' | 'mailing_list';
  })[];
  subject?: string;
  timestamp?: string;
}

// --- Market ---

export interface GetCharactersCharacterIdOrders200Ok {
  duration: number;
  escrow?: number;
  is_buy_order?: boolean;
  is_corporation: boolean;
  issued: string;
  location_id: number;
  min_volume?: number;
  order_id: number;
  price: number;
  range: '1' | '10' | '2' | '20' | '3' | '30' | '4' | '40' | '5' | 'region' | 'solarsystem' | 'station';
  region_id: number;
  type_id: number;
  volume_remain: number;
  volume_total: number;
}

export interface GetCharactersCharacterIdOrdersHistory200Ok {
  duration: number;
  escrow?: number;
  is_buy_order?: boolean;
  is_corporation: boolean;
  issued: string;
  location_id: number;
  min_volume?: number;
  order_id: number;
  price: number;
  range: '1' | '10' | '2' | '20' | '3' | '30' | '4' | '40' | '5' | 'region' | 'solarsystem' | 'station';
  region_id: number;
  state: 'cancelled' | 'expired';
  type_id: number;
  volume_remain: number;
  volume_total: number;
}

export interface GetCorporationsCorporationIdOrders200Ok {
  duration: number;
  escrow?: number;
  is_buy_order?: boolean;
  issued: string;
  issued_by: number;
  location_id: number;
  min_volume?: number;
  order_id: number;
  price: number;
  range: '1' | '10' | '2' | '20' | '3' | '30' | '4' | '40' | '5' | 'region' | 'solarsystem' | 'station';
  region_id: number;
  type_id: number;
  volume_remain: number;
  volume_total: number;
  wallet_division: number;
}

export interface GetCorporationsCorporationIdOrdersHistory200Ok {
  duration: number;
  escrow?: number;
  is_buy_order?: boolean;
  issued: string;
  issued_by?: number;
  location_id: number;
  min_volume?: number;
  order_id: number;
  price: number;
  range: '1' | '10' | '2' | '20' | '3' | '30' | '4' | '40' | '5' | 'region' | 'solarsystem' | 'station';
  region_id: number;
  state: 'cancelled' | 'expired';
  type_id: number;
  volume_remain: number;
  volume_total: number;
  wallet_division: number;
}

export interface GetMarketsGroupsMarketGroupIdOk {
  description: string;
  market_group_id: number;
  name: string;
  parent_group_id?: number;
  types: number[];
}

export interface GetMarketsPrices200Ok {
  adjusted_price?: number;
  average_price?: number;
  type_id: number;
}

export interface GetMarketsRegionIdHistory200Ok {
  average: number;
  date: string;
  highest: number;
  lowest: number;
  order_count: number;
  volume: number;
}

export interface GetMarketsRegionIdOrders200Ok {
  duration: number;
  is_buy_order: boolean;
  issued: string;
  location_id: number;
  min_volume: number;
  order_id: number;
  price: number;
  range: 'station' | 'region' | 'solarsystem' | '1' | '2' | '3' | '4' | '5' | '10' | '20' | '30' | '40';
  system_id: number;
  type_id: number;
  volume_remain: number;
  volume_total: number;
}

export interface GetMarketsStructuresStructureId200Ok {
  duration: number;
  is_buy_order: boolean;
  issued: string;
  location_id: number;
  min_volume: number;
  order_id: number;
  price: number;
  range: 'station' | 'region' | 'solarsystem' | '1' | '2' | '3' | '4' | '5' | '10' | '20' | '30' | '40';
  type_id: number;
  volume_remain: number;
  volume_total: number;
}

// --- Planetary Interaction ---

export interface GetCharactersCharacterIdPlanets200Ok {
  last_update: string;
  num_pins: number;
  owner_id: number;
  planet_id: number;
  planet_type: 'temperate' | 'barren' | 'oceanic' | 'ice' | 'gas' | 'lava' | 'storm' | 'plasma';
  solar_system_id: number;
  upgrade_level: number;
}

export interface GetCharactersCharacterIdPlanetsPlanetIdOk {
  links: ({
    destination_pin_id: number;
    link_level: number;
    source_pin_id: number;
  })[];
  pins: ({
    contents?: ({
      amount: number;
      type_id: number;
    })[];
    expiry_time?: string;
    extractor_details?: {
      cycle_time?: number;
      head_radius?: number;
      heads: ({
        head_id: number;
        latitude: number;
        longitude: number;
      })[];
      product_type_id?: number;
      qty_per_cycle?: number;
    };
    factory_details?: {
      schematic_id: number;
    };
    install_time?: string;
    last_cycle_start?: string;
    latitude: number;
    longitude: number;
    pin_id: number;
    schematic_id?: number;
    type_id: number;
  })[];
  routes: ({
    content_type_id: number;
    destination_pin_id: number;
    quantity: number;
    route_id: number;
    source_pin_id: number;
    waypoints?: number[];
  })[];
}

export interface GetCorporationsCorporationIdCustomsOffices200Ok {
  alliance_tax_rate?: number;
  allow_access_with_standings: boolean;
  allow_alliance_access: boolean;
  bad_standing_tax_rate?: number;
  corporation_tax_rate?: number;
  excellent_standing_tax_rate?: number;
  good_standing_tax_rate?: number;
  neutral_standing_tax_rate?: number;
  office_id: number;
  reinforce_exit_end: number;
  reinforce_exit_start: number;
  standing_level?: 'bad' | 'excellent' | 'good' | 'neutral' | 'terrible';
  system_id: number;
  terrible_standing_tax_rate?: number;
}

export interface GetUniverseSchematicsSchematicIdOk {
  cycle_time: number;
  schematic_name: string;
}

// --- Search ---

export interface GetCharactersCharacterIdSearchOk {
  agent?: number[];
  alliance?: number[];
  character?: number[];
  constellation?: number[];
  corporation?: number[];
  faction?: number[];
  inventory_type?: number[];
  region?: number[];
  solar_system?: number[];
  station?: number[];
  structure?: number[];
}

// --- Skills ---

export interface GetCharactersCharacterIdAttributesOk {
  accrued_remap_cooldown_date?: string;
  bonus_remaps?: number;
  charisma: number;
  intelligence: number;
  last_remap_date?: string;
  memory: number;
  perception: number;
  willpower: number;
}

export interface GetCharactersCharacterIdSkillqueue200Ok {
  finish_date?: string;
  finished_level: number;
  level_end_sp?: number;
  level_start_sp?: number;
  queue_position: number;
  skill_id: number;
  start_date?: string;
  training_start_sp?: number;
}

export interface GetCharactersCharacterIdSkillsOk {
  skills: ({
    active_skill_level: number;
    skill_id: number;
    skillpoints_in_skill: number;
    trained_skill_level: number;
  })[];
  total_sp: number;
  unallocated_sp?: number;
}

// --- Sovereignty ---

export interface GetSovereigntyCampaigns200Ok {
  attackers_score?: number;
  campaign_id: number;
  constellation_id: number;
  defender_id?: number;
  defender_score?: number;
  event_type: 'tcu_defense' | 'ihub_defense' | 'station_defense' | 'station_freeport';
  participants?: ({
    alliance_id: number;
    score: number;
  })[];
  solar_system_id: number;
  start_time: string;
  structure_id: number;
}

export interface GetSovereigntyMap200Ok {
  alliance_id?: number;
  corporation_id?: number;
  faction_id?: number;
  system_id: number;
}

export interface GetSovereigntyStructures200Ok {
  alliance_id: number;
  solar_system_id: number;
  structure_id: number;
  structure_type_id: number;
  vulnerability_occupancy_level?: number;
  vulnerable_end_time?: string;
  vulnerable_start_time?: string;
}

// --- Status ---

export interface GetStatusOk {
  players: number;
  server_version: string;
  start_time: string;
  vip?: boolean;
}

// --- Universe ---

export interface GetUniverseAncestries200Ok {
  bloodline_id: number;
  description: string;
  icon_id?: number;
  id: number;
  name: string;
  short_description?: string;
}

export interface GetUniverseAsteroidBeltsAsteroidBeltIdOk {
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  system_id: number;
}

export interface GetUniverseBloodlines200Ok {
  bloodline_id: number;
  charisma: number;
  corporation_id: number;
  description: string;
  intelligence: number;
  memory: number;
  name: string;
  perception: number;
  race_id: number;
  ship_type_id: number;
  willpower: number;
}

export interface GetUniverseCategoriesCategoryIdOk {
  category_id: number;
  groups: number[];
  name: string;
  published: boolean;
}

export interface GetUniverseConstellationsConstellationIdOk {
  constellation_id: number;
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  region_id: number;
  systems: number[];
}

export interface GetUniverseFactions200Ok {
  corporation_id?: number;
  description: string;
  faction_id: number;
  is_unique: boolean;
  militia_corporation_id?: number;
  name: string;
  size_factor: number;
  solar_system_id?: number;
  station_count: number;
  station_system_count: number;
}

export interface GetUniverseGraphicsGraphicIdOk {
  collision_file?: string;
  graphic_file?: string;
  graphic_id: number;
  icon_folder?: string;
  sof_dna?: string;
  sof_fation_name?: string;
  sof_hull_name?: string;
  sof_race_name?: string;
}

export interface GetUniverseGroupsGroupIdOk {
  category_id: number;
  group_id: number;
  name: string;
  published: boolean;
  types: number[];
}

export interface GetUniverseMoonsMoonIdOk {
  moon_id: number;
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  system_id: number;
}

export interface GetUniversePlanetsPlanetIdOk {
  name: string;
  planet_id: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  system_id: number;
  type_id: number;
}

export interface GetUniverseRaces200Ok {
  alliance_id: number;
  description: string;
  name: string;
  race_id: number;
}

export interface GetUniverseRegionsRegionIdOk {
  constellations: number[];
  description?: string;
  name: string;
  region_id: number;
}

export interface GetUniverseStargatesStargateIdOk {
  destination: {
    stargate_id: number;
    system_id: number;
  };
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  stargate_id: number;
  system_id: number;
  type_id: number;
}

export interface GetUniverseStarsStarIdOk {
  age: number;
  luminosity: number;
  name: string;
  radius: number;
  solar_system_id: number;
  spectral_class: 'K2 V' | 'K4 V' | 'G2 V' | 'G8 V' | 'M7 V' | 'K7 V' | 'M2 V' | 'K5 V' | 'M3 V' | 'G0 V' | 'G7 V' | 'G3 V' | 'F9 V' | 'G5 V' | 'F6 V' | 'K8 V' | 'K9 V' | 'K6 V' | 'G9 V' | 'G6 V' | 'G4 VI' | 'G4 V' | 'F8 V' | 'F2 V' | 'F1 V' | 'K3 V' | 'F0 VI' | 'G1 VI' | 'G0 VI' | 'K1 V' | 'M4 V' | 'M1 V' | 'M6 V' | 'M0 V' | 'K2 IV' | 'G2 VI' | 'K0 V' | 'K5 IV' | 'F5 VI' | 'G6 VI' | 'F6 VI' | 'F2 IV' | 'G3 VI' | 'M8 V' | 'F1 VI' | 'K1 IV' | 'F7 V' | 'G5 VI' | 'M5 V' | 'G7 VI' | 'F5 V' | 'F4 VI' | 'F8 VI' | 'K3 IV' | 'F4 IV' | 'F0 V' | 'G7 IV' | 'G8 VI' | 'F2 VI' | 'F4 V' | 'F7 VI' | 'F3 V' | 'G1 V' | 'G9 VI' | 'F3 IV' | 'F9 VI' | 'M9 V' | 'K0 IV' | 'F1 IV' | 'G4 IV' | 'F3 VI' | 'K4 IV' | 'G5 IV' | 'G3 IV' | 'G1 IV' | 'K7 IV' | 'G0 IV' | 'K6 IV' | 'K9 IV' | 'G2 IV' | 'F9 IV' | 'F0 IV' | 'K8 IV' | 'G8 IV' | 'F6 IV' | 'F5 IV' | 'A0' | 'A0IV' | 'A0IV2';
  temperature: number;
  type_id: number;
}

export interface GetUniverseStationsStationIdOk {
  max_dockable_ship_volume: number;
  name: string;
  office_rental_cost: number;
  owner?: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  race_id?: number;
  reprocessing_efficiency: number;
  reprocessing_stations_take: number;
  services: 'bounty-missions' | 'assasination-missions' | 'courier-missions' | 'interbus' | 'reprocessing-plant' | 'refinery' | 'market' | 'black-market' | 'stock-exchange' | 'cloning' | 'surgery' | 'dna-therapy' | 'repair-facilities' | 'factory' | 'labratory' | 'gambling' | 'fitting' | 'paintshop' | 'news' | 'storage' | 'insurance' | 'docking' | 'office-rental' | 'jump-clone-facility' | 'loyalty-point-store' | 'navy-offices' | 'security-offices'[];
  station_id: number;
  system_id: number;
  type_id: number;
}

export interface GetUniverseStructuresStructureIdOk {
  name: string;
  owner_id: number;
  position?: {
    x: number;
    y: number;
    z: number;
  };
  solar_system_id: number;
  type_id?: number;
}

export interface GetUniverseSystemJumps200Ok {
  ship_jumps: number;
  system_id: number;
}

export interface GetUniverseSystemKills200Ok {
  npc_kills: number;
  pod_kills: number;
  ship_kills: number;
  system_id: number;
}

export interface GetUniverseSystemsSystemIdOk {
  constellation_id: number;
  name: string;
  planets?: ({
    asteroid_belts?: number[];
    moons?: number[];
    planet_id: number;
  })[];
  position: {
    x: number;
    y: number;
    z: number;
  };
  security_class?: string;
  security_status: number;
  star_id?: number;
  stargates?: number[];
  stations?: number[];
  system_id: number;
}

export interface GetUniverseTypesTypeIdOk {
  capacity?: number;
  description: string;
  dogma_attributes?: ({
    attribute_id: number;
    value: number;
  })[];
  dogma_effects?: ({
    effect_id: number;
    is_default: boolean;
  })[];
  graphic_id?: number;
  group_id: number;
  icon_id?: number;
  market_group_id?: number;
  mass?: number;
  name: string;
  packaged_volume?: number;
  portion_size?: number;
  published: boolean;
  radius?: number;
  type_id: number;
  volume?: number;
}

export interface PostUniverseIdsOk {
  agents?: ({
    id?: number;
    name?: string;
  })[];
  alliances?: ({
    id?: number;
    name?: string;
  })[];
  characters?: ({
    id?: number;
    name?: string;
  })[];
  constellations?: ({
    id?: number;
    name?: string;
  })[];
  corporations?: ({
    id?: number;
    name?: string;
  })[];
  factions?: ({
    id?: number;
    name?: string;
  })[];
  inventory_types?: ({
    id?: number;
    name?: string;
  })[];
  regions?: ({
    id?: number;
    name?: string;
  })[];
  stations?: ({
    id?: number;
    name?: string;
  })[];
  systems?: ({
    id?: number;
    name?: string;
  })[];
}

export interface PostUniverseNames200Ok {
  category: 'alliance' | 'character' | 'constellation' | 'corporation' | 'inventory_type' | 'region' | 'solar_system' | 'station' | 'faction';
  id: number;
  name: string;
}

// --- Wallet ---

export interface GetCharactersCharacterIdWalletJournal200Ok {
  amount?: number;
  balance?: number;
  context_id?: number;
  context_id_type?: 'structure_id' | 'station_id' | 'market_transaction_id' | 'character_id' | 'corporation_id' | 'alliance_id' | 'eve_system' | 'industry_job_id' | 'contract_id' | 'planet_id' | 'system_id' | 'type_id';
  date: string;
  description: string;
  first_party_id?: number;
  id: number;
  reason?: string;
  ref_type: 'acceleration_gate_fee' | 'advertisement_listing_fee' | 'agent_donation' | 'agent_location_services' | 'agent_miscellaneous' | 'agent_mission_collateral_paid' | 'agent_mission_collateral_refunded' | 'agent_mission_reward' | 'agent_mission_reward_corporation_tax' | 'agent_mission_time_bonus_reward' | 'agent_mission_time_bonus_reward_corporation_tax' | 'agent_security_services' | 'agent_services_rendered' | 'agents_preward' | 'air_career_program_reward' | 'alliance_maintainance_fee' | 'alliance_registration_fee' | 'allignment_based_gate_toll' | 'asset_safety_recovery_tax' | 'bounty' | 'bounty_prize' | 'bounty_prize_corporation_tax' | 'bounty_prizes' | 'bounty_reimbursement' | 'bounty_surcharge' | 'brokers_fee' | 'clone_activation' | 'clone_transfer' | 'contraband_fine' | 'contract_auction_bid' | 'contract_auction_bid_corp' | 'contract_auction_bid_refund' | 'contract_auction_sold' | 'contract_brokers_fee' | 'contract_brokers_fee_corp' | 'contract_collateral' | 'contract_collateral_deposited_corp' | 'contract_collateral_payout' | 'contract_collateral_refund' | 'contract_deposit' | 'contract_deposit_corp' | 'contract_deposit_refund' | 'contract_deposit_sales_tax' | 'contract_price' | 'contract_price_payment_corp' | 'contract_reversal' | 'contract_reward' | 'contract_reward_deposited' | 'contract_reward_deposited_corp' | 'contract_reward_refund' | 'contract_sales_tax' | 'copying' | 'corporate_reward_payout' | 'corporate_reward_tax' | 'corporation_account_withdrawal' | 'corporation_bulk_payment' | 'corporation_dividend_payment' | 'corporation_liquidation' | 'corporation_logo_change_cost' | 'corporation_payment' | 'corporation_registration_fee' | 'cosmetic_market_component_item_purchase' | 'cosmetic_market_skin_purchase' | 'cosmetic_market_skin_sale' | 'cosmetic_market_skin_sale_broker_fee' | 'cosmetic_market_skin_sale_tax' | 'cosmetic_market_skin_transaction' | 'courier_mission_escrow' | 'cspa' | 'cspaofflinerefund' | 'daily_challenge_reward' | 'daily_goal_payouts' | 'daily_goal_payouts_tax' | 'datacore_fee' | 'dna_modification_fee' | 'docking_fee' | 'duel_wager_escrow' | 'duel_wager_payment' | 'duel_wager_refund' | 'ess_escrow_transfer' | 'external_trade_delivery' | 'external_trade_freeze' | 'external_trade_thaw' | 'factory_slot_rental_fee' | 'flux_payout' | 'flux_tax' | 'flux_ticket_repayment' | 'flux_ticket_sale' | 'freelance_jobs_broadcasting_fee' | 'freelance_jobs_duration_fee' | 'freelance_jobs_escrow_refund' | 'freelance_jobs_reward' | 'freelance_jobs_reward_corporation_tax' | 'freelance_jobs_reward_escrow' | 'gm_cash_transfer' | 'gm_plex_fee_refund' | 'industry_job_tax' | 'infrastructure_hub_maintenance' | 'inheritance' | 'insurance' | 'insurgency_corruption_contribution_reward' | 'insurgency_suppression_contribution_reward' | 'item_trader_payment' | 'jump_clone_activation_fee' | 'jump_clone_installation_fee' | 'kill_right_fee' | 'lp_store' | 'manufacturing' | 'market_escrow' | 'market_fine_paid' | 'market_provider_tax' | 'market_transaction' | 'medal_creation' | 'medal_issued' | 'milestone_reward_payment' | 'mission_completion' | 'mission_cost' | 'mission_expiration' | 'mission_reward' | 'office_rental_fee' | 'operation_bonus' | 'opportunity_reward' | 'planetary_construction' | 'planetary_export_tax' | 'planetary_import_tax' | 'player_donation' | 'player_trading' | 'project_discovery_reward' | 'project_discovery_tax' | 'project_payouts' | 'reaction' | 'redeemed_isk_token' | 'release_of_impounded_property' | 'repair_bill' | 'reprocessing_tax' | 'researching_material_productivity' | 'researching_technology' | 'researching_time_productivity' | 'resource_wars_reward' | 'reverse_engineering' | 'season_challenge_reward' | 'security_processing_fee' | 'shares' | 'skill_purchase' | 'skyhook_claim_fee' | 'sovereignity_bill' | 'store_purchase' | 'store_purchase_refund' | 'structure_gate_jump' | 'transaction_tax' | 'under_construction' | 'upkeep_adjustment_fee' | 'war_ally_contract' | 'war_fee' | 'war_fee_surrender';
  second_party_id?: number;
  tax?: number;
  tax_receiver_id?: number;
}

export interface GetCharactersCharacterIdWalletTransactions200Ok {
  client_id: number;
  date: string;
  is_buy: boolean;
  is_personal: boolean;
  journal_ref_id: number;
  location_id: number;
  quantity: number;
  transaction_id: number;
  type_id: number;
  unit_price: number;
}

export interface GetCorporationsCorporationIdWallets200Ok {
  balance: number;
  division: number;
}

export interface GetCorporationsCorporationIdWalletsDivisionJournal200Ok {
  amount?: number;
  balance?: number;
  context_id?: number;
  context_id_type?: 'structure_id' | 'station_id' | 'market_transaction_id' | 'character_id' | 'corporation_id' | 'alliance_id' | 'eve_system' | 'industry_job_id' | 'contract_id' | 'planet_id' | 'system_id' | 'type_id';
  date: string;
  description: string;
  first_party_id?: number;
  id: number;
  reason?: string;
  ref_type: 'acceleration_gate_fee' | 'advertisement_listing_fee' | 'agent_donation' | 'agent_location_services' | 'agent_miscellaneous' | 'agent_mission_collateral_paid' | 'agent_mission_collateral_refunded' | 'agent_mission_reward' | 'agent_mission_reward_corporation_tax' | 'agent_mission_time_bonus_reward' | 'agent_mission_time_bonus_reward_corporation_tax' | 'agent_security_services' | 'agent_services_rendered' | 'agents_preward' | 'air_career_program_reward' | 'alliance_maintainance_fee' | 'alliance_registration_fee' | 'allignment_based_gate_toll' | 'asset_safety_recovery_tax' | 'bounty' | 'bounty_prize' | 'bounty_prize_corporation_tax' | 'bounty_prizes' | 'bounty_reimbursement' | 'bounty_surcharge' | 'brokers_fee' | 'clone_activation' | 'clone_transfer' | 'contraband_fine' | 'contract_auction_bid' | 'contract_auction_bid_corp' | 'contract_auction_bid_refund' | 'contract_auction_sold' | 'contract_brokers_fee' | 'contract_brokers_fee_corp' | 'contract_collateral' | 'contract_collateral_deposited_corp' | 'contract_collateral_payout' | 'contract_collateral_refund' | 'contract_deposit' | 'contract_deposit_corp' | 'contract_deposit_refund' | 'contract_deposit_sales_tax' | 'contract_price' | 'contract_price_payment_corp' | 'contract_reversal' | 'contract_reward' | 'contract_reward_deposited' | 'contract_reward_deposited_corp' | 'contract_reward_refund' | 'contract_sales_tax' | 'copying' | 'corporate_reward_payout' | 'corporate_reward_tax' | 'corporation_account_withdrawal' | 'corporation_bulk_payment' | 'corporation_dividend_payment' | 'corporation_liquidation' | 'corporation_logo_change_cost' | 'corporation_payment' | 'corporation_registration_fee' | 'cosmetic_market_component_item_purchase' | 'cosmetic_market_skin_purchase' | 'cosmetic_market_skin_sale' | 'cosmetic_market_skin_sale_broker_fee' | 'cosmetic_market_skin_sale_tax' | 'cosmetic_market_skin_transaction' | 'courier_mission_escrow' | 'cspa' | 'cspaofflinerefund' | 'daily_challenge_reward' | 'daily_goal_payouts' | 'daily_goal_payouts_tax' | 'datacore_fee' | 'dna_modification_fee' | 'docking_fee' | 'duel_wager_escrow' | 'duel_wager_payment' | 'duel_wager_refund' | 'ess_escrow_transfer' | 'external_trade_delivery' | 'external_trade_freeze' | 'external_trade_thaw' | 'factory_slot_rental_fee' | 'flux_payout' | 'flux_tax' | 'flux_ticket_repayment' | 'flux_ticket_sale' | 'freelance_jobs_broadcasting_fee' | 'freelance_jobs_duration_fee' | 'freelance_jobs_escrow_refund' | 'freelance_jobs_reward' | 'freelance_jobs_reward_corporation_tax' | 'freelance_jobs_reward_escrow' | 'gm_cash_transfer' | 'gm_plex_fee_refund' | 'industry_job_tax' | 'infrastructure_hub_maintenance' | 'inheritance' | 'insurance' | 'insurgency_corruption_contribution_reward' | 'insurgency_suppression_contribution_reward' | 'item_trader_payment' | 'jump_clone_activation_fee' | 'jump_clone_installation_fee' | 'kill_right_fee' | 'lp_store' | 'manufacturing' | 'market_escrow' | 'market_fine_paid' | 'market_provider_tax' | 'market_transaction' | 'medal_creation' | 'medal_issued' | 'milestone_reward_payment' | 'mission_completion' | 'mission_cost' | 'mission_expiration' | 'mission_reward' | 'office_rental_fee' | 'operation_bonus' | 'opportunity_reward' | 'planetary_construction' | 'planetary_export_tax' | 'planetary_import_tax' | 'player_donation' | 'player_trading' | 'project_discovery_reward' | 'project_discovery_tax' | 'project_payouts' | 'reaction' | 'redeemed_isk_token' | 'release_of_impounded_property' | 'repair_bill' | 'reprocessing_tax' | 'researching_material_productivity' | 'researching_technology' | 'researching_time_productivity' | 'resource_wars_reward' | 'reverse_engineering' | 'season_challenge_reward' | 'security_processing_fee' | 'shares' | 'skill_purchase' | 'skyhook_claim_fee' | 'sovereignity_bill' | 'store_purchase' | 'store_purchase_refund' | 'structure_gate_jump' | 'transaction_tax' | 'under_construction' | 'upkeep_adjustment_fee' | 'war_ally_contract' | 'war_fee' | 'war_fee_surrender';
  second_party_id?: number;
  tax?: number;
  tax_receiver_id?: number;
}

export interface GetCorporationsCorporationIdWalletsDivisionTransactions200Ok {
  client_id: number;
  date: string;
  is_buy: boolean;
  journal_ref_id: number;
  location_id: number;
  quantity: number;
  transaction_id: number;
  type_id: number;
  unit_price: number;
}

// --- Wars ---

export interface GetWarsWarIdKillmails200Ok {
  killmail_hash: string;
  killmail_id: number;
}

export interface GetWarsWarIdOk {
  aggressor: {
    alliance_id?: number;
    corporation_id?: number;
    isk_destroyed: number;
    ships_killed: number;
  };
  allies?: ({
    alliance_id?: number;
    corporation_id?: number;
  })[];
  declared: string;
  defender: {
    alliance_id?: number;
    corporation_id?: number;
    isk_destroyed: number;
    ships_killed: number;
  };
  finished?: string;
  id: number;
  mutual: boolean;
  open_for_allies: boolean;
  retracted?: string;
  started?: string;
}

// Operation ID → Response type mapping
export interface EsiOperationTypes {
  'get_alliances_alliance_id': GetAlliancesAllianceIdOk;
  'get_alliances_alliance_id_contacts': GetAlliancesAllianceIdContacts200Ok[];
  'get_alliances_alliance_id_contacts_labels': GetAlliancesAllianceIdContactsLabels200Ok[];
  'get_alliances_alliance_id_icons': GetAlliancesAllianceIdIconsOk;
  'get_characters_character_id': GetCharactersCharacterIdOk;
  'get_characters_character_id_agents_research': GetCharactersCharacterIdAgentsResearch200Ok[];
  'get_characters_character_id_assets': GetCharactersCharacterIdAssets200Ok[];
  'get_characters_character_id_attributes': GetCharactersCharacterIdAttributesOk;
  'get_characters_character_id_blueprints': GetCharactersCharacterIdBlueprints200Ok[];
  'get_characters_character_id_calendar': GetCharactersCharacterIdCalendar200Ok[];
  'get_characters_character_id_calendar_event_id': GetCharactersCharacterIdCalendarEventIdOk;
  'get_characters_character_id_calendar_event_id_attendees': GetCharactersCharacterIdCalendarEventIdAttendees200Ok[];
  'get_characters_character_id_clones': GetCharactersCharacterIdClonesOk;
  'get_characters_character_id_contacts': GetCharactersCharacterIdContacts200Ok[];
  'get_characters_character_id_contacts_labels': GetCharactersCharacterIdContactsLabels200Ok[];
  'get_characters_character_id_contracts': GetCharactersCharacterIdContracts200Ok[];
  'get_characters_character_id_contracts_contract_id_bids': GetCharactersCharacterIdContractsContractIdBids200Ok[];
  'get_characters_character_id_contracts_contract_id_items': GetCharactersCharacterIdContractsContractIdItems200Ok[];
  'get_characters_character_id_corporationhistory': GetCharactersCharacterIdCorporationhistory200Ok[];
  'get_characters_character_id_fatigue': GetCharactersCharacterIdFatigueOk;
  'get_characters_character_id_fittings': GetCharactersCharacterIdFittings200Ok[];
  'get_characters_character_id_fleet': GetCharactersCharacterIdFleetOk;
  'get_characters_character_id_fw_stats': GetCharactersCharacterIdFwStatsOk;
  'get_characters_character_id_industry_jobs': GetCharactersCharacterIdIndustryJobs200Ok[];
  'get_characters_character_id_killmails_recent': GetCharactersCharacterIdKillmailsRecent200Ok[];
  'get_characters_character_id_location': GetCharactersCharacterIdLocationOk;
  'get_characters_character_id_loyalty_points': GetCharactersCharacterIdLoyaltyPoints200Ok[];
  'get_characters_character_id_mail': GetCharactersCharacterIdMail200Ok[];
  'get_characters_character_id_mail_labels': GetCharactersCharacterIdMailLabelsOk;
  'get_characters_character_id_mail_lists': GetCharactersCharacterIdMailLists200Ok[];
  'get_characters_character_id_mail_mail_id': GetCharactersCharacterIdMailMailIdOk;
  'get_characters_character_id_medals': GetCharactersCharacterIdMedals200Ok[];
  'get_characters_character_id_mining': GetCharactersCharacterIdMining200Ok[];
  'get_characters_character_id_notifications': GetCharactersCharacterIdNotifications200Ok[];
  'get_characters_character_id_notifications_contacts': GetCharactersCharacterIdNotificationsContacts200Ok[];
  'get_characters_character_id_online': GetCharactersCharacterIdOnlineOk;
  'get_characters_character_id_orders': GetCharactersCharacterIdOrders200Ok[];
  'get_characters_character_id_orders_history': GetCharactersCharacterIdOrdersHistory200Ok[];
  'get_characters_character_id_planets': GetCharactersCharacterIdPlanets200Ok[];
  'get_characters_character_id_planets_planet_id': GetCharactersCharacterIdPlanetsPlanetIdOk;
  'get_characters_character_id_portrait': GetCharactersCharacterIdPortraitOk;
  'get_characters_character_id_roles': GetCharactersCharacterIdRolesOk;
  'get_characters_character_id_search': GetCharactersCharacterIdSearchOk;
  'get_characters_character_id_ship': GetCharactersCharacterIdShipOk;
  'get_characters_character_id_skillqueue': GetCharactersCharacterIdSkillqueue200Ok[];
  'get_characters_character_id_skills': GetCharactersCharacterIdSkillsOk;
  'get_characters_character_id_standings': GetCharactersCharacterIdStandings200Ok[];
  'get_characters_character_id_titles': GetCharactersCharacterIdTitles200Ok[];
  'get_characters_character_id_wallet_journal': GetCharactersCharacterIdWalletJournal200Ok[];
  'get_characters_character_id_wallet_transactions': GetCharactersCharacterIdWalletTransactions200Ok[];
  'get_contracts_public_bids_contract_id': GetContractsPublicBidsContractId200Ok[];
  'get_contracts_public_items_contract_id': GetContractsPublicItemsContractId200Ok[];
  'get_contracts_public_region_id': GetContractsPublicRegionId200Ok[];
  'get_corporation_corporation_id_mining_extractions': GetCorporationCorporationIdMiningExtractions200Ok[];
  'get_corporation_corporation_id_mining_observers': GetCorporationCorporationIdMiningObservers200Ok[];
  'get_corporation_corporation_id_mining_observers_observer_id': GetCorporationCorporationIdMiningObserversObserverId200Ok[];
  'get_corporations_corporation_id': GetCorporationsCorporationIdOk;
  'get_corporations_corporation_id_alliancehistory': GetCorporationsCorporationIdAlliancehistory200Ok[];
  'get_corporations_corporation_id_assets': GetCorporationsCorporationIdAssets200Ok[];
  'get_corporations_corporation_id_blueprints': GetCorporationsCorporationIdBlueprints200Ok[];
  'get_corporations_corporation_id_contacts': GetCorporationsCorporationIdContacts200Ok[];
  'get_corporations_corporation_id_contacts_labels': GetCorporationsCorporationIdContactsLabels200Ok[];
  'get_corporations_corporation_id_containers_logs': GetCorporationsCorporationIdContainersLogs200Ok[];
  'get_corporations_corporation_id_contracts': GetCorporationsCorporationIdContracts200Ok[];
  'get_corporations_corporation_id_contracts_contract_id_bids': GetCorporationsCorporationIdContractsContractIdBids200Ok[];
  'get_corporations_corporation_id_contracts_contract_id_items': GetCorporationsCorporationIdContractsContractIdItems200Ok[];
  'get_corporations_corporation_id_customs_offices': GetCorporationsCorporationIdCustomsOffices200Ok[];
  'get_corporations_corporation_id_divisions': GetCorporationsCorporationIdDivisionsOk;
  'get_corporations_corporation_id_facilities': GetCorporationsCorporationIdFacilities200Ok[];
  'get_corporations_corporation_id_fw_stats': GetCorporationsCorporationIdFwStatsOk;
  'get_corporations_corporation_id_icons': GetCorporationsCorporationIdIconsOk;
  'get_corporations_corporation_id_industry_jobs': GetCorporationsCorporationIdIndustryJobs200Ok[];
  'get_corporations_corporation_id_killmails_recent': GetCorporationsCorporationIdKillmailsRecent200Ok[];
  'get_corporations_corporation_id_medals': GetCorporationsCorporationIdMedals200Ok[];
  'get_corporations_corporation_id_medals_issued': GetCorporationsCorporationIdMedalsIssued200Ok[];
  'get_corporations_corporation_id_members_titles': GetCorporationsCorporationIdMembersTitles200Ok[];
  'get_corporations_corporation_id_membertracking': GetCorporationsCorporationIdMembertracking200Ok[];
  'get_corporations_corporation_id_orders': GetCorporationsCorporationIdOrders200Ok[];
  'get_corporations_corporation_id_orders_history': GetCorporationsCorporationIdOrdersHistory200Ok[];
  'get_corporations_corporation_id_roles': GetCorporationsCorporationIdRoles200Ok[];
  'get_corporations_corporation_id_roles_history': GetCorporationsCorporationIdRolesHistory200Ok[];
  'get_corporations_corporation_id_shareholders': GetCorporationsCorporationIdShareholders200Ok[];
  'get_corporations_corporation_id_standings': GetCorporationsCorporationIdStandings200Ok[];
  'get_corporations_corporation_id_starbases': GetCorporationsCorporationIdStarbases200Ok[];
  'get_corporations_corporation_id_starbases_starbase_id': GetCorporationsCorporationIdStarbasesStarbaseIdOk;
  'get_corporations_corporation_id_structures': GetCorporationsCorporationIdStructures200Ok[];
  'get_corporations_corporation_id_titles': GetCorporationsCorporationIdTitles200Ok[];
  'get_corporations_corporation_id_wallets': GetCorporationsCorporationIdWallets200Ok[];
  'get_corporations_corporation_id_wallets_division_journal': GetCorporationsCorporationIdWalletsDivisionJournal200Ok[];
  'get_corporations_corporation_id_wallets_division_transactions': GetCorporationsCorporationIdWalletsDivisionTransactions200Ok[];
  'get_dogma_attributes_attribute_id': GetDogmaAttributesAttributeIdOk;
  'get_dogma_dynamic_items_type_id_item_id': GetDogmaDynamicItemsTypeIdItemIdOk;
  'get_dogma_effects_effect_id': GetDogmaEffectsEffectIdOk;
  'get_fleets_fleet_id': GetFleetsFleetIdOk;
  'get_fleets_fleet_id_members': GetFleetsFleetIdMembers200Ok[];
  'get_fleets_fleet_id_wings': GetFleetsFleetIdWings200Ok[];
  'get_fw_leaderboards': GetFwLeaderboardsOk;
  'get_fw_leaderboards_characters': GetFwLeaderboardsCharactersOk;
  'get_fw_leaderboards_corporations': GetFwLeaderboardsCorporationsOk;
  'get_fw_stats': GetFwStats200Ok[];
  'get_fw_systems': GetFwSystems200Ok[];
  'get_fw_wars': GetFwWars200Ok[];
  'get_incursions': GetIncursions200Ok[];
  'get_industry_facilities': GetIndustryFacilities200Ok[];
  'get_industry_systems': GetIndustrySystems200Ok[];
  'get_insurance_prices': GetInsurancePrices200Ok[];
  'get_killmails_killmail_id_killmail_hash': GetKillmailsKillmailIdKillmailHashOk;
  'get_loyalty_stores_corporation_id_offers': GetLoyaltyStoresCorporationIdOffers200Ok[];
  'get_markets_groups_market_group_id': GetMarketsGroupsMarketGroupIdOk;
  'get_markets_prices': GetMarketsPrices200Ok[];
  'get_markets_region_id_history': GetMarketsRegionIdHistory200Ok[];
  'get_markets_region_id_orders': GetMarketsRegionIdOrders200Ok[];
  'get_markets_structures_structure_id': GetMarketsStructuresStructureId200Ok[];
  'get_sovereignty_campaigns': GetSovereigntyCampaigns200Ok[];
  'get_sovereignty_map': GetSovereigntyMap200Ok[];
  'get_sovereignty_structures': GetSovereigntyStructures200Ok[];
  'get_status': GetStatusOk;
  'get_universe_ancestries': GetUniverseAncestries200Ok[];
  'get_universe_asteroid_belts_asteroid_belt_id': GetUniverseAsteroidBeltsAsteroidBeltIdOk;
  'get_universe_bloodlines': GetUniverseBloodlines200Ok[];
  'get_universe_categories_category_id': GetUniverseCategoriesCategoryIdOk;
  'get_universe_constellations_constellation_id': GetUniverseConstellationsConstellationIdOk;
  'get_universe_factions': GetUniverseFactions200Ok[];
  'get_universe_graphics_graphic_id': GetUniverseGraphicsGraphicIdOk;
  'get_universe_groups_group_id': GetUniverseGroupsGroupIdOk;
  'get_universe_moons_moon_id': GetUniverseMoonsMoonIdOk;
  'get_universe_planets_planet_id': GetUniversePlanetsPlanetIdOk;
  'get_universe_races': GetUniverseRaces200Ok[];
  'get_universe_regions_region_id': GetUniverseRegionsRegionIdOk;
  'get_universe_schematics_schematic_id': GetUniverseSchematicsSchematicIdOk;
  'get_universe_stargates_stargate_id': GetUniverseStargatesStargateIdOk;
  'get_universe_stars_star_id': GetUniverseStarsStarIdOk;
  'get_universe_stations_station_id': GetUniverseStationsStationIdOk;
  'get_universe_structures_structure_id': GetUniverseStructuresStructureIdOk;
  'get_universe_system_jumps': GetUniverseSystemJumps200Ok[];
  'get_universe_system_kills': GetUniverseSystemKills200Ok[];
  'get_universe_systems_system_id': GetUniverseSystemsSystemIdOk;
  'get_universe_types_type_id': GetUniverseTypesTypeIdOk;
  'get_wars_war_id': GetWarsWarIdOk;
  'get_wars_war_id_killmails': GetWarsWarIdKillmails200Ok[];
  'post_characters_affiliation': PostCharactersAffiliation200Ok[];
  'post_characters_character_id_assets_locations': PostCharactersCharacterIdAssetsLocations200Ok[];
  'post_characters_character_id_assets_names': PostCharactersCharacterIdAssetsNames200Ok[];
  'post_corporations_corporation_id_assets_locations': PostCorporationsCorporationIdAssetsLocations200Ok[];
  'post_corporations_corporation_id_assets_names': PostCorporationsCorporationIdAssetsNames200Ok[];
  'post_universe_ids': PostUniverseIdsOk;
  'post_universe_names': PostUniverseNames200Ok[];
}
