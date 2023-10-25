module.exports = {
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.([tT]ests|[sS]pec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageThreshold: {
    global: {
      branches: 93,
      functions: 94,
      lines: 98,
      statements: 98,
    },
    './tests/factories/': {
      branches: 40,
    },
  },
};
