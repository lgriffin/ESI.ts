# Testing Guide for ESI.ts

This document provides comprehensive instructions for testing the ESI.ts library, including unit tests, integration tests, and behavior-driven development scenarios.

## 🧪 Test Structure

ESI.ts follows a multi-layered testing approach:

```
tests/
├── tdd/                    # Test-Driven Development (Unit Tests)
│   ├── alliances/
│   │   ├── AllianceClient.test.ts          # Original tests
│   │   ├── AllianceClient.improved.test.ts # Enhanced resilient tests
│   │   └── ...
│   └── ...
├── bdd/                    # Behavior-Driven Development
│   ├── features/          # Gherkin feature files
│   │   ├── alliances/
│   │   │   └── getAllianceById.feature
│   │   └── ...
│   └── steps/             # Step definitions
│       ├── alliances/
│       └── ...
└── integration/           # Integration tests (future)
```

## 🚀 Quick Start

### Running Tests

```bash
# Run all unit tests
npm test

# Run unit tests with coverage
npm run coverage

# Run improved resilient tests
npm run test:improved

# Run BDD tests
npm run bdd

# Run all tests
npm run test:all

# Watch mode for development
npm run test:watch
```

### Test Configuration Files

- `jest.unit.config.cjs` - Standard unit tests
- `jest.improved.config.cjs` - Enhanced resilient tests
- `jest.bdd.config.cjs` - Behavior-driven tests

## 🛡️ Resilient Testing

### Test Utilities

ESI.ts provides comprehensive testing utilities in `src/testing/TestHelpers.ts`:

#### TestDataFactory
Creates mock data for testing:

```typescript
import { TestDataFactory } from '@lgriffin/esi.ts';

// Create mock alliance data
const mockAlliance = TestDataFactory.createAllianceInfo({
  name: 'Test Alliance',
  ticker: 'TEST'
});

// Create mock errors
const networkError = TestDataFactory.createError(ApiErrorType.NETWORK_ERROR);
```

#### TestScenarios
Provides common testing scenarios:

```typescript
import { TestScenarios } from '@lgriffin/esi.ts';

// Test retry logic
const result = await TestScenarios.testRetryLogic(
  () => client.alliance.getAllianceById(99005338),
  3, // max retries
  2  // expected failures before success
);

// Test concurrent requests
const results = await TestScenarios.testConcurrency(
  () => client.alliance.getAllianceById(99005338),
  10 // number of concurrent requests
);

// Test error recovery
const result = await TestScenarios.testErrorRecovery(
  primaryOperation,
  fallbackOperation
);
```

#### TestAssertions
Provides validation helpers:

```typescript
import { TestAssertions } from '@lgriffin/esi.ts';

// Assert valid alliance data
TestAssertions.assertValidAllianceInfo(allianceData);

// Assert valid error
TestAssertions.assertValidError(error);

// Assert response time
TestAssertions.assertResponseTime(startTime, 1000);

// Assert non-empty array
TestAssertions.assertArrayNotEmpty(results);
```

### MockApiClient
Creates configurable mock clients:

```typescript
import { createMockApiClient } from '@lgriffin/esi.ts';

const mockClient = createMockApiClient({
  delay: 100,           // Simulate network delay
  failureRate: 0.3,     // 30% failure rate
  networkErrors: true,  // Enable network error simulation
  timeoutErrors: true,  // Enable timeout error simulation
  serverErrors: true    // Enable server error simulation
});
```

## 📝 Writing Resilient Tests

### 1. Network Resilience Tests

```typescript
describe('Network Resilience', () => {
  it('should handle network failures gracefully', async () => {
    const networkError = TestDataFactory.createError(ApiErrorType.NETWORK_ERROR);
    const mockGetAlliance = jest.fn().mockRejectedValue(networkError);
    
    // Mock the API
    (allianceClient as any).allianceApi = { getAllianceById: mockGetAlliance };

    await expect(allianceClient.getAllianceById(99005338))
      .rejects
      .toThrow(ApiError);

    // Verify error handling
    try {
      await allianceClient.getAllianceById(99005338);
    } catch (error) {
      TestAssertions.assertValidError(error);
      expect(error.type).toBe(ApiErrorType.NETWORK_ERROR);
    }
  });
});
```

### 2. Performance Tests

```typescript
describe('Performance Tests', () => {
  it('should complete requests within time limits', async () => {
    const startTime = Date.now();
    const result = await allianceClient.getAllianceById(99005338);
    
    TestAssertions.assertResponseTime(startTime, 1000); // Max 1 second
    TestAssertions.assertValidAllianceInfo(result);
  });

  it('should handle high-frequency requests', async () => {
    const promises = Array(50).fill(null).map(() => 
      allianceClient.getAllianceById(99005338)
    );

    const startTime = Date.now();
    const results = await Promise.all(promises);
    
    TestAssertions.assertResponseTime(startTime, 2000); // Max 2 seconds
    expect(results).toHaveLength(50);
  });
});
```

### 3. Error Recovery Tests

```typescript
describe('Error Recovery', () => {
  it('should implement fallback mechanisms', async () => {
    const primaryError = TestDataFactory.createError(ApiErrorType.SERVER_ERROR);
    const fallbackData = TestDataFactory.createAllianceInfo({ name: 'Fallback' });

    const result = await TestScenarios.testErrorRecovery(
      () => Promise.reject(primaryError),
      () => Promise.resolve(fallbackData)
    );

    expect(result.name).toBe('Fallback');
  });

  it('should retry with exponential backoff', async () => {
    let attemptCount = 0;
    const operation = jest.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount <= 2) {
        throw TestDataFactory.createError(ApiErrorType.NETWORK_ERROR);
      }
      return Promise.resolve(mockAlliance);
    });

    const result = await TestScenarios.testRetryLogic(operation, 3, 2);
    
    expect(result).toEqual(mockAlliance);
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
```

