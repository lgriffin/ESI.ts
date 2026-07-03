import { z } from 'zod';
import {
  AllianceInfoSchema,
  AllianceContactSchema,
  AllianceContactLabelSchema,
  AllianceIconSchema,
} from '../schemas/alliance';

export type AllianceInfo = z.infer<typeof AllianceInfoSchema>;
export type AllianceContact = z.infer<typeof AllianceContactSchema>;
export type AllianceContactLabel = z.infer<typeof AllianceContactLabelSchema>;
export type AllianceIcon = z.infer<typeof AllianceIconSchema>;
