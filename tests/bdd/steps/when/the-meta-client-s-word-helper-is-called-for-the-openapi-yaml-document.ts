import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  "the meta client's {word} helper is called for the OpenAPI YAML document",
  async function (helper: string) {
    const meta = this.client.meta;
    await captureOutcome(this, async () => {
      if (helper === 'fetch-all') {
        return meta.fetchAllEndpoint('getOpenApiYaml', []);
      }
      const pages: unknown[] = [];
      for await (const page of meta.streamEndpoint('getOpenApiYaml')) {
        pages.push(page);
      }
      return pages;
    });
  },
);
