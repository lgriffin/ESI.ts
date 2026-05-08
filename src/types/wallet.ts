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
