const { defineConfig } = require('cypress');

console.log('CYPRESS_HOST_URL: ', process.env.CYPRESS_HOST_URL);

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on: any) {
      require('cypress-terminal-report/src/installLogsPrinter')(on);
    },
    baseUrl: process.env.CYPRESS_HOST_URL || 'http://localhost:3000',
  },
});

export {};
