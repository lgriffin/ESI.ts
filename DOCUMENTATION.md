# 📚 ESI.ts Documentation Guide

> **Version 3.4.0** - Latest documentation for the EVE Online ESI API TypeScript client

## 🌐 Online Documentation

The complete API documentation is automatically generated from the TypeScript source code and is available:

- **Online**: [GitHub Pages](https://lgriffin.github.io/ESI.ts/) (if enabled)
- **Locally**: Run `npm run docs:serve` to serve docs at `http://localhost:8080`

## 📖 Documentation Structure

### Main Sections

1. **[Classes](docs/classes/index.html)** - All API clients and core classes
   - `EsiClient` - Main client with all APIs
   - `CustomEsiClient` - Lightweight client with selected APIs
   - Individual clients (`CharacterClient`, `MarketClient`, etc.)

2. **[Interfaces](docs/interfaces/index.html)** - TypeScript interfaces and contracts
   - Configuration interfaces
   - API response types
   - Client contracts

3. **[Functions](docs/functions/index.html)** - Utility functions and helpers
   - Request handlers
   - Validation utilities
   - Test helpers

4. **[Types](docs/types/index.html)** - Type aliases and custom types

### Key Documentation Pages

- **[EsiClient](docs/classes/src_EsiClient.EsiClient.html)** - Main client class
- **[EsiClientBuilder](docs/classes/src_EsiClientBuilder.EsiClientBuilder.html)** - Builder pattern for custom clients
- **[API Request Handler](docs/functions/src_core_ApiRequestHandler.handleRequest.html)** - Core request processing
- **[ETag Caching](docs/functions/src_core_ApiRequestHandler.initializeETagCache.html)** - Performance caching system

## 🔧 Documentation Commands

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

## 📝 Documentation Features

### ✅ What's Included

- **Complete API Coverage** - All classes, methods, and properties
- **Type Information** - Full TypeScript type definitions
- **Source Links** - Direct links to GitHub source code
- **Search Functionality** - Built-in search across all documentation
- **Inheritance Hierarchy** - Class inheritance relationships
- **Cross-References** - Links between related classes and methods
- **Examples** - Code examples from README and comments

### 🎯 Navigation Tips

1. **Search Box** - Use the search box in the top-right to find specific classes or methods
2. **Module Tree** - Navigate through the organized module structure
3. **Class Hierarchy** - View inheritance relationships
4. **Source Links** - Click "Defined in" links to view source code on GitHub

## 🚀 Quick Start Examples

The documentation includes comprehensive examples for:

- **Basic Usage** - Simple API calls (status, character lookup, universe)
- **Authentication** - Working with authenticated endpoints (wallet, skills, assets, mail)
- **Error Handling** - Proper error management with `EsiError`
- **Custom Clients** - Building lightweight clients with `EsiClientBuilder`
- **ETag Caching** - Performance optimization with `Cache-Control` TTL
- **Builder Pattern** - Fluent client construction
- **Cursor Pagination** - Freelance Jobs and future cursor-based routes
- **ESI Scopes** - Required SSO scopes documented per endpoint

## 📊 Documentation Quality

- **Coverage**: 100% of public APIs documented
- **Type Safety**: Full TypeScript type information
- **Examples**: Practical usage examples
- **Search**: Full-text search capability
- **Mobile Friendly**: Responsive design for all devices

## 🔄 Keeping Documentation Updated

The documentation is automatically regenerated from source code, ensuring it's always current with the latest API changes. Key benefits:

- **Always Current** - Reflects latest code changes
- **Type Accurate** - TypeScript ensures type information is correct
- **Comprehensive** - Covers all public APIs automatically
- **Searchable** - Full-text search across all content

---

**💡 Tip**: Bookmark the documentation site and use it as your primary reference when working with ESI.ts!
