import { loadJsYaml } from '../optionalPeers';
import type { SdeMetadata } from './SdeExtractor';

function asText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

/**
 * Parses the contents of an SDE `_sde.yaml` file. The fields may sit at the
 * top level or be nested under an `sde:` key; the nested block wins when both
 * are present. A field that is missing or is not a string or number comes back
 * as an empty string.
 *
 * `SdeDataProvider.fromDirectory` and `SdeExtractor.readMetadata` (behind
 * `fromZip`) both read metadata through this function, so the two layouts give
 * the same result whichever way the SDE is loaded.
 */
export function parseSdeMetadata(content: string): SdeMetadata {
  const parsed = loadJsYaml().load(content) as Record<string, unknown>;
  const block = (parsed.sde ?? parsed) as Record<string, unknown>;
  return {
    buildNumber: asText(block.buildNumber),
    releaseDate: asText(block.releaseDate),
  };
}
