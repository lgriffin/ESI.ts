import { AlphaClient } from './AlphaClient';

/** Not a domain client: it extends nothing, so none of its methods count. */
export class ClientRegistry {
  getAlpha(): AlphaClient {
    return new AlphaClient();
  }
}
