import { metaPaths } from '../../support/meta';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return the entry under its compatibility date',
  function () {
    expect(lastRequest().url.pathname).toBe(metaPaths.changelog);
    expect(Object.keys(this.result.changelog)).toEqual(['2026-08-18']);
    expect(
      this.result.changelog['2026-08-18'].map((e: any) => [
        e.method,
        e.path,
        e.type,
      ]),
    ).toEqual([['GET', '/corporations/{corporation_id}', 'breaking']]);
  },
);
