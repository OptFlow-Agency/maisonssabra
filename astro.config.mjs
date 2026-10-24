// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Static by default; storefront catalogue pages opt into per-request rendering with `export const prerender = false`.
export default defineConfig({
  site: 'https://maisonsabra.ma',
  adapter: vercel(),
  // .env uses the NEXT_PUBLIC_ names; expose them alongside Astro's PUBLIC_.
  vite: { plugins: [tailwindcss()], envPrefix: ['PUBLIC_', 'NEXT_PUBLIC_'] },
});
