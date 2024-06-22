const { defineConfig } = require('cypress');

console.log("CYPRESS_HOST_URL: ", process.env.CYPRESS_HOST_URL);
console.log("HOST_URL: ", process.env.HOST_URL);

module.exports = defineConfig({
  e2e: {
    setupNodeEvents() {
      // implement node event listeners here
    },
    baseUrl: process.env.CYPRESS_HOST_URL || 'http://localhost:3000',
  },
});

export {};