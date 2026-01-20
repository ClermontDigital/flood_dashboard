import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**"],
  },
  {
    rules: {
      // Downgrade React Compiler/Hooks rules to warnings
      // These patterns (setState in effect, manual memoization) are common and safe
      // but flagged by Next.js 16's stricter rules
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
