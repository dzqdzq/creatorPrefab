import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: '@aspect/creator-ui-kit/vue',
        replacement: path.resolve(__dirname, '../../creator-ui-kit/src/cc/index.ts'),
      },
      {
        find: '@aspect/creator-ui-kit/style.css',
        replacement: path.resolve(__dirname, '../../creator-ui-kit/dist/style.css'),
      },
      {
        find: '@aspect/creator-ui-kit',
        replacement: path.resolve(__dirname, '../../creator-ui-kit'),
      },
    ],
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  // 优化依赖，排除 creator-ui-kit 让 Vite 实时编译
  optimizeDeps: {
    exclude: ['@aspect/creator-ui-kit'],
  },
});
