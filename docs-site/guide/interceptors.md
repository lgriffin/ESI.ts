# Interceptors

Interceptors let you hook into the request/response pipeline to add logging, metrics, header manipulation, or custom logic.

## Request Interceptors

Run before a request is sent:

```typescript
import { EsiClient, RequestContext } from '@lgriffin/esi.ts';

const client = new EsiClient({
  requestInterceptors: [
    async (context: RequestContext) => {
      console.log(`→ ${context.method} ${context.url}`);
      // Add custom headers
      context.headers['X-Custom-Header'] = 'my-value';
      return context;
    },
  ],
});
```

## Response Interceptors

Run after a response is received:

```typescript
const client = new EsiClient({
  responseInterceptors: [
    async (context: ResponseContext) => {
      console.log(
        `← ${context.status} ${context.url} (${context.responseTimeMs}ms)`,
      );
      return context;
    },
  ],
});
```

## Adding Interceptors at Runtime

```typescript
// Returns an unsubscribe function
const unsub = client.addRequestInterceptor(async (ctx) => {
  ctx.headers['X-Request-Id'] = crypto.randomUUID();
  return ctx;
});

// Remove the interceptor later
unsub();

// Response interceptors work the same way
const unsub2 = client.addResponseInterceptor(async (ctx) => {
  if (ctx.status >= 400) {
    myMetrics.increment('esi.errors', { status: ctx.status });
  }
  return ctx;
});
```

## Use Cases

### Request Logging

```typescript
client.addRequestInterceptor(async (ctx) => {
  console.log(`[ESI] ${ctx.method} ${ctx.url}`);
  return ctx;
});
```

### Response Metrics

```typescript
client.addResponseInterceptor(async (ctx) => {
  myMetrics.histogram('esi.response_time', ctx.responseTimeMs, {
    endpoint: ctx.url,
    status: ctx.status,
  });
  return ctx;
});
```

### Custom Authentication

```typescript
client.addRequestInterceptor(async (ctx) => {
  const token = await myTokenStore.getToken();
  ctx.headers['Authorization'] = `Bearer ${token}`;
  return ctx;
});
```
