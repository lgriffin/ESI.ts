export enum ApiErrorType {
    NETWORK_ERROR = 'NETWORK_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
    SERVER_ERROR = 'SERVER_ERROR',
    CLIENT_ERROR = 'CLIENT_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class ApiError extends Error {
    public readonly type: ApiErrorType;
    public readonly statusCode?: number;
    public readonly details?: any;
    public readonly timestamp: Date;
    public readonly requestId?: string;

    constructor(
        message: string,
        type: ApiErrorType = ApiErrorType.UNKNOWN_ERROR,
        statusCode?: number,
        details?: any,
        requestId?: string
    ) {
        super(message);
        this.name = 'ApiError';
        this.type = type;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date();
        this.requestId = requestId;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }

    static fromHttpStatus(statusCode: number, message: string, details?: any, requestId?: string): ApiError {
        let type: ApiErrorType;

        switch (Math.floor(statusCode / 100)) {
            case 4:
                if (statusCode === 401) {
                    type = ApiErrorType.AUTHENTICATION_ERROR;
                } else if (statusCode === 403) {
                    type = ApiErrorType.AUTHORIZATION_ERROR;
                } else if (statusCode === 404) {
                    type = ApiErrorType.NOT_FOUND_ERROR;
                } else if (statusCode === 429) {
                    type = ApiErrorType.RATE_LIMIT_ERROR;
                } else {
                    type = ApiErrorType.CLIENT_ERROR;
                }
                break;
            case 5:
                type = ApiErrorType.SERVER_ERROR;
                break;
            default:
                type = ApiErrorType.UNKNOWN_ERROR;
        }

        return new ApiError(message, type, statusCode, details, requestId);
    }

    static networkError(message: string = 'Network connection failed', details?: any): ApiError {
        return new ApiError(message, ApiErrorType.NETWORK_ERROR, undefined, details);
    }

    static timeoutError(message: string = 'Request timeout', details?: any): ApiError {
        return new ApiError(message, ApiErrorType.TIMEOUT_ERROR, undefined, details);
    }

    static validationError(message: string, details?: any): ApiError {
        return new ApiError(message, ApiErrorType.VALIDATION_ERROR, 400, details);
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            type: this.type,
            statusCode: this.statusCode,
            details: this.details,
            timestamp: this.timestamp.toISOString(),
            requestId: this.requestId,
            stack: this.stack
        };
    }
}

export class ErrorHandler {
    static handle(error: any, requestId?: string): never {
        if (error instanceof ApiError) {
            throw error;
        }

        // Handle Axios/HTTP errors
        if (error.response) {
            const statusCode = error.response.status;
            const message = error.response.data?.error || 
                           error.response.data?.message || 
                           error.message || 
                           `HTTP ${statusCode} Error`;
            
            throw ApiError.fromHttpStatus(statusCode, message, error.response.data, requestId);
        }

        // Handle network errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
            throw ApiError.networkError(`Network error: ${error.message}`, { code: error.code });
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            throw ApiError.timeoutError(`Request timeout: ${error.message}`);
        }

        // Default to unknown error
        throw new ApiError(
            error.message || 'An unknown error occurred',
            ApiErrorType.UNKNOWN_ERROR,
            undefined,
            error,
            requestId
        );
    }

    static isRetryable(error: ApiError): boolean {
        return [
            ApiErrorType.NETWORK_ERROR,
            ApiErrorType.TIMEOUT_ERROR,
            ApiErrorType.SERVER_ERROR,
            ApiErrorType.RATE_LIMIT_ERROR
        ].includes(error.type);
    }

    static getRetryDelay(error: ApiError, attempt: number): number {
        if (error.type === ApiErrorType.RATE_LIMIT_ERROR) {
            // Check for Retry-After header in details
            const retryAfter = error.details?.headers?.['retry-after'];
            if (retryAfter) {
                return parseInt(retryAfter) * 1000; // Convert to milliseconds
            }
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, etc.
        return Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
    }
}
