# ESI.ts Documentation Guide

> **Version 5.1.0** - Latest documentation for the EVE Online ESI API TypeScript client

## Local Documentation

The complete API documentation is automatically generated from the TypeScript source code using TypeDoc.

- **Locally**: Run `npm run docs:serve` to serve docs at `http://localhost:8080`

## Documentation Structure

### Main Sections

1. **Classes** - All API clients and core classes
   - `EsiClient` - Main client with all 35 domain APIs
   - `CustomEsiClient` - Lightweight client with selected APIs via `EsiClientBuilder`
   - Individual clients (`CharacterClient`, `MarketClient`, `SkyhooksClient`, etc.)

2. **Interfaces** - TypeScript interfaces and contracts
   - Configuration interfaces (`EsiClientConfig`)
   - API response types (33 domain-specific type files)
   - Client contracts (`ICache`, `IRateLimiter`, `ILogger`)

3. **Functions** - Utility functions and helpers
   - Request handlers
   - Validation utilities
   - Test helpers

4. **Types** - Type aliases and custom types

### Key Documentation Pages

- **EsiClient** - Main client class with all domain accessors
- **EsiClientBuilder** - Builder pattern for custom clients
- **EsiDiagnostics** - Cache/circuit-breaker stats accessor
- **RequestDeduplicator** - Concurrent request coalescing
- **CircuitBreaker** - Fault tolerance with state machine
- **ETagCacheManager** - ETag-based response caching
- **RateLimiter** - ESI rate limit compliance

## Documentation Commands

```bash
# Generate documentation
npm run docs

# Watch for changes and regenerate docs
npm run docs:watch

# Serve documentation locally at http://localhost:8080
npm run docs:serve

# Clean documentation folder
npm run clean:docs

# Clean all build artifacts (including docs)
npm run clean
```

## Documentation Features

### What's Included

- **Complete API Coverage** - All classes, methods, and properties
- **Type Information** - Full TypeScript type definitions
- **Source Links** - Direct links to GitHub source code
- **Search Functionality** - Built-in search across all documentation
- **Inheritance Hierarchy** - Class inheritance relationships
- **Cross-References** - Links between related classes and methods
- **Examples** - Code examples from README and comments

### Navigation Tips

1. **Search Box** - Use the search box in the top-right to find specific classes or methods
2. **Module Tree** - Navigate through the organized module structure
3. **Class Hierarchy** - View inheritance relationships
4. **Source Links** - Click "Defined in" links to view source code on GitHub

## Quick Start Examples

The documentation includes comprehensive examples for:

- **Basic Usage** - Simple API calls (status, character lookup, universe)
- **Authentication** - Working with authenticated endpoints (wallet, skills, assets, mail)
- **Error Handling** - Proper error management with `EsiError`
- **Custom Clients** - Building lightweight clients with `EsiClientBuilder`
- **ETag Caching** - Performance optimization with `Cache-Control` TTL
- **Builder Pattern** - Fluent client construction
- **Cursor Pagination** - Freelance Jobs and future cursor-based routes
- **ESI Scopes** - Required SSO scopes documented per endpoint
- **Rate Limiting** - Configurable rate limit compliance
- **Token Refresh** - Automatic 401 retry with token provider

## Documentation Quality

- **Coverage**: 100% of public APIs documented
- **Type Safety**: Full TypeScript type information
- **Examples**: Practical usage examples
- **Search**: Full-text search capability
- **Mobile Friendly**: Responsive design for all devices

## Keeping Documentation Updated

The documentation is automatically regenerated from source code, ensuring it's always current with the latest API changes. CI generates and uploads documentation as a build artifact on every push.
