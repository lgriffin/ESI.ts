/**
 * Global Jest setup to configure test environment
 */

export default async function globalSetup() {
    // Enable test mode for rate limiter to disable delays during tests
    const { RateLimiter } = await import('../../core/rateLimiter/RateLimiter');
    const rateLimiter = RateLimiter.getInstance();
    rateLimiter.setTestMode(true);
    rateLimiter.reset(); // Reset any existing state
    
    console.log('✅ Test mode enabled for rate limiter');
}
