import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the requests to ESI shall have carried the after tokens {string}',
  function (list: string) {
    const tokens = sentRequests().map(
      (request) => request.url.searchParams.get('after') ?? '-',
    );
    expect(tokens).toEqual(list.split(', '));
  },
);
