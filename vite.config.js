export default { base: './', build: { chunkSizeWarningLimit: 4000, rollupOptions: { output: { entryFileNames: 'app.js', assetFileNames: '[name][extname]' } } } };
