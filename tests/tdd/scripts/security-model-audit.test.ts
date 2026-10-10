/**
 * Self-tests for the security model audit
 * (scripts/quality/security-model-core.ts, CHARTER SEC-09 to SEC-12).
 *
 * The fixture under fixtures/security-model/valid passes every rule. Each
 * negative case below changes one thing in it and expects the one finding
 * that rule exists for, so a rule that stops firing fails here rather than
 * passing the real model for the wrong reason.
 */
import { readFileSync } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
  AuditInput,
  DiscoveredSites,
  SecurityIndex,
  anchorOf,
  auditSecurityModel,
  formatFindings,
  parseProse,
  scanSource,
  stripComments,
  taggedRules,
} from '../../../scripts/quality/security-model-core';

const FIXTURE = path.join(__dirname, 'fixtures/security-model/valid');
const read = (name: string) => readFileSync(path.join(FIXTURE, name), 'utf-8');

function sitesOf(): DiscoveredSites {
  const sites: DiscoveredSites = { network: new Set(), headers: new Map() };
  scanSource('src/transport.ts', read('transport.ts.fixture'), sites);
  scanSource('src/pages.ts', read('pages.ts.fixture'), sites);
  return sites;
}

function valid(): AuditInput {
  return {
    prose: read('SECURITY-MODEL.md'),
    index: yaml.load(read('security-model.yaml')) as SecurityIndex,
    features: [
      {
        file: 'tests/bdd/features/0001-boundary.feature',
        source: read('0001-boundary.feature'),
      },
    ],
    triageLog: read('security-triage-log.md'),
    sites: sitesOf(),
    faultIds: new Set(['x-pages-beyond-the-cap']),
    exists: () => true,
    today: '2026-10-10',
  };
}

function messages(input: AuditInput): string[] {
  return auditSecurityModel(input).map((f) => `${f.check} ${f.message}`);
}

/** The valid fixture with one change applied. */
function variant(change: (input: AuditInput) => void): string[] {
  const input = valid();
  change(input);
  return messages(input);
}

describe('security model audit: the fixture', () => {
  it('passes a model whose prose, index, Rules, log and sites agree', () => {
    expect(messages(valid())).toEqual([]);
  });

  it('parses the prose tables and lists', () => {
    const prose = parseProse(read('SECURITY-MODEL.md'));
    expect([...prose.properties]).toEqual([
      ['P1', 'critical'],
      ['P2', 'medium'],
    ]);
    expect([...prose.disclaimed]).toEqual(['D1']);
    expect([...prose.nonFindings]).toEqual(['N1']);
    expect([...prose.dispositions]).toEqual(['VALID', 'KNOWN-NON-FINDING']);
    expect(prose.anchors.has('known-non-findings')).toBe(true);
  });

  it('builds GitHub heading anchors', () => {
    expect(anchorOf('Rollout and open gaps')).toBe('rollout-and-open-gaps');
    expect(anchorOf('`P1` · Token')).toBe('p1--token');
  });

  it('reads the tags directly above each Rule', () => {
    const rules = taggedRules('f.feature', read('0001-boundary.feature'));
    expect(rules.map((r) => [r.line, r.tags])).toEqual([
      [4, ['P1']],
      [11, ['P2']],
    ]);
    expect(
      taggedRules('f.feature', '@sec-P1\n\n  Rule: untagged after a gap.'),
    ).toEqual([]);
  });
});

describe('SEC-09: prose and index agree', () => {
  it('fails a property missing from the index', () => {
    expect(
      variant((i) => {
        i.index.properties = i.index.properties.filter((p) => p.id !== 'P2');
      }),
    ).toContain(
      'SEC-09 P2 is in the prose properties table but not in the index.',
    );
  });

  it('fails a property missing from the prose', () => {
    expect(
      variant((i) => {
        i.prose = i.prose.replace(/^\| P2 .*$/m, '');
      }),
    ).toContain(
      'SEC-09 P2 is in the index but not in the prose properties table.',
    );
  });

  it('fails a severity that differs', () => {
    expect(
      variant((i) => {
        i.index.properties[0]!.severity = 'high';
      }),
    ).toContain('SEC-09 P1 is critical in the prose and high in the index.');
  });

  it('fails a disclaimed property, non-finding or disposition on one side only', () => {
    const found = variant((i) => {
      i.index.disclaimed.push({ id: 'D2' });
      i.index.non_findings = [];
      i.index.dispositions.push({ id: 'MODEL-GAP', section: 'triage' });
    });
    expect(found).toEqual(
      expect.arrayContaining([
        'SEC-09 The disclaimed property D2 is in the index but not in the prose.',
        'SEC-09 The non-finding N1 is in the prose but not in the index.',
        'SEC-09 The disposition MODEL-GAP is in the index but not in the prose.',
      ]),
    );
  });
});

