import js from "@eslint/js";

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  location: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  CustomEvent: "readonly",
  Event: "readonly",
  HTMLElement: "readonly",
  HTMLCanvasElement: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  fetch: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  performance: "readonly",
  console: "readonly"
};

const nodeGlobals = {
  process: "readonly",
  Buffer: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  require: "readonly",
  module: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly"
};

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      ".vite/**"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...browserGlobals,
        ...nodeGlobals
      }
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": [
        "warn",
        {
          args: "none",
          ignoreRestSiblings: true,
          caughtErrors: "none"
        }
      ]
    }
  }
];
