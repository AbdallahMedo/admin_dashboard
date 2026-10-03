import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_API_BASE_URL || 'https://design-more.onrender.com';
  return {
    base: './',
    server: {
      host: '0.0.0.0', port: 3000, open: false,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/health': { target: backend, changeOrigin: true }
      }
    },
    build: { outDir: 'dist', sourcemap: false }
  };
});
