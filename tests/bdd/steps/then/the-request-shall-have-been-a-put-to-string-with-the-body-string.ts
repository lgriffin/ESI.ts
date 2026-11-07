import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the request shall have been a PUT to {string} with the body {string}',
  function (path: string, body: string) {
    const request = lastRequest();
    expect(request.method).toBe('PUT');
    expect(request.url.pathname).toMatch(new RegExp(`${path}$`));
    expect(JSON.parse(request.body ?? 'null')).toEqual(JSON.parse(body));
  },
);
