import stylistic from "@stylistic/eslint-plugin";
import eslintConfigTrumpet from "@trumpet/eslint-config-next";

export default [
  {
    ignores: [
      "src/app/_components/shadcn/**",
      "components/shadcn/**",
      ".env.local",
      "postcss.config.cjs",
      "prettier.config.js",
      "dist/**",
      ".cache/**",
      "public/**",
      "node_modules/**",
      "*.esm.js",
      ".next/**",
      "tsconfig.json",
      "next.config.mjs",
      "tailwind.config.cjs",
      "eslint.config.js",
      "next-env.d.ts",
    ],
  },
  ...eslintConfigTrumpet,
  stylistic.configs.recommended,
  {
    rules: {
      "@stylistic/semi": ["error", "always"],
      "@stylistic/arrow-parens": ["error", "always"],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/brace-style": "off",
      "@stylistic/member-delimiter-style": [
        "error",
        {
          multiline: {
            delimiter: "semi",
            requireLast: true,
          },
          singleline: {
            delimiter: "semi",
            requireLast: true,
          },
        },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "unicorn/prefer-ternary": "off",
      "unicorn/filename-case": "off",
      "unicorn/prefer-array-some": "off",
      "prefer-const": "off", // agree with this, but this rule is not very intelligent
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "n/no-unsupported-features/es-syntax": "off",
      "unicorn/consistent-function-scoping": "off",
      "unicorn/no-for-loop": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "react-perf/jsx-no-new-array-as-prop": "off",
      "no-fallthrough": "off", // agree, but does not recognize literal unions
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "react-hooks/exhaustive-deps": "off",
      "unicorn/no-nested-ternary": "off",
      "@typescript-eslint/require-await": "off", // this does not play nicely with server components
      "@typescript-eslint/no-deprecated": "off",
    },
  },
  {
    files: ["api/**/*.{ts,tsx,js,jsx}"], // disable for axios files as it causes errors
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
];
