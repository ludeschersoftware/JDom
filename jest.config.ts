import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "jest-environment-jsdom",
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json"
            }
        ]
    },
    moduleFileExtensions: ["ts", "tsx", "js"],
    testMatch: ["**/*.test.ts"],
    roots: ["./src", "./tests"],
    clearMocks: true
};

export default config;
