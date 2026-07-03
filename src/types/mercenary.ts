import { z } from 'zod';
import {
  MercenaryDenSchema,
  MercenaryTacticalOperationSchema,
} from '../schemas/mercenary';

export type MercenaryDen = z.infer<typeof MercenaryDenSchema>;
export type MercenaryTacticalOperation = z.infer<
  typeof MercenaryTacticalOperationSchema
>;
