// eslint.config.mjs

import eslint from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import * as tseslint from 'typescript-eslint'; // ✅ fix

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node
      }
    },
    plugins: {
      'simple-import-sort': simpleImportSort
    }
  },

  {
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'prefer-const': 'error',
      'no-console': 'warn',
      'no-debugger': 'warn',

      '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

      'semi': ['error', 'always'],
      'curly': ['error', 'all'],

    }
  },

  {
    ignores: ['**/node_modules/', '**/dist/', '**/build/', '**/src/server.ts']
  }
);
