const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents() {
      // implement node event listeners here
    },
    baseUrl: process.env.HOST_URL || 'http://localhost:3000', // Adjust based on your app's URL
  },
});

export {};