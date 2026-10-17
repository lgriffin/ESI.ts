import { z } from 'zod';
import {
  MercenaryDenSchema,
  MercenaryDensResponseSchema,
  MercenaryTacticalOperationSchema,
  MercenaryTacticalOperationsResponseSchema,
  MercenaryDenDetailSchema,
  MercenaryTacticalOperationDetailSchema,
} from '../schemas/mercenary';

export type MercenaryDen = z.infer<typeof MercenaryDenSchema>;
export type MercenaryTacticalOperation = z.infer<
  typeof MercenaryTacticalOperationSchema
>;
export type MercenaryDensResponse = z.infer<typeof MercenaryDensResponseSchema>;
export type MercenaryTacticalOperationsResponse = z.infer<
  typeof MercenaryTacticalOperationsResponseSchema
>;
export type MercenaryDenDetail = z.infer<typeof MercenaryDenDetailSchema>;
export type MercenaryTacticalOperationDetail = z.infer<
  typeof MercenaryTacticalOperationDetailSchema
>;
