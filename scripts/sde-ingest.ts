import * as path from 'node:path';
import * as fs from 'node:fs';
import { SdeDownloader } from '../src/sde/ingestion/SdeDownloader';
import { SdeExtractor } from '../src/sde/ingestion/SdeExtractor';
import { SdeDatabaseBuilder } from '../src/sde/ingestion/SdeDatabaseBuilder';
import { SDE_FILE_REGISTRY } from '../src/sde/ingestion/constants';

interface CliOptions {
  output: string;
  check: boolean;
  force: boolean;
  validate: boolean;
  verbose: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const opts: CliOptions = {
    output: './eve-sde.sqlite',
    check: false,
    force: false,
    validate: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      opts.output = args[++i];
    } else if (arg === '--check') {
      opts.check = true;
    } else if (arg === '--force') {
      opts.force = true;
    } else if (arg === '--validate') {
      opts.validate = true;
    } else if (arg === '--verbose') {
      opts.verbose = true;
    }
  }

  return opts;
}

function log(message: string, verbose: boolean = false, opts?: CliOptions): void {
  if (verbose && opts && !opts.verbose) return;
  console.log(message);
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const downloader = new SdeDownloader();
  const extractor = new SdeExtractor();
  const builder = new SdeDatabaseBuilder();

  log('Checking latest SDE build...');
  const latestBuild = await downloader.getLatestBuild();
  log(`Latest SDE build: ${latestBuild.buildNumber} (${latestBuild.releaseDate})`);

  if (opts.check) {
    return;
  }

  const zipPath = path.resolve(opts.output.replace(/\.sqlite$/, '.zip'));
  const dbPath = path.resolve(opts.output);

  if (!opts.force && fs.existsSync(dbPath)) {
    log(`Database already exists at ${dbPath}. Use --force to overwrite.`);
    return;
  }

  log(`Downloading SDE to ${zipPath}...`);
  await downloader.download({
    outputPath: zipPath,
    onProgress: (downloaded, total) => {
      if (total > 0) {
        const pct = Math.round((downloaded / total) * 100);
        process.stdout.write(`\r  Progress: ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} MB)`);
      }
    },
  });
  console.log('');
  log('Download complete.');

  log('Reading SDE metadata...');
  const metadata = extractor.readMetadata(zipPath);
  log(`SDE build: ${metadata.buildNumber}, released: ${metadata.releaseDate}`);

  log('Parsing YAML files...');
  const yamlFiles = SDE_FILE_REGISTRY.map((spec) => spec.yamlFile);
  const parsedFiles = extractor.parseFiles(zipPath, yamlFiles);
  log(`Parsed ${parsedFiles.length} files.`);

  log(`Building database at ${dbPath}...`);
  builder.build({
    outputPath: dbPath,
    parsedFiles,
    sdeVersion: metadata.buildNumber,
    buildDate: metadata.releaseDate,
    onProgress: (tableName, inserted, total) => {
      log(`  ${tableName}: ${inserted}/${total} rows`, true, opts);
    },
  });

  log(`SDE database built successfully at ${dbPath}`);

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
    log('Cleaned up zip file.', true, opts);
  }
}

main().catch((err) => {
  console.error('SDE ingestion failed:', err);
  process.exit(1);
});
