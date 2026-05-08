export interface War {
  id: number;
  declared: string;
  started?: string;
  finished?: string;
  retracted?: string;
  mutual: boolean;
  open_for_allies: boolean;
  aggressor: {
    corporation_id?: number;
    alliance_id?: number;
    isk_destroyed: number;
    ships_killed: number;
  };
  defender: {
    corporation_id?: number;
    alliance_id?: number;
    isk_destroyed: number;
    ships_killed: number;
  };
  allies?: { corporation_id?: number; alliance_id?: number }[];
}
