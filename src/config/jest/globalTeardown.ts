/**
 * Global Jest teardown to clean up test environment
 */

export default async function globalTeardown() {
    // Reset rate limiter after all tests complete
    const { RateLimiter } = await import('../../core/rateLimiter/RateLimiter');
    const rateLimiter = RateLimiter.getInstance();
    rateLimiter.reset();
    
    console.log('✅ Rate limiter reset after test completion');
}
