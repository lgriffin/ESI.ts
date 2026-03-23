import { PaginationHandler } from '../../../src/core/pagination/PaginationHandler';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('PaginationHandler', () => {
    let client: ApiClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        const rateLimiter = RateLimiter.getInstance();
        rateLimiter.reset();
        rateLimiter.setTestMode(true);
        client = new ApiClient('test', 'https://esi.evetech.net', undefined);
    });

    describe('fetchRemainingPages', () => {
        it('should return first page data when totalPages is 1', async () => {
            const firstPageData = [{ id: 1 }, { id: 2 }];

            const result = await PaginationHandler.fetchRemainingPages(
                client, 'alliances', 'GET', false, firstPageData, 1
            );

            expect(result).toEqual([{ id: 1 }, { id: 2 }]);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should fetch page 2 and combine with page 1 data', async () => {
            const firstPageData = [{ id: 1 }, { id: 2 }];
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 3 }, { id: 4 }]));

            const result = await PaginationHandler.fetchRemainingPages(
                client, 'alliances', 'GET', false, firstPageData, 2
            );

            expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0][0]).toBe('https://esi.evetech.net/alliances?page=2');
        });

        it('should fetch multiple remaining pages', async () => {
            const firstPageData = [{ id: 1 }];
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 2 }]));
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 3 }]));
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 4 }]));

            const result = await PaginationHandler.fetchRemainingPages(
                client, 'alliances', 'GET', false, firstPageData, 4
            );

            expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
            expect(fetchMock).toHaveBeenCalledTimes(3);
        });

        it('should preserve query params when paginating', async () => {
            const firstPageData = [{ id: 1 }];
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 2 }]));
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 3 }]));

            await PaginationHandler.fetchRemainingPages(
                client, 'markets/10000002/orders?order_type=all', 'GET', false,
                firstPageData, 3
            );

            expect(fetchMock.mock.calls[0][0]).toBe(
                'https://esi.evetech.net/markets/10000002/orders?order_type=all&page=2'
            );
            expect(fetchMock.mock.calls[1][0]).toBe(
                'https://esi.evetech.net/markets/10000002/orders?order_type=all&page=3'
            );
        });

        it('should stop on empty page when stopOnEmptyPage is true', async () => {
            const firstPageData = [{ id: 1 }];
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 2 }]));
            fetchMock.mockResponseOnce(JSON.stringify([])); // empty page 3
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 4 }])); // should not be fetched

            const result = await PaginationHandler.fetchRemainingPages(
                client, 'alliances', 'GET', false, firstPageData, 4, undefined,
                { stopOnEmptyPage: true }
            );

            expect(result).toEqual([{ id: 1 }, { id: 2 }]);
            expect(fetchMock).toHaveBeenCalledTimes(2); // pages 2 and 3 only
        });

        it('should not stop on empty page when stopOnEmptyPage is false', async () => {
            const firstPageData = [{ id: 1 }];
            fetchMock.mockResponseOnce(JSON.stringify([]));
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 3 }]));

            const result = await PaginationHandler.fetchRemainingPages(
                client, 'alliances', 'GET', false, firstPageData, 3, undefined,
                { stopOnEmptyPage: false }
            );

            expect(result).toEqual([{ id: 1 }, { id: 3 }]);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('should respect maxPages option', async () => {
            const firstPageData = [{ id: 1 }];
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 2 }]));
            // Page 3 should not be fetched due to maxPages: 2

            const result = await PaginationHandler.fetchRemainingPages(
                client, 'alliances', 'GET', false, firstPageData, 5, undefined,
                { maxPages: 2 }
            );

            expect(result).toEqual([{ id: 1 }, { id: 2 }]);
            expect(fetchMock).toHaveBeenCalledTimes(1); // only page 2
        });

        it('should include auth header when requiresAuth is true', async () => {
            const authedClient = new ApiClient('test', 'https://esi.evetech.net', 'my-token');
            const firstPageData = [{ id: 1 }];
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 2 }]));

            await PaginationHandler.fetchRemainingPages(
                authedClient, 'characters/123/assets', 'GET', true, firstPageData, 2
            );

            const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
            expect(headers['Authorization']).toBe('Bearer my-token');
        });

        it('should not include auth header when requiresAuth is false', async () => {
            const firstPageData = [{ id: 1 }];
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 2 }]));

            await PaginationHandler.fetchRemainingPages(
                client, 'alliances', 'GET', false, firstPageData, 2
            );

            const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
            expect(headers['Authorization']).toBeUndefined();
        });

        it('should retry failed page fetches', async () => {
            const firstPageData = [{ id: 1 }];
            // Page 2: fail once, then succeed
            fetchMock.mockResponseOnce('Server Error', { status: 500 });
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 2 }]));

            const result = await PaginationHandler.fetchRemainingPages(
                client, 'alliances', 'GET', false, firstPageData, 2, undefined,
                { maxRetries: 3, retryDelayMs: 1 }
            );

            expect(result).toEqual([{ id: 1 }, { id: 2 }]);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('should stop after maxRetries consecutive failures', async () => {
            const firstPageData = [{ id: 1 }];
            // Page 2 fails 3 times (all retries exhausted)
            fetchMock.mockResponse('Server Error', { status: 500 });

            const result = await PaginationHandler.fetchRemainingPages(
                client, 'alliances', 'GET', false, firstPageData, 5, undefined,
                { maxRetries: 3, retryDelayMs: 1 }
            );

            // Should have page 1 data only since page 2 failed all retries,
            // then 3 consecutive failures triggers the stop
            expect(result).toEqual([{ id: 1 }]);
        });

        it('should reset consecutive failure count on success', async () => {
            const firstPageData = [{ id: 1 }];
            // Page 2: fail once then succeed (via retry)
            fetchMock.mockResponseOnce('Server Error', { status: 500 });
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 2 }]));
            // Page 3: fail once then succeed (via retry)
            fetchMock.mockResponseOnce('Server Error', { status: 500 });
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 3 }]));

            const result = await PaginationHandler.fetchRemainingPages(
                client, 'alliances', 'GET', false, firstPageData, 3, undefined,
                { maxRetries: 3, retryDelayMs: 1 }
            );

            expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
        });

        it('should handle non-array JSON responses by wrapping in array', async () => {
            const firstPageData = [{ id: 1 }];
            fetchMock.mockResponseOnce(JSON.stringify({ id: 2, name: 'single' }));

            const result = await PaginationHandler.fetchRemainingPages(
                client, 'some/endpoint', 'GET', false, firstPageData, 2
            );

            expect(result).toEqual([{ id: 1 }, { id: 2, name: 'single' }]);
        });

        it('should send body on POST paginated requests', async () => {
            const firstPageData = [{ id: 1 }];
            const body = { ids: [1, 2, 3] };
            fetchMock.mockResponseOnce(JSON.stringify([{ id: 2 }]));

            await PaginationHandler.fetchRemainingPages(
                client, 'universe/names', 'POST', false, firstPageData, 2, body
            );

            const sentBody = fetchMock.mock.calls[0][1]?.body;
            expect(sentBody).toBe(JSON.stringify(body));
        });
    });
});
