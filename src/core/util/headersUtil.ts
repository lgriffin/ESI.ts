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

    static get expires(): string | null {
        return this.headers['expires'] ?? null;
    }

    static getHeaders(): Record<string, string> {
        return this.headers;
    }
}

export default HeadersUtil;
