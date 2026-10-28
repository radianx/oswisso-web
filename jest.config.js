module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Deployment outputs contain another package.json and must not be indexed.
  modulePathIgnorePatterns: ['<rootDir>/.netlify/', '<rootDir>/.next/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
