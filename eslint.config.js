const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const jestPlugin = require('eslint-plugin-jest');
const importPlugin = require('eslint-plugin-import-x');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'build/**',
      'tmp/**',
      '.github/test-stacks/**',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      jest: jestPlugin,
      import: importPlugin,
    },
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
      'sort-imports': ['error', { ignoreDeclarationSort: true }],
      'import/order': [
        'error',
        { alphabetize: { order: 'asc' }, 'newlines-between': 'never' },
      ],
      'no-return-await': 'error',
      'no-console': 'error',
      'import/no-default-export': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/no-unassigned-import': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'all' },
      ],
      '@typescript-eslint/no-unused-expressions': 'error',
    },
  },

  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  prettierConfig,
);
