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
