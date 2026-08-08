import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // UIプロトタイプ（デザイン資産。アプリコードではないため対象外）
    "docs/design/**",
    // スコープ外にした機能の退避先（T-1300）。ビルド対象外なので型・Lintの対象にもしない
    // （tsconfig.json の exclude と対に保つこと）
    "docs/archive/**",
  ]),
]);

export default eslintConfig;
