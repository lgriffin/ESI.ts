// Alliance Types
export interface AllianceInfo {
    alliance_id: number;
    name: string;
    ticker: string;
    creator_id: number;
    creator_corporation_id: number;
    executor_corporation_id?: number;
    date_founded: string;
    faction_id?: number;
}

export interface AllianceContact {
    contact_id: number;
    contact_type: 'character' | 'corporation' | 'alliance';
    standing: number;
    label_ids?: number[];
}

export interface AllianceContactLabel {
    label_id: number;
    label_name: string;
}

export interface AllianceIcon {
    px64x64?: string;
    px128x128?: string;
}

// Character Types
export interface CharacterInfo {
    character_id: number;
    name: string;
    description?: string;
    corporation_id: number;
    alliance_id?: number;
    ancestry_id?: number;
    bloodline_id: number;
    race_id: number;
    gender: 'male' | 'female';
    security_status?: number;
    title?: string;
    birthday: string;
}

export interface CharacterPortrait {
    px64x64?: string;
    px128x128?: string;
    px256x256?: string;
    px512x512?: string;
}

export interface CharacterAttributes {
    charisma: number;
    intelligence: number;
    memory: number;
    perception: number;
    willpower: number;
    bonus_remaps?: number;
    last_remap_date?: string;
    accrued_remap_cooldown_date?: string;
}

// Corporation Types
export interface CorporationInfo {
    corporation_id: number;
    name: string;
    ticker: string;
    description?: string;
    url?: string;
    alliance_id?: number;
    ceo_id: number;
    creator_id: number;
    date_founded?: string;
    faction_id?: number;
    home_station_id?: number;
    member_count: number;
    shares?: number;
    tax_rate: number;
    war_eligible?: boolean;
}

// Universe Types
export interface SolarSystemInfo {
    system_id: number;
    name: string;
    constellation_id: number;
    security_class?: string;
    security_status: number;
    star_id?: number;
    stargates?: number[];
    stations?: number[];
    planets?: {
        asteroid_belts?: number[];
        moons?: number[];
        planet_id: number;
    }[];
}

export interface ConstellationInfo {
    constellation_id: number;
    name: string;
    region_id: number;
    systems: number[];
    position: {
        x: number;
        y: number;
        z: number;
    };
}

export interface RegionInfo {
    region_id: number;
    name: string;
    description?: string;
    constellations: number[];
}

// Market Types
export interface MarketOrder {
    order_id: number;
    type_id: number;
    location_id: number;
    volume_total: number;
    volume_remain: number;
    min_volume: number;
    price: number;
    is_buy_order: boolean;
    duration: number;
    issued: string;
    range: string;
    state?: 'open' | 'closed' | 'expired' | 'cancelled';
}

export interface MarketHistory {
    date: string;
    order_count: number;
    volume: number;
    highest: number;
    average: number;
    lowest: number;
}

// Common API Response Types
export interface ApiResponse<T> {
    data: T;
    status: number;
    headers: Record<string, string>;
}

export interface PaginatedResponse<T> {
    data: T[];
    total_count?: number;
    page?: number;
    total_pages?: number;
}

export interface ErrorResponse {
    error: string;
    error_description?: string;
    sso_status?: number;
}

// Asset Types
export interface CharacterAsset {
    item_id: number;
    type_id: number;
    quantity: number;
    location_id: number;
    location_type: 'station' | 'solar_system' | 'other';
    location_flag: string;
    is_singleton: boolean;
    is_blueprint_copy?: boolean;
}

export interface AssetLocation {
    item_id: number;
    position: {
        x: number;
        y: number;
        z: number;
    };
}

export interface AssetName {
    item_id: number;
    name: string;
}

// Mail Types
export interface MailMessage {
    mail_id: number;
    subject?: string;
    from?: number;
    timestamp: string;
    labels?: number[];
    is_read?: boolean;
    recipients: Array<{
        recipient_id: number;
        recipient_type: 'alliance' | 'character' | 'corporation' | 'mailing_list';
    }>;
}

export interface MailLabel {
    label_id: number;
    name: string;
    color?: string;
    unread_count?: number;
}

