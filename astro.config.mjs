import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical production URL. Cloudflare Pages preview deployments must NOT
// override this — canonicals and sitemap URLs always point at production.
const site = process.env.PUBLIC_SITE_URL || 'https://cumberlandseptichub.com';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/thank-you/') && !page.includes('/404'),
    }),
  ],
});
