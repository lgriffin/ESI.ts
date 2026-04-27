export interface RequestContext {
  url: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface ResponseContext {
  url: string;
  endpoint: string;
  method: string;
  status: number;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
  fromCache: boolean;
}

export type RequestInterceptor = (
  context: RequestContext,
) => RequestContext | Promise<RequestContext>;

export type ResponseInterceptor = (
  context: ResponseContext,
) => ResponseContext | Promise<ResponseContext>;

export class MiddlewareManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  addRequestInterceptor(fn: RequestInterceptor): () => void {
    this.requestInterceptors.push(fn);
    return () => {
      this.requestInterceptors = this.requestInterceptors.filter(
        (i) => i !== fn,
      );
    };
  }

  addResponseInterceptor(fn: ResponseInterceptor): () => void {
    this.responseInterceptors.push(fn);
    return () => {
      this.responseInterceptors = this.responseInterceptors.filter(
        (i) => i !== fn,
      );
    };
  }

  async applyRequestInterceptors(
    context: RequestContext,
  ): Promise<RequestContext> {
    let ctx = context;
    for (const interceptor of this.requestInterceptors) {
      ctx = await interceptor(ctx);
    }
    return ctx;
  }

  async applyResponseInterceptors(
    context: ResponseContext,
  ): Promise<ResponseContext> {
    let ctx = context;
    for (const interceptor of this.responseInterceptors) {
      ctx = await interceptor(ctx);
    }
    return ctx;
  }

  hasInterceptors(): boolean {
    return (
      this.requestInterceptors.length > 0 ||
      this.responseInterceptors.length > 0
    );
  }

  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }
}
