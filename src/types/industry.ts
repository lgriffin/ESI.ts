import { z } from 'zod';
import {
  IndustryJobSchema,
  CorporationIndustryJobSchema,
  MiningLedgerEntrySchema,
  IndustryFacilitySchema,
  IndustrySystemSchema,
  MoonExtractionTimerSchema,
  MiningObserverSchema,
  MiningObserverEntrySchema,
} from '../schemas/industry';

export type IndustryJob = z.infer<typeof IndustryJobSchema>;
export type CorporationIndustryJob = z.infer<
  typeof CorporationIndustryJobSchema
>;
export type MiningLedgerEntry = z.infer<typeof MiningLedgerEntrySchema>;
export type IndustryFacility = z.infer<typeof IndustryFacilitySchema>;
export type IndustrySystem = z.infer<typeof IndustrySystemSchema>;
export type MoonExtractionTimer = z.infer<typeof MoonExtractionTimerSchema>;
export type MiningObserver = z.infer<typeof MiningObserverSchema>;
export type MiningObserverEntry = z.infer<typeof MiningObserverEntrySchema>;
