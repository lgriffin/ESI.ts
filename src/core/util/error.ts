export class EsiError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly url?: string
    ) {
        super(message);
        this.name = 'EsiError';
    }
}

export const buildError = (message: string, type: string = 'ERROR', url?: string): Error => {
    const error = new Error(`[${type}] ${message}`);
    if (url) {
        (error as any).url = url;
    }
    return error;
};
