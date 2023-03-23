/* eslint-disable no-undef */
module.exports = {
  env: {
    browser: true,
    es2021: true,
    mocha: true,
  },
  extends: 'eslint:recommended',
  overrides: [],
  parserOptions: {
    ecmaVersion: '2021',
    sourceType: 'module',
  },
  rules: {},
  globals: {
    chai: 'readonly',
  },
};
