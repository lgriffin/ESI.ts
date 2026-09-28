/**
 * SDE domain: icons, graphics, graphic material sets and translation languages.
 *
 * Types for the tables of this domain; the Zod schemas that validate them
 * are in ./schemas.ts (split out of the former src/sde/types.ts, Track S
 * Run 12).
 */

/** eve_graphic_material_sets [939 rows] */
export interface GraphicMaterialSet {
  materialSetId: number;
  colorHull: unknown;
  colorPrimary: unknown;
  colorSecondary: unknown;
  colorWindow: unknown;
  description: string;
  sofFactionName: string;
  sofRaceHint: string;
  material1: string | null;
  material2: string | null;
  material3: string | null;
  material4: string | null;
  custommaterial1: string | null;
  custommaterial2: string | null;
  sofPatternName: string | null;
}

/** eve_graphics [6069 rows] */
export interface Graphic {
  graphicId: number;
  graphicFile: string;
  iconFolder: string | null;
  sofFactionName: string | null;
  sofHullName: string | null;
  sofRaceName: string | null;
}

/** eve_icons [4658 rows] */
export interface Icon {
  iconId: number;
  iconFile: string;
}

/** eve_translation_languages [8 rows] — string PK */
export interface TranslationLanguage {
  translationLanguageId: string;
  name: string;
}