// Wallet Types
export interface WalletTransaction {
    transaction_id: number;
    date: string;
    type_id: number;
    location_id: number;
    unit_price: number;
    quantity: number;
    client_id: number;
    is_buy: boolean;
    is_personal: boolean;
    journal_ref_id: number;
}

export interface WalletJournal {
    id: number;
    date: string;
    ref_type: string;
    first_party_id?: number;
    second_party_id?: number;
    amount?: number;
    balance?: number;
    reason?: string;
    description: string;
    context_id?: number;
    context_id_type?: string;
}

// Skills Types
export interface CharacterSkill {
    skill_id: number;
    skillpoints_in_skill: number;
    trained_skill_level: number;
    active_skill_level: number;
}

export interface SkillQueue {
    skill_id: number;
    finished_level: number;
    queue_position: number;
    level_end_sp?: number;
    level_start_sp?: number;
    training_start_sp?: number;
    start_date?: string;
    finish_date?: string;
}

// Contract Types
export interface Contract {
    contract_id: number;
    issuer_id: number;
    issuer_corporation_id: number;
    assignee_id?: number;
    acceptor_id?: number;
    start_location_id?: number;
    end_location_id?: number;
    type: 'unknown' | 'item_exchange' | 'auction' | 'courier' | 'loan';
    status: 'outstanding' | 'in_progress' | 'finished_issuer' | 'finished_contractor' | 'finished' | 'cancelled' | 'rejected' | 'failed' | 'deleted' | 'reversed';
    title?: string;
    for_corporation: boolean;
    availability: 'public' | 'personal' | 'corporation' | 'alliance';
    date_issued: string;
    date_expired: string;
    date_accepted?: string;
    date_completed?: string;
    days_to_complete?: number;
    price?: number;
    reward?: number;
    collateral?: number;
    buyout?: number;
    volume?: number;
}

export interface ContractItem {
    record_id: number;
    type_id: number;
    quantity: number;
    raw_quantity?: number;
    is_singleton: boolean;
    is_blueprint_copy?: boolean;
    is_included: boolean;
}

export interface ContractBid {
    bid_id: number;
    bidder_id: number;
    date_bid: string;
    amount: number;
}

// Calendar Types
export interface CalendarEvent {
    event_id: number;
    event_date: string;
    title: string;
    importance: number;
    event_response: 'declined' | 'not_responded' | 'accepted' | 'tentative';
}

export interface CalendarEventDetail {
    event_id: number;
    date: string;
    title: string;
    text: string;
    owner_id: number;
    owner_name: string;
    owner_type: 'eve_server' | 'corporation' | 'faction' | 'character' | 'alliance';
    duration: number;
    importance: number;
    response: string;
}

export interface CalendarEventAttendee {
    character_id: number;
    event_response: 'declined' | 'not_responded' | 'accepted' | 'tentative';
}

// Clone Types
export interface CloneInfo {
    home_location?: {
        location_id: number;
        location_type: 'station' | 'structure';
    };
    jump_clones: {
        jump_clone_id: number;
        location_id: number;
        location_type: 'station' | 'structure';
        implants: number[];
        name?: string;
    }[];
    last_clone_jump_date?: string;
    last_station_change_date?: string;
}

// Contact Types
export interface Contact {
    contact_id: number;
    contact_type: 'character' | 'corporation' | 'alliance' | 'faction';
    standing: number;
    label_ids?: number[];
    is_watched?: boolean;
}

export interface ContactLabel {
    label_id: number;
    label_name: string;
}

// Corporation Sub-types
export interface CorporationAllianceHistory {
    alliance_id?: number;
    is_deleted?: boolean;
    record_id: number;
    start_date: string;
}

export interface CorporationMedal {
    medal_id: number;
    title: string;
    description: string;
    creator_id: number;
    date: string;
}

export interface CorporationMember {
    character_id: number;
}

export interface CorporationStarbase {
    starbase_id: number;
    type_id: number;
    system_id: number;
    state: 'offline' | 'online' | 'onlining' | 'reinforced' | 'unanchoring';
    moon_id?: number;
    onlined_since?: string;
    reinforced_until?: string;
    unanchor_at?: string;
}

