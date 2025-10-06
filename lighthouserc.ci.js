// ABOUTME: Simplified Lighthouse CI configuration for GitHub Actions workflow
// Used by performance-budget.yml when server is already running

module.exports = {
  ci: {
    collect: {
      // Server is already started by workflow, no autorun needed
      numberOfRuns: 3,

      // URL will be passed via CLI
      url: ['http://localhost:3000'],

      // Chrome settings for consistent testing
      settings: {
        chromeFlags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-extensions',
        ],

        // Categories to audit
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],

        skipAudits: ['uses-http2'],
      },
    },

    // No upload configuration - results stay in .lighthouseci directory
  },
}
