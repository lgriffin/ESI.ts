import { expectType, expectAssignable } from 'tsd';
import type {
  EsiResult,
  EsiResponse,
  EsiResponseMeta,
  EsiError,
} from '../../src';

// --- EsiResult discriminated union ---

declare const result: EsiResult<{ players: number }>;

if (result.ok) {
  expectType<true>(result.ok);
  expectType<{ players: number }>(result.data);
  expectType<EsiResponseMeta>(result.meta);
}

if (!result.ok) {
  expectType<false>(result.ok);
  expectType<EsiError>(result.error);
  expectAssignable<EsiResponseMeta | undefined>(result.meta);
}

// EsiResult success branch is assignable to EsiResponse shape
declare const success: Extract<EsiResult<string>, { ok: true }>;
expectType<string>(success.data);
expectType<EsiResponseMeta>(success.meta);
