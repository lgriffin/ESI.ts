module.exports = {
  rootDir: '../..',
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  globalSetup: '<rootDir>/tests/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.ts',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testMatch: [
    '<rootDir>/tests/tdd/**/*.test.ts',
    '<rootDir>/tests/bdd/step-definitions/**/*.steps.ts',
    '<rootDir>/tests/bdd/specs/**/*.spec.ts',
  ],
  verbose: true,
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*.ts',
    '!src/**/*.generated.ts',
    '!src/clients/generated/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 75,
      lines: 90,
      statements: 90,
    },
  },
};