### 4. Concurrent Request Tests

```typescript
describe('Concurrency Tests', () => {
  it('should handle concurrent requests safely', async () => {
    const results = await TestScenarios.testConcurrency(
      () => allianceClient.getAllianceById(99005338),
      10
    );

    expect(results).toHaveLength(10);
    results.forEach(result => {
      TestAssertions.assertValidAllianceInfo(result);
    });
  });

  it('should maintain data consistency under load', async () => {
    const operations = [
      () => client.alliance.getAllianceById(99005338),
      () => client.alliance.getContacts(99005338),
      () => client.alliance.getCorporations(99005338)
    ];

    const results = await Promise.all(
      operations.map(op => TestScenarios.testConcurrency(op, 5))
    );

    // Verify all operations completed successfully
    results.forEach(resultSet => {
      expect(resultSet).toHaveLength(5);
    });
  });
});
```

## 🎭 Behavior-Driven Development (BDD)

### Feature Files

Write features in Gherkin syntax:

```gherkin
# tests/bdd/features/alliances/getAllianceById.feature
Feature: Get Alliance Information by ID

  Scenario: Retrieve alliance information with a valid ID
    Given an alliance with ID "99005338" exists
    When I request the alliance information for ID "99005338"
    Then the response should contain the alliance name "Goonswarm Federation"

  Scenario: Handle invalid alliance ID
    Given an invalid alliance ID "-1"
    When I request the alliance information for the invalid ID
    Then I should receive a validation error

  Scenario: Handle network failures
    Given the ESI service is temporarily unavailable
    When I request alliance information
    Then the system should retry the request
    And eventually return an appropriate error
```

### Step Definitions

Implement step definitions in TypeScript:

```typescript
// tests/bdd-scenarios/alliances/bdd-alliance.test.ts
import { EsiClient } from '../../../src/EsiClient';
import { getETagCache, resetETagCache } from '../../../src/core/ApiRequestHandler';
import fetchMock from 'jest-fetch-mock';

let allianceClient: AllianceClient;
let result: any;
let error: any;

Given('an alliance with ID {string} exists', function (allianceId: string) {
  // Setup mock data
  const mockAlliance = TestDataFactory.createAllianceInfo({
    alliance_id: parseInt(allianceId),
    name: 'Goonswarm Federation'
  });
  
  // Configure mock
  const mockApi = { getAllianceById: jest.fn().mockResolvedValue(mockAlliance) };
  (allianceClient as any).allianceApi = mockApi;
});

When('I request the alliance information for ID {string}', async function (allianceId: string) {
  try {
    result = await allianceClient.getAllianceById(parseInt(allianceId));
  } catch (err) {
    error = err;
  }
});

Then('the response should contain the alliance name {string}', function (expectedName: string) {
  TestAssertions.assertValidAllianceInfo(result);
  expect(result.name).to.equal(expectedName);
});
```

## 🔧 Test Configuration

### Jest Configuration Options

```javascript
// jest.improved.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 10000,        // 10 seconds for resilience tests
  maxWorkers: '50%',         // Use half available cores
  bail: false,               // Don't stop on first failure
  detectOpenHandles: true,   // Detect async operations
  forceExit: true,          // Force exit after tests
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/testing/**'
  ],
  
  // Enhanced reporting
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage/improved',
      outputName: 'junit.xml'
    }]
  ]
};
```

### Environment Setup

```typescript
// src/config/jest/jest.setup.ts
import fetchMock from 'jest-fetch-mock';
import { getBody, getHeaders } from '../../testing/TestHelpers';

// Enable fetch mocking
fetchMock.enableMocks();

// Global test utilities
global.getBody = getBody;
global.getHeaders = getHeaders;

// Reset mocks before each test
beforeEach(() => {
  fetchMock.resetMocks();
  jest.clearAllMocks();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

## 📊 Coverage and Reporting

### Generating Coverage Reports

```bash
# Generate coverage report
npm run coverage

# View HTML coverage report
open coverage/lcov-report/index.html

# View improved test coverage
npm run test:improved
open coverage/improved/index.html
```

### Coverage Targets

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:all
      - run: npm run coverage
      - uses: codecov/codecov-action@v2
        with:
          file: ./coverage/lcov.info
```

## 🐛 Debugging Tests

### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--config",
        "jest.unit.config.cjs",
        "${relativeFile}"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debugging Tips

1. **Use `console.log` strategically**:
   ```typescript
   console.log('Test data:', JSON.stringify(testData, null, 2));
   ```

2. **Use Jest's debugging features**:
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand
   ```

3. **Isolate failing tests**:
   ```bash
   npm test -- --testNamePattern="specific test name"
   ```

4. **Check async operations**:
   ```typescript
   // Ensure all promises are awaited
   await expect(asyncOperation()).resolves.toBeDefined();
   ```

## 🚀 Best Practices

### 1. Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mock Management
- Reset mocks between tests
- Use factory functions for consistent mock data
- Mock at the appropriate abstraction level

### 3. Error Testing
- Test both success and failure scenarios
- Verify error types and messages
- Test error recovery mechanisms

### 4. Performance Testing
- Set realistic timeouts
- Test under various load conditions
- Monitor resource usage

### 5. Maintainability
- Keep tests simple and focused
- Use shared utilities for common operations
- Document complex test scenarios

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Jest BDD Testing](https://jestjs.io/docs/using-matchers)
- [TypeScript Testing Best Practices](https://typescript-eslint.io/docs/)
- [ESI API Documentation](https://esi.evetech.net/ui/)

---

Happy testing! 🧪
