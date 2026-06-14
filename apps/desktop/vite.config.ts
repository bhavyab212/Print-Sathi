import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import electron from 'electron-vite';

export default defineConfig({
  plugins: [
    electron({
      main: {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'out/main',
          },
        },
      },
      preload: {
        input: 'src/preload/index.ts',
        vite: {
          build: {
            outDir: 'out/preload',
          },
        },
      },
      renderer: {
        root: 'src/renderer',
        build: {
          rollupOptions: {
            input: {
              index: resolve(__dirname, 'src/renderer/index.html')
            }
          },
          outDir: 'dist-renderer',
        },
      },
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
