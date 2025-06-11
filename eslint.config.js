const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
      },
      globals: {
        node: true,
        browser: true,
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        alert: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        Image: 'readonly',
        FormData: 'readonly',
        fetch: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'off',
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
  {
    files: ['spec/**/*.ts', 'spec/**/*.tsx', 'spec/**/*.js', 'spec/**/*.jsx'],
    languageOptions: {
      globals: {
        jasmine: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  {
    files: ['dist/**/*.js', 'public/dist/**/*.js'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
];
