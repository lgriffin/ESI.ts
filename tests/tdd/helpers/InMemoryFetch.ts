import type { FetchLike } from '../../../src/core/ApiClient';

interface StubbedResponse {
  body?: unknown;
  status?: number;
  headers?: Record<string, string>;
}

interface RecordedCall {
  url: string;
  init?: RequestInit;
}

export class InMemoryFetch {
  private responses: StubbedResponse[] = [];
  private _calls: RecordedCall[] = [];

  stub(response: StubbedResponse): this {
    this.responses.push(response);
    return this;
  }

  get calls(): ReadonlyArray<RecordedCall> {
    return this._calls;
  }

  reset(): void {
    this.responses = [];
    this._calls = [];
  }

  get fetch(): FetchLike {
    return async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      this._calls.push({ url, init });

      const stubbed = this.responses.shift();
      if (!stubbed) {
        throw new Error(`InMemoryFetch: no stubbed response for ${url}`);
      }

      const status = stubbed.status ?? 200;
      const headers = new Headers(stubbed.headers ?? {});
      if (!headers.has('x-esi-request-id')) {
        headers.set('x-esi-request-id', 'test-request-id');
      }

      const nullBodyStatuses = [101, 204, 205, 304];
      const body = nullBodyStatuses.includes(status)
        ? null
        : stubbed.body !== undefined
          ? JSON.stringify(stubbed.body)
          : '';

      return new Response(body, { status, headers });
    };
  }
}
