export interface AccessListEntry {
  entity_id: number;
  entity_type: 'character' | 'corporation' | 'alliance';
  access_type: 'allowed' | 'blocked';
}

export interface AccessList {
  access_list_id: number;
  name: string;
  entries: AccessListEntry[];
}
