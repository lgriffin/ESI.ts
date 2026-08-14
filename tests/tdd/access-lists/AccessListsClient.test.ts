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
      access_list_id: 42,
      name: 'Corp Docking ACL',
      entries: [
        {
          entity_id: 1689391488,
          entity_type: 'character',
          access_type: 'allowed',
        },
        {
          entity_id: 98000002,
          entity_type: 'corporation',
          access_type: 'blocked',
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      accessListsClient.getAccessList(123456789, 42),
    );
    expect(result).toHaveProperty('access_list_id', 42);
    expect(result).toHaveProperty('name', 'Corp Docking ACL');
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].entity_type).toBe('character');
    expect(result.entries[0].access_type).toBe('allowed');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/characters/123456789/access-lists/42',
    );
  });

  it('should get all access lists for a character', async () => {
    const mockResponse = [
      {
        access_list_id: 42,
        name: 'Corp Docking ACL',
        entries: [
          {
            entity_id: 1689391488,
            entity_type: 'character',
            access_type: 'allowed',
          },
        ],
      },
      {
        access_list_id: 43,
        name: 'Alliance ACL',
        entries: [],
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      accessListsClient.getCharacterAccessLists(123456789),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('access_list_id', 42);
    expect(result[1]).toHaveProperty('access_list_id', 43);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/characters/123456789/access-lists',
    );
  });

  describeClientErrors('AccessListsClient', () =>
    accessListsClient.getAccessList(123456789, 42),
  );
});
