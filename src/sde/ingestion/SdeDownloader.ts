import * as fs from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { SdeError } from '../errors';

import { SDE_DOWNLOAD_URL, SDE_LATEST_BUILD_URL } from './constants';

export interface SdeBuildInfo {
  buildNumber: string;
  releaseDate: string;
}

export interface SdeDownloadOptions {
  outputPath: string;
  onProgress?: ((downloaded: number, total: number) => void) | undefined;
  signal?: AbortSignal | undefined;
  /**
   * The most bytes the download may write before it is abandoned with an
   * SdeError. Defaults to 2 GiB. The export is
   * input from the network, and this bounds how much disk it can take.
   */
  maxBytes?: number | undefined;
}

/** The default download bound: 2 GiB, many times the size of the export. */
const SDE_MAX_DOWNLOAD_BYTES = 2 * 1024 ** 3;

export class SdeDownloader {
  async getLatestBuild(): Promise<SdeBuildInfo> {
    let response: Response;
    try {
      response = await fetch(SDE_LATEST_BUILD_URL);
    } catch (error) {
      throw new SdeError(
        `Failed to fetch latest SDE build info: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!response.ok) {
      throw new SdeError(
        `Failed to fetch latest SDE build info: HTTP ${response.status}`,
      );
    }

    let text: string;
    try {
      text = await response.text();
    } catch (error) {
      throw new SdeError(
        `Failed to read SDE build info response: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const lines = text.split('\n').filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      throw new SdeError('SDE build info response contained no data');
    }

    try {
      const lastLine = lines[lines.length - 1]!;
      const parsed = JSON.parse(lastLine);
      return {
        buildNumber: String(parsed.buildNumber),
        releaseDate: parsed.releaseDate ?? '',
      };
    } catch (error) {
      throw new SdeError(
        `Failed to parse SDE build info: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async download(options: SdeDownloadOptions): Promise<string> {
    const maxBytes = options.maxBytes ?? SDE_MAX_DOWNLOAD_BYTES;
    if (!Number.isFinite(maxBytes) || maxBytes < 0) {
      throw new SdeError(
        `Failed to download SDE: maxBytes must be a finite, non-negative number, not ${maxBytes}`,
      );
    }
    let response: Response;
    try {
      response = await fetch(SDE_DOWNLOAD_URL, {
        signal: options.signal ?? null,
      });
    } catch (error) {
      throw new SdeError(
        `Failed to download SDE: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!response.ok) {
      throw new SdeError(`Failed to download SDE: HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new SdeError('Failed to download SDE: response body is empty');
    }

    const totalBytes = Number(response.headers.get('content-length')) || 0;
    if (totalBytes > maxBytes) {
      throw new SdeError(
        `Failed to download SDE: the export is ${totalBytes} bytes, over the ${maxBytes}-byte limit`,
      );
    }
    let downloadedBytes = 0;

    const nodeStream = Readable.fromWeb(
      response.body as import('node:stream/web').ReadableStream,
    );

    const progressTracker = new Transform({
      transform(chunk, _encoding, callback) {
        downloadedBytes += chunk.length;
        if (downloadedBytes > maxBytes) {
          callback(
            new SdeError(
              `the download passed the ${maxBytes}-byte limit before it ended`,
            ),
          );
          return;
        }
        if (options.onProgress && totalBytes > 0) {
          options.onProgress(downloadedBytes, totalBytes);
        }
        callback(null, chunk);
      },
    });

    const writeStream = fs.createWriteStream(options.outputPath);

    try {
      await pipeline(nodeStream, progressTracker, writeStream);
    } catch (error) {
      fs.rmSync(options.outputPath, { force: true });
      throw new SdeError(
        `Failed to write SDE file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return options.outputPath;
  }
}
