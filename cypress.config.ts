const { defineConfig } = require('cypress');

module.exports = defineConfig({
  retries: 1,
  e2e: {
    setupNodeEvents(on: any, config: any) {
      require('cypress-terminal-report/src/installLogsPrinter')(on);
      return config;
    },
    baseUrl: process.env.CYPRESS_HOST_URL || 'http://localhost:3000',
  },
});

export {};
