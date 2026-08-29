import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'ESI.ts',
  description:
    'Production-grade TypeScript client for the EVE Online ESI API',
  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/logo.svg',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/clients' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Explorer', link: '/explorer/' },
      {
        text: 'v9.6.0',
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/lgriffin/ESI.ts/blob/master/CHANGELOG.md',
          },
          {
            text: 'NPM',
            link: 'https://www.npmjs.com/package/@lgriffin/esi.ts',
          },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Why ESI.ts?', link: '/guide/why-esi-ts' },
          ],
        },
        {
          text: 'Essentials',
          items: [
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Authentication', link: '/guide/authentication' },
            { text: 'Error Handling', link: '/guide/error-handling' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Caching', link: '/guide/caching' },
            { text: 'Rate Limiting', link: '/guide/rate-limiting' },
            { text: 'Pagination & Streaming', link: '/guide/pagination' },
            { text: 'Batch Operations', link: '/guide/batch-operations' },
            {
              text: 'Runtime Validation',
              link: '/guide/runtime-validation',
            },
            {
              text: 'Lightweight Clients',
              link: '/guide/lightweight-clients',
            },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Interceptors', link: '/guide/interceptors' },
            { text: 'Circuit Breaker', link: '/guide/circuit-breaker' },
            { text: 'Response Metadata', link: '/guide/response-metadata' },
            { text: 'SDE Module', link: '/guide/sde' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Domain Clients', link: '/reference/clients' },
            { text: 'Configuration', link: '/reference/configuration' },
            { text: 'Error Classes', link: '/reference/errors' },
            { text: 'Types', link: '/reference/types' },
            { text: 'Environment Variables', link: '/reference/environment' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            {
              text: 'Public Endpoints',
              link: '/examples/public',
            },
            {
              text: 'Authenticated Endpoints',
              link: '/examples/authenticated',
            },
            {
              text: 'Advanced Patterns',
              link: '/examples/advanced',
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/lgriffin/ESI.ts' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@lgriffin/esi.ts' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern:
        'https://github.com/lgriffin/ESI.ts/edit/master/docs-site/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the GPL-3.0 License.',
      copyright: 'Copyright © 2024-present Leigh Griffin',
    },

    outline: {
      level: [2, 3],
    },
  },
});
