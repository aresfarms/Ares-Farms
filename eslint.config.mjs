import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

const hookRules =
  reactHooks.configs?.flat?.recommended?.rules ??
  reactHooks.configs?.recommended?.rules ??
  {};

const eslintConfig = defineConfig([
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...hookRules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: ["src/components/property/PropertyEvaluationWorkspace.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/use-memo": "off",
    },
  },
  {
    files: [
      "src/app/api/**/*.{ts,tsx}",
      "src/lib/security/**/*.{ts,tsx}",
      "src/security/**/*.{ts,tsx}",
      "src/proxy.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  globalIgnores([
    ".next/**",
    ".claude/worktrees/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
