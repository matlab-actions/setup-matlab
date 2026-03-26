export default {
    clearMocks: true,
    testEnvironment: "node",
    collectCoverage: true,
    testMatch: ["**/*.test.ts"],
    transform: {
        "^.+\\.[jt]s$": [
            "ts-jest",
            {
                useESM: true,
                diagnostics: {
                    ignoreCodes: [1378, 151002],
                },
            },
        ],
    },
    extensionsToTreatAsEsm: ['.ts'],
    transformIgnorePatterns: ["node_modules/(?!(@actions)/)"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
};
