import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      // catch (e) {} vacío es aceptable (fallback silencioso)
      "no-empty": ["error", { allowEmptyCatch: true }],
      // no romper por variables/args sin usar; avisar y permitir _prefijo
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrors: "none" }],
    },
  },
];
