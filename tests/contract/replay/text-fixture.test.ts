/**
 * A text endpoint's fixture (meta/openapi.yaml) stores the document as a
 * string. The replay must send it as the document itself and compare what the
 * client returns character for character, since there are no keys to compare.
 */
import { publicGetEndpoints } from '../recorded/catalogue';
import { fixturePath, loadFixture } from '../recorded/fixture';
import { replayFixture } from '../recorded/replay';

const ENDPOINT = 'meta.getOpenApiYaml';
const definition = publicGetEndpoints().find(
  (e) => e.key === ENDPOINT,
)!.definition;

describe('a recorded text document', () => {
  it('replays as the recorded text, unquoted', async () => {
    const report = await replayFixture(
      loadFixture(fixturePath(ENDPOINT)),
      definition,
    );

    expect(report.problems).toEqual([]);
  });
});
