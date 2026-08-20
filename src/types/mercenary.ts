import { z } from 'zod';
import {
  MercenaryDenSchema,
  MercenaryTacticalOperationSchema,
  MercenaryDenDetailSchema,
  MercenaryTacticalOperationDetailSchema,
} from '../schemas/mercenary';

export type MercenaryDen = z.infer<typeof MercenaryDenSchema>;
export type MercenaryTacticalOperation = z.infer<
  typeof MercenaryTacticalOperationSchema
>;
export type MercenaryDenDetail = z.infer<typeof MercenaryDenDetailSchema>;
export type MercenaryTacticalOperationDetail = z.infer<
  typeof MercenaryTacticalOperationDetailSchema
>;
