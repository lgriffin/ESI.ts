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

export interface FactionWarfareLeaderboard {
  kills: {
    yesterday: { amount: number; id?: number }[];
    last_week: { amount: number; id?: number }[];
    active_total: { amount: number; id?: number }[];
  };
  victory_points: {
    yesterday: { amount: number; id?: number }[];
    last_week: { amount: number; id?: number }[];
    active_total: { amount: number; id?: number }[];
  };
}

export interface FactionWarfareCorporationStats {
  faction_id?: number;
  enlisted_on?: string;
  pilots?: number;
  kills: { yesterday: number; last_week: number; total: number };
  victory_points: { yesterday: number; last_week: number; total: number };
}
