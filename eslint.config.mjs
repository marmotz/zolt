import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'out/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      curly: ['error', 'all'],

      'padding-line-between-statements': ['error', { blankLine: 'always', prev: '*', next: 'return' }],

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Configuration spécifique pour les fichiers d'infrastructure (parser, builder, visitors)
  {
    files: [
      'src/parser/**/*.ts',
      'src/builder/**/*.ts',
      'src/utils/project-graph.ts',
      'src/cli/index.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Configuration spécifique pour les tests
  {
    files: ['**/*.spec.ts', '**/*.e2e.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  eslintConfigPrettier,

  {
    rules: {
      curly: ['error', 'all'],
    },
  }
);
