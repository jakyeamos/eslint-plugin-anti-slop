import antiSlop from "eslint-plugin-anti-slop";

export default [
  {
    files: ["fixture.jsx"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    ...antiSlop.configs.recommended,
  },
];