// Dogma Types
export interface DogmaAttribute {
    attribute_id: number;
    name: string;
    description?: string;
    icon_id?: number;
    default_value?: number;
    published?: boolean;
    display_name?: string;
    unit_id?: number;
    stackable?: boolean;
    high_is_good?: boolean;
}

export interface DogmaEffect {
    effect_id: number;
    name: string;
    description?: string;
    icon_id?: number;
    display_name?: string;
    published?: boolean;
    effect_category?: number;
    is_assistance?: boolean;
    is_offensive?: boolean;
    is_warp_safe?: boolean;
    disallow_auto_repeat?: boolean;
}

export interface DogmaDynamicItem {
    created_by: number;
    dogma_attributes: { attribute_id: number; value: number }[];
    dogma_effects: { effect_id: number; is_default: boolean }[];
    mutator_type_id: number;
    source_type_id: number;
}

// Faction Warfare Types
export interface FactionWarfareStats {
    faction_id: number;
    pilots: number;
    systems_controlled: number;
    kills: { yesterday: number; last_week: number; total: number };
    victory_points: { yesterday: number; last_week: number; total: number };
}

export interface FactionWarfareCharacterStats {
    faction_id?: number;
    enlisted_on?: string;
    current_rank?: number;
    highest_rank?: number;
    kills: { yesterday: number; last_week: number; total: number };
    victory_points: { yesterday: number; last_week: number; total: number };
}

export interface FactionWarfareSystem {
    solar_system_id: number;
    owner_faction_id: number;
    occupier_faction_id: number;
    contested: 'captured' | 'contested' | 'uncontested' | 'vulnerable';
    victory_points: number;
    victory_points_threshold: number;
}

export interface FactionWarfareWar {
    aggressor_id: number;
    defender_id: number;
}

// Fitting Types
export interface Fitting {
    fitting_id: number;
    name: string;
    description: string;
    ship_type_id: number;
    items: {
        type_id: number;
        flag: number;
        quantity: number;
    }[];
}

// Fleet Types
export interface FleetInfo {
    fleet_id?: number;
    fleet_boss_id?: number;
    is_free_move: boolean;
    is_registered: boolean;
    is_voice_enabled: boolean;
    motd: string;
}

export interface FleetMember {
    character_id: number;
    ship_type_id: number;
    wing_id: number;
    squad_id: number;
    role: 'fleet_commander' | 'wing_commander' | 'squad_commander' | 'squad_member';
    role_name: string;
    join_time: string;
    takes_fleet_warp: boolean;
    solar_system_id: number;
    station_id?: number;
}

export interface FleetWing {
    id: number;
    name: string;
    squads: { id: number; name: string }[];
}

export interface CharacterFleetInfo {
    fleet_id: number;
    role: 'fleet_commander' | 'wing_commander' | 'squad_commander' | 'squad_member';
    squad_id: number;
    wing_id: number;
}

// Incursion Types
export interface Incursion {
    type: string;
    state: 'withdrawing' | 'mobilizing' | 'established';
    staging_solar_system_id: number;
    constellation_id: number;
    infested_solar_systems: number[];
    has_boss: boolean;
    faction_id: number;
    influence: number;
}

// Industry Types
export interface IndustryJob {
    job_id: number;
    installer_id: number;
    facility_id: number;
    station_id: number;
    activity_id: number;
    blueprint_id: number;
    blueprint_type_id: number;
    blueprint_location_id: number;
    output_location_id: number;
    runs: number;
    cost?: number;
    licensed_runs?: number;
    probability?: number;
    product_type_id?: number;
    status: 'active' | 'cancelled' | 'delivered' | 'paused' | 'ready' | 'reverted';
    duration: number;
    start_date: string;
    end_date: string;
    pause_date?: string;
    completed_date?: string;
    completed_character_id?: number;
    successful_runs?: number;
}

export interface MiningLedgerEntry {
    date: string;
    solar_system_id: number;
    type_id: number;
    quantity: number;
}

export interface IndustryFacility {
    facility_id: number;
    owner_id: number;
    region_id: number;
    solar_system_id: number;
    tax?: number;
    type_id: number;
}

export interface IndustrySystem {
    solar_system_id: number;
    cost_indices: {
        activity: string;
        cost_index: number;
    }[];
}

