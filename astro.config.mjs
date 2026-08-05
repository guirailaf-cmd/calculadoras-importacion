// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: reemplazar por el dominio real antes de desplegar a producción.
  site: 'https://calculadoras-importacion.example.com',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});