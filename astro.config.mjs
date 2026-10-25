// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Static by default; storefront catalogue pages opt into per-request rendering with `export const prerender = false`.
export default defineConfig({
  site: 'https://maisonsabra.ma',
  adapter: vercel(),
  vite: { plugins: [tailwindcss()] },
});
