import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      curly: ['error', 'all'],

      'padding-line-between-statements': ['error', { blankLine: 'always', prev: '*', next: 'return' }],

      '@typescript-eslint/no-unused-vars': ['warn'],
      'no-console': 'off',
    },
  },

  eslintConfigPrettier
);
