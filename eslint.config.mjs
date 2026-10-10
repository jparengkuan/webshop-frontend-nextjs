import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Import through the "@/" alias, never by climbing out of a feature.
      "no-restricted-imports": ["error", { patterns: [{ group: ["../../*"], message: "Use the @/ alias." }] }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  // Formatting is Prettier's job; turn off ESLint rules that would fight it.
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".ddev/**"]),
]);

export default eslintConfig;
