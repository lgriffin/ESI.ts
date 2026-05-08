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
