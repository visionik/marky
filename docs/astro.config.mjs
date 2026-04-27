// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://visionik.github.io',
  base: '/crackdown',
  integrations: [
    starlight({
      title: 'crackdown',
      description:
        'An extensible, plugin-based Markdown linter with first-class Mermaid diagram validation.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/visionik/crackdown',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/visionik/crackdown/edit/main/docs/',
      },
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { slug: 'getting-started' },
            { slug: 'architecture' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { slug: 'cli-reference' },
            { slug: 'api-reference' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { slug: 'plugin-guide' },
            { slug: 'migration' },
          ],
        },
      ],
    }),
  ],
})
