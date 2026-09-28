/**
 * The schema for the SDE build metadata (`SdeVersionInfo` in ../../version.ts).
 */
import { z } from 'zod';

export const SdeVersionSchema = z.looseObject({
  version: z.string(),
  buildDate: z.string(),
  importedAt: z.string(),
  checksum: z.string().optional(),
});
