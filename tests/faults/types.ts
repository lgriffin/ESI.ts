/**
 * The vocabulary of the fault catalogue: what a fault is, what a target is,
 * and the outcome a fault must assert.
 */
import type { HttpResponse } from '../bdd/support/transport';
import type { z } from 'zod';
import type { EsiClient } from '../../src/EsiClient';

/**
 * Where the behaviour a fault checks is specified. The self-test resolves
 * every reference against the file, so a renamed Rule or heading fails it.
 */
export type RuleRef =
  | {
      /** Feature file under tests/bdd/features, e.g. `core/0051-resilience.feature`. */
      feature: string;
      /** The Rule title exactly as written after `Rule: `. */
      rule: string;
    }
  | {
      /** Guide under guides/, e.g. `ERRORS.md`. */
      guide: string;
      /** A heading in that guide, without the leading `#`s. */
      section: string;
    };

/** The properties of a target that decide what a fault should do to it. */
export interface TargetTraits {
  readonly name: string;
  readonly method: 'GET' | 'POST';
  readonly requiresAuth: boolean;
  /** Offset pagination: the good exchange spans two pages via X-Pages. */
  readonly paginated: boolean;
  /** Cursor pagination: the good body carries before/after tokens. */
  readonly cursor: boolean;
  /** Retry budget of the fault client (attempts = retries + 1 for GET). */
  readonly retries: number;
  /** Request timeout of the fault client, in milliseconds. */
  readonly timeoutMs: number;
  /** Spec-aware freshness TTL for the endpoint, if it has one. */
  readonly specTtlMs: number | undefined;
}

/** A clean exchange for one call: what ESI sends and what the client returns. */
export interface Exchange {
  /** Responses in the order the client requests them (page 1 first). */
  readonly responses: readonly HttpResponse[];
  /** The value the call resolves with for these responses. */
  readonly result: unknown;
}

export interface Target extends TargetTraits {
  /** The ETag the good exchange's first response carries (GET only). */
  readonly etag: string | undefined;
  /** URL path (and query) of the first request, for failure messages. */
  readonly path: string;
  /** The endpoint's response schema. */
  readonly schema: z.ZodType;
  /** The good exchange. A fresh copy on every call. */
  good(): Exchange;
  /** The call under test, through `withMetadata()` so staleness is visible. */
  call(client: EsiClient): Promise<{ data: unknown; meta: { stale: boolean } }>;
}

/** The error a rejecting fault must produce. */
export type ExpectedError =
  | {
      readonly class: 'EsiError' | 'TimeoutError' | 'EsiValidationError';
      readonly statusCode: number;
      readonly message: RegExp;
    }
  | {
      /** A plain Error carrying a bracketed code, e.g. `[JSON_PARSE_ERROR]`. */
      readonly class: 'CodedError';
      readonly code: string;
      readonly message: RegExp;
    };

export type Settlement =
  | {
      /** The call resolves with this value (deep equality). */
      readonly resolves: unknown;
      /** `meta.stale` on the resolved value. */
      readonly stale: boolean;
    }
  | { readonly rejects: ExpectedError };

/**
 * The cache after the call, observed through the transport:
 * - `empty`: the next call sends no If-None-Match and fetches afresh.
 * - `holds-result`: the next call revalidates with the target's ETag and a
 *   304 returns the value this call resolved with (or, for a rejecting call
 *   after priming, the primed value).
 */
export type CacheState = 'empty' | 'holds-result';

export interface ExpectedLog {
  readonly level: 'warn' | 'error';
  readonly message: RegExp;
  /** Exactly this many warn/error entries match `message`. */
  readonly count: number;
}

export interface Outcome {
  readonly settlement: Settlement;
  /** HTTP requests the call sends, retries and pages included. */
  readonly requests: number;
  /**
   * How many of those requests carry If-None-Match. Checked only when set,
   * for a fault whose Rule says when the client may revalidate.
   */
  readonly conditionalRequests?: number;
  readonly cache: CacheState;
  /** Clock time from call to settlement (the clock is virtual). */
  readonly elapsedMs: { readonly min: number; readonly max: number };
  /**
   * Every warn/error log entry the call emits. Each entry must match one
   * expectation, and each expectation must match `count` entries. `[]` means
   * the call logs nothing at warn or above.
   */
  readonly logs: readonly ExpectedLog[];
}

export interface FaultContext {
  readonly target: Target;
  /** The good exchange for the target. */
  readonly good: Exchange;
}

export interface Fault {
  /** Stable kebab-case id, used in test names and known-gaps.json. */
  readonly id: string;
  /** What the network does, in one line. */
  readonly title: string;
  readonly rule: RuleRef;
  /** Targets this fault applies to. Default: all. */
  appliesTo?(target: TargetTraits): boolean;
  /**
   * Serve the good exchange first, then move the clock past the endpoint's
   * freshness TTL so the faulted call goes to the network with a cached entry
   * in place.
   */
  readonly prime?: boolean;
  /** The responses the faulted call is served, in order. */
  exchange(ctx: FaultContext): readonly HttpResponse[];
  /** What the client must do. */
  expected(ctx: FaultContext): Outcome;
}

/** An entry in known-gaps.json: a fault that exposes an unfixed bug. */
export interface KnownGap {
  readonly fault: string;
  readonly targets: readonly string[];
  readonly bead: string;
  readonly reason: string;
}
