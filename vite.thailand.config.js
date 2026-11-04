// Vite config for the Thailand births short (thailand-births/).
//   npx vite --config vite.thailand.config.js --port 5174
//   npx vite build --config vite.thailand.config.js   -> dist-thailand/
export default {
  root: 'thailand-births',
  base: './',
  build: { outDir: '../dist-thailand', emptyOutDir: true, target: 'es2022', chunkSizeWarningLimit: 4000 },
  esbuild: { target: 'es2022' },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
};
