import AdmZip from 'adm-zip';
import * as yaml from 'js-yaml';
import { SDE_METADATA_FILENAME } from './constants';
import { SdeError } from '../errors';

export interface SdeMetadata {
  buildNumber: string;
  releaseDate: string;
}

export interface ParsedSdeFile {
  filename: string;
  records: Map<string | number, Record<string, unknown>>;
}

function findEntry(
  zip: AdmZip,
  filename: string,
): AdmZip.IZipEntry | undefined {
  const basename = filename.replace(/^.*[\\/]/, '');
  return zip.getEntries().find((entry) => {
    if (entry.isDirectory) return false;
    const entryBasename = entry.entryName.replace(/^.*[\\/]/, '');
    return (
      entryBasename === basename ||
      entry.entryName === filename ||
      entry.entryName === `sde/${filename}`
    );
  });
}

function readEntryAsString(entry: AdmZip.IZipEntry): string {
  const buffer = entry.getData();
  return buffer.toString('utf-8');
}

export class SdeExtractor {
  readMetadata(zipPath: string): SdeMetadata {
    const zip = new AdmZip(zipPath);
    const entry = findEntry(zip, SDE_METADATA_FILENAME);

    if (!entry) {
      throw new SdeError(
        `Metadata file '${SDE_METADATA_FILENAME}' not found in archive: ${zipPath}`,
      );
    }

    const content = readEntryAsString(entry);
    const parsed = yaml.load(content) as Record<string, unknown>;

    const bn = parsed.buildNumber;
    const rd = parsed.releaseDate;
    return {
      buildNumber:
        typeof bn === 'string' || typeof bn === 'number' ? String(bn) : '',
      releaseDate:
        typeof rd === 'string' || typeof rd === 'number' ? String(rd) : '',
    };
  }

  parseFile(zipPath: string, filename: string): ParsedSdeFile {
    const zip = new AdmZip(zipPath);
    return this.parseFileFromZip(zip, filename);
  }

  parseFiles(zipPath: string, filenames: string[]): ParsedSdeFile[] {
    const zip = new AdmZip(zipPath);
    const results: ParsedSdeFile[] = [];

    for (const filename of filenames) {
      const entry = findEntry(zip, filename);
      if (!entry) {
        // File not present in this SDE build — skip silently
        continue;
      }
      results.push(this.parseEntryAsFile(entry, filename));
    }

    return results;
  }

  listFiles(zipPath: string): string[] {
    const zip = new AdmZip(zipPath);
    return zip
      .getEntries()
      .filter(
        (entry) => !entry.isDirectory && entry.entryName.endsWith('.yaml'),
      )
      .map((entry) => entry.entryName);
  }

  private parseFileFromZip(zip: AdmZip, filename: string): ParsedSdeFile {
    const entry = findEntry(zip, filename);

    if (!entry) {
      throw new SdeError(`File '${filename}' not found in archive`);
    }

    return this.parseEntryAsFile(entry, filename);
  }

  private parseEntryAsFile(
    entry: AdmZip.IZipEntry,
    filename: string,
  ): ParsedSdeFile {
    const content = readEntryAsString(entry);
    const parsed = yaml.load(content) as Record<
      string | number,
      Record<string, unknown>
    >;
    const records = new Map<string | number, Record<string, unknown>>(
      Object.entries(parsed).map(([key, value]) => {
        const numKey = Number(key);
        return [Number.isNaN(numKey) ? key : numKey, value];
      }),
    );

    return { filename, records };
  }
}
