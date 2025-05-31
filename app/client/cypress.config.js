import { defineConfig } from 'cypress';

export default defineConfig({
  viewportHeight: 1080,
  viewportWidth: 1920,

  // ➊ Tell Cypress to use Mochawesome
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/reports',  // where all JSON + HTML go
    overwrite: false,              // keep each spec’s JSON
    html: true,                   // don’t auto-gen HTML per spec
    json: false                     // emit JSON for each spec run
  },

  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // if you want to pull in any plugins (e.g. cypress-mochawesome-reporter),
      // you could do it here:
      // require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
  },
});
