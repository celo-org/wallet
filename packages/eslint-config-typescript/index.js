module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'react', 'react-native', 'react-hooks'],
  rules: {
    'no-eval': 'error',
    '@typescript-eslint/triple-slash-reference': 'error',
    'import/no-relative-packages': 'error',
    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-inner-declarations': ['error', 'functions'],
    'no-restricted-syntax': ['error', 'ForInStatement'],
    'void-zero': 'off',
    'max-classes-per-file': ['error', 2],
    'react-native/no-unused-styles': 'error',
    semi: 'off',
    '@typescript-eslint/no-extra-semi': 'off',
    '@typescript-eslint/semi': 'off',
    'react-hooks/rules-of-hooks': 'error',
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
    '@typescript-eslint/no-floating-promises': 'error',

    // Disable rules pulled in by "recommended" above that we're failing. It could make
    // sense to work towards enabling these.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ban-types': 'off',
    'no-fallthrough': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    'no-case-declarations': 'off',
    'no-useless-catch': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
}
