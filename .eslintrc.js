module.exports = {
  overrides: [
    {
      files: ['src/utils/analytics.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};