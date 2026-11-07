import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  "SSO's token endpoint shall have received the client id {string} and no Authorization header",
  function (clientId: string) {
    const requests = sentRequests().filter(
      (r) => r.url.pathname === '/v2/oauth/token',
    );
    expect(requests).toHaveLength(1);
    const [request] = requests;
    expect(new URLSearchParams(request!.body ?? '').get('client_id')).toBe(
      clientId,
    );
    expect(
      Object.keys(request!.headers).map((h) => h.toLowerCase()),
    ).not.toContain('authorization');
  },
);
