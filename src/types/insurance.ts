import { z } from 'zod';
import { InsurancePriceSchema } from '../schemas/insurance';

export type InsurancePrice = z.infer<typeof InsurancePriceSchema>;
