/**
 * Every place `src/` takes input from the network is in the security model's
 * index (guides/security-model.yaml, CHARTER SEC-11): each network call, and
 * each read of a response header by name. A new call site or header read
 * fails here until the index lists it, so the model's list of untrusted
 * inputs cannot fall behind the code. Discovery is `scanSource` in
 * scripts/quality/security-model-core.ts, which `npm run security:model`
 * uses too.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
  DiscoveredSites,
  SecurityIndex,
  scanSource,
} from '../../../scripts/quality/security-model-core';

const ROOT = path.resolve(__dirname, '../../..');

function sourceFiles(rel: string): string[] {
  return readdirSync(path.join(ROOT, rel)).flatMap((entry) => {
    const child = `${rel}/${entry}`;
    if (statSync(path.join(ROOT, child)).isDirectory())
      return sourceFiles(child);
    return child.endsWith('.ts') ? [child] : [];
  });
}

const index = yaml.load(
  readFileSync(path.join(ROOT, 'guides/security-model.yaml'), 'utf-8'),
) as SecurityIndex;

const sites: DiscoveredSites = { network: new Set(), headers: new Map() };
for (const file of sourceFiles('src')) {
  scanSource(file, readFileSync(path.join(ROOT, file), 'utf-8'), sites);
}

describe('untrusted input sites in src/ (security model SEC-11)', () => {
  it('finds the network calls and header reads it is meant to', () => {
    // An empty scan would pass every case below.
    expect(sites.network.size).toBeGreaterThanOrEqual(4);
    expect(sites.headers.get('src/core/util/headersUtil.ts')).toContain(
      'x-pages',
    );
  });

  it('lists every network call site in the index, and no other', () => {
    expect([...sites.network].sort()).toEqual(
      index.network_call_sites.map((s) => s.file).sort(),
    );
  });

  it('lists every file that reads a response header in the index, and no other', () => {
    expect([...sites.headers.keys()].sort()).toEqual(
      index.header_read_sites.map((s) => s.file).sort(),
    );
  });

  it.each(index.header_read_sites.map((s) => [s.file, s.headers ?? []]))(
    '%s: the index names every header the file reads by name',
    (file, listed) => {
      const read = [...(sites.headers.get(file) ?? [])].filter(
        (h) => h !== '*',
      );
      expect(read.filter((h) => !listed.includes(h))).toEqual([]);
    },
  );
});
