const baseConfig = require('./.eslintrc.js')

module.exports = {
  ...baseConfig,
  globals: {},
  extends: [...baseConfig.extends, 'plugin:react/recommended'],
  plugins: ['react'],
  rules: {
    ...baseConfig.rules,
    'react/no-deprecated': 'off',
    'react/no-children-prop': 'off',
    'react/prop-types': 'off',
    camelcase: ['error', { properties: 'never' }]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
