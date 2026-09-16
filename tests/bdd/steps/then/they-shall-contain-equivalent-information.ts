import { metaPaths } from '../../support/meta';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('they shall contain equivalent information', function () {
  const { json, yaml } = this.result;
  expect(
    sentRequests()
      .map((r) => r.url.pathname)
      .sort(),
  ).toEqual([metaPaths.json, metaPaths.yaml]);

  expect(json.openapi).toBe('3.1.0');
  expect(yaml).toContain(`openapi: ${json.openapi}\n`);
  expect(yaml).toContain(`  title: ${json.info.title}\n`);
  expect(Object.keys(json.paths)).toEqual(['/alliances']);
  expect(yaml).toContain('\n  /alliances:\n');
  expect(yaml).toContain(`summary: ${json.paths['/alliances'].get.summary}`);
});
