import { z } from 'zod';
import {
  CorporationProjectSchema,
  CorporationProjectContributionSchema,
  CorporationProjectContributorSchema,
} from '../schemas/corporation-projects';

export type CorporationProject = z.infer<typeof CorporationProjectSchema>;
export type CorporationProjectContribution = z.infer<
  typeof CorporationProjectContributionSchema
>;
export type CorporationProjectContributor = z.infer<
  typeof CorporationProjectContributorSchema
>;
