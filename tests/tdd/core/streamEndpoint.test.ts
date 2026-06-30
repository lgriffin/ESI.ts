import { ApiClient } from '../../../src/core/ApiClient';
import { BaseEsiClient } from '../../../src/clients/BaseEsiClient';
import { EndpointMap } from '../../../src/core/endpoints/EndpointDefinition';
import { PageResult } from '../../../src/core/pagination/AsyncPaginationIterator';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';

jest.mock('../../../src/core/ApiRequestHandler', () => {
  const original = jest.requireActual('../../../src/core/ApiRequestHandler');
  return {
    ...original,
    handleRequest: jest.fn(),
  };
});

import { handleRequest } from '../../../src/core/ApiRequestHandler';
const mockHandleRequest = handleRequest as jest.MockedFunction<
  typeof handleRequest
>;

const testEndpoints = {
  getItems: {
    path: 'test/{regionId}/items/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    queryParams: { category: 'category' },
  },
  getSecureItems: {
    path: 'secure/{characterId}/items/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
} as const satisfies EndpointMap;

class TestClient extends BaseEsiClient<typeof testEndpoints> {
  constructor(client: ApiClient) {
    super(client, testEndpoints);
  }

  streamItems(
    regionId: number,
    category?: string,
  ): AsyncGenerator<PageResult<{ id: number }>, void, undefined> {
    return this.streamEndpoint<{ id: number }>('getItems', regionId, category);
  }

  streamSecureItems(
    characterId: number,
  ): AsyncGenerator<PageResult<{ id: number }>, void, undefined> {
    return this.streamEndpoint<{ id: number }>('getSecureItems', characterId);
  }
}

describe('streamEndpoint', () => {
  let apiClient: ApiClient;
  let testClient: TestClient;

  beforeEach(() => {
    mockHandleRequest.mockReset();
    apiClient = new ApiClient('test', 'https://esi.evetech.net');
    const rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    apiClient.setRateLimiter(rateLimiter);
    testClient = new TestClient(apiClient);
  });

  it('should yield a single page for non-paginated response', async () => {
    mockHandleRequest.mockResolvedValueOnce({
      headers: { 'x-pages': '1' },
      body: [{ id: 1 }, { id: 2 }],
    });

    const pages: PageResult<{ id: number }>[] = [];
    for await (const page of testClient.streamItems(100)) {
      pages.push(page);
    }

    expect(pages).toHaveLength(1);
    expect(pages[0].data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(pages[0].page).toBe(1);
    expect(pages[0].totalPages).toBe(1);
  });

  it('should yield multiple pages sequentially', async () => {
    mockHandleRequest
      .mockResolvedValueOnce({
        headers: { 'x-pages': '3' },
        body: [{ id: 1 }],
      })
      .mockResolvedValueOnce({
        headers: { 'x-pages': '3' },
        body: [{ id: 2 }],
      })
      .mockResolvedValueOnce({
        headers: { 'x-pages': '3' },
        body: [{ id: 3 }],
      });

    const pages: PageResult<{ id: number }>[] = [];
    for await (const page of testClient.streamItems(100)) {
      pages.push(page);
    }

    expect(pages).toHaveLength(3);
    expect(pages[0]).toEqual({ data: [{ id: 1 }], page: 1, totalPages: 3 });
    expect(pages[1]).toEqual({ data: [{ id: 2 }], page: 2, totalPages: 3 });
    expect(pages[2]).toEqual({ data: [{ id: 3 }], page: 3, totalPages: 3 });
  });

  it('should stop on early break', async () => {
    mockHandleRequest
      .mockResolvedValueOnce({
        headers: { 'x-pages': '10' },
        body: [{ id: 1 }],
      })
      .mockResolvedValueOnce({
        headers: { 'x-pages': '10' },
        body: [{ id: 2 }],
      });

    const pages: PageResult<{ id: number }>[] = [];
    for await (const page of testClient.streamItems(100)) {
      pages.push(page);
      if (page.page >= 2) break;
    }

    expect(pages).toHaveLength(2);
    expect(mockHandleRequest).toHaveBeenCalledTimes(2);
  });

  it('should stop on empty page', async () => {
    mockHandleRequest
      .mockResolvedValueOnce({
        headers: { 'x-pages': '3' },
        body: [{ id: 1 }],
      })
      .mockResolvedValueOnce({
        headers: { 'x-pages': '3' },
        body: [],
      });

    const pages: PageResult<{ id: number }>[] = [];
    for await (const page of testClient.streamItems(100)) {
      pages.push(page);
    }

    expect(pages).toHaveLength(1);
  });

  it('should build correct URL with path params', async () => {
    mockHandleRequest.mockResolvedValueOnce({
      headers: { 'x-pages': '1' },
      body: [],
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of testClient.streamItems(42)) {
      // consume
    }

    expect(mockHandleRequest).toHaveBeenCalledWith(
      apiClient,
      'test/42/items/',
      'GET',
      undefined,
      false,
    );
  });

  it('should build correct URL with query params', async () => {
    mockHandleRequest.mockResolvedValueOnce({
      headers: { 'x-pages': '1' },
      body: [],
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of testClient.streamItems(100, 'weapons')) {
      // consume
    }

    expect(mockHandleRequest).toHaveBeenCalledWith(
      apiClient,
      'test/100/items/?category=weapons',
      'GET',
      undefined,
      false,
    );
  });

  it('should append datasource to URL', async () => {
    apiClient.setDatasource('singularity');
    mockHandleRequest.mockResolvedValueOnce({
      headers: { 'x-pages': '1' },
      body: [],
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of testClient.streamItems(100)) {
      // consume
    }

    expect(mockHandleRequest).toHaveBeenCalledWith(
      apiClient,
      'test/100/items/?datasource=singularity',
      'GET',
      undefined,
      false,
    );
  });

  it('should pass requiresAuth through for auth endpoints', async () => {
    mockHandleRequest.mockResolvedValueOnce({
      headers: { 'x-pages': '1' },
      body: [{ id: 1 }],
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of testClient.streamSecureItems(999)) {
      // consume
    }

    expect(mockHandleRequest).toHaveBeenCalledWith(
      apiClient,
      'secure/999/items/',
      'GET',
      undefined,
      true,
    );
  });

  it('should propagate errors to consumer', async () => {
    mockHandleRequest.mockRejectedValueOnce(
      Object.assign(new Error('Not Found'), { statusCode: 404 }),
    );

    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of testClient.streamItems(100)) {
        // consume
      }
    }).rejects.toMatchObject({ statusCode: 404 });
  });

  it('should report totalPages from response headers', async () => {
    mockHandleRequest.mockResolvedValueOnce({
      headers: { 'x-pages': '42' },
      body: [{ id: 1 }],
    });

    const gen = testClient.streamItems(100);
    const first = await gen.next();

    expect(first.value!.totalPages).toBe(42);

    await gen.return(undefined);
  });

  it('should handle datasource combined with query params', async () => {
    apiClient.setDatasource('tranquility');
    mockHandleRequest.mockResolvedValueOnce({
      headers: { 'x-pages': '1' },
      body: [],
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of testClient.streamItems(100, 'ships')) {
      // consume
    }

    expect(mockHandleRequest).toHaveBeenCalledWith(
      apiClient,
      'test/100/items/?category=ships&datasource=tranquility',
      'GET',
      undefined,
      false,
    );
  });
});
