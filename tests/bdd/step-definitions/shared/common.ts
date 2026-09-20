import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

export { EsiClient, EsiError, TestDataFactory };

export function expectEsiError(fn: () => Promise<any>): Promise<void> {
  return expect(fn()).rejects.toThrow(EsiError);
}
