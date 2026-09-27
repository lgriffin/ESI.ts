import { expectAssignable, expectError, expectType } from 'tsd';
import { createEsi } from '../../src/client';
import type { HttpTransport } from '../../src/core/ports/HttpTransport';
import {
  createMockTransport,
  type MockRoute,
  type MockTransport,
  type SentRequest,
} from '../../src/testing';

const transport = createMockTransport();

// The mock is an HttpTransport, so it goes where fetch goes.
expectAssignable<HttpTransport>(transport);
void createEsi({ userAgent: 'app/1.0 (dev@example.com)', transport });

// respond() chains, and takes the route shape.
expectType<MockTransport>(transport.respond({ path: '/status', body: {} }));
expectType<MockTransport>(
  transport.respond({
    method: 'POST',
    path: /\/universe\/names/,
    status: 200,
    headers: { etag: '"a"' },
    body: [],
    times: 1,
  }),
);
expectError(transport.respond({}));
expectError(transport.respond({ path: 42 }));
expectAssignable<MockRoute>({ path: '/status' });

// The record is read-only.
expectType<readonly SentRequest[]>(transport.sent);
expectType<readonly string[]>(transport.unrouted);
expectType<readonly MockRoute[]>(transport.routes);
expectType<string>(transport.sent[0]!.method);
expectType<string | undefined>(transport.sent[0]!.body);
expectError(transport.sent.push);
expectError((transport.sent = []));
expectType<void>(transport.reset());
