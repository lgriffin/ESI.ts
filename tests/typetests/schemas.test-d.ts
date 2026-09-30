/**
 * Type tests for the `./schemas` entry point: the fields a response always
 * carries stay required in each schema's shape and in the type it infers, so
 * a declaration that quietly makes one optional fails here (and the type
 * mutation ratchet, `npm run test:type-mutation`, sees the mutant killed).
 */
import { expectType } from 'tsd';
import type { z } from 'zod';

import {
  CharacterAssetSchema,
  ConstellationInfoSchema,
  CorporationMarketOrderSchema,
  FittingCreatedSchema,
  LoyaltyPointsSchema,
  MoonExtractionTimerSchema,
  NotificationSchema,
  OrbitalSkyhookSchema,
  PublicContractBidSchema,
} from '../../src/schemas';

// Each schema's shape keeps the field required.
expectType<z.ZodNumber>(MoonExtractionTimerSchema.shape.moon_id);
expectType<z.ZodNumber>(LoyaltyPointsSchema.shape.loyalty_points);
expectType<z.ZodNumber>(LoyaltyPointsSchema.shape.corporation_id);
expectType<z.ZodNumber>(FittingCreatedSchema.shape.fitting_id);
expectType<z.ZodBoolean>(CharacterAssetSchema.shape.is_singleton);
expectType<z.ZodNumber>(ConstellationInfoSchema.shape.region_id);
expectType<z.ZodNumber>(OrbitalSkyhookSchema.shape.system_id);
expectType<z.ZodNumber>(OrbitalSkyhookSchema.shape.corporation_id);
expectType<z.ZodNumber>(CorporationMarketOrderSchema.shape.volume_total);
expectType<z.ZodString>(PublicContractBidSchema.shape.date_bid);
expectType<z.ZodNumber>(NotificationSchema.shape.notification_id);

// And the parsed value types it.
declare const timer: z.infer<typeof MoonExtractionTimerSchema>;
expectType<number>(timer.moon_id);
declare const points: z.infer<typeof LoyaltyPointsSchema>;
expectType<number>(points.loyalty_points);
declare const skyhook: z.infer<typeof OrbitalSkyhookSchema>;
expectType<number>(skyhook.system_id);
declare const bid: z.infer<typeof PublicContractBidSchema>;
expectType<string>(bid.date_bid);
