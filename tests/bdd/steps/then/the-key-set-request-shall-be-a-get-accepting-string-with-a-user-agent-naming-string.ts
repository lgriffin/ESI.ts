import { Then } from '../../support/steps';

Then(
  'the key set request shall be a GET accepting {string} with a User-Agent naming {string}',
  function (accept: string, agent: string) {
    const [request] = this.values.verification.requests;
    expect(request.init.method).toBe('GET');
    expect(request.init.headers.Accept).toBe(accept);
    expect(request.init.headers['User-Agent']).toContain(agent);
  },
);
