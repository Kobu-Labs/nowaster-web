/** @type {import("eslint").Linter.Config} */
const config = {
  ignorePatterns: ["src/app/_components/shadcn/**", "tailwind.config.ts"], // <<< ignore all files in test folder
  parser: "@typescript-eslint/parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "prettier", "no-relative-import-paths"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ],
  rules: {
    "comma-dangle": [
      "error",
      {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
        functions: "always-multiline",
      },
    ],
    semi: ["error", "always"],
    indent: ["error", 2],
    "no-relative-import-paths/no-relative-import-paths": [
      "error",
      {
        allowSameFolder: false,
        rootDir: ".",
        prefix: "@",
      },
    ],
    "react-hooks/exhaustive-deps": "off",
    "@typescript-eslint/unbound-method": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/consistent-indexed-object-style": "off",
    "@typescript-eslint/consistent-type-imports": [
      "off",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
  },
};
module.exports = config;
