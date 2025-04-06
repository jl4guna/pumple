import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@pages': path.resolve(__dirname, './pages'),
      '@utils': path.resolve(__dirname, './utils'),
      '@assets': path.resolve(__dirname, './assets'),
      '@styles': path.resolve(__dirname, './styles'),
      '@types': path.resolve(__dirname, './types'),
    },
  },
});
