import { EsiError } from '../../../../src/core/util/error';

export function expectEsiErrorWithCode(
  error: unknown,
  statusCode: number,
): void {
  expect(error).toBeInstanceOf(EsiError);
  expect((error as EsiError).statusCode).toBe(statusCode);
}

export async function catchError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (e) {
    return e;
  }
}
