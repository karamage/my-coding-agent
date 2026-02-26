'use strict';
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  clearMocks: true,
  restoreMocks: true,
};
