/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/__tests__'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
};
