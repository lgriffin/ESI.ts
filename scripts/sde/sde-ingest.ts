import * as path from 'node:path';
import * as fs from 'node:fs';

/**
 * npm run sde:ingest [-- --output <dir>] [-- --check] [-- --force] [-- --from-zip <archive>] [-- --keep-zip]
 *
 * A non-empty output directory is left alone unless --force is given, and
 * --force empties it before extracting, so the directory holds exactly the
 * archive's files and a file CCP removed does not survive from an older
 * export.
 *
 * Downloads CCP's current export and extracts it to --output (sde-data/ by
 * default). --from-zip extracts an archive already on disk instead, which is
 * how nightly-sde.yml reuses the ZIP it caches per build; --keep-zip leaves
 * the downloaded archive next to the directory.
 */
import { SdeDownloader } from '../../src/sde/ingestion/SdeDownloader';
import { SdeExtractor } from '../../src/sde/ingestion/SdeExtractor';

interface CliOptions {
  output: string;
  check: boolean;
  force: boolean;
  verbose: boolean;
  /** An archive already on disk to extract instead of downloading. */
  fromZip: string | null;
  keepZip: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const opts: CliOptions = {
    output: './sde-data',
    check: false,
    force: false,
    verbose: false,
    fromZip: null,
    keepZip: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      opts.output = args[++i] ?? opts.output;
    } else if (arg === '--check') {
      opts.check = true;
    } else if (arg === '--force') {
      opts.force = true;
    } else if (arg === '--verbose') {
      opts.verbose = true;
    } else if (arg === '--from-zip') {
      opts.fromZip = args[++i] ?? null;
    } else if (arg === '--keep-zip') {
      opts.keepZip = true;
    }
  }

  return opts;
}

function log(
  message: string,
  verbose: boolean = false,
  opts?: CliOptions,
): void {
  if (verbose && opts && !opts.verbose) return;
  console.log(message);
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(opts.output);

  if (opts.fromZip) {
    const zipPath = path.resolve(opts.fromZip);
    if (!fs.existsSync(zipPath)) {
      throw new Error(`No archive at ${zipPath}`);
    }
    if (!prepareOutputDir(outDir, opts)) {
      log(`SDE data already exists at ${outDir}. Use --force to replace it.`);
      return;
    }
    extract(zipPath, outDir, opts);
    return;
  }

  const downloader = new SdeDownloader();

  log('Checking latest SDE build...');
  const latestBuild = await downloader.getLatestBuild();
  log(
    `Latest SDE build: ${latestBuild.buildNumber} (${latestBuild.releaseDate})`,
  );

  if (opts.check) {
    return;
  }

  const zipPath = outDir + '.zip';

  if (!prepareOutputDir(outDir, opts)) {
    log(`SDE data already exists at ${outDir}. Use --force to re-download.`);
    return;
  }

  log(`Downloading SDE to ${zipPath}...`);
  await downloader.download({
    outputPath: zipPath,
    onProgress: (downloaded, total) => {
      if (total > 0) {
        const pct = Math.round((downloaded / total) * 100);
        process.stdout.write(
          `\r  Progress: ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} MB)`,
        );
      }
    },
  });
  console.log('');
  log('Download complete.');

  extract(zipPath, outDir, opts);

  if (!opts.keepZip && fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
    log('Cleaned up zip file.', true, opts);
  }
}

/**
 * True when the output directory is empty or absent, or --force emptied it;
 * false when it holds files that must be kept.
 */
function prepareOutputDir(outDir: string, opts: CliOptions): boolean {
  const populated = fs.existsSync(outDir) && fs.readdirSync(outDir).length > 0;
  if (!populated) return true;
  if (!opts.force) return false;
  fs.rmSync(outDir, { recursive: true, force: true });
  log(`Removed the previous export at ${outDir}`, true, opts);
  return true;
}

function extract(zipPath: string, outDir: string, opts: CliOptions): void {
  log('Extracting YAML files...');
  const extractor = new SdeExtractor();
  const metadata = extractor.readMetadata(zipPath);
  log(`SDE build: ${metadata.buildNumber}, released: ${metadata.releaseDate}`);

  extractor.extractAll(zipPath, outDir);
  log(`Extracted to ${outDir}`);

  log(`SDE data ready at ${outDir}`);
  log("Usage: SdeDataProvider.fromDirectory('" + outDir + "')");
  if (opts.verbose) log(`Archive kept at ${zipPath}`, true, opts);
}

main().catch((err) => {
  console.error('SDE download failed:', err);
  process.exit(1);
});