describe('SEC-10: every claimed property is stated and tested', () => {
  it('fails a property with no tagged Rule', () => {
    expect(
      variant((i) => {
        i.features[0]!.source = i.features[0]!.source.replace('@sec-P2', '');
      }),
    ).toContain(
      'SEC-10 P2 has no Rule tagged @sec-P2; tag the Rule that states it, or set rule: none with a rule_reason.',
    );
  });

  it('accepts rule: none with a reason, and fails it without one', () => {
    const strip = (i: AuditInput) => {
      i.features[0]!.source = i.features[0]!.source.replace('@sec-P2', '');
      i.index.properties[1]!.rule = 'none';
    };
    expect(
      variant((i) => {
        strip(i);
        i.index.properties[1]!.rule_reason = 'a pipeline property';
      }),
    ).toEqual([]);
    expect(variant(strip)).toContain(
      'SEC-10 P2 says rule: none without a rule_reason.',
    );
  });

  it('fails a test file that does not exist', () => {
    expect(
      variant((i) => {
        i.exists = (f) => f !== 'tests/unit/pages.test.ts';
      }),
    ).toContain(
      'SEC-10 P2 names tests/unit/pages.test.ts, which does not exist.',
    );
  });

  it('fails a claimed property with no test file', () => {
    expect(
      variant((i) => {
        i.index.properties[1]!.tests = [];
      }),
    ).toContain('SEC-10 P2 is claimed with no test file.');
  });

  it('fails a Rule that claims a disclaimed property or an unknown id', () => {
    const found = variant((i) => {
      i.features[0]!.source = i.features[0]!.source.replace(
        '@sec-P1',
        '@sec-P1 @sec-D1',
      ).replace('@sec-P2', '@sec-P2 @sec-P9');
    });
    expect(found).toEqual([
      expect.stringContaining('tags @sec-D1, a disclaimed property'),
      expect.stringContaining('tags @sec-P9, which the index does not hold'),
    ]);
  });

  it('fails a tagged Rule that did not run, or did not pass, in the BDD results', () => {
    const p1 =
      'If a request leaves the host, then the client shall not send the token.';
    expect(
      variant((i) => {
        i.ruleResults = new Map([[p1, true]]);
      }),
    ).toEqual([
      expect.stringMatching(/@sec-P2\) did not run in the BDD results/),
    ]);
    expect(
      variant((i) => {
        i.ruleResults = new Map([
          [p1, false],
          [
            'If ESI reports more than 1000 pages, then the client shall request no more than 1000 pages.',
            true,
          ],
        ]);
      }),
    ).toEqual([
      expect.stringMatching(/@sec-P1\) has a scenario that did not pass/),
    ]);
  });

  it('fails a tagged Rule that did not pass even when its property is a gap', () => {
    const found = variant((i) => {
      Object.assign(i.index.properties[0]!, {
        status: 'gap',
        issue: 627,
        expires: '2026-12-31',
      });
      i.ruleResults = new Map([
        [
          'If a request leaves the host, then the client shall not send the token.',
          false,
        ],
        [
          'If ESI reports more than 1000 pages, then the client shall request no more than 1000 pages.',
          true,
        ],
      ]);
    });
    expect(found).toContainEqual(
      expect.stringMatching(/@sec-P1\) has a scenario that did not pass/),
    );
  });

  it('accepts a gap with an issue and an unexpired date, and no Rule yet', () => {
    expect(
      variant((i) => {
        i.features[0]!.source = i.features[0]!.source.replace('@sec-P2', '');
        Object.assign(i.index.properties[1]!, {
          status: 'gap',
          issue: 627,
          expires: '2026-12-31',
          tests: [],
        });
      }),
    ).toEqual([]);
  });

  it('fails a gap with no issue, no date or an expired date', () => {
    const gap = (fields: object) =>
      variant((i) => {
        Object.assign(i.index.properties[1]!, { status: 'gap', ...fields });
      });
    expect(gap({ expires: '2026-12-31' })).toContain(
      'SEC-10 P2 is a gap with no issue number.',
    );
    expect(gap({ issue: 1 })).toContain(
      'SEC-10 P2 is a gap with no expiry date (YYYY-MM-DD).',
    );
    expect(gap({ issue: 1, expires: '2026-10-09' })).toContain(
      "SEC-10 P2's gap expired on 2026-10-09; fix it or record a new decision.",
    );
  });

  it('fails a status other than gap', () => {
    expect(
      variant((i) => {
        i.index.properties[1]!.status = 'partial';
      }),
    ).toContain('SEC-10 P2 has status "partial"; the only status is gap.');
  });

  it('fails a gap count that grew against master', () => {
    expect(
      variant((i) => {
        i.baseIndex = yaml.load(read('security-model.yaml')) as SecurityIndex;
        Object.assign(i.index.properties[1]!, {
          status: 'gap',
          issue: 1,
          expires: '2026-12-31',
        });
      }),
    ).toContain(
      'SEC-10 The index has 1 gaps and master has 0; the count of gaps may only shrink.',
    );
  });
});

