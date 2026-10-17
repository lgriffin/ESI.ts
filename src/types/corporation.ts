import { z } from 'zod';
import {
  CorporationInfoSchema,
  CorporationAllianceHistorySchema,
  CorporationMedalSchema,
  CorporationStarbaseSchema,
  CorporationDivisionsSchema,
  CorporationFacilitySchema,
  CorporationIssuedMedalSchema,
  CorporationMemberTitleSchema,
  CorporationMemberTrackingSchema,
  CorporationMemberRoleSchema,
  CorporationRoleHistorySchema,
  CorporationShareholderSchema,
  CorporationStarbaseDetailSchema,
  CorporationStructureSchema,
  CorporationTitleSchema,
  ContainerLogSchema,
} from '../schemas/corporation';

export type CorporationInfo = z.infer<typeof CorporationInfoSchema>;
export type CorporationAllianceHistory = z.infer<
  typeof CorporationAllianceHistorySchema
>;
export type CorporationMedal = z.infer<typeof CorporationMedalSchema>;
export type CorporationStarbase = z.infer<typeof CorporationStarbaseSchema>;
export type CorporationDivisions = z.infer<typeof CorporationDivisionsSchema>;
export type CorporationFacility = z.infer<typeof CorporationFacilitySchema>;
export type CorporationIssuedMedal = z.infer<
  typeof CorporationIssuedMedalSchema
>;
export type CorporationMemberTitle = z.infer<
  typeof CorporationMemberTitleSchema
>;
export type CorporationMemberTracking = z.infer<
  typeof CorporationMemberTrackingSchema
>;
export type CorporationMemberRole = z.infer<typeof CorporationMemberRoleSchema>;
export type CorporationRoleHistory = z.infer<
  typeof CorporationRoleHistorySchema
>;
export type CorporationShareholder = z.infer<
  typeof CorporationShareholderSchema
>;
export type CorporationStarbaseDetail = z.infer<
  typeof CorporationStarbaseDetailSchema
>;
export type CorporationStructure = z.infer<typeof CorporationStructureSchema>;
export type CorporationTitle = z.infer<typeof CorporationTitleSchema>;
export type ContainerLog = z.infer<typeof ContainerLogSchema>;
