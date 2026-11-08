import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  "the {word} client's {word} helper collects with the identifiers {string}",
  async function (client: string, helper: string, identifiers: string) {
    const args = identifiers === '-' ? [] : identifiers.split(', ').map(Number);
    const domain = (this.client as unknown as Record<string, unknown>)[
      client
    ] as Record<string, (...args: number[]) => Promise<unknown>>;
    const method = domain[helper];
    if (typeof method !== 'function') {
      throw new Error(`The ${client} client has no ${helper} helper`);
    }
    await captureOutcome(this, () => method.apply(domain, args));
  },
);