describe('SEC-11: every network call and header read is indexed', () => {
  it('finds calls and literal reads, and skips comments and writes', () => {
    const sites = sitesOf();
    expect([...sites.network]).toEqual(['src/transport.ts']);
    expect([...sites.headers]).toEqual([
      ['src/pages.ts', new Set(['x-pages'])],
    ]);
  });

  it('counts a dynamic headers.get as a read', () => {
    const sites: DiscoveredSites = { network: new Set(), headers: new Map() };
    scanSource('src/c.ts', 'const f = (n: string) => headers.get(n);', sites);
    expect(sites.headers.get('src/c.ts')).toEqual(new Set(['*']));
  });

  it('finds fetch called through a global object, but not another method named fetch', () => {
    const sites: DiscoveredSites = { network: new Set(), headers: new Map() };
    scanSource('src/a.ts', 'await globalThis.fetch(url);', sites);
    scanSource('src/b.ts', 'await cache.fetch(key);', sites);
    expect([...sites.network]).toEqual(['src/a.ts']);
  });

  it('finds reads through any headers receiver, in any case, but not the outgoing request', () => {
    const sites: DiscoveredSites = { network: new Set(), headers: new Map() };
    scanSource(
      'src/r.ts',
      [
        "const a = fetchHeaders.get('Location');",
        "const b = headers['X-Pages'];",
        "const c = req.headers['Authorization'];",
      ].join('\n'),
      sites,
    );
    expect(sites.headers.get('src/r.ts')).toEqual(
      new Set(['location', 'x-pages']),
    );
  });

  it('blanks block and line comments but keeps URLs in strings', () => {
    expect(stripComments("/* fetch(x) */ a('https://x'); // fetch(y)")).toBe(
      "               a('https://x'); ",
    );
  });

  it('fails a network call the index does not list, and a stale entry', () => {
    const found = variant((i) => {
      i.sites.network.add('src/new.ts');
      i.index.network_call_sites.push({ file: 'src/gone.ts' });
    });
    expect(found).toEqual([
      'SEC-11 src/new.ts makes a network call the index does not list under network_call_sites.',
      'SEC-11 network_call_sites lists src/gone.ts, which makes no network call.',
    ]);
  });

  it('fails a header read the index does not list, by file and by name', () => {
    const found = variant((i) => {
      i.sites.headers.set('src/new.ts', new Set(['location']));
      i.sites.headers.get('src/pages.ts')!.add('x-cursor-after');
    });
    expect(found).toEqual([
      'SEC-11 src/pages.ts reads the x-cursor-after header, which header_read_sites does not list for it.',
      'SEC-11 src/new.ts reads response headers (location) and is not in header_read_sites.',
    ]);
  });

  it('fails a stale header entry and an input site that does not exist', () => {
    const found = variant((i) => {
      i.sites.headers.clear();
      i.exists = (f) => f !== 'src/pages.ts';
    });
    expect(found).toEqual([
      'SEC-11 header_read_sites lists src/pages.ts, which reads no response header.',
      'SEC-11 The input x-pages names src/pages.ts, which does not exist.',
    ]);
  });

  it('fails a listed header a file no longer reads, unless it reads by a computed name', () => {
    expect(
      variant((i) => {
        i.index.header_read_sites[0]!.headers!.push('etag');
      }),
    ).toEqual([
      'SEC-11 header_read_sites lists etag for src/pages.ts, which no longer reads it.',
    ]);
    expect(
      variant((i) => {
        i.index.header_read_sites[0]!.headers!.push('etag');
        i.sites.headers.get('src/pages.ts')!.add('*');
      }),
    ).toEqual([]);
  });
});

