/**
 * SDE domain: market groups and accounting entry types.
 *
 * Types for the tables of this domain; the Zod schemas that validate them
 * are in ./schemas.ts (split out of the former src/sde/types.ts, Track S
 * Run 12).
 */

/** eve_accounting_entry_types [177 rows] */
export interface AccountingEntryType {
  accountingEntryTypeId: number;
  internalName: string;
  name: string;
  journalMessage: string | null;
  description: string | null;
}

/** eve_market_groups [2106 rows] */
export interface MarketGroup {
  marketGroupId: number;
  description: string;
  hasTypes: boolean;
  iconId: number;
  name: string;
  parentGroupId: number | null;
}
