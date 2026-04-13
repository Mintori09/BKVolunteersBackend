/** @type {import('jest').Config} */
const config = {
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    coverageReporters: ['json', 'text', 'html'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    roots: ['<rootDir>/src', '<rootDir>/__test__'],
    testEnvironment: 'jest-environment-node',
    transformIgnorePatterns: ['/node_modules/', '\\.pnp\\.[^\\/]+$'],
    watchPathIgnorePatterns: [
        './dist',
        './prisma',
        './coverage',
        './logs',
        './assets',
        './node_modules',
        'index.ts',
        'app.ts',
        'src/validations',
        'src/routes',
    ],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    transform: {
        '^.+\\.ts$': 'babel-jest',
    },
}

module.exports = config