describe('SEC-11: every registered input has a hostile-value generator', () => {
  it('fails an input with no generator', () => {
    expect(
      variant((i) => {
        i.index.inputs[0]!.generators = [];
      }),
    ).toEqual([
      expect.stringMatching(/^SEC-11 The input x-pages has no generator/),
    ]);
  });

  it('fails a generator naming a missing fault or file', () => {
    const found = variant((i) => {
      i.index.inputs[0]!.generators = [
        'fault:no-such-fault',
        'tests/gone.test.ts',
      ];
      i.exists = (f) => f !== 'tests/gone.test.ts';
    });
    expect(found).toEqual([
      'SEC-11 The input x-pages names the generator fault:no-such-fault, which does not exist.',
      'SEC-11 The input x-pages names the generator tests/gone.test.ts, which does not exist.',
    ]);
  });

  it('fails a generator that is not a fault or a test file under tests/', () => {
    expect(
      variant((i) => {
        i.index.inputs[0]!.generators = ['src/pages.ts', 'guides/FUZZ.md'];
      }),
    ).toEqual([
      'SEC-11 The input x-pages names the generator src/pages.ts, which is neither a fault:<id> nor a test file under tests/.',
      'SEC-11 The input x-pages names the generator guides/FUZZ.md, which is neither a fault:<id> nor a test file under tests/.',
    ]);
  });
});

describe('SEC-12: citations and dispositions are closed', () => {
  it('fails a non-finding or disposition citing a missing section', () => {
    const found = variant((i) => {
      i.index.non_findings[0]!.section = 'no-such-section';
      i.index.dispositions[0]!.section = 'nowhere';
    });
    expect(found).toEqual([
      'SEC-12 The non-finding N1 cites the section #no-such-section, which the prose does not have.',
      'SEC-12 The disposition VALID cites the section #nowhere, which the prose does not have.',
    ]);
  });

  it('fails a non-finding whose disposition is outside the closed set', () => {
    expect(
      variant((i) => {
        i.index.non_findings[0]!.disposition = 'WONTFIX';
      }),
    ).toContain(
      'SEC-12 The non-finding N1 has disposition WONTFIX, outside the closed set.',
    );
  });

  it('fails a triage-log line outside the closed set, or citing a missing section', () => {
    const found = variant((i) => {
      i.triageLog = i.triageLog
        .replace('`KNOWN-NON-FINDING`', '`WONTFIX`')
        .replace('#known-non-findings', '#gone');
    });
    expect(found).toEqual([
      'SEC-12 Triage log line 5 has disposition "WONTFIX", outside the closed set.',
      'SEC-12 Triage log line 5 cites #gone, which the prose does not have.',
    ]);
  });

  it('checks a triage-log row whose date is malformed', () => {
    const found = variant((i) => {
      i.triageLog = i.triageLog
        .replace('2026-10-10', '10/10/2026')
        .replace('`KNOWN-NON-FINDING`', '`WONTFIX`');
    });
    expect(found).toEqual([
      'SEC-12 Triage log line 5 has the date "10/10/2026"; write it as YYYY-MM-DD.',
      'SEC-12 Triage log line 5 has disposition "WONTFIX", outside the closed set.',
    ]);
  });
});

describe('formatFindings', () => {
  it('prints one line per finding with its check', () => {
    expect(
      formatFindings([{ check: 'SEC-11', message: 'src/x.ts is unlisted.' }]),
    ).toBe('  SEC-11  src/x.ts is unlisted.');
  });
});
