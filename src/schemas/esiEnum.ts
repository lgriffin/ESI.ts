import { z } from 'zod';

export function esiEnum<const T extends readonly [string, ...string[]]>(
  values: T,
): z.ZodType<T[number] | (string & {})> {
  return z.union([
    z.enum(values as unknown as [string, ...string[]]),
    z.string(),
  ]);
}