// Insurance Types
export interface InsurancePrice {
    type_id: number;
    levels: {
        cost: number;
        payout: number;
        name: string;
    }[];
}

// Killmail Types
export interface KillmailSummary {
    killmail_id: number;
    killmail_hash: string;
}

export interface Killmail {
    killmail_id: number;
    killmail_time: string;
    solar_system_id: number;
    moon_id?: number;
    war_id?: number;
    victim: {
        character_id?: number;
        corporation_id?: number;
        alliance_id?: number;
        faction_id?: number;
        ship_type_id: number;
        damage_taken: number;
        position?: { x: number; y: number; z: number };
        items?: any[];
    };
    attackers: {
        character_id?: number;
        corporation_id?: number;
        alliance_id?: number;
        faction_id?: number;
        ship_type_id?: number;
        weapon_type_id?: number;
        damage_done: number;
        final_blow: boolean;
        security_status: number;
    }[];
}

// Location Types
export interface CharacterLocation {
    solar_system_id: number;
    station_id?: number;
    structure_id?: number;
}

export interface CharacterOnline {
    online: boolean;
    last_login?: string;
    last_logout?: string;
    logins?: number;
}

export interface CharacterShip {
    ship_item_id: number;
    ship_name: string;
    ship_type_id: number;
}

// Loyalty Types
export interface LoyaltyPoints {
    corporation_id: number;
    loyalty_points: number;
}

export interface LoyaltyStoreOffer {
    offer_id: number;
    type_id: number;
    quantity: number;
    lp_cost: number;
    isk_cost: number;
    ak_cost?: number;
    required_items: {
        type_id: number;
        quantity: number;
    }[];
}

// PI Types
export interface PlanetaryColony {
    solar_system_id: number;
    planet_id: number;
    planet_type: 'temperate' | 'barren' | 'oceanic' | 'ice' | 'gas' | 'lava' | 'storm' | 'plasma';
    owner_id: number;
    last_update: string;
    upgrade_level: number;
    num_pins: number;
}

export interface CustomsOffice {
    office_id: number;
    system_id: number;
    reinforce_exit_start: number;
    reinforce_exit_end: number;
    alliance_tax_rate?: number;
    corporation_tax_rate?: number;
    standing_level?: string;
    terrible_standing_tax_rate?: number;
    bad_standing_tax_rate?: number;
    neutral_standing_tax_rate?: number;
    good_standing_tax_rate?: number;
    excellent_standing_tax_rate?: number;
}

// Sovereignty Types
export interface SovereigntyCampaign {
    campaign_id: number;
    structure_id: number;
    solar_system_id: number;
    constellation_id: number;
    event_type: 'tcu_defense' | 'ihub_defense' | 'station_defense' | 'station_freeport';
    start_time: string;
    defender_id?: number;
    defender_score?: number;
    attackers_score?: number;
    participants?: { alliance_id: number; score: number }[];
}

export interface SovereigntyMap {
    system_id: number;
    alliance_id?: number;
    corporation_id?: number;
    faction_id?: number;
}

export interface SovereigntyStructure {
    alliance_id: number;
    solar_system_id: number;
    structure_id: number;
    structure_type_id: number;
    vulnerability_occupancy_level?: number;
    vulnerable_start_time?: string;
    vulnerable_end_time?: string;
}

// Status Types
export interface ServerStatus {
    players: number;
    server_version: string;
    start_time: string;
    vip?: boolean;
}

// Universe Sub-types
export interface Ancestry {
    id: number;
    name: string;
    bloodline_id: number;
    description: string;
    short_description?: string;
    icon_id?: number;
}

export interface Bloodline {
    bloodline_id: number;
    name: string;
    description: string;
    race_id: number;
    corporation_id: number;
    ship_type_id: number;
    charisma: number;
    intelligence: number;
    memory: number;
    perception: number;
    willpower: number;
}

export interface Faction {
    faction_id: number;
    name: string;
    description: string;
    size_factor: number;
    station_count: number;
    station_system_count: number;
    is_unique: boolean;
    solar_system_id?: number;
    corporation_id?: number;
    militia_corporation_id?: number;
}

export interface Race {
    race_id: number;
    name: string;
    description: string;
    alliance_id: number;
}

