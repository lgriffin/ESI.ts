import { EsiError, isEsiError, isRateLimited, isNotFound, isUnauthorized, isForbidden, isServerError } from '../../../src/core/util/error';

describe('EsiError', () => {
    describe('instance methods', () => {
        it('isRateLimited returns true for 420 and 429', () => {
            expect(new EsiError(420, 'Error Limited').isRateLimited()).toBe(true);
            expect(new EsiError(429, 'Too many requests').isRateLimited()).toBe(true);
            expect(new EsiError(404, 'Not found').isRateLimited()).toBe(false);
        });

        it('isNotFound returns true for 404', () => {
            expect(new EsiError(404, 'Not found').isNotFound()).toBe(true);
            expect(new EsiError(400, 'Bad request').isNotFound()).toBe(false);
        });

        it('isUnauthorized returns true for 401', () => {
            expect(new EsiError(401, 'Unauthorized').isUnauthorized()).toBe(true);
            expect(new EsiError(403, 'Forbidden').isUnauthorized()).toBe(false);
        });

        it('isForbidden returns true for 403', () => {
            expect(new EsiError(403, 'Forbidden').isForbidden()).toBe(true);
            expect(new EsiError(401, 'Unauthorized').isForbidden()).toBe(false);
        });

        it('isServerError returns true for 5xx', () => {
            expect(new EsiError(500, 'Internal server error').isServerError()).toBe(true);
            expect(new EsiError(503, 'Service Unavailable').isServerError()).toBe(true);
            expect(new EsiError(520, 'Unknown').isServerError()).toBe(true);
            expect(new EsiError(429, 'Too many requests').isServerError()).toBe(false);
        });
    });

    describe('standalone type guards', () => {
        it('isEsiError narrows to EsiError', () => {
            const esiErr = new EsiError(404, 'Not found', '/test');
            const plainErr = new Error('plain');

            expect(isEsiError(esiErr)).toBe(true);
            expect(isEsiError(plainErr)).toBe(false);
            expect(isEsiError(null)).toBe(false);
            expect(isEsiError(undefined)).toBe(false);
            expect(isEsiError('string')).toBe(false);
        });

        it('isRateLimited combines instanceof and status check', () => {
            expect(isRateLimited(new EsiError(429, 'Too many requests'))).toBe(true);
            expect(isRateLimited(new EsiError(420, 'Error Limited'))).toBe(true);
            expect(isRateLimited(new EsiError(404, 'Not found'))).toBe(false);
            expect(isRateLimited(new Error('not esi'))).toBe(false);
            expect(isRateLimited(null)).toBe(false);
        });

        it('isNotFound combines instanceof and status check', () => {
            expect(isNotFound(new EsiError(404, 'Not found'))).toBe(true);
            expect(isNotFound(new EsiError(500, 'Server error'))).toBe(false);
            expect(isNotFound(new Error('not esi'))).toBe(false);
        });

        it('isUnauthorized combines instanceof and status check', () => {
            expect(isUnauthorized(new EsiError(401, 'Unauthorized'))).toBe(true);
            expect(isUnauthorized(new EsiError(403, 'Forbidden'))).toBe(false);
            expect(isUnauthorized(new Error('not esi'))).toBe(false);
        });

        it('isForbidden combines instanceof and status check', () => {
            expect(isForbidden(new EsiError(403, 'Forbidden'))).toBe(true);
            expect(isForbidden(new EsiError(401, 'Unauthorized'))).toBe(false);
            expect(isForbidden(new Error('not esi'))).toBe(false);
        });

        it('isServerError combines instanceof and status check', () => {
            expect(isServerError(new EsiError(500, 'Internal'))).toBe(true);
            expect(isServerError(new EsiError(503, 'Unavailable'))).toBe(true);
            expect(isServerError(new EsiError(404, 'Not found'))).toBe(false);
            expect(isServerError(new Error('not esi'))).toBe(false);
        });
    });
});
