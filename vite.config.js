import { defineConfig } from 'vite';

// Arena previews are served through a generated e2b.app host.
export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
