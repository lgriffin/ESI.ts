export interface Fitting {
  fitting_id: number;
  name: string;
  description: string;
  ship_type_id: number;
  items: {
    type_id: number;
    flag: number;
    quantity: number;
  }[];
}
