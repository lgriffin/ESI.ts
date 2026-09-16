import { z } from 'zod';
import {
  ContractSchema,
  PublicContractSchema,
  ContractItemSchema,
  ContractBidSchema,
} from '../schemas/contracts';

export type Contract = z.infer<typeof ContractSchema>;
export type PublicContract = z.infer<typeof PublicContractSchema>;
export type ContractItem = z.infer<typeof ContractItemSchema>;
export type ContractBid = z.infer<typeof ContractBidSchema>;
