// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Static by default; storefront catalogue pages opt into per-request rendering with `export const prerender = false`.
export default defineConfig({
  site: 'https://maisonsabra.ma',
  adapter: vercel(),
  // Instant-feeling navigation: a link's page is fetched on hover/focus (touchstart on phones) before the click lands.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: {
    plugins: [tailwindcss()],
    // Dev server only: allow ngrok tunnels (any subdomain) for previewing on real phones.
    server: { allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev'] },
  },
});
