import * as path from 'node:path';
import type AdmZip from 'adm-zip';
import { SDE_METADATA_FILENAME } from './constants';
import { SdeError } from '../errors';
import { loadAdmZip, loadJsYaml } from '../optionalPeers';
import { parseSdeMetadata } from './metadata';

export interface SdeMetadata {
  buildNumber: string;
  releaseDate: string;
}

export interface ParsedSdeFile {
  filename: string;
  records: Map<string | number, Record<string, unknown>>;
}

/** The last path segment, whichever separator the archive used. */
function baseName(name: string): string {
  return name.slice(
    Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')) + 1,
  );
}

/**
 * The entry whose file name matches, at any depth. A directory entry ends in a
 * separator, so its base name is empty and never matches.
 */
function findEntry(
  zip: AdmZip,
  filename: string,
): AdmZip.IZipEntry | undefined {
  const wanted = baseName(filename);
  return zip.getEntries().find((entry) => baseName(entry.entryName) === wanted);
}

/**
 * Whether an archive entry name, read with either separator, resolves inside
 * `dir`. Absolute names, drive letters and `..` segments that climb out fail.
 */
function landsInside(dir: string, entryName: string): boolean {
  const name = entryName.replace(/\\/g, '/');
  if (name.startsWith('/') || /^[A-Za-z]:/.test(name)) return false;
  const root = path.resolve(dir);
  const target = path.resolve(root, name);
  return target === root || target.startsWith(root + path.sep);
}

function openZip(zipPath: string): AdmZip {
  const Zip = loadAdmZip();
  return new Zip(zipPath);
}

function readEntryAsString(entry: AdmZip.IZipEntry): string {
  const buffer = entry.getData();
  return buffer.toString('utf-8');
}

export class SdeExtractor {
  readMetadata(zipPath: string): SdeMetadata {
    const zip = openZip(zipPath);
    const entry = findEntry(zip, SDE_METADATA_FILENAME);

    if (!entry) {
      throw new SdeError(
        `Metadata file '${SDE_METADATA_FILENAME}' not found in archive: ${zipPath}`,
      );
    }

    return parseSdeMetadata(readEntryAsString(entry));
  }

  parseFile(zipPath: string, filename: string): ParsedSdeFile {
    const zip = openZip(zipPath);
    return this.parseFileFromZip(zip, filename);
  }

  parseFiles(zipPath: string, filenames: string[]): ParsedSdeFile[] {
    const zip = openZip(zipPath);
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

  /**
   * Extract every entry into `outputDir`. Entry names come from the archive,
   * which is input from the network, so the whole archive is refused, before
   * anything is written, if any entry would land outside `outputDir`
   * (security model P9). This does not rely on the adm-zip version installed
   * sanitising names.
   */
  extractAll(zipPath: string, outputDir: string): void {
    const zip = openZip(zipPath);
    const escaping = zip
      .getEntries()
      .map((entry) => entry.rawEntryName.toString('utf-8'))
      .filter((name) => !landsInside(outputDir, name));
    if (escaping.length > 0) {
      throw new SdeError(
        `Refusing to extract ${zipPath}: ${escaping.length} entr${escaping.length === 1 ? 'y' : 'ies'} would land outside ${outputDir} (first: ${JSON.stringify(escaping[0])})`,
      );
    }
    zip.extractAllTo(outputDir, true);
  }

  listFiles(zipPath: string): string[] {
    const zip = openZip(zipPath);
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
    const parsed = loadJsYaml().load(content) as Record<
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
