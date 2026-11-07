import { addRequestInterceptor } from '../../support/interceptors';
import { Given } from '../../support/steps';

Given(
  'the client has a request interceptor {string} that appends {string} to the header {string}',
  function (name: string, suffix: string, header: string) {
    addRequestInterceptor(this, name, (context) => ({
      ...context,
      headers: {
        ...context.headers,
        [header]: `${context.headers[header] ?? ''}${suffix}`,
      },
    }));
  },
);
