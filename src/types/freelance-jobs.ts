import { z } from 'zod';
import {
  EsiCursorSchema,
  FreelanceJobSummarySchema,
  FreelanceJobsListingSchema,
  FreelanceJobDetailSchema,
  CharacterFreelanceJobsListingSchema,
  FreelanceJobParticipationSchema,
  CorporationFreelanceJobsListingSchema,
  FreelanceJobParticipantSchema,
} from '../schemas/freelance-jobs';

export type EsiCursor = z.infer<typeof EsiCursorSchema>;
export type FreelanceJobSummary = z.infer<typeof FreelanceJobSummarySchema>;
export type FreelanceJobsListing = z.infer<typeof FreelanceJobsListingSchema>;
export type FreelanceJobDetail = z.infer<typeof FreelanceJobDetailSchema>;
export type CharacterFreelanceJobsListing = z.infer<
  typeof CharacterFreelanceJobsListingSchema
>;
export type FreelanceJobParticipation = z.infer<
  typeof FreelanceJobParticipationSchema
>;
export type CorporationFreelanceJobsListing = z.infer<
  typeof CorporationFreelanceJobsListingSchema
>;
export type FreelanceJobParticipant = z.infer<
  typeof FreelanceJobParticipantSchema
>;
