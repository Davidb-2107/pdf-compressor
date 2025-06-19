module.exports = {
  extends: ['react-app', 'react-app/jest'],
  overrides: [
    {
      files: ['**/*.worker.js', '**/worker-config.js'],
      rules: {
        'no-restricted-globals': 'off',
        // Allow 'self' keyword in Web Worker files
        // Web Workers use 'self' to refer to the global scope
      }
    }
  ],
  // Keep the default rules for all other files
  rules: {
    // You can add additional global rules here if needed
  }
};
