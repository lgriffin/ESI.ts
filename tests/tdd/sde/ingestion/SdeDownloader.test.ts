import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { SdeDownloader } from '../../../../src/sde/ingestion/SdeDownloader';
import { SdeError } from '../../../../src/sde/errors';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetch(impl: typeof fetch): void {
  global.fetch = jest.fn(impl) as typeof fetch;
}

describe('SdeDownloader', () => {
  const downloader = new SdeDownloader();

  describe('getLatestBuild', () => {
    it('should parse build info from JSONL response', async () => {
      mockFetch(
        async () =>
          new Response(
            '{"buildNumber":"2025-09-15.1","releaseDate":"2025-09-15"}\n',
            { status: 200 },
          ),
      );

      const info = await downloader.getLatestBuild();
      expect(info.buildNumber).toBe('2025-09-15.1');
      expect(info.releaseDate).toBe('2025-09-15');
    });

    it('should use the last non-empty line from JSONL', async () => {
      mockFetch(
        async () =>
          new Response(
            '{"buildNumber":"old"}\n{"buildNumber":"2025-09-15.1","releaseDate":"2025-09-15"}\n\n',
            { status: 200 },
          ),
      );

      const info = await downloader.getLatestBuild();
      expect(info.buildNumber).toBe('2025-09-15.1');
    });

    it('should handle missing releaseDate', async () => {
      mockFetch(
        async () => new Response('{"buildNumber":"42"}\n', { status: 200 }),
      );

      const info = await downloader.getLatestBuild();
      expect(info.buildNumber).toBe('42');
      expect(info.releaseDate).toBe('');
    });

    it('should throw SdeError on HTTP error', async () => {
      mockFetch(async () => new Response('', { status: 500 }));

      await expect(downloader.getLatestBuild()).rejects.toThrow(SdeError);
      await expect(downloader.getLatestBuild()).rejects.toThrow('HTTP 500');
    });

    it('should throw SdeError on network failure', async () => {
      mockFetch(async () => {
        throw new Error('ECONNREFUSED');
      });

      await expect(downloader.getLatestBuild()).rejects.toThrow(SdeError);
      await expect(downloader.getLatestBuild()).rejects.toThrow('ECONNREFUSED');
    });

    it('should throw SdeError on empty response', async () => {
      mockFetch(async () => new Response('', { status: 200 }));

      await expect(downloader.getLatestBuild()).rejects.toThrow(SdeError);
      await expect(downloader.getLatestBuild()).rejects.toThrow(
        'contained no data',
      );
    });

    it('should throw SdeError on invalid JSON', async () => {
      mockFetch(async () => new Response('not valid json\n', { status: 200 }));

      await expect(downloader.getLatestBuild()).rejects.toThrow(SdeError);
      await expect(downloader.getLatestBuild()).rejects.toThrow('parse');
    });

    it('should throw SdeError when response.text() fails', async () => {
      mockFetch(async () => {
        const response = new Response('ok', { status: 200 });
        jest.spyOn(response, 'text').mockRejectedValue(new Error('read error'));
        return response;
      });

      await expect(downloader.getLatestBuild()).rejects.toThrow(SdeError);
      await expect(downloader.getLatestBuild()).rejects.toThrow('read error');
    });
  });

  describe('download', () => {
    it('should throw SdeError on HTTP error', async () => {
      mockFetch(async () => new Response('', { status: 404 }));

      await expect(
        downloader.download({ outputPath: '/tmp/sde.zip' }),
      ).rejects.toThrow(SdeError);
    });

    it('should throw SdeError on network failure', async () => {
      mockFetch(async () => {
        throw new TypeError('fetch failed');
      });

      await expect(
        downloader.download({ outputPath: '/tmp/sde.zip' }),
      ).rejects.toThrow(SdeError);
    });

    it('should throw SdeError when response body is null', async () => {
      mockFetch(async () => {
        const r = new Response(null, { status: 200 });
        Object.defineProperty(r, 'body', { value: null });
        return r;
      });

      await expect(
        downloader.download({ outputPath: '/tmp/sde.zip' }),
      ).rejects.toThrow(SdeError);
      await expect(
        downloader.download({ outputPath: '/tmp/sde.zip' }),
      ).rejects.toThrow('empty');
    });

    it('should write data to outputPath and call onProgress', async () => {
      const zipContent = Buffer.from('PK\x03\x04fakecontent');
      const totalBytes = zipContent.length;

      mockFetch(async () => {
        return new Response(zipContent, {
          status: 200,
          headers: { 'content-length': String(totalBytes) },
        });
      });

      const outputPath = path.join(
        os.tmpdir(),
        `sde-dl-test-${Date.now()}.zip`,
      );
      const progressCalls: Array<[number, number]> = [];

      try {
        const result = await downloader.download({
          outputPath,
          onProgress: (downloaded, total) => {
            progressCalls.push([downloaded, total]);
          },
        });

        expect(result).toBe(outputPath);
        expect(fs.existsSync(outputPath)).toBe(true);
        const written = fs.readFileSync(outputPath);
        expect(written).toEqual(zipContent);
        expect(progressCalls.length).toBeGreaterThan(0);
        const lastCall = progressCalls[progressCalls.length - 1]!;
        expect(lastCall[0]).toBe(totalBytes);
        expect(lastCall[1]).toBe(totalBytes);
      } finally {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }
    });

    it('should throw SdeError when pipeline fails', async () => {
      const zipContent = Buffer.from('PK\x03\x04fakecontent');

      mockFetch(async () => {
        return new Response(zipContent, {
          status: 200,
          headers: { 'content-length': String(zipContent.length) },
        });
      });

      await expect(
        downloader.download({
          outputPath: '/nonexistent/path/that/does/not/exist/sde.zip',
        }),
      ).rejects.toThrow(SdeError);
    });
  });
});
