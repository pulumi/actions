module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  testPathIgnorePatterns: ['.*/dist/.*', '.*dist.*'],
};
