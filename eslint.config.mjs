import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "**/*.min.js",
      "playwright-report/**",
      "test-results/**",
      "specs/**",
      ".specify/**",
    ],
  },
];

export default eslintConfig;
