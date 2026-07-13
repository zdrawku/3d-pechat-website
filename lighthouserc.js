// Lighthouse CI config. Serves the prerendered static build and audits the key
// pages, asserting category-score budgets so the scores earned in the
// lighthouse-improvements work don't silently regress.
//
// Run locally:  npm run build && npx lhci autorun
// In CI:        see .github/workflows/lighthouse.yml
module.exports = {
  ci: {
    collect: {
      // Serve the built static output directly — no separate server needed.
      staticDistDir: './dist/dprinting-services-website/browser',
      // Audit a representative sample: home, a product/list page, and a blog post.
      url: [
        'http://localhost/index.html',
        'http://localhost/products/index.html',
        'http://localhost/prices/index.html',
        'http://localhost/blog/index.html',
        'http://localhost/blog/what-is-3d-printing/index.html',
      ],
      numberOfRuns: 3, // median of 3 to smooth run-to-run variance
      settings: {
        // Desktop preset — matches how most audits are framed. Switch to mobile
        // (or add a second run) if mobile budgets become the priority.
        preset: 'desktop',
      },
    },
    assert: {
      // Category-level budgets. Warn vs error chosen so a small regression flags
      // without blocking, while a large drop fails. Tune upward as scores improve.
      assertions: {
        // Local desktop medians sit ~0.71–0.80 today; warn under 0.70 so a real
        // drop flags without failing on normal variance. Raise as perf improves.
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      // Store reports as workflow artifacts (temporary public storage). Swap for
      // an LHCI server or filesystem target if you want history.
      target: 'temporary-public-storage',
    },
  },
};
