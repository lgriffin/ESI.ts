import { z } from 'zod';
import {
  ContractSchema,
  PublicContractSchema,
  ContractItemSchema,
  PublicContractItemSchema,
  ContractBidSchema,
  PublicContractBidSchema,
} from '../schemas/contracts';

export type Contract = z.infer<typeof ContractSchema>;
export type PublicContract = z.infer<typeof PublicContractSchema>;
export type ContractItem = z.infer<typeof ContractItemSchema>;
export type PublicContractItem = z.infer<typeof PublicContractItemSchema>;
export type ContractBid = z.infer<typeof ContractBidSchema>;
export type PublicContractBid = z.infer<typeof PublicContractBidSchema>;
