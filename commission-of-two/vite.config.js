import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
export default { root, base: './', build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 4000 } };
