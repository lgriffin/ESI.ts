export interface Contract {
  contract_id: number;
  issuer_id: number;
  issuer_corporation_id: number;
  assignee_id?: number;
  acceptor_id?: number;
  start_location_id?: number;
  end_location_id?: number;
  type: 'unknown' | 'item_exchange' | 'auction' | 'courier' | 'loan';
  status:
    | 'outstanding'
    | 'in_progress'
    | 'finished_issuer'
    | 'finished_contractor'
    | 'finished'
    | 'cancelled'
    | 'rejected'
    | 'failed'
    | 'deleted'
    | 'reversed';
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
