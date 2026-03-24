class HeadersUtil {
    private static headers: Record<string, string> = {};

    static extractHeaders(fetchHeaders: Headers): Record<string, string> {
        const headers: Record<string, string> = {};
        fetchHeaders.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
        });
        this.headers = headers;
        return headers;
    }

    static get xPages(): number {
        return parseInt(this.headers['x-pages'] ?? '1', 10);
    }

    static get errorLimitRemain(): number {
        return parseInt(this.headers['x-esi-error-limit-remain'] ?? '0', 10);
    }

    static get errorLimitReset(): number {
        return parseInt(this.headers['x-esi-error-limit-reset'] ?? '0', 10);
    }

    static get rateLimitRemaining(): number {
        return parseInt(this.headers['x-ratelimit-remaining'] ?? '-1', 10);
    }

    static get rateLimitLimit(): number {
        return parseInt(this.headers['x-ratelimit-limit'] ?? '0', 10);
    }

    static get rateLimitUsed(): number {
        return parseInt(this.headers['x-ratelimit-used'] ?? '0', 10);
    }

    static get rateLimitGroup(): string | null {
        return this.headers['x-ratelimit-group'] ?? null;
    }

    static get retryAfter(): number | null {
        const val = this.headers['retry-after'];
        return val ? parseInt(val, 10) : null;
    }

    static get expires(): string | null {
        return this.headers['expires'] ?? null;
    }

    static get etag(): string | null {
        return this.headers['etag'] ?? null;
    }

    static get lastModified(): string | null {
        return this.headers['last-modified'] ?? null;
    }

    static get cacheControl(): string | null {
        return this.headers['cache-control'] ?? null;
    }

    static get cursorBefore(): string | null {
        return this.headers['x-cursor-before'] ?? null;
    }

    static get cursorAfter(): string | null {
        return this.headers['x-cursor-after'] ?? null;
    }

    static get hasCursorPagination(): boolean {
        return this.cursorBefore !== null || this.cursorAfter !== null;
    }

    static getHeaders(): Record<string, string> {
        return this.headers;
    }
}

export default HeadersUtil;
