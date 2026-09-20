import * as path from 'node:path';
import * as fs from 'node:fs';
import { SdeDownloader } from '../src/sde/ingestion/SdeDownloader';
import { SdeExtractor } from '../src/sde/ingestion/SdeExtractor';

interface CliOptions {
  output: string;
  check: boolean;
  force: boolean;
  verbose: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const opts: CliOptions = {
    output: './sde-data',
    check: false,
    force: false,
    verbose: false,
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

  log('Checking latest SDE build...');
  const latestBuild = await downloader.getLatestBuild();
  log(`Latest SDE build: ${latestBuild.buildNumber} (${latestBuild.releaseDate})`);

  if (opts.check) {
    return;
  }

  const outDir = path.resolve(opts.output);
  const zipPath = outDir + '.zip';

  if (!opts.force && fs.existsSync(outDir) && fs.readdirSync(outDir).length > 0) {
    log(`SDE data already exists at ${outDir}. Use --force to re-download.`);
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

  log('Extracting YAML files...');
  const extractor = new SdeExtractor();
  const metadata = extractor.readMetadata(zipPath);
  log(`SDE build: ${metadata.buildNumber}, released: ${metadata.releaseDate}`);

  extractor.extractAll(zipPath, outDir);
  log(`Extracted to ${outDir}`);

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
    log('Cleaned up zip file.', true, opts);
  }

  log(`SDE data ready at ${outDir}`);
  log('Usage: SdeDataProvider.fromDirectory(\'' + outDir + '\')');
}

main().catch((err) => {
  console.error('SDE download failed:', err);
  process.exit(1);
});
