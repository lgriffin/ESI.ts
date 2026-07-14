import fetchMock from 'jest-fetch-mock';

const ERROR_SCENARIOS = [
  { status: 500, message: 'Internal server error' },
  { status: 404, message: 'Resource not found' },
  { status: 401, message: 'Unauthorized' },
  { status: 403, message: 'Forbidden' },
  { status: 429, message: 'Too many requests' },
] as const;

export function describeClientErrors(
  clientName: string,
  callApi: () => Promise<unknown>,
): void {
  describe(`${clientName} error handling`, () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    for (const { status, message } of ERROR_SCENARIOS) {
      it(`should throw on HTTP ${status}`, async () => {
        fetchMock.mockResponseOnce(message, { status });
        await expect(callApi()).rejects.toThrow(message);
      });
    }
  });
}
