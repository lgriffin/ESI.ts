import { setFlagsFromString } from 'v8';
import { runInNewContext } from 'vm';
import {
  analyseSoak,
  linearFit,
  renderSoakMarkdown,
} from '../../../scripts/soak-core';
import {
  SoakRun,
  SoakSample,
  leakyInterceptor,
  runSoak,
} from '../../../tests/benchmark/soak';

const MiB = 1024 * 1024;

/** A run whose samples come from `heapAt(requests)`, clean in every other way. */
function syntheticRun(
  heapAt: (requests: number, index: number) => number,
  overrides: Partial<SoakRun> = {},
  sample: Partial<SoakSample> = {},
  step = 2000,
): SoakRun {
  const samples = Array.from({ length: 50 }, (_, i) => {
    const requests = (i + 1) * step;
    return {
      requests,
      heapUsed: heapAt(requests, i),
      cacheEntries: 500,
      timers: 1,
      ...sample,
    };
  });
  return {
    options: {
      requests: 100_000,
      distinctKeys: 100_000,
      cacheMaxEntries: 500,
      concurrency: 16,
      samples: 50,
    },
    samples,
    timersBefore: 0,
    timersAfterShutdown: 0,
    listenersBefore: 8,
    listenersAfterShutdown: 8,
    unexpectedErrors: [],
    durationMs: 4000,
    ...overrides,
  };
}

/** Deterministic GC-sawtooth noise of about ±300 KiB. */
const noise = (i: number) => Math.sin(i * 1.7) * 300 * 1024;

describe('heap soak analysis', () => {
  it('fits a straight line exactly', () => {
    const fit = linearFit([0, 1, 2, 3], [10, 12, 14, 16]);
    expect(fit.slope).toBeCloseTo(2, 12);
    expect(fit.intercept).toBeCloseTo(10, 12);
    expect(fit.r2).toBeCloseTo(1, 12);
  });

  it('passes a flat heap with collection noise', () => {
    const verdict = analyseSoak(syntheticRun((_, i) => 42 * MiB + noise(i)));
    expect(verdict.findings).toEqual([]);
    expect(verdict.passed).toBe(true);
  });

  it('passes growth confined to warm-up in the first half', () => {
    const verdict = analyseSoak(
      syntheticRun(
        (requests, i) => Math.min(requests, 40_000) * 100 + 42 * MiB + noise(i),
      ),
    );
    expect(verdict.passed).toBe(true);
  });

  it('flags steady growth of 60 bytes per request', () => {
    const verdict = analyseSoak(
      syntheticRun((requests, i) => 42 * MiB + requests * 60 + noise(i)),
    );
    expect(verdict.passed).toBe(false);
    expect(verdict.findings[0]).toMatch(/^Heap grew/);
    expect(verdict.bytesPerThousandRequests).toBeGreaterThan(50_000);
  });

  it('does not flag a slope whose total growth stays under the floor', () => {
    // 30 bytes per request is above the rate limit, but a 10 000-request run
    // grows only ~150 KiB over its second half.
    const verdict = analyseSoak(
      syntheticRun((requests) => 42 * MiB + requests * 30, {}, {}, 200),
    );
    expect(verdict.bytesPerThousandRequests).toBeCloseTo(30_000, 6);
    expect(verdict.projectedGrowthBytes).toBeLessThan(2 * MiB);
    expect(verdict.passed).toBe(true);
  });

  it('flags a cache above its bound', () => {
    const verdict = analyseSoak(
      syntheticRun(() => 42 * MiB, {}, { cacheEntries: 501 }),
    );
    expect(verdict.findings).toEqual([
      'The cache held 501 entries, above its bound of 500.',
    ]);
  });

  it('flags timers that accumulate during the run', () => {
    const run = syntheticRun(() => 42 * MiB);
    run.samples = run.samples.map((s, i) => ({ ...s, timers: 1 + i }));
    expect(analyseSoak(run).findings[0]).toMatch(/Active timers drifted/);
  });

  it('flags timers and listeners left after shutdown', () => {
    const verdict = analyseSoak(
      syntheticRun(() => 42 * MiB, {
        timersAfterShutdown: 1,
        listenersAfterShutdown: 9,
      }),
    );
    expect(verdict.findings).toEqual([
      '1 timer(s) still active after shutdown.',
      '1 process listener(s) left after shutdown.',
    ]);
  });

  it('fails closed on too few samples and on unexpected request failures', () => {
    const run = syntheticRun(() => 42 * MiB, {
      unexpectedErrors: ['EsiError: Internal Server Error'],
    });
    run.samples = run.samples.slice(0, 3);
    const verdict = analyseSoak(run);
    expect(verdict.passed).toBe(false);
    expect(verdict.findings).toHaveLength(2);
    expect(renderSoakMarkdown(run, verdict)).toContain('**Failed.**');
  });
});

describe('heap soak against the real pipeline', () => {
  // Jest does not start workers with --expose-gc; V8 exposes it on request.
  setFlagsFromString('--expose-gc');
  const gc = runInNewContext('gc') as () => void;
  // A few seconds under coverage on a loaded machine; the default 5 s is tight.
  const TIMEOUT_MS = 60_000;

  it(
    'flags a client carrying a response interceptor that retains every response',
    async () => {
      const run = await runSoak({
        requests: 12_000,
        distinctKeys: 12_000,
        cacheMaxEntries: 200,
        concurrency: 16,
        samples: 20,
        gc,
        responseInterceptors: [leakyInterceptor()],
      });
      const verdict = analyseSoak(run);

      expect(run.unexpectedErrors).toEqual([]);
      expect(verdict.maxCacheEntries).toBeLessThanOrEqual(200);
      expect(verdict.passed).toBe(false);
      expect(verdict.findings).toHaveLength(1);
      expect(verdict.findings[0]).toMatch(/^Heap grew/);
    },
    TIMEOUT_MS,
  );

  it(
    'passes the same run without the leak, with the cache at its bound and no timers left',
    async () => {
      const run = await runSoak({
        requests: 12_000,
        distinctKeys: 12_000,
        cacheMaxEntries: 200,
        concurrency: 16,
        samples: 20,
        gc,
      });
      const verdict = analyseSoak(run);
      const heap = verdict.findings.filter((f) => f.startsWith('Heap grew'));

      expect(
        verdict.findings.filter((f) => !f.startsWith('Heap grew')),
      ).toEqual([]);
      expect(verdict.maxCacheEntries).toBe(200);
      expect(run.timersAfterShutdown).toBeLessThanOrEqual(run.timersBefore);
      expect(run.listenersAfterShutdown).toBeLessThanOrEqual(
        run.listenersBefore,
      );
      // On Node 18 this run grows about 400 bytes per request whatever the
      // client does: its bundled undici retains something per `Response`, and
      // the same code is flat on 20 and 22. The gate that matters runs on
      // Node 20 (nightly-benchmarks.yml), so the heap finding is only
      // asserted where the platform can hold it.
      if (Number(process.versions.node.split('.')[0]) >= 20) {
        expect(heap).toEqual([]);
      }
    },
    TIMEOUT_MS,
  );
});
