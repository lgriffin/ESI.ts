export interface InsurancePrice {
  type_id: number;
  levels: {
    cost: number;
    payout: number;
    name: string;
  }[];
}
