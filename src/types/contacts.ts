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
