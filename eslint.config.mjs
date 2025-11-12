import nextConfig from "eslint-config-next";
import jestDom from "eslint-plugin-jest-dom";
import testingLibrary from "eslint-plugin-testing-library";

export default [
  ...nextConfig,
  {
    ignores: ["node_modules", ".next", "dist"]
  },
  {
    files: ["**/*.{ts,tsx}"]
  },
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    plugins: {
      "testing-library": testingLibrary,
      "jest-dom": jestDom
    },
    rules: {
      "testing-library/no-await-sync-events": "error",
      "testing-library/prefer-screen-queries": "warn",
      "jest-dom/prefer-enabled-disabled": "warn"
    },
    languageOptions: {
      globals: {
        vi: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly"
      }
    }
  }
];
