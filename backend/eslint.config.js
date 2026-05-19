import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'off',

      // CPS-004 — Static analysis / complexity metrics
      complexity: ['warn', { max: 10 }],
      'max-depth': ['warn', { max: 4 }],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-nested-callbacks': ['warn', { max: 3 }],
      'max-params': ['warn', { max: 5 }],

      // Security / quality
      'no-console': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'multi-line'],
      'no-throw-literal': 'error',
      'no-return-await': 'warn',
      'require-await': 'warn',
      'no-empty': 'warn',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-shadow': 'warn',
      'no-template-curly-in-string': 'warn',
      'no-self-compare': 'error',
      'no-sparse-arrays': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'prisma/**'],
  },
];