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
