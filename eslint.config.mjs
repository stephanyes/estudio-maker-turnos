import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 🎯 Reglas más estrictas para mejor calidad de código
      "@typescript-eslint/no-explicit-any": "warn", // Cambiar a error cuando sea posible
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/prefer-const": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // React específicas
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      
      // General
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn", // Permitir console en desarrollo
      "no-debugger": "error",
      "no-alert": "warn",
      
      // Performance
      "react/jsx-no-bind": "warn",
      "react/jsx-no-leaked-render": "warn",
    }
  }
];

export default eslintConfig;
