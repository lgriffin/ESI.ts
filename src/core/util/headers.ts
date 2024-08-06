// src/utils/HeadersUtil.ts

// Experimental Utility functions for extracting headers. Not integrated yet, just testing and inspired by
// https://raw.githubusercontent.com/burberius/eve-esi/master/src/main/java/net/troja/eve/esi/HeaderUtil.java

/**
 * Extracts relevant headers from the response
 * @param headers Headers object from the response
 * @returns An object containing xPages and expires header, xPages set to 1 if we don't have any (safety first!)
 */
export const extractHeaders = (headers: Headers): { xPages: number, expires: Date | null } => {
    let xPages = headers.get('X-Pages') ? parseInt(headers.get('X-Pages') as string, 10) : null;
    xPages = xPages !== null ? xPages : 1;  // Set xPages to 1 if it is null
    const expires = headers.get('Expires') ? new Date(headers.get('Expires') as string) : null;

    return { xPages, expires };
};

/**
 * Gets the X-Pages header value
 * @param headers Object containing the extracted headers
 * @returns The X-Pages value or null
 */
export const getXPages = (headers: { xPages: number, expires: Date | null }): number => {
    return headers.xPages;
};

/**
 * Gets the Expires header value
 * @param headers Object containing the extracted headers
 * @returns The Expires value or null
 */
export const getExpires = (headers: { xPages: number, expires: Date | null }): Date | null => {
    return headers.expires;
};

/**
 * Generic function to get a header value by name
 * @param headers Headers object from the response
 * @param headerName Name of the header to retrieve
 * @returns The value of the header or null
 */
export const getHeader = (headers: Headers, headerName: string): string | null => {
    return headers.get(headerName);
};
