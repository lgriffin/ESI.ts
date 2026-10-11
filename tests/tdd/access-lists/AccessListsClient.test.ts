import { ApiClient } from '../../../src/core/ApiClient';
import { AccessListsClient } from '../../../src/clients/AccessListsClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

describe('AccessListsClient', () => {
  let client: ApiClient;
  let accessListsClient: AccessListsClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new ApiClient('dummy-client-id', 'https://esi.evetech.net');
    client.setAccessToken('test-token');
    const rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client.setRateLimiter(rateLimiter);
    accessListsClient = new AccessListsClient(client);
  });

  it('should get access list by ID', async () => {
    const mockResponse = {
      id: 42,
      name: 'Corp Docking ACL',
      description: 'Who may dock',
      membership: {
        allow_everyone: false,
        alliances: [{ alliance_id: 99000006, access: 'Blocked' }],
        corporations: [{ corporation_id: 98000002, access: 'Allowed' }],
        characters: [{ character_id: 1689391488, access: 'Admin' }],
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      accessListsClient.getAccessList(123456789, 42),
    );
    expect(result).toEqual(mockResponse);
    expect(result.membership.characters[0]!.access).toBe('Admin');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/characters/123456789/access-lists/42',
    );
  });

  it('should get all access lists for a character', async () => {
    const mockResponse = { access_lists: [{ id: 42 }, { id: 43 }] };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      accessListsClient.getCharacterAccessLists(123456789),
    );
    expect(result).toEqual(mockResponse);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/characters/123456789/access-lists',
    );
  });

  describeClientErrors('AccessListsClient', (apiClient) =>
    new AccessListsClient(apiClient).getAccessList(123456789, 42),
  );
});