export interface StationInfo {
    station_id: number;
    name: string;
    owner?: number;
    system_id: number;
    type_id: number;
    race_id?: number;
    reprocessing_efficiency: number;
    reprocessing_stations_take: number;
    max_dockable_ship_volume: number;
    office_rental_cost: number;
    services: string[];
    position: { x: number; y: number; z: number };
}

export interface TypeInfo {
    type_id: number;
    name: string;
    description: string;
    published: boolean;
    group_id: number;
    market_group_id?: number;
    radius?: number;
    volume?: number;
    capacity?: number;
    portion_size?: number;
    mass?: number;
    icon_id?: number;
    graphic_id?: number;
    dogma_attributes?: { attribute_id: number; value: number }[];
    dogma_effects?: { effect_id: number; is_default: boolean }[];
}

// War Types
export interface War {
    id: number;
    declared: string;
    started?: string;
    finished?: string;
    retracted?: string;
    mutual: boolean;
    open_for_allies: boolean;
    aggressor: { corporation_id?: number; alliance_id?: number; isk_destroyed: number; ships_killed: number };
    defender: { corporation_id?: number; alliance_id?: number; isk_destroyed: number; ships_killed: number };
    allies?: { corporation_id?: number; alliance_id?: number }[];
}

// Search Types
export interface SearchResult {
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

// Freelance Jobs Types
export interface EsiCursor {
    before: string | null;
    after: string | null;
}

export interface FreelanceJobSummary {
    id: string;
    name: string;
    state: string;
    last_modified: string;
    progress: {
        current: number;
        desired: number;
    };
    reward?: {
        initial: number;
        remaining: number;
    };
}

export interface FreelanceJobsListing {
    cursor: EsiCursor;
    freelance_jobs: FreelanceJobSummary[];
}

export interface FreelanceJobDetail {
    id: string;
    name: string;
    state: string;
    last_modified: string;
    progress: {
        current: number;
        desired: number;
    };
    reward?: {
        initial: number;
        remaining: number;
    };
    details: {
        description: string;
        career: string;
        created: string;
        expires: string;
        creator: {
            character: { id: number; name: string };
            corporation: { id: number; name: string };
        };
    };
    configuration: {
        version: number;
        parameters: Record<string, any>;
        method: string;
    };
    contribution: {
        max_committed_participants: number;
        reward_per_contribution: number;
        submission_multiplier: number;
    };
    access_and_visibility: {
        acl_protected: boolean;
        broadcast_locations: { id: number; name: string }[];
    };
}

// Character Sub-types
export interface AgentResearch {
    agent_id: number;
    skill_type_id: number;
    started_at: string;
    points_per_day: number;
    remainder_points: number;
}

export interface Blueprint {
    item_id: number;
    type_id: number;
    location_id: number;
    location_flag: string;
    quantity: number;
    time_efficiency: number;
    material_efficiency: number;
    runs: number;
}

export interface CorporationHistory {
    corporation_id: number;
    record_id: number;
    start_date: string;
    is_deleted?: boolean;
}

export interface JumpFatigue {
    jump_fatigue_expire_date?: string;
    last_jump_date?: string;
    last_update_date?: string;
}

export interface Medal {
    medal_id: number;
    title: string;
    description: string;
    date: string;
    issuer_id: number;
    corporation_id: number;
    reason: string;
    status: 'private' | 'public';
    graphics: { part: number; layer: number; graphic: string; color?: number }[];
}

export interface Notification {
    notification_id: number;
    type: string;
    sender_id: number;
    sender_type: 'character' | 'corporation' | 'alliance' | 'faction' | 'other';
    timestamp: string;
    text?: string;
    is_read?: boolean;
}

export interface Standing {
    from_id: number;
    from_type: 'agent' | 'npc_corp' | 'faction';
    standing: number;
}

export interface CharacterTitle {
    title_id: number;
    name: string;
}

export interface CharacterAffiliation {
    character_id: number;
    corporation_id: number;
    alliance_id?: number;
    faction_id?: number;
}

export interface CharacterRole {
    roles?: string[];
    roles_at_hq?: string[];
    roles_at_base?: string[];
    roles_at_other?: string[];
}
