export default {
    testEnvironment: "node",
    collectCoverage: true,
    testMatch: ["**/*.test.ts"],
    transform: {
        "^.+\\.[jt]s$": [
            "ts-jest",
            {
                diagnostics: {
                    ignoreCodes: [151002, 2823],
                },
            },
        ],
    },
    transformIgnorePatterns: ["node_modules/(?!(@actions)/)"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "^@actions/core$": "<rootDir>/node_modules/@actions/core/lib/core.js",
        "^@actions/exec$": "<rootDir>/node_modules/@actions/exec/lib/exec.js",
        "^@actions/io$": "<rootDir>/node_modules/@actions/io/lib/io.js",
        "^@actions/io/lib/io-util$": "<rootDir>/node_modules/@actions/io/lib/io-util.js",
        "^@actions/http-client$": "<rootDir>/node_modules/@actions/http-client/lib/index.js",
        "^@actions/http-client/lib/auth$": "<rootDir>/node_modules/@actions/http-client/lib/auth.js",
        "^@actions/http-client/lib/proxy$": "<rootDir>/node_modules/@actions/http-client/lib/proxy.js",
        "^@actions/tool-cache$": "<rootDir>/node_modules/@actions/tool-cache/lib/tool-cache.js",
        "^@actions/cache$": "<rootDir>/node_modules/@actions/cache/lib/cache.js",
        "^@actions/glob$": "<rootDir>/node_modules/@actions/glob/lib/glob.js",
    },
};
