import { batchFetch, batchPost } from '../../../src/core/BatchRequestHandler';
import { EsiError } from '../../../src/core/util/error';

describe('BatchRequestHandler', () => {
  describe('batchFetch', () => {
    it('should return empty maps for empty keys array', async () => {
      const result = await batchFetch([], () => Promise.resolve('unused'));
      expect(result.results.size).toBe(0);
      expect(result.errors.size).toBe(0);
    });

    it('should populate results map on success', async () => {
      const result = await batchFetch([1, 2, 3], (key) =>
        Promise.resolve(`value-${key}`),
      );
      expect(result.results.size).toBe(3);
      expect(result.results.get(1)).toBe('value-1');
      expect(result.results.get(2)).toBe('value-2');
      expect(result.results.get(3)).toBe('value-3');
      expect(result.errors.size).toBe(0);
    });

    it('should populate errors map on failure', async () => {
      const result = await batchFetch(['a'], () =>
        Promise.reject(new Error('fetch failed')),
      );
      expect(result.results.size).toBe(0);
      expect(result.errors.size).toBe(1);
      expect(result.errors.get('a')).toBeInstanceOf(Error);
      expect(result.errors.get('a')!.message).toBe('fetch failed');
    });

    it('should separate successes and failures in mixed results', async () => {
      const result = await batchFetch([1, 2, 3, 4], (key) => {
        if (key % 2 === 0) return Promise.reject(new Error(`fail-${key}`));
        return Promise.resolve(`ok-${key}`);
      });
      expect(result.results.size).toBe(2);
      expect(result.results.get(1)).toBe('ok-1');
      expect(result.results.get(3)).toBe('ok-3');
      expect(result.errors.size).toBe(2);
      expect(result.errors.has(2)).toBe(true);
      expect(result.errors.has(4)).toBe(true);
    });

    it('should respect concurrency limit', async () => {
      const running: number[] = [];
      let maxConcurrent = 0;

      const result = await batchFetch(
        [1, 2, 3, 4, 5],
        async (key) => {
          running.push(key);
          maxConcurrent = Math.max(maxConcurrent, running.length);
          await new Promise((r) => setTimeout(r, 10));
          running.splice(running.indexOf(key), 1);
          return key * 10;
        },
        { concurrency: 2 },
      );

      expect(maxConcurrent).toBeLessThanOrEqual(2);
      expect(result.results.size).toBe(5);
    });

    it('should invoke onProgress with correct counts', async () => {
      const progressCalls: [number, number][] = [];

      await batchFetch(['a', 'b', 'c'], (key) => Promise.resolve(key), {
        onProgress: (completed, total) => {
          progressCalls.push([completed, total]);
        },
      });

      expect(progressCalls).toHaveLength(3);
      expect(progressCalls.map(([, total]) => total)).toEqual([3, 3, 3]);
      const completedValues = progressCalls
        .map(([completed]) => completed)
        .sort();
      expect(completedValues).toEqual([1, 2, 3]);
    });

    it('should preserve EsiError instances in errors map', async () => {
      const esiError = new EsiError(
        404,
        'Not Found',
        'https://esi.evetech.net/v1/test',
      );

      const result = await batchFetch([1], () => Promise.reject(esiError));

      expect(result.errors.get(1)).toBeInstanceOf(EsiError);
      expect(result.errors.get(1)).toBe(esiError);
    });

    it('should wrap non-Error rejections as Error', async () => {
      const result = await batchFetch([1], () =>
        Promise.reject('string error'),
      );

      expect(result.errors.get(1)).toBeInstanceOf(Error);
      expect(result.errors.get(1)!.message).toBe('string error');
    });
  });

  describe('batchPost', () => {
    it('should return empty array for empty input', async () => {
      const poster = jest.fn();
      const result = await batchPost([], poster);
      expect(result).toEqual([]);
      expect(poster).not.toHaveBeenCalled();
    });

    it('should send one chunk when array is smaller than chunkSize', async () => {
      const poster = jest.fn().mockResolvedValue([{ id: 1, name: 'a' }]);

      const result = await batchPost([1], poster, 1000);

      expect(poster).toHaveBeenCalledTimes(1);
      expect(poster).toHaveBeenCalledWith([1]);
      expect(result).toEqual([{ id: 1, name: 'a' }]);
    });

    it('should send one chunk when array equals chunkSize', async () => {
      const ids = Array.from({ length: 100 }, (_, i) => i + 1);
      const poster = jest.fn().mockResolvedValue(ids.map((id) => ({ id })));

      await batchPost(ids, poster, 100);

      expect(poster).toHaveBeenCalledTimes(1);
      expect(poster).toHaveBeenCalledWith(ids);
    });

    it('should split into correct number of chunks', async () => {
      const ids = Array.from({ length: 2500 }, (_, i) => i + 1);
      const poster = jest
        .fn()
        .mockImplementation((chunk: number[]) =>
          Promise.resolve(chunk.map((id) => ({ id }))),
        );

      const result = await batchPost(ids, poster, 1000);

      expect(poster).toHaveBeenCalledTimes(3);
      expect(poster.mock.calls[0][0]).toHaveLength(1000);
      expect(poster.mock.calls[1][0]).toHaveLength(1000);
      expect(poster.mock.calls[2][0]).toHaveLength(500);
      expect(result).toHaveLength(2500);
    });

    it('should concatenate results in chunk order', async () => {
      const poster = jest
        .fn()
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }, { id: 4 }]);

      const result = await batchPost([1, 2, 3, 4], poster, 2);

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
    });
  });
});
