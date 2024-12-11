module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  testRegex: '__test__/.*\\.test\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  }
};
