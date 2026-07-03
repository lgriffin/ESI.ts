import { z } from 'zod';
import {
  ContractSchema,
  ContractItemSchema,
  ContractBidSchema,
} from '../schemas/contracts';

export type Contract = z.infer<typeof ContractSchema>;
export type ContractItem = z.infer<typeof ContractItemSchema>;
export type ContractBid = z.infer<typeof ContractBidSchema>;
