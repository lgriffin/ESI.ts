export interface RateLimitMeta {
  remaining: number;
  limit: number;
  used: number;
  group: string | null;
}

export interface EsiResponseMeta {
  headers: Record<string, string>;
  fromCache: boolean;
  stale: boolean;
  cacheHitType?: 'spec-ttl' | 'etag-304' | 'stale-on-error';
  warning?: { code: number; message: string };
  requestId?: string;
  date?: string;
  contentLanguage?: string;
  rateLimit?: RateLimitMeta;
  responseTimeMs?: number;
}

export interface EsiResponse<T> {
  data: T;
  meta: EsiResponseMeta;
}
