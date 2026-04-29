export interface EsiWarning {
  code: number;
  message: string;
}

export interface ParsedHeaders {
  raw: Record<string, string>;
  xPages: number;
  etag: string | null;
  cacheControl: string | null;
  expires: string | null;
  lastModified: string | null;
  cursorBefore: string | null;
  cursorAfter: string | null;
  hasCursorPagination: boolean;
  warning: EsiWarning | null;
  requestId: string | null;
  date: string | null;
  contentLanguage: string | null;
}

export function parseWarning(
  value: string | null | undefined,
): EsiWarning | null {
  if (!value) return null;
  const match =
    /^(\d{3}) - "([^"]+)"$/.exec(value) ??
    /^(\d{3}) - ([^ ].+[^ ])$/.exec(value);
  if (!match) return null;
  return { code: parseInt(match[1], 10), message: match[2] };
}

export function parseHeaders(fetchHeaders: Headers): ParsedHeaders {
  const raw: Record<string, string> = {};
  fetchHeaders.forEach((value, key) => {
    raw[key.toLowerCase()] = value;
  });

  const cursorBefore = raw['x-cursor-before'] ?? null;
  const cursorAfter = raw['x-cursor-after'] ?? null;

  return {
    raw,
    xPages: parseInt(raw['x-pages'] ?? '1', 10),
    etag: raw['etag'] ?? null,
    cacheControl: raw['cache-control'] ?? null,
    expires: raw['expires'] ?? null,
    lastModified: raw['last-modified'] ?? null,
    cursorBefore,
    cursorAfter,
    hasCursorPagination: 'x-cursor-before' in raw || 'x-cursor-after' in raw,
    warning: parseWarning(raw['warning']),
    requestId: raw['x-esi-request-id'] ?? null,
    date: raw['date'] ?? null,
    contentLanguage: raw['content-language'] ?? null,
  };
}
