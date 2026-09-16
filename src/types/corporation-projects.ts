import { z } from 'zod';
import {
  CorporationProjectCursorSchema,
  CorporationProjectSummarySchema,
  CorporationProjectsListingSchema,
  CorporationProjectSchema,
  CorporationProjectContributionSchema,
  CorporationProjectContributorSchema,
  CorporationProjectContributorsListingSchema,
} from '../schemas/corporation-projects';

export type CorporationProjectCursor = z.infer<
  typeof CorporationProjectCursorSchema
>;
export type CorporationProjectSummary = z.infer<
  typeof CorporationProjectSummarySchema
>;
export type CorporationProjectsListing = z.infer<
  typeof CorporationProjectsListingSchema
>;
export type CorporationProject = z.infer<typeof CorporationProjectSchema>;
export type CorporationProjectContribution = z.infer<
  typeof CorporationProjectContributionSchema
>;
export type CorporationProjectContributor = z.infer<
  typeof CorporationProjectContributorSchema
>;
export type CorporationProjectContributorsListing = z.infer<
  typeof CorporationProjectContributorsListingSchema
>;
