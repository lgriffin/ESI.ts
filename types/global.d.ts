import { getBody, getHeaders } from '../src/core/util/testHelpers';

declare global {
  // Extending the NodeJS Global interface
  namespace NodeJS {
    interface Global {
      getBody: typeof getBody;
      getHeaders: typeof getHeaders;
    }
  }

  // Adding to globalThis (in case global is used outside NodeJS context)
  var getBody: typeof getBody;
  var getHeaders: typeof getHeaders;
}

export {};
