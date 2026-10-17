import { z } from 'zod';
import {
  ParagonHubSkinrListingSchema,
  ParagonHubCharacterListingSchema,
  ParagonHubSkinrResponseSchema,
  ParagonHubCharacterSkinrResponseSchema,
  ParagonHubCursorSchema,
} from '../schemas/paragon-hub';

export type ParagonHubSkinrListing = z.infer<
  typeof ParagonHubSkinrListingSchema
>;
export type ParagonHubCharacterListing = z.infer<
  typeof ParagonHubCharacterListingSchema
>;
export type ParagonHubSkinrResponse = z.infer<
  typeof ParagonHubSkinrResponseSchema
>;
export type ParagonHubCharacterSkinrResponse = z.infer<
  typeof ParagonHubCharacterSkinrResponseSchema
>;
export type ParagonHubCursor = z.infer<typeof ParagonHubCursorSchema>;
