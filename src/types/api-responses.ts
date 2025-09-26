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
