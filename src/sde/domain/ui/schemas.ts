/**
 * SDE domain: icons, graphics, graphic material sets and translation languages.
 *
 * Zod schemas for the tables of this domain, next to the types in
 * ./types.ts they validate (split out of the former src/sde/schemas.ts,
 * Track S Run 12).
 */

import { z } from 'zod';

export const GraphicMaterialSetSchema = z.looseObject({
  materialSetId: z.number().int(),
  colorHull: z.unknown(),
  colorPrimary: z.unknown(),
  colorSecondary: z.unknown(),
  colorWindow: z.unknown(),
  description: z.string(),
  sofFactionName: z.string(),
  sofRaceHint: z.string(),
  material1: z.string().nullable(),
  material2: z.string().nullable(),
  material3: z.string().nullable(),
  material4: z.string().nullable(),
  custommaterial1: z.string().nullable(),
  custommaterial2: z.string().nullable(),
  sofPatternName: z.string().nullable(),
  resPathInsert: z.string().optional(),
});

export const GraphicSchema = z.looseObject({
  graphicId: z.number().int(),
  graphicFile: z.string(),
  iconFolder: z.string().nullable(),
  sofFactionName: z.string().nullable(),
  sofHullName: z.string().nullable(),
  sofRaceName: z.string().nullable(),
  sofLayout: z.array(z.string()).optional(),
  sofMaterialSetId: z.number().int().optional(),
});

export const IconSchema = z.looseObject({
  iconId: z.number().int(),
  iconFile: z.string(),
});

export const TranslationLanguageSchema = z.looseObject({
  translationLanguageId: z.string(),
  name: z.string(),
});
